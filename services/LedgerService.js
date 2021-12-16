import Errors from '../classes/Errors'
import VendorModel from '../models/VendorModel'
import LedgerModel from '../models/LedgerModel'
import InventoryModel from '../models/InventoryModel'
import CashJournalModel from '../models/CashJournalModel'
import { TransactionType, TransType } from '../classes/Constants'
import AccountPayableModel from '../models/AccountPayableModel'

const ledgerService = {
  getAll: async (limit, offset, client_id) => {
    return await LedgerModel.getPaginatedItems(limit, offset, client_id)
  },
  getById: async (id) => {
    var ledger = await LedgerModel.getById(id)
    if (!ledger) {
      throw new Errors.NO_RECORDS_FOUND()
    }
    return ledger
  },
  update: async (params) => {
    if (!params.vendor_id) {
      var vendor = await VendorModel.create(params)
      params.vendor_id = vendor.vendor_id
    }

    // revert quantity for inventory
    var oldLedger = await LedgerModel.getById(params.ledger_id);
    var revertInventory = await InventoryModel.addQuantity({ admin_id: params.admin_id, item_id: oldLedger.item_id, quantity: oldLedger.quantity })
    // -----------------------------
    var ledger = await LedgerModel.update(params)
    var inventor = await InventoryModel.subtractQuantity({ admin_id: params.admin_id, item_id: params.item_id, quantity: params.quantity })
    if (params.type_id === TransactionType.CASH) {
      // insert into cash journal
      var transaction = JSON.parse(JSON.stringify(params));
      transaction.transaction_id = params.ledger_id;
      transaction.total = transaction.total * -1;
      await CashJournalModel.update(transaction)
      await AccountPayableModel.permanentDelete(params.ledger_id)
    }else{
      await CashJournalModel.permanentDelete(params.ledger_id)
      await AccountPayableModel.update(params)
    }


    return ledger
  },
  delete: async (params) => {
    return await LedgerModel.delete(params)
  },
  create: async (params) => {
    if (!params.vendor_id) {
      var vendor = await VendorModel.create(params)
      params.vendor_id = vendor.vendor_id
    }
    var ledger = await LedgerModel.create(params)
    var inventor = await InventoryModel.subtractQuantity({ admin_id: params.admin_id, item_id: params.item_id, quantity: params.quantity })

    if (params.type_id === TransactionType.CASH) {
      // insert into cash journal
      var transaction = JSON.parse(JSON.stringify(params));
      transaction.reference_id = ledger.ledger_id;
      transaction.total = transaction.total * -1;
      transaction.type_id = TransType.ORDER;
      await CashJournalModel.create(transaction)
    }else{
      params.ledger_id = ledger.ledger_id
      params.balance = params.total
      await AccountPayableModel.create(params)
    }

    return ledger
  }
}

export {
  ledgerService
}
