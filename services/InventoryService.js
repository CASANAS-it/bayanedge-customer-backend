import Errors from '../classes/Errors'
import InventoryModel from '../models/InventoryModel'
import LedgerModel from '../models/LedgerModel'
import SalesModel from '../models/SalesModel'

const inventoryService = {
  getAll: async (limit, offset, client_id, search) => {
    return await InventoryModel.getPaginatedItems(limit, offset, client_id, search)
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
  getSalesPurchaseById: async (clientId, id) => {
    var sales = await SalesModel.getItemDetails(clientId, id)
    var ledger = await LedgerModel.getItemDetails(clientId, id)
    var details = [...sales,...ledger]
    details = details.sort((a, b) => (a.date > b.date) ? 1 : ((b.date > a.date) ? -1 : 0))
    var result = [];
    for (let index = 0; index < details.length; index++) {
      const element = details[index];
      var findIndex = element.details.findIndex(x => x.item_id == id);
      if (findIndex >= 0) {
        result.push({ type: element.type, date: element.date, data: element.details[findIndex] })
      }
    }
    return result
  },
  update: async (params) => {
    var inventory = await InventoryModel.getByName(params.item_id, params.name, params.client_id)
    if (inventory) {
      throw new Errors.DUPLICATE_ENTRY()
    } else
      return await InventoryModel.update(params)
  },
  delete: async (params) => {
    return await InventoryModel.delete(params)
  },
  create: async (params) => {
    var inventory = await InventoryModel.getByName(0, params.name, params.client_id)
    if (inventory) {
      throw new Errors.DUPLICATE_ENTRY()
    } else
      return await InventoryModel.create(params)
  }
}

export {
  inventoryService
}
