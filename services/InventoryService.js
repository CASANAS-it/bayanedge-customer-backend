import Errors from '../classes/Errors'
import InventoryModel from '../models/InventoryModel'

const inventoryService = {
  getAll: async (limit, offset) => {
    return await InventoryModel.getPaginatedItems(limit, offset)
  },
  getById: async (id) => {
    var inventory = await InventoryModel.getByItemId(id)
    if (!inventory) {
      throw new Errors.NO_RECORDS_FOUND()
    }
    return inventory
  },
  update: async (params) => {
    return await InventoryModel.update(params)
  },
  delete: async (params) => {
    return await InventoryModel.delete(params)
  },
  create: async (params) => {
    return await InventoryModel.create(params)
  }
}

export {
  inventoryService
}
