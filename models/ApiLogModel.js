import mongoose from 'mongoose'
import Database from '../classes/Database'
import moment from 'moment'

const customModel = {

  init() {
    const db = Database.getConnection()

    /**
      * Customer
      */
    const customerSchema = new mongoose.Schema({
      api_log_id: {
        type: 'String'
      },
      request_data: {
        type: 'String'
      },
      response_data: {
        type: 'String'
      },
      type: {
        type: 'String'
      },
      is_success: {
        type: 'String'
      },
      date: {
        type: 'String'
      }
    })

    customModel.setModel(db.connection.model('api_log', customerSchema))

    return customerSchema
  },

  /**
   * Set Model
   */
  setModel: model => {
    customModel.model = model
  },

  /**
   * Get model
   */
  getModel: () => {
    return customModel.model
  },
  insertLog: async ({ apiLogId, requestData, responseData, type, isSuccess }) => {
    const apiLog = new customModel.model({
      api_log_id: apiLogId,
      request_data: requestData,
      response_data: responseData,
      type,
      is_success: isSuccess,
      date: moment().format()
    })

    await apiLog.save()
  }

}

export default {
  ...customModel
}
