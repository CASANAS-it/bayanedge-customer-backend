import ExpenseTypeModel from '../models/ExpenseTypeModel';
import AssetTypeModel from '../models/AssetTypeModel'
import LiabilityTypeModel from '../models/LiabilityTypeModel'
import RevenueTypeModel from '../models/RevenueTypeModel';
import EquityTypeModel from '../models/EquityTypeModel';
import TransactionTypeModel from '../models/TransactionTypeModel';
import CustomerModel from '../models/CustomerModel';
import VendorModel from '../models/VendorModel'
import { AssetType } from '../classes/Constants';
import InventoryModel from '../models/InventoryModel';


const lookupService = {
  getAllAssetType: async () => {
    return await AssetTypeModel.getAll()
  },
  getAllExpenseType: async () => {
    return await ExpenseTypeModel.getAll()
  },
  getAllEquityType: async () => {
    return await EquityTypeModel.getAll()
  },
  getAllLiabilityType: async () => {
    return await LiabilityTypeModel.getAll()
  },
  getAllRevenueType: async () => {
    return await RevenueTypeModel.getAll()
  },
  getAllTransactionType: async () => {
    return await TransactionTypeModel.getAll()
  },
  getAllCustomer: async (clientId) => {
    return await CustomerModel.getAllByClientId(clientId)
  },
  getAllVendor: async (clientId) => {
    return await VendorModel.getAllByClientId(clientId)
  },
  getAllItem : async (clientId) => {
    return await InventoryModel.getAllByClientId(clientId)
  },

}



export {
  lookupService
}
