import CommonMessage from './CommonMessage'
import Logger from './Logger'
import SafeError from './SafeError'

/**
 * ErrorManager Class
 */
export class ErrorManager {
  /**
   * Get the error stacktrace
   * @param {*} err Error Stacktrace
   * @return {CommonMessage} Returns JSON response with initialized
   * error status and messages
   */
  getSafeError(err) {
    Logger.error(err.stack)
    if (err instanceof SafeError) {
      return {
        status: err.status,
        response_code: (err.code || err.status),
        response_message: err.message,
        data: null
      }
    }

    // create a safe, generic error message to always return
    return new SafeError({})
  }
}

export default new ErrorManager()
