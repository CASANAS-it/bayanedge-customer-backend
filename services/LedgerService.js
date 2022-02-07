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

const ledgerService = {
  getAll: async (limit, offset, client_id) => {
    return await LedgerModel.getPaginatedItems(limit, offset, client_id)
  },
  getAllAP: async (limit, offset, client_id) => {
    return await LedgerModel.getPaginatedAPItems(limit, offset, client_id)
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
    return ledger
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


    if (!params.vendor) {
      var vendor = await CustomerModel.create(params)
      params.vendor_id = vendor.vendor_id
    }

    // // revert quantity for inventory
    var oldSales = await LedgerModel.getById(params.transaction_id);
    for (let index = 0; index < oldSales.details.length; index++) {
      const item = oldSales.details[index];
      var inventor = await InventoryModel.subtractQuantity({ admin_id: params.admin_id, item_id: item.item_id, quantity: item.quantity })
    }

    // -----------------------------
    if (params.trans_type == "On Credit") {
      params.balance = params.total_unit_cost
      params.is_completed = false
    }

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
    return ledger
  },
  delete: async (params) => {
    var oldSales = await LedgerModel.getById(params.id);
    for (let index = 0; index < oldSales.details.length; index++) {
      const item = oldSales.details[index];
      var inventor = await InventoryModel.subtractQuantity({ admin_id: params.admin_id, item_id: item.item_id, quantity: item.quantity })
    }

    await CashJournalModel.permanentDeleteByRefId(params.id)
    return await LedgerModel.delete(params)
  },
  create: async (params) => {
    if (params.trans_type == "On Cash") {
      var hasSales = await beginningBalanceService.hasDataByClient({ client_id: params.client_id, type_id: TransType.INVENTORY })

      if (!hasSales) {
        throw new Errors.NO_BEGINNING_BALANCE()
      }
    } else {
      var hasSales = await beginningBalanceService.hasDataByClient({ client_id: params.client_id, type_id: TransType.ACCOUNTS_PAYABLE })

      if (!hasSales) {
        throw new Errors.NO_BEGINNING_BALANCE()
      }
    }
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


    if (!params.vendor) {
      var vendor = await CustomerModel.create(params)
      params.vendor_id = vendor.vendor_id
    }

    if (params.trans_type == "On Credit") {
      params.balance = params.total_unit_cost
      params.is_completed = false
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

    return ledger
  }
}

export {
  ledgerService
}
