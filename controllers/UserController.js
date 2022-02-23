
// Properties
import Properties from '../properties'

// Database
import UserModel from '../models/UserModel'

// Security
import { authorize } from '../security/SecurityManager'

// Errors
import Errors from '../classes/Errors'
import ErrorManager from '../classes/ErrorManager'
import CommonMessage from '../classes/CommonMessage'

const customControllers = {
  init: router => {
    const baseUrl = `${Properties.api}/user`
    router.post(
      baseUrl + '/:id/changePassword',
      authorize([]),
      customControllers.changePassword
    )
    // router.post(baseUrl + "/change-password-via-activation-code", customControllers.changePasswordViaActivationCode);
    router.get(baseUrl + "/forgot-password/:id", customControllers.initForgotPassword);
    router.post(baseUrl + "/change-password-via-activation-code", customControllers.changePasswordViaActivationCode);

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
      await UserModel.updatePassword(req.body.admin_id, req.body.passwordNew)
      res.send({
        success: true
      })
    } catch (err) {
      const safeErr = ErrorManager.getSafeError(err)
      res.status(safeErr.status).json(safeErr)
    }
  },
  initForgotPassword: async (req, res) => {
    try {
      const result = await UserModel.initForgotPassword(req.params.id);
      if (result != null) {
        res.json({ response_code: 0, response_message: "Successful" })
      } else {
        res.json({ response_code: -1, response_message: "User does not exists" })
      }
    } catch (err) {
      const safeErr = ErrorManager.getSafeError(err);
      res.status(safeErr.response_code).json(safeErr);
    }
  },
  changePasswordViaActivationCode: async (req, res) => {
    try {
      let model = await UserModel.getByActivationCode(req.body.activation_code);
      if (model) {
        model.activation_code = '';
        model.password = req.body.password;

        let user = await UserModel.updatePassword(model.id, req.body.password);

        if (!user) {
          throw new Errors.CHANGE_PASSWORD_FAILED()
        } else {
          res.send(
            new CommonMessage({
            })
          )
        }
      } else {
        res.json({ response_code: -1, response_message: "Link expired", })

      }
    } catch (err) {
      const safeErr = ErrorManager.getSafeError(err);
      res.status(safeErr.response_code).json(safeErr);
    }
  },
}

export default {
  ...customControllers
}
