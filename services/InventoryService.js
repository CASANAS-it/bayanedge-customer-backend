import Errors from '../classes/Errors'
import InventoryModel from '../models/InventoryModel'

const inventoryService = {
  getAll: async (limit, offset, client_id) => {
    return await InventoryModel.getPaginatedItems(limit, offset, client_id)
  },
  getSummary: async (client_id) => {
    var items = await InventoryModel.getAllByClientId(client_id)
    var total = 0;
    items.forEach(element => {
      total += element.unit_cost * element.quantity
    });
    return total
  },
  hasInventoryByClient: async (id) => {
    var items = await InventoryModel.getByClientId(id)
    return items !== null ? true : false
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
