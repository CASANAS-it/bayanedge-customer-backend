import Errors from '../classes/Errors'
import SafeError from '../classes/SafeError'
import InventoryModel from '../models/InventoryModel'
import LedgerModel from '../models/LedgerModel'
import SalesModel from '../models/SalesModel'
import { isNumber } from '../utils/CommonUtil'

const inventoryService = {
  getAll: async (limit, offset, client_id, search) => {
    return await InventoryModel.getPaginatedItems(limit, offset, client_id, search)
  },
  getSummary: async (client_id) => {
    var items = await InventoryModel.getAllByClientId(client_id)
    var total = 0;
    for (let index = 0; index < items.length; index++) {
      const element = items[index];
      if (element.unit_cost && element.quantity)
        total += element.unit_cost * element.quantity
      else{
        console.log(element,'hello')
      }
    }
    return total
  },
  uploadFile: async (admin_id, client_id, datas) => {
    if (datas.length == 0) {
      throw new Errors.NO_DATA()
    } else {
      // validations
      for (let i = 0; i < datas.length; i++) {
        const element = datas[i];

        // check fields

        if (!element['Product Name'])
          throw new SafeError({
            status: 200,
            code: 209,
            message: "Name is required for line :" + (i + 2),
            name: "Inventory"
          })
        else if (!element['Product Code'])
          throw new SafeError({
            status: 200,
            code: 209,
            message: "Code is required for line :" + (i + 2),
            name: "Inventory"
          })
        else if (!element['Unit Cost'])
          throw new SafeError({
            status: 200,
            code: 209,
            message: "Unit Cost is required for line :" + (i + 2),
            name: "Inventory"
          })
        else if (!element['Unit Selling Price'])
          throw new SafeError({
            status: 200,
            code: 209,
            message: "Unit Selling Price is required for line :" + (i + 2),
            name: "Inventory"
          })
        else if (!element['Unit of Measurement'])
          throw new SafeError({
            status: 200,
            code: 209,
            message: "Unit of Measurement is required for line :" + (i + 2),
            name: "Inventory"
          })
        else if (!isNumber(element['Unit Cost']))
          throw new SafeError({
            status: 200,
            code: 209,
            message: "Unit Cost is not valid for line :" + (i + 2),
            name: "Inventory"
          })
        else if (!isNumber(element['Unit Selling Price']))
          throw new SafeError({
            status: 200,
            code: 209,
            message: "Unit Selling Price is not valid for line :" + (i + 2),
            name: "Inventory"
          })
        else if (!isNumber(element['Beginning Quantity']))
          throw new SafeError({
            status: 200,
            code: 209,
            message: "Beginning Quantity is not valid for line :" + (i + 2),
            name: "Inventory"
          })

        // check duplicates
        var duplicateInName = datas.filter((x, index) => index != i && x['Product Name'] == element['Product Name'])
        var duplicateInCode = datas.filter((x, index) => index != i && x['Product Code'] == element['Product Code'])

        if (duplicateInName.length > 0)
          throw new SafeError({
            status: 200,
            code: 209,
            message: "Duplicate Name in line :" + (i + 2),
            name: "Inventory"
          })
        else if (duplicateInCode.length > 0) {
          throw new SafeError({
            status: 200,
            code: 209,
            message: "Duplicate Code in line :" + (i + 2),
            name: "Inventory"
          })
        }
        else {
          var duplicateName = await InventoryModel.getByName(0, element['Product Name'], client_id)
          var duplicateCode = await InventoryModel.getByProductCode(0, element['Product Code'], client_id)
          if (duplicateName) {
            throw new SafeError({
              status: 200,
              code: 209,
              message: "Existing Name in line :" + (i + 2),
              name: "Inventory"
            })
          } else if (duplicateCode) {
            throw new SafeError({
              status: 200,
              code: 209,
              message: "Existing Code in line :" + (i + 2),
              name: "Inventory"
            })
          }
        }
      }
    }

    for (let ii = 0; ii < datas.length; ii++) {
      const element = datas[ii];
      var requestData = {
        product_code: element['Product Code'],
        name: element['Product Name'],
        client_id: client_id,
        unit_cost: element['Unit Cost'],
        unit_selling_price: element['Unit Selling Price'],
        unit_of_measurement: element['Unit of Measurement'],
        admin_id: admin_id,
        beginning_quantity: element['Beginning Quantity'],
      }

      var items = await InventoryModel.create(requestData)
    }
    return true;
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
    var details = [...sales, ...ledger]
    details = details.sort((a, b) => (a.date > b.date) ? 1 : ((b.date > a.date) ? -1 : 0))
    var result = [];
    for (let index = 0; index < details.length; index++) {
      const element = details[index];
      var data = element.details.filter(x => x.item_id == id);
      if (data) {
        for (let ii = 0; ii < data.length; ii++) {
          const elem = data[ii];
          result.push({ type: element.type, date: element.date, data: elem })
        }
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
