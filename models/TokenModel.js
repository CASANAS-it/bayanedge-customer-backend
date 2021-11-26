import { generateId } from '../utils/Crypto'
import mongoose from 'mongoose'
import Database from '../classes/Database'

const customModel = {
  /**
   * Init  schema
   */
  init () {
    const db = Database.getConnection()

    /**
      * Token
      */
    const tokenSchema = new mongoose.Schema({
      created_date: {
        type: 'Date'
      },
      id: {
        type: 'String',
        required: true
      },
      merchant_credential_id: {
        type: 'String'
      },
      token: {
        type: 'String'
      }
    })

    customModel.setModel(db.connection.model('Token', tokenSchema))

    return tokenSchema
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
  create: async (userId, token) => {
    const tkn = new customModel.model({
      id: generateId(),
      token: token,
      merchant_credential_id: userId,
      created_date: new Date()
    })

    return await tkn.save()
  }
}

export default {
  ...customModel
}
