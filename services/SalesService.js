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
import { parseTwoDigitYear } from 'moment'

const salesService = {
  getAll: async (limit, offset, client_id) => {
    return await SalesModel.getPaginatedItems(limit, offset, client_id)
  },
  getAllAR: async (limit, offset, client_id) => {
    return await SalesModel.getPaginatedARItems(limit, offset, client_id)
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
    return sales
  },
  update: async (params) => {
    if (!params.customer_id) {
      var customer = await CustomerModel.create(params)
      params.customer_id = customer.customer_id
    }

    var oldSales = await SalesModel.getById(params.transaction_id);

    // -----------------------------
    if (params.trans_type == "On Credit") {
      params.balance = params.total_unit_selling
      params.is_completed = false
    }

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
    for (let index = 0; index < oldSales.details.length; index++) {
      const item = oldSales.details[index];
      var inventor = await InventoryModel.addQuantity({ admin_id: params.admin_id, item_id: item.item_id, quantity: item.quantity })
    }

    await CashJournalModel.permanentDeleteByRefId(params.id)
    return await SalesModel.delete(params)
  },
  create: async (params) => {

    // var hasSales = await beginningBalanceService.hasDataByClient({ client_id: params.client_id, type_id: TransType.SALES })

    // if (!hasSales) {
    //   throw new Errors.NO_BEGINNING_BALANCE()
    // }

    if (!params.customer_id) {
      var customer = await CustomerModel.create(params)
      params.customer_id = customer.customer_id
    }
    if (params.trans_type == "On Credit") {
      params.balance = params.total_unit_selling
      params.is_completed = false
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
