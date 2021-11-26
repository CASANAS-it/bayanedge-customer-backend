
// Properties
import Properties from '../properties'

// Database
import UserModel from '../models/UserModel'

// Security
import { authorize } from '../security/SecurityManager'

// Errors
import Errors from '../classes/Errors'
import ErrorManager from '../classes/ErrorManager'

const customControllers = {
  init: router => {
    const baseUrl = `${Properties.api}/user`
    router.post(
      baseUrl + '/:id/changePassword',
      authorize(['ADMIN']),
      customControllers.changePassword
    )
  },

  /**
   * UserModel.changePassword
   *   @description Change password of user from admin
   *   @returns object
   *
   */
  changePassword: async (req, res) => {
    try {
      const user = await UserModel.getByUsernameAndPassword(
        req.user.username,
        req.body.passwordAdmin
      )
      if (!user) {
        throw new Errors.PWD_ADMIN_NOT_VALID()
      }
      await UserModel.updatePassword(req.params.id, req.body.passwordNew)
      res.send({
        success: true
      })
    } catch (err) {
      const safeErr = ErrorManager.getSafeError(err)
      res.status(safeErr.status).json(safeErr)
    }
  }
}

export default {
  ...customControllers
}
