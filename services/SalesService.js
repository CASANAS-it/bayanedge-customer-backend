import Errors from '../classes/Errors'
import VendorModel from '../models/VendorModel'
import CustomerModel from '../models/CustomerModel'
import SalesModel from '../models/SalesModel'
import InventoryModel from '../models/InventoryModel'
import CashJournalModel from '../models/CashJournalModel'
import { FlowType, TransactionType, TransType } from '../classes/Constants'
import AccountPayableModel from '../models/AccountPayableModel'
import AccountReceivableModel from '../models/AccountReceivableModel'
import { beginningBalanceService } from './BeginningBalanceService'

const salesService = {
  getAll: async (limit, offset, client_id) => {
    return await SalesModel.getPaginatedItems(limit, offset, client_id)
  },
  hasDataByClient: async (id) => {
    var items = await SalesModel.getByClientId(id)
    return items !== null ? true : false
  },
  getById: async (id) => {
    var sales = await SalesModel.getById(id)
    if (!sales) {
      throw new Errors.NO_RECORDS_FOUND()
    }
    return sales
  },
  update: async (params) => {
    if (!params.customer_id) {
      var customer = await CustomerModel.create(params)
      params.customer_id = customer.customer_id
    }

    // revert quantity for inventory
    var oldSales = await SalesModel.getById(params.transaction_id);
    var revertInventory = await InventoryModel.addQuantity({ admin_id: params.admin_id, item_id: oldSales.item_id, quantity: oldSales.quantity })
    // -----------------------------
    var sales = await SalesModel.update(params)
    var inventor = await InventoryModel.subtractQuantity({ admin_id: params.admin_id, item_id: params.item_id, quantity: params.quantity })

    await CashJournalModel.permanentDeleteByRefId(params.transaction_id)

    var transaction = params;
    transaction.reference_id = sales.transaction_id;
    transaction.type_id = TransType.SALES;
    transaction.flow_type_id = FlowType.INFLOW
    transaction.details = sales;
    transaction.display_id = sales.display_id
    await CashJournalModel.create(transaction)

    return sales
  },
  delete: async (params) => {
    var oldSales = await SalesModel.getById(params.id);
    var revertInventory = await InventoryModel.addQuantity({ admin_id: params.admin_id, item_id: oldSales.item_id, quantity: oldSales.quantity })
  
    await CashJournalModel.permanentDeleteByRefId(params.id)
    return await SalesModel.delete(params)
  },
  create: async (params) => {

    var hasSales = await beginningBalanceService.hasDataByClient({ client_id: params.client_id, type_id: TransType.SALES })

    if (!hasSales) {
      throw new Errors.NO_BEGINNING_BALANCE()
    }
    var sales = await SalesModel.create(params)
    var inventor = await InventoryModel.subtractQuantity({ admin_id: params.admin_id, item_id: params.item_id, quantity: params.quantity })

    var transaction = params;
    transaction.reference_id = sales.transaction_id;
    transaction.type_id = TransType.SALES;
    transaction.flow_type_id = FlowType.INFLOW
    transaction.details = sales;
    transaction.display_id = sales.display_id
    await CashJournalModel.create(transaction)


    return sales
  }
}

export {
  salesService
}
