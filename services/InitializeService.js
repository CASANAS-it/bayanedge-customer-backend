import Logger from '../classes/Logger'
import AssetTypeModel from '../models/AssetTypeModel'
import RevenueTypeModel from '../models/RevenueTypeModel'
import LiabilityTypeModel from '../models/LiabilityTypeModel'
import ExpenseTypeModel from '../models/ExpenseTypeModel'
import EquityTypeModel from '../models/EquityTypeModel'
import UserModel from '../models/UserModel'
import TransactionTypeModel from '../models/TransactionTypeModel'
import {
  AssetType,
  LiabilityType,
  RevenueType,
  ExpenseType,
  UserType,
  EquityType,
  TransactionType,
  OpexType,
} from '../classes/Constants'
import OperatingExpenseTypeModel from '../models/OperatingExpenseTypeModel'

const initializeService = {

  init: async () => {
    const count = await TransactionTypeModel.getAll()

    // if (count.length === 0) {
    //   Logger.info('INITIALIZATION STARTED')
    //   await initializeService.initializeData()
    // }
    var countType = await OperatingExpenseTypeModel.getAll()
    if (countType.length === 0) {
      await initializeService.initializeNopexType()
    }
  },
  initializeNopexType: async () => {
    Logger.info('******************************')
    Logger.info('****Initializing Nopex Type****')
    Logger.info('******************************')
    await OperatingExpenseTypeModel.createType({ name: OpexType.SALARIES_WAGES,sort : 1 })
    await OperatingExpenseTypeModel.createType({ name: OpexType.MONTH_PAY,sort : 2  })
    await OperatingExpenseTypeModel.createType({ name: OpexType.RENTAL,sort : 3  })
    await OperatingExpenseTypeModel.createType({ name: OpexType.LIGHT_WATER,sort : 4  })
    await OperatingExpenseTypeModel.createType({ name: OpexType.TRANSPORTATION,sort : 5  })
    await OperatingExpenseTypeModel.createType({ name: OpexType.REPRESENTATION,sort : 6  })
    await OperatingExpenseTypeModel.createType({ name: OpexType.COMMUNICATIONS,sort : 7  })

    await OperatingExpenseTypeModel.createType({ name: OpexType.OFFICE_SUPPLIES,sort : 8  })
    await OperatingExpenseTypeModel.createType({ name: OpexType.REPAIRS_MAINTENANCE,sort :9   })
    await OperatingExpenseTypeModel.createType({ name: OpexType.SUBSCRIPTION_FEES,sort : 10  })
    await OperatingExpenseTypeModel.createType({ name: OpexType.ADVERTISING_PROMO,sort : 11  })
    await OperatingExpenseTypeModel.createType({ name: OpexType.TAXES_LICENSES,sort : 12  })
    // await OperatingExpenseTypeModel.createType({ name: OpexType.OTHER_EXPENSE,sort : 13  })

  },

  initializeData: async () => {


    Logger.info('********************************')
    Logger.info('****Initializing Data****')
    Logger.info('********************************')


    await initTransactionType()
    // await initAssetType()
    await initRevenueType()
    await initLiabilityType()
    await initExpenseType()
    await initEquityType()

    Logger.info('********************************')
    Logger.info('****Finished Initializing Data****')
    Logger.info('********************************')
  }
}


async function initAssetType() {
  Logger.info('******************************')
  Logger.info('****Initializing Asset Type****')
  Logger.info('******************************')

  await AssetTypeModel.createAssetType({ name: AssetType.CASH })
  await AssetTypeModel.createAssetType({ name: AssetType.CASH_IN_BANK })
  await AssetTypeModel.createAssetType({ name: AssetType.PETTY_CASH_FUND })
  await AssetTypeModel.createAssetType({ name: AssetType.ACCOUNTS_RECEIVABLE })
  await AssetTypeModel.createAssetType({ name: AssetType.ADVANCES })
  await AssetTypeModel.createAssetType({ name: AssetType.INVENTORY })
  await AssetTypeModel.createAssetType({ name: AssetType.MEMBER_FUND })
  await AssetTypeModel.createAssetType({ name: AssetType.FIXED_ASSET })
  await AssetTypeModel.createAssetType({ name: AssetType.ACCUMULATED_DEPRECIATION })
  await AssetTypeModel.createAssetType({ name: AssetType.OTHER_ASSETS })
}


async function initTransactionType() {
  Logger.info('******************************')
  Logger.info('****Initializing Transaction Type****')
  Logger.info('******************************')

  await TransactionTypeModel.createTransactionType({ name: TransactionType.CASH })
  await TransactionTypeModel.createTransactionType({ name: TransactionType.ACCOUNT })
}

async function initRevenueType() {
  Logger.info('******************************')
  Logger.info('****Initializing Revenu Type****')
  Logger.info('******************************')

  await RevenueTypeModel.createRevenueType({ name: RevenueType.INCOME })
  await RevenueTypeModel.createRevenueType({ name: RevenueType.OTHER_INCOME })
}


async function initLiabilityType() {
  Logger.info('******************************')
  Logger.info('****Initializing LiabilityType****')
  Logger.info('******************************')

  await LiabilityTypeModel.createLiabilityType({ name: LiabilityType.ACCOUNTS_PAYABLE })
  await LiabilityTypeModel.createLiabilityType({ name: LiabilityType.LOANS_PAYABLE })
  await LiabilityTypeModel.createLiabilityType({ name: LiabilityType.PETTY_CASH_FUND })
  await LiabilityTypeModel.createLiabilityType({ name: LiabilityType.INTEREST_PAYABLE })
  await LiabilityTypeModel.createLiabilityType({ name: LiabilityType.OTHER_CURRENT_LIABILITY })
  await LiabilityTypeModel.createLiabilityType({ name: LiabilityType.DEBT })
  await LiabilityTypeModel.createLiabilityType({ name: LiabilityType.OTHER_PAYABLE })
}

async function initEquityType() {
  Logger.info('******************************')
  Logger.info('****Initializing EquityType****')
  Logger.info('******************************')

  await EquityTypeModel.createEquityType({ name: EquityType.EQUITY })
}


async function initExpenseType() {
  Logger.info('******************************')
  Logger.info('****Initializing ExpenseType****')
  Logger.info('******************************')

  await ExpenseTypeModel.createExpenseType({ name: ExpenseType.COST_GOODS })
  await ExpenseTypeModel.createExpenseType({ name: ExpenseType.OPERATING_EXPENSE })
}

export default initializeService
