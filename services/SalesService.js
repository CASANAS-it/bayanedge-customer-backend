import Errors from '../classes/Errors'
import VendorModel from '../models/VendorModel'
import CustomerModel from '../models/CustomerModel'
import SalesModel from '../models/SalesModel'
import InventoryModel from '../models/InventoryModel'
import CashJournalModel from '../models/CashJournalModel'
import { FlowType, TransactionType, TransType } from '../classes/Constants'
import AccountPayableModel from '../models/AccountPayableModel'
import AccountReceivableModel from '../models/AccountReceivableModel'
import { beginningBalanceService } from './BeginningBalanceService'
import ErrorManager from '../classes/ErrorManager'
import SafeError from '../classes/SafeError'
import moment, { parseTwoDigitYear } from 'moment'

const salesService = {
  getAll: async (limit, offset, client_id, filter) => {
    return await SalesModel.getPaginatedItems(limit, offset, client_id, filter)
  },
  getAllTotal: async (type, client_id, filter) => {
    return await SalesModel.getAllFiltered(type, client_id, filter)
  },
  getAllAR: async (limit, offset, client_id, filter) => {
    return await SalesModel.getPaginatedARItems(limit, offset, client_id, filter)
  },

  getAllBeginningAR: async (limit, offset, client_id) => {
    return await SalesModel.getPaginatedBeginningItems(limit, offset, client_id, "On Credit")
  },

  getAllBeginningSales: async (limit, offset, client_id) => {
    return await SalesModel.getPaginatedBeginningItems(limit, offset, client_id, "On Cash")
  },
  hasDataByClient: async (id) => {
    var items = await SalesModel.getByClientId(id)
    return items !== null ? true : false
  },
  getById: async (id) => {
    var sales = await SalesModel.getById(id)
    if (!sales) {
      throw new Errors.NO_RECORDS_FOUND()
    }

    var childTrans = await CashJournalModel.getAllByClientIdRefId(sales.client_id, id)
    sales.childTrans = childTrans;
    return sales
  },

  getSummary: async (client_id) => {
    var sales = await SalesModel.getAllByClientId(client_id)
    var saleTotal = 0;
    var arTotal = 0;
    sales.forEach(element => {
      if (element.trans_type === "On Cash")
        saleTotal += element.total_unit_selling
      else
        arTotal += element.total_unit_selling
    });
    var result = {
      saleTotal,
      arTotal
    }
    return result
  },
  update: async (params) => {
    if (!params.customer_id) {
      var customer = await CustomerModel.create(params)
      params.customer_id = customer.customer_id
    }

    var oldSales = await SalesModel.getById(params.transaction_id);

    // -----------------------------
    var customer = await CustomerModel.getByCustomerId(params.customer_id)
    if (params.trans_type == "On Credit") {
      var date = moment(params.date).add(customer.terms, 'days').format("YYYY-MM-DD")

      params.next_payment_date = date;

      params.balance = params.total_unit_selling
      params.is_completed = false


      if (customer.credit_limit > 0 && (parseFloat(customer.available_credit) + parseFloat(oldSales.total_unit_selling)) < parseFloat(params.total_unit_selling)) {
        var error = new SafeError({
          status: 200,
          code: 209,
          message: "Insufficient Credit",
          name: "Sales"
        })
        throw error
      }
    }

    var isRefExists = await SalesModel.getByRef(params.transaction_id, params.reference_no, params.client_id)

    if (isRefExists)
      throw new Errors.DUPLICATE_REFERENCE()

    for (let index = 0; index < params.details.length; index++) {
      const item = params.details[index];
      var inv = await InventoryModel.getByItemId(item.item_id)
      var oldInv = oldSales.details.find(x => x.item_id == inv.item_id)
      var quantity = parseFloat(inv.quantity) + parseFloat(oldInv ? oldInv.quantity : 0)

      if (quantity < item.quantity) {
        var error = new SafeError({
          status: 200,
          code: 209,
          message: inv.name + " : Insufficient Quantity",
          name: "Sales"
        })
        throw error
      }
    }


    for (let index = 0; index < params.details.length; index++) {
      const item = params.details[index];
      var inventor = await InventoryModel.subtractQuantity({ admin_id: params.admin_id, item_id: item.item_id, quantity: item.quantity })
    }
    // // revert quantity for inventory

    for (let index = 0; index < oldSales.details.length; index++) {
      const item = oldSales.details[index];

      var inventor = await InventoryModel.addQuantity({ admin_id: params.admin_id, item_id: item.item_id, quantity: item.quantity })
    }
    var sales = await SalesModel.update(params)
    if (customer.available_credit && customer.credit_limit) {
      customer.available_credit = (parseFloat(customer.available_credit) + parseFloat(oldSales.total_unit_selling)) - parseFloat(params.total_unit_selling)
      await CustomerModel.updateCredit(customer)
    }

    if (params.trans_type == "On Cash") {

      await CashJournalModel.permanentDeleteByRefId(params.transaction_id)
      var transaction = params;
      transaction.total = params.total_unit_selling;
      transaction.reference_id = sales.transaction_id;
      transaction.type_id = TransType.SALES;
      transaction.flow_type_id = FlowType.INFLOW
      transaction.details = sales;
      transaction.display_id = sales.display_id
      await CashJournalModel.create(transaction)
    }
    return sales
  },
  delete: async (params) => {
    var oldSales = await SalesModel.getById(params.id);
    var customer = await CustomerModel.getByCustomerId(oldSales.customer_id)
  
    if (oldSales.details)
      for (let index = 0; index < oldSales.details.length; index++) {
        const item = oldSales.details[index];
        var inventor = await InventoryModel.addQuantity({ admin_id: params.admin_id, item_id: item.item_id, quantity: item.quantity })
      }
    customer.available_credit = (parseFloat(customer.available_credit) + parseFloat(oldSales.total_unit_selling))
    await CustomerModel.updateCredit(customer)
    await CashJournalModel.permanentDeleteByRefId(params.id)
    return await SalesModel.delete(params)
  },
  create: async (params) => {

    if (!params.trans_type == "On Cash") {
      var hasSales = await beginningBalanceService.hasDataByClient({ client_id: params.client_id, type_id: TransType.SALES })

      if (!hasSales) {
        throw new Errors.NO_BEGINNING_BALANCE()
      }

    } else {
      // var hasSales = await beginningBalanceService.hasDataByClient({ client_id: params.client_id, type_id: TransType.ACCOUNTS_RECEIVABLE })

      // if (!hasSales) {
      //   throw new Errors.NO_BEGINNING_BALANCE()
      // }
    }
    var isRefExists = await SalesModel.getByRef(0, params.reference_no, params.client_id)

    if (isRefExists)
      throw new Errors.DUPLICATE_REFERENCE()

    if (!params.customer_id) {
      var customer = await CustomerModel.create(params)
      params.customer_id = customer.customer_id
    }
    var customer = await CustomerModel.getByCustomerId(params.customer_id)
    if (params.trans_type == "On Credit") {
      var date = moment(params.date).add(customer.terms, 'days').format("YYYY-MM-DD")
      console.log(date, customer.terms)
      params.next_payment_date = date;

      params.balance = params.total_unit_selling
      params.is_completed = false
      if (customer.credit_limit > 0 && customer.available_credit < params.total_unit_selling) {
        var error = new SafeError({
          status: 200,
          code: 209,
          message: "Insufficient Credit",
          name: "Sales"
        })
        throw error
      }
    }

    // checking of quantity
    for (let index = 0; index < params.details.length; index++) {
      const item = params.details[index];
      var inv = await InventoryModel.getByItemId(item.item_id)
      if (inv.quantity < item.quantity) {
        var error = new SafeError({
          status: 200,
          code: 209,
          message: inv.name + " : Insufficient Quantity",
          name: "Sales"
        })
        throw error
      }
    }

    for (let index = 0; index < params.details.length; index++) {
      const item = params.details[index];
      var inventor = await InventoryModel.subtractQuantity({ admin_id: params.admin_id, item_id: item.item_id, quantity: item.quantity })
    }

    var sales = await SalesModel.create(params)
    if (customer.available_credit && customer.credit_limit) {
      customer.available_credit = parseFloat(customer.available_credit) - parseFloat(params.total_unit_selling)
      await CustomerModel.updateCredit(customer)
    }

    if (params.trans_type == "On Cash") {
      var transaction = params;
      transaction.total = params.total_unit_selling;
      transaction.reference_id = sales.transaction_id;
      transaction.type_id = TransType.SALES;
      transaction.flow_type_id = FlowType.INFLOW
      transaction.details = sales;
      transaction.display_id = sales.display_id
      await CashJournalModel.create(transaction)
    }
    return sales
  }
}

export {
  salesService
}
