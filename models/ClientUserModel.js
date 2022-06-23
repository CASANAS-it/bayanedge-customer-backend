import { generateId } from '../utils/Crypto'
import mongoose from 'mongoose'
import Database from '../classes/Database'

const customModel = {

  init() {
    const db = Database.getConnection()
    const clientUserSchema = new mongoose.Schema({
      client_id: {
        type: 'String'
      },
      user_id: {
        type: 'String'
      },
    })

    customModel.setModel(db.connection.model('client_user', clientUserSchema,'client_user'))
    return clientUserSchema
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
  getAll: async () => {
    return await customModel.getModel()
      .find()
      .select(['-_id', '-__v'])
      .lean()
  },
  getByUserId: async (user_id) => {
    return await customModel.model.findOne({
      user_id: user_id
    }).lean()
  },
  getByClientId: async (client_id) => {
    return await customModel.model.findOne({
      client_id: client_id
    }).lean()
  }
}

export default {
  ...customModel
}
