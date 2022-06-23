/* eslint-disable valid-jsdoc */
// Dependencies
import jsonwebtoken from 'jsonwebtoken'
import cors from 'cors'
import helmet from 'helmet'
// Properties
import properties from '../properties'
// Errors
import ErrorManager from '../classes/ErrorManager'
import Errors from '../classes/Errors'
// import AccessModel from '../models/AccessModel'

/**
 * Middleware JWT
 * @param {string, array} roles Authorized role, null for all
 */
export const authorize = (accessLevel) => {
  // Roles param can be a single role string (e.g. Role.User or 'User')
  // or an array of roles (e.g. [Role.Admin, Role.User] or ['Admin', 'User'])
  return [
    // Authenticate JWT token and attach user to request object (req.user)
    async (req, res, next) => {
      const token =
        req.headers.authorization &&
        req.headers.authorization.replace('Bearer ', '')

      if (!token) {
        const safeErr = ErrorManager.getSafeError(
          new Errors.INVALID_AUTH_HEADER()
        )
        res.status(safeErr.status).json(safeErr.body)
      } else {
        let decodedUser = null
        try {
          decodedUser = jsonwebtoken.verify(token, properties.tokenSecret)
          req.body.admin_id = decodedUser.id
          req.body.client_id = decodedUser.client_id
        } catch (err) {
          // Token not valid
          const safeErr = ErrorManager.getSafeError(new Errors.JWT_INVALID())
          return res.status(401).json(safeErr.body)
        }

        // const hasAccess = await AccessModel.getUserByAccessLevel({ accessLevel, loginId: decodedUser.login_id })

        // if (hasAccess) {
        //   req.user = decodedUser
          next()
        // } else {
        //   const safeErr = ErrorManager.getSafeError(new Errors.UNAUTHORIZED())
        //   res.status(safeErr.status).json(safeErr.body)
        // }
      }
    }
  ]
}

export const initSecurity = (app) => {
  app.use(helmet())
  app.use(cors())
}
