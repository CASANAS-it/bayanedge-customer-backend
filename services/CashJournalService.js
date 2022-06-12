import Errors from '../classes/Errors'
import VendorModel from '../models/VendorModel'
import CustomerModel from '../models/CustomerModel'
import CashJournalModel from '../models/CashJournalModel'
import InventoryModel from '../models/InventoryModel'
import { FlowType, TransType } from '../classes/Constants'
import BeginningBalanceModel from '../models/BeginningBalanceModel'

const cashJournalService = {
  getAll: async (limit, offset, client_id, type, search, type_id, filter = null) => {
    return await CashJournalModel.getPaginatedItems(limit, offset, client_id, type, search, type_id, filter)
  },
    
  getByRef: async (client_id, type, search, type_id, filter = null) => {
    return await CashJournalModel.getAllFiltered(client_id, type, search, type_id, filter)
  },
  getAllTotal: async (client_id, type, search, type_id, filter = null) => {
    return await CashJournalModel.getAllFiltered(client_id, type, search, type_id, filter)
  },
  getAllByRefId: async (limit, offset, client_id, search, ref_id, type_id) => {
    return await CashJournalModel.getPaginatedItemsByRefId(limit, offset, client_id, search, ref_id, type_id)
  },
  getById: async (id) => {
    var sales = await CashJournalModel.getById(id)
    if (!sales) {
      throw new Errors.NO_RECORDS_FOUND()
    }
    return sales
  },
  getSummaryByType: async (client_id, type_id) => {
    var beginningBalance = await BeginningBalanceModel.getByClientIdTypeId(client_id, type_id)
    var total = beginningBalance ? parseFloat(beginningBalance.details.beginning_amount) : 0;

    var cj = await CashJournalModel.getAllByClientIdTypeId(client_id, type_id)
    cj.forEach(element => {
      total += parseFloat(element.total)
    });
    return total
  },
  getSummary: async (params) => {
    var cj = await CashJournalModel.getAllByClientId(params.client_id)
    var begBalance = await BeginningBalanceModel.getAllByClientId(params.client_id)
    var cashOnHandBeg = begBalance.find(x => x.type_id == TransType.CASH_ON_HAND)
    cashOnHandBeg = cashOnHandBeg ? parseFloat(cashOnHandBeg.total) : 0;

    var total = cashOnHandBeg;
    var inflowTotal = 0;
    var outflowTotal = 0;
    cj.forEach(element => {
      if (element.flow_type_id === FlowType.INFLOW)
        inflowTotal += element.total
      else
        outflowTotal += element.total
    });
    total += inflowTotal - outflowTotal;
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
    // var oldSales = await CashJournalModel.getById(params.sales_id);
    // var revertInventory = await InventoryModel.subtractQuantity({ admin_id: params.admin_id, item_id: oldSales.item_id, quantity: oldSales.quantity })
    // -----------------------------
    var sales = await CashJournalModel.update(params)
    // var inventor = await InventoryModel.addQuantity({ admin_id: params.admin_id, item_id: params.item_id, quantity: params.quantity })
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
    // var inventor = await InventoryModel.addQuantity({ admin_id: params.admin_id, item_id: params.item_id, quantity: params.quantity })

    return sales
  }
}

export {
  cashJournalService
}
