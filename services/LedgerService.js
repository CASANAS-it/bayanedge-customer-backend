import Errors from '../classes/Errors'
import VendorModel from '../models/VendorModel'
import LedgerModel from '../models/LedgerModel'
import InventoryModel from '../models/InventoryModel'
import CashJournalModel from '../models/CashJournalModel'
import { FlowType, TransactionType, TransType } from '../classes/Constants'
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
    // revert quantity for inventory
    var oldLedger = await LedgerModel.getById(params.transaction_id);
    var revertInventory = await InventoryModel.addQuantity({ admin_id: params.admin_id, item_id: oldLedger.item_id, quantity: oldLedger.quantity })
    // -----------------------------
    var ledger = await LedgerModel.update(params)
    var inventor = await InventoryModel.subtractQuantity({ admin_id: params.admin_id, item_id: params.item_id, quantity: params.quantity })

    await CashJournalModel.permanentDeleteByRefId(params.transaction_id)

    var transaction = JSON.parse(JSON.stringify(params));
    transaction.reference_id = ledger.transaction_id;
    transaction.type_id = TransType.LEDGER;
    transaction.details = ledger;
    transaction.display_id = ledger.display_id
    transaction.flow_type_id = FlowType.OUTFLOW
    await CashJournalModel.create(transaction)

    return ledger
  },
  delete: async (params) => {
    return await LedgerModel.delete(params)
  },
  create: async (params) => {
    var ledger = await LedgerModel.create(params)
    var inventor = await InventoryModel.subtractQuantity({ admin_id: params.admin_id, item_id: params.item_id, quantity: params.quantity })

    var transaction = JSON.parse(JSON.stringify(params));
    transaction.reference_id = ledger.transaction_id;
    transaction.type_id = TransType.LEDGER;
    transaction.details = ledger;
    transaction.display_id = ledger.display_id
    transaction.flow_type_id = FlowType.OUTFLOW
    await CashJournalModel.create(transaction)

    return ledger
  }
}

export {
  ledgerService
}
