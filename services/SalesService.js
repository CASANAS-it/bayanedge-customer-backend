import Errors from '../classes/Errors'
import VendorModel from '../models/VendorModel'
import CustomerModel from '../models/CustomerModel'
import SalesModel from '../models/SalesModel'
import InventoryModel from '../models/InventoryModel'

const salesService = {
  getAll: async (limit, offset,client_id) => {
    return await SalesModel.getPaginatedItems(limit, offset,client_id)
  },
  getById: async (id) => {
    var sales = await SalesModel.getById(id)
    if (!sales) {
      throw new Errors.NO_RECORDS_FOUND()
    }
    return sales
  },
  update: async (params) => {
    if(!params.customer_id){
      var customer = await CustomerModel.create(params)
      params.customer_id = customer.customer_id
    }

    // revert quantity for inventory
    var oldSales = await SalesModel.getById(params.sales_id);
    var revertInventory = await InventoryModel.subtractQuantity({admin_id : params.admin_id ,item_id : oldSales.item_id, quantity : oldSales.quantity})
    // -----------------------------
    var sales = await SalesModel.update(params)
    var inventor = await InventoryModel.addQuantity({admin_id : params.admin_id ,item_id : params.item_id, quantity : params.quantity})
    return sales
  },
  delete: async (params) => {
    return await SalesModel.delete(params)
  },
  create: async (params) => {
    if(!params.customer_id){
      var customer = await CustomerModel.create(params)
      params.customer_id = customer.customer_id
    }
    var sales = await SalesModel.create(params)
    var inventor = await InventoryModel.addQuantity({admin_id : params.admin_id ,item_id : params.item_id, quantity : params.quantity})
    
    return sales
  }
}

export {
  salesService
}
