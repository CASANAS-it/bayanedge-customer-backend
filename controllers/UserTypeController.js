
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
import userTypeService from '../services/UserTypeService'

const customControllers = {
  init: router => {
    const baseUrl = `${Properties.api}/user_type`
    router.get(baseUrl + '/', authorize(), customControllers.get)
  },

  /**
   * UserTypeModel.get
   *   @description Get all user types
   *   @returns object
   *
   */
  get: async (req, res) => {
    try {
      const data = await userTypeService.getAll()
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
