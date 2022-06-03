
// Properties
import Properties from '../properties'

// Database
import UserModel from '../models/UserModel'

// Security
import { authorize } from '../security/SecurityManager'

import CommonMessage from '../classes/CommonMessage'
// Errors
import Errors from '../classes/Errors'
import ErrorManager from '../classes/ErrorManager'
import { lookupService } from '../services/LookupService'
import { UserType } from '../classes/Constants'
import { reportService } from '../services/TransactionService'

const customControllers = {
  init: router => {
    const baseUrl = `${Properties.api}`
    router.get(baseUrl + '/asset_type', authorize(), customControllers.getAssetType)
    router.get(baseUrl + '/revenue_type', authorize(), customControllers.getRevenueType)
    router.get(baseUrl + '/liability_type', authorize(), customControllers.getLiabilityType)
    router.get(baseUrl + '/expense_type', authorize(), customControllers.getExpenseType)
    router.get(baseUrl + '/equity_type', authorize(), customControllers.getEquityType)
    router.get(baseUrl + '/transaction_type', authorize(), customControllers.getTransactionType)
    router.get(baseUrl + '/customer', authorize(), customControllers.getCustomers)
    router.get(baseUrl + '/vendor', authorize(), customControllers.getVendors)
    router.get(baseUrl + '/inventory_list', authorize(), customControllers.getInventory)
    router.get(baseUrl + '/opex_type', authorize(), customControllers.getOpexType)
    router.post(baseUrl + '/dashboard', authorize(), customControllers.getDashBoard)

  },

  getAssetType: async (req, res) => {
    try {
      const data = await lookupService.getAllAssetType()
      res.send(
        new CommonMessage({
          data: data
        })
      )
    } catch (err) {
      const safeErr = ErrorManager.getSafeError(err)
      res.status(safeErr.status).json(safeErr)
    }
  },
  getEquityType: async (req, res) => {
    try {
      const data = await lookupService.getAllEquityType()
      res.send(
        new CommonMessage({
          data: data
        })
      )
    } catch (err) {
      const safeErr = ErrorManager.getSafeError(err)
      res.status(safeErr.status).json(safeErr)
    }
  },
  getOpexType: async (req, res) => {
    try {
      const data = await lookupService.getAllOpexType()
      res.send(
        new CommonMessage({
          data: data
        })
      )
    } catch (err) {
      const safeErr = ErrorManager.getSafeError(err)
      res.status(safeErr.status).json(safeErr)
    }
  },
  getExpenseType: async (req, res) => {
    try {
      const data = await lookupService.getAllExpenseType()
      res.send(
        new CommonMessage({
          data: data
        })
      )
    } catch (err) {
      const safeErr = ErrorManager.getSafeError(err)
      res.status(safeErr.status).json(safeErr)
    }
  },
  getLiabilityType: async (req, res) => {
    try {
      const data = await lookupService.getAllLiabilityType()
      res.send(
        new CommonMessage({
          data: data
        })
      )
    } catch (err) {
      const safeErr = ErrorManager.getSafeError(err)
      res.status(safeErr.status).json(safeErr)
    }
  },
  getRevenueType: async (req, res) => {
    try {
      const data = await lookupService.getAllRevenueType()
      res.send(
        new CommonMessage({
          data: data
        })
      )
    } catch (err) {
      const safeErr = ErrorManager.getSafeError(err)
      res.status(safeErr.status).json(safeErr)
    }
  },
  getTransactionType: async (req, res) => {
    try {
      const data = await lookupService.getAllTransactionType()
      res.send(
        new CommonMessage({
          data: data
        })
      )
    } catch (err) {
      const safeErr = ErrorManager.getSafeError(err)
      res.status(safeErr.status).json(safeErr)
    }
  },
  getCustomers: async (req, res) => {
    try {
      const data = await lookupService.getAllCustomer(req.body.client_id)
      res.send(
        new CommonMessage({
          data: data
        })
      )
    } catch (err) {
      const safeErr = ErrorManager.getSafeError(err)
      res.status(safeErr.status).json(safeErr)
    }
  },
  getDashBoard: async (req, res) => {
    try {
      reportService.getDashboard(req.body).then(data => {
        res.send(
          new CommonMessage({
            data: data
          })
        )
      })
    } catch (err) {
      const safeErr = ErrorManager.getSafeError(err)
      res.status(safeErr.status).json(safeErr)
    }
  },
  getVendors: async (req, res) => {
    try {
      const data = await lookupService.getAllVendor(req.body.client_id)
      res.send(
        new CommonMessage({
          data: data
        })
      )
    } catch (err) {
      const safeErr = ErrorManager.getSafeError(err)
      res.status(safeErr.status).json(safeErr)
    }
  },
  getInventory: async (req, res) => {
    try {
      const data = await lookupService.getAllItem(req.body.client_id)
      res.send(
        new CommonMessage({
          data: data
        })
      )
    } catch (err) {
      const safeErr = ErrorManager.getSafeError(err)
      res.status(safeErr.status).json(safeErr)
    }
  }
}

export default {
  ...customControllers
}
