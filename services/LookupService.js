import ExpenseTypeModel from '../models/ExpenseTypeModel';
import AssetTypeModel from '../models/AssetTypeModel'
import LiabilityTypeModel from '../models/LiabilityTypeModel'
import RevenueTypeModel from '../models/RevenueTypeModel';
import EquityTypeModel from '../models/EquityTypeModel';
import { AssetType } from '../classes/Constants';


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
}



export {
  lookupService
}
