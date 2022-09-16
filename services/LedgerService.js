import Errors from '../classes/Errors'
import VendorModel from '../models/VendorModel'
import CustomerModel from '../models/CustomerModel'
import LedgerModel from '../models/LedgerModel'
import InventoryModel from '../models/InventoryModel'
import CashJournalModel from '../models/CashJournalModel'
import { FlowType, TransactionType, TransType } from '../classes/Constants'
import AccountPayableModel from '../models/AccountPayableModel'
import AccountReceivableModel from '../models/AccountReceivableModel'
import { beginningBalanceService } from './BeginningBalanceService'
import { cashJournalService } from './CashJournalService'
import SafeError from '../classes/SafeError'
import moment from 'moment'

const ledgerService = {
  getAll: async (limit, offset, client_id, filter) => {
    return await LedgerModel.getPaginatedItems(limit, offset, client_id, filter)
  },
  getAllTotal: async (client_id, filter) => {
    return await LedgerModel.getAllFiltered(client_id, filter)
  },
  getAllAP: async (limit, offset, client_id, filter) => {
    return await LedgerModel.getPaginatedAPItems(limit, offset, client_id, filter)
  },
  getAllBeginningAP: async (limit, offset, client_id) => {
    return await LedgerModel.getPaginatedBeginningItems(limit, offset, client_id, "On Credit")
  },

  getAllBeginningLedger: async (limit, offset, client_id) => {
    return await LedgerModel.getPaginatedBeginningItems(limit, offset, client_id, "On Cash")
  },
  hasDataByClient: async (id) => {
    var items = await LedgerModel.getByClientId(id)
    return items !== null ? true : false
  },
  getById: async (id) => {
    var ledger = await LedgerModel.getById(id)
    if (!ledger) {
      throw new Errors.NO_RECORDS_FOUND()
    }
    var childTrans = await CashJournalModel.getAllByClientIdRefId(ledger.client_id, id)
    ledger.childTrans = childTrans;
    return ledger
  },
  getSummary: async (client_id) => {
    var ledger = await LedgerModel.getAllByClientId(client_id)
    var buyTotal = 0;
    var apTotal = 0;
    ledger.forEach(element => {
      if (element.trans_type === "On Cash")
        buyTotal += element.total_unit_cost
      else
        apTotal += element.total_unit_cost
    });
    var result = {
      buyTotal,
      apTotal
    }
    return result
  },
  update: async (params) => {
    var summary = await cashJournalService.getSummary(params)

    if (summary) {
      if (params.total_unit_cost > summary.total) {
        throw new SafeError({
          status: 200,
          code: 209,
          message: "Insufficient Cash Balance",
          name: "Ledger"
        })
      }
    }

    var isRefExists = await LedgerModel.getByRef(params.transaction_id, params.reference_no, params.client_id)

    if (isRefExists)
      throw new Errors.DUPLICATE_REFERENCE()

    if (!params.vendor_id) {
      var isVendorExist = await VendorModel.getByVendorName(0, params.vendor_name, params.client_id)
      if (isVendorExist)
        throw new Errors.RECORD_ALREADY_EXISTS()

      var vendor = await VendorModel.create(params)
      params.vendor_id = vendor.vendor_id
    }

    // // revert quantity for inventory
    var oldSales = await LedgerModel.getById(params.transaction_id);
    for (let index = 0; index < oldSales.details.length; index++) {
      const item = oldSales.details[index];
      var inventor = await InventoryModel.subtractQuantity({ admin_id: params.admin_id, item_id: item.item_id, quantity: item.quantity })
    }

    // -----------------------------
    var vendor = await VendorModel.getByVendorId(params.vendor_id)
    if (params.trans_type == "On Credit") {
      var date = moment(params.date).add(vendor.terms, 'days').format("YYYY-MM-DD")
      params.next_payment_date = date;

      params.balance = params.total_unit_cost
      params.is_completed = false

      if (vendor.credit_limit > 0 && (parseFloat(vendor.available_credit) + parseFloat(oldSales.total_unit_cost)) < parseFloat(params.total_unit_cost)) {
        var error = new SafeError({
          status: 200,
          code: 209,
          message: "Insufficient Credit",
          name: "Ledger"
        })
        throw error
      }
    }

    // console.log(params, 'params----')
    var ledger = await LedgerModel.update(params)
    for (let index = 0; index < params.details.length; index++) {
      const item = params.details[index];

      var inventor = await InventoryModel.addQuantity({ admin_id: params.admin_id, item_id: item.item_id, quantity: item.quantity })
    }
    if (params.trans_type == "On Cash") {

      await CashJournalModel.permanentDeleteByRefId(params.transaction_id)
      var transaction = params;
      transaction.total = params.total_unit_cost;
      transaction.reference_id = ledger.transaction_id;
      transaction.type_id = TransType.LEDGER;
      transaction.flow_type_id = FlowType.OUTFLOW
      transaction.details = ledger;
      transaction.display_id = ledger.display_id
      await CashJournalModel.create(transaction)
    }
    if (vendor.available_credit && vendor.credit_limit) {

      vendor.available_credit = (parseFloat(vendor.available_credit) + parseFloat(oldSales.total_unit_cost)) - parseFloat(params.total_unit_cost)
      await VendorModel.updateCredit(vendor)
    }

    return ledger
  },
  delete: async (params) => {
    var oldSales = await LedgerModel.getById(params.id);
    var vendor = await VendorModel.getByVendorId(oldSales.vendor_id)

    for (let index = 0; index < oldSales.details.length; index++) {
      const item = oldSales.details[index];
      var inventor = await InventoryModel.subtractQuantity({ admin_id: params.admin_id, item_id: item.item_id, quantity: item.quantity })
    }

    if (vendor.available_credit) {
      vendor.available_credit = (parseFloat(vendor.available_credit) + parseFloat(oldSales.total_unit_cost))
      await VendorModel.updateCredit(vendor)
    }

    await CashJournalModel.permanentDeleteByRefId(params.id)
    return await LedgerModel.delete(params)
  },
  create: async (params) => {

    if (!params.vendor_id) {

      var isVendorExist = await VendorModel.getByVendorName(0, params.vendor_name, params.client_id)
      if (isVendorExist)
        throw new Errors.RECORD_ALREADY_EXISTS()

      var vendor = await VendorModel.create(params)
      params.vendor_id = vendor.vendor_id
    }
    if (params.trans_type == "On Cash") {
      var hasSales = await beginningBalanceService.hasDataByClient({ client_id: params.client_id, type_id: TransType.INVENTORY })

      if (!hasSales) {
        throw new Errors.NO_BEGINNING_BALANCE()
      }
    } else {
      // var hasSales = await beginningBalanceService.hasDataByClient({ client_id: params.client_id, type_id: TransType.ACCOUNTS_PAYABLE })

      // if (!hasSales) {
      //   throw new Errors.NO_BEGINNING_BALANCE()
      // }
    }
    var isRefExists = await LedgerModel.getByRef(0, params.reference_no, params.client_id)

    if (isRefExists)
      throw new Errors.DUPLICATE_REFERENCE()
    var summary = await cashJournalService.getSummary(params)

    if (summary) {
      if (params.total_unit_cost > summary.total) {
        throw new SafeError({
          status: 200,
          code: 209,
          message: "Insufficient Cash Balance",
          name: "Ledger"
        })
      }
    }

    var vendor = await VendorModel.getByVendorId(params.vendor_id)
    if (params.trans_type == "On Credit") {
      var date = moment(params.date).add(vendor.terms, 'days').format("YYYY-MM-DD")
      params.next_payment_date = date;

      params.balance = params.total_unit_cost
      params.is_completed = false
      if (vendor.credit_limit > 0 && parseFloat(vendor.available_credit) < parseFloat(params.total_unit_cost)) {
        var error = new SafeError({
          status: 200,
          code: 209,
          message: "Insufficient Credit",
          name: "Ledger"
        })
        throw error
      }
    }
    var ledger = await LedgerModel.create(params)
    for (let index = 0; index < params.details.length; index++) {
      const item = params.details[index];
      var inventor = await InventoryModel.addQuantity({ admin_id: params.admin_id, item_id: item.item_id, quantity: item.quantity })
    }


    if (params.trans_type == "On Cash") {
      var transaction = params;
      transaction.total = params.total_unit_cost;
      transaction.reference_id = ledger.transaction_id;
      transaction.type_id = TransType.LEDGER;
      transaction.flow_type_id = FlowType.OUTFLOW
      transaction.details = ledger;
      transaction.display_id = ledger.display_id
      await CashJournalModel.create(transaction)
    }
    if (vendor.available_credit && vendor.credit_limit) {

      vendor.available_credit = parseFloat(vendor.available_credit) - parseFloat(params.total_unit_cost)
      await VendorModel.updateCredit(vendor)
    }
    return ledger
  }
}

export {
  ledgerService
}
