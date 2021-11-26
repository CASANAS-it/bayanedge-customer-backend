import SuccessMessages from './SuccessMessages'

/**
 * Default response to client
 */
class CommonMessage {
  /**
   * Default constructor for return messages
   * @param {String} response_code Response Code
   * @param {String} response_message Response Message
   * @param {*} data Result of the API
   */
  constructor ({
    response_code: responseCode = SuccessMessages.SUCCESS.code,
    response_message: responseMessage = SuccessMessages.SUCCESS.message,
    data = {}
  }) {
    this.response_code = responseCode
    this.response_message = responseMessage
    this.data = data
  }
}

export default CommonMessage
