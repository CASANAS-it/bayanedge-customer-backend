import SafeError from './SafeError'
import ErrorMessages from './ErrorMessages'

/**
 * Create custom error dynamically base on ./ErrorMessages.js
 * EXAMPLE: throw new Errors.JWT_EXPIRED()
 */
const Errors = Object.entries(ErrorMessages).reduce((errors, [k, v, c]) => {
  const name = k
  errors[k] = class k extends (
    SafeError
  ) {
    /**
     * Error Class Constuctor
     * @param {*} message Http Message from ErrorMessages
     * @param {*} status Http Status from ErrorMessages
     */
    constructor (message = v.message, status = v.status, code = v.code) {
      super({
        message: message,
        status: status,
        name: name,
        code: code
      })
    }
  }
  return errors
}, {})

export default Errors
