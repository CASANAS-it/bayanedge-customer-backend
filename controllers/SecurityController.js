import Properties from '../properties'
import Errors from '../classes/Errors'
import ErrorManager from '../classes/ErrorManager'
import initializeService from '../services/InitializeService'
import userService from '../services/UserService'
import tokenService from '../services/TokenService'
import CommonMessage from '../classes/CommonMessage'
const securityControllers = {
  init: (router) => {
    const baseUrl = `${Properties.api}`
    router.post(baseUrl + '/login', securityControllers.authenticate)

  },
  authenticate: async (req, res) => {
    try {
      await initializeService.init()
      const params = req.body
      const user = await userService.login(params)
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
