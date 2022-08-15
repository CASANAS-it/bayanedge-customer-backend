import Properties from '../properties'
import Errors from '../classes/Errors'
import ErrorManager from '../classes/ErrorManager'
import initializeService from '../services/InitializeService'
import userService from '../services/UserService'
import tokenService from '../services/TokenService'
import CommonMessage from '../classes/CommonMessage'
import { authorize } from '../security/SecurityManager'
const securityControllers = {
  init: (router) => {
    const baseUrl = `${Properties.api}`
    router.post(baseUrl + '/login', securityControllers.authenticate)
    router.post(baseUrl + '/summary', authorize(), securityControllers.getSetUpSummary)

  },
  authenticate: async (req, res) => {
    try {
      await initializeService.init()
      res.send(
        new CommonMessage({
          data: await userService.login(req.body)
        })
      )
    } catch (err) {
      const safeErr = ErrorManager.getSafeError(err)
      
      res.send(safeErr)
    }
  },
  getSetUpSummary: async (req, res) => {
    try {
      // await initializeService.init()
      const params = req.body
      const user = await userService.getSummary(params)
      if (user) {
        res.send(
          new CommonMessage({
            data: user
          })
        )
      } else {
        throw new Errors.INVALID_LOGIN()
      }
    } catch (err) {
      const safeErr = ErrorManager.getSafeError(err)
      res.status(safeErr.status).json(safeErr.body)
    }
  },

  authenticateToken: async (req, res) => {
    try {
    } catch (err) {
      const safeErr = ErrorManager.getSafeError(err)
      res.status(safeErr.status).json(safeErr.body)
    }
  }

}

export default securityControllers
