// Express
import express from 'express'
import http from 'http'
import bodyParser from 'body-parser'
import path from 'path'

// Swagger
import swaggerUi from 'swagger-ui-express'
import yaml from 'yamljs'

// Logging
import Logger from './Logger'

// Properties
import properties from '../properties.js'

// Security
import cors from 'cors'

// Controllers
import SecurityController from '../controllers/SecurityController'
import UserController from '../controllers/UserController'

// Start Import Controllers

// Database
import Database from './Database.js'
import LookupController from '../controllers/LookupController'
import InventoryController from '../controllers/InventoryController'
import CustomerController from '../controllers/CustomerController'
import VendorController from '../controllers/VendorController'
import AssetController from '../controllers/AssetController'
import ExpenseController from '../controllers/ExpenseController'
import EquityController from '../controllers/EquityController'
import LiabilityController from '../controllers/LiabilityController'
import RevenueController from '../controllers/RevenueController'
import EnterpriseController from '../controllers/EnterpriseController'
import SalesController from '../controllers/SalesController'
import LedgerController from '../controllers/LedgerController'
import AccountPayableController from '../controllers/AccountPayableController'
import AccountReceivableController from '../controllers/AccountReceivableController'
import CashJournalController from '../controllers/CashJournalController'
import LoansPayableController from '../controllers/LoansPayableController'
import LoansPayableItemController from '../controllers/LoansPayableItemController'
import CashInflowController from '../controllers/CashInflowController'
import CashOutflowController from '../controllers/CashOutflowController'
import LoansProceedController from '../controllers/LoansProceedController'
import BeginningBalanceController from '../controllers/BeginningBalanceController'

const cron = require('node-cron')
// End Import Controllers

class Server {
  constructor () {
    this.app = express()
  }

  /**
   * Start the server
   * @returns {Promise<void>}
   */
  async init () {
    // Start Init Database
    Database.init()
    // End Init Database

    // Add parser
    this.app.use(bodyParser.json())
    this.app.use(bodyParser.urlencoded({ extended: true }))
    this.app.use(Logger.expressMiddleware)

    // Securitiy
    // this.app.use(helmet());
    this.app.use(cors())

    // Redirect frontend
    this.app.use('*', (req, res, next) => {
      if (req.originalUrl) {
        const url = req.originalUrl
        if (!url.startsWith('/api/') && url.indexOf('.') === -1) {
          res
            .status(200)
            .sendFile(path.resolve(path.join(__dirname, '//..//', properties.publicPath.replace(/\//g, '//'), '//index.html')))
        } else {
          next()
        }
      } else {
        next()
      }
    })

    // Start App Server
    const server = http.Server(this.app)
    this.app.use(express.static(properties.publicPath))

    await server.listen(properties.port)
    Logger.info('Server started on port ' + properties.port)

    // Import controllers
    const router = express.Router()
    SecurityController.init(router)
    LookupController.init(router)

    // Start Init Controllers
    UserController.init(router)
    InventoryController.init(router)
    CustomerController.init(router)
    VendorController.init(router)
    AssetController.init(router)
    ExpenseController.init(router)
    EquityController.init(router)
    LiabilityController.init(router)
    RevenueController.init(router)
    EnterpriseController.init(router)
    SalesController.init(router)
    LedgerController.init(router)
    AccountPayableController.init(router)
    AccountReceivableController.init(router)
    CashJournalController.init(router)
    LoansPayableController.init(router)
    LoansPayableItemController.init(router)
    CashInflowController.init(router)
    CashOutflowController.init(router)
    LoansProceedController.init(router)
    BeginningBalanceController.init(router)
    // End Init Controllers

    this.app.use('/', router)

    console.log('Started running Batch Job Process')
    // cron.schedule('*/5 * * * *', async () => {
    //   console.log('Running validating jobs')
    //   await JobsService.updateJobs()
    // })
  }
}

export default new Server()
