import Errors from '../classes/Errors'
import VendorModel from '../models/VendorModel'
import CustomerModel from '../models/CustomerModel'
import CashJournalModel from '../models/CashJournalModel'
import InventoryModel from '../models/InventoryModel'
import { TransType } from '../classes/Constants'

const cashJournalService = {
  getAll: async (limit, offset, client_id, type) => {
    return await CashJournalModel.getPaginatedItems(limit, offset, client_id, type)
  },
  getById: async (id) => {
    var sales = await CashJournalModel.getById(id)
    if (!sales) {
      throw new Errors.NO_RECORDS_FOUND()
    }
    return sales
  },
  getSummary: async () => {
    var cj = await CashJournalModel.getAll()
    var total = 0;
    var inflowTotal = 0;
    var outflowTotal = 0;
    cj.forEach(element => {
      total += element.total;
      if (element.type_id === TransType.SALES)
        inflowTotal += element.total
      else
        outflowTotal += element.total
    });
    var result = {
      total: total,
      inflowTotal: inflowTotal,
      outflowTotal: outflowTotal
    }
    return result
  },
  update: async (params) => {
    if (!params.customer_id) {
      var customer = await CustomerModel.create(params)
      params.customer_id = customer.customer_id
    }

    // revert quantity for inventory
    var oldSales = await CashJournalModel.getById(params.sales_id);
    var revertInventory = await InventoryModel.subtractQuantity({ admin_id: params.admin_id, item_id: oldSales.item_id, quantity: oldSales.quantity })
    // -----------------------------
    var sales = await CashJournalModel.update(params)
    var inventor = await InventoryModel.addQuantity({ admin_id: params.admin_id, item_id: params.item_id, quantity: params.quantity })
    return sales
  },
  delete: async (params) => {
    return await CashJournalModel.delete(params)
  },
  create: async (params) => {
    if (!params.customer_id) {
      var customer = await CustomerModel.create(params)
      params.customer_id = customer.customer_id
    }
    var sales = await CashJournalModel.create(params)
    var inventor = await InventoryModel.addQuantity({ admin_id: params.admin_id, item_id: params.item_id, quantity: params.quantity })

    return sales
  }
}

export {
  cashJournalService
}
