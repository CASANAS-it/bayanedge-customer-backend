
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

const customControllers = {
  init: router => {
    const baseUrl = `${Properties.api}`
    router.get(baseUrl + '/asset_type', authorize(), customControllers.getAssetType)
    router.get(baseUrl + '/revenue_type', authorize(), customControllers.getRevenueType)
    router.get(baseUrl + '/liability_type', authorize(), customControllers.getLiabilityType)
    router.get(baseUrl + '/expense_type', authorize(), customControllers.getExpenseType)
    router.get(baseUrl + '/equity_type', authorize(), customControllers.getEquityType)
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
  }
}

export default {
  ...customControllers
}
