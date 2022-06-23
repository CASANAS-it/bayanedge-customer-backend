// Import Mongoose
import mongoose from 'mongoose'
// Logging
import Logger from './Logger'
// Properties
import properties from '../properties.js'
import TokenModel from '../models/TokenModel'
import UserTypeModel from '../models/UserTypeModel'
import UserModel from '../models/UserModel'
import AssetTypeModel from '../models/AssetTypeModel'
import EquityTypeModel from '../models/EquityTypeModel'
import RevenueTypeModel from '../models/RevenueTypeModel'
import LiabilityTypeModel from '../models/LiabilityTypeModel'
import ExpenseTypeModel from '../models/ExpenseTypeModel'
import ApiLogModel from '../models/ApiLogModel'
import InventoryModel from '../models/InventoryModel'
import CustomerModel from '../models/CustomerModel'
import VendorModel from '../models/VendorModel'
import RevenueModel from '../models/RevenueModel'
import LiabilityModel from '../models/LiabilityModel'
import AssetModel from '../models/AssetModel'
import ExpenseModel from '../models/ExpenseModel'
import EquityModel from '../models/EquityModel'
import ClientUserModel from '../models/ClientUserModel'
import EnterpriseModel from '../models/EnterpriseModel'
import TransactionTypeModel from '../models/TransactionTypeModel'
import SalesModel from '../models/SalesModel'
import LedgerModel from '../models/LedgerModel'
import CashJournalModel from '../models/CashJournalModel'
import AccountPayableModel from '../models/AccountPayableModel'
import AccountReceivableModel from '../models/AccountReceivableModel'
import LoansPayableItemModel from '../models/LoansPayableItemModel'
import LoansPayableModel from '../models/LoansPayableModel'
import LoansProceedModel from '../models/LoansProceedModel'
import BeginningBalanceModel from '../models/BeginningBalanceModel'
import LoansRepaymentModel from '../models/LoansRepaymentModel'
import JobsModel from '../models/JobsModel'
import OperatingExpenseTypeModel from '../models/OperatingExpenseTypeModel'
/**
 * Connection to DB
 */
class Database {
  /**
   * Init database
   */
  async init() {
    await this.authenticate()
    Logger.info('MongoDB connected at: ' + properties.butler_db_dbUrl)

    // Start Init Models

    TokenModel.init()
    UserTypeModel.init()
    UserModel.init()
    AssetTypeModel.init()
    EquityTypeModel.init()
    RevenueTypeModel.init()
    LiabilityTypeModel.init()
    ExpenseTypeModel.init()
    ApiLogModel.init()
    InventoryModel.init()
    CustomerModel.init()
    VendorModel.init()
    AssetModel.init()
    RevenueModel.init()
    ExpenseModel.init()
    EquityModel.init()
    LiabilityModel.init()
    ClientUserModel.init()
    EnterpriseModel.init()
    TransactionTypeModel.init()
    SalesModel.init()
    LedgerModel.init()
    CashJournalModel.init()
    AccountPayableModel.init()
    AccountReceivableModel.init()
    LoansPayableItemModel.init()
    LoansPayableModel.init()
    LoansProceedModel.init()
    BeginningBalanceModel.init()
    LoansRepaymentModel.init()
    OperatingExpenseTypeModel.init()
    JobsModel.init()
    // End Init Models
  }

  /**
   * Start database connection
   */
  async authenticate() {
    Logger.info('Authenticating to the databases...')
    try {
      this.dbConnection_eVoucher_db = await mongoose.connect(
        'mongodb://' + properties.butler_db_dbUrl,
        { useNewUrlParser: true }
      )
    } catch (err) {
      Logger.error(`Failed connection to the DB: ${err.message}`)
      Logger.error(err)
      await new Promise((resolve) => setTimeout(resolve, 5000))
      await this.authenticate()
    }
  }

  /**
   * Get connection db
   *  @return {String} Connection to db
   */
  getConnection() {
    return this.dbConnection_eVoucher_db
  }
}

export default new Database()
