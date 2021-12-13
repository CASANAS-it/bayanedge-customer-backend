import Errors from '../classes/Errors'
import VendorModel from '../models/VendorModel'
import LedgerModel from '../models/LedgerModel'
import InventoryModel from '../models/InventoryModel'

const ledgerService = {
  getAll: async (limit, offset,client_id) => {
    return await LedgerModel.getPaginatedItems(limit, offset,client_id)
  },
  getById: async (id) => {
    var ledger = await LedgerModel.getById(id)
    if (!ledger) {
      throw new Errors.NO_RECORDS_FOUND()
    }
    return ledger
  },
  update: async (params) => {
    if(!params.vendor_id){
      var vendor = await VendorModel.create(params)
      params.vendor_id = vendor.vendor_id
    }

    // revert quantity for inventory
    var oldLedger = await LedgerModel.getById(params.ledger_id);
    var revertInventory = await InventoryModel.addQuantity({admin_id : params.admin_id ,item_id : oldLedger.item_id, quantity : oldLedger.quantity})
    // -----------------------------
    var ledger = await LedgerModel.update(params)
    var inventor = await InventoryModel.subtractQuantity({admin_id : params.admin_id ,item_id : params.item_id, quantity : params.quantity})
    return ledger
  },
  delete: async (params) => {
    return await LedgerModel.delete(params)
  },
  create: async (params) => {
    if(!params.vendor_id){
      var vendor = await VendorModel.create(params)
      params.vendor_id = vendor.vendor_id
    }
    var ledger = await LedgerModel.create(params)
    var inventor = await InventoryModel.subtractQuantity({admin_id : params.admin_id ,item_id : params.item_id, quantity : params.quantity})
    
    return ledger
  }
}

export {
  ledgerService
}
