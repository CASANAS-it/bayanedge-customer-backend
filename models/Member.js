import { generateId } from '../utils/Crypto'
import mongoose from 'mongoose'
import Database from '../classes/Database'

const customModel = {
  /**
   * Init  schema
   */
  init() {
    const db = Database.getConnection()

    /**
      * Token
      */
    const member = new mongoose.Schema({
      first_name: {
        type: 'String'
      },
      middle_name: {
        type: 'String'
      },
      last_name: {
        type: 'String'
      },
      email_address: {
        type: 'String'
      },
      mobile_number: {
        type: 'String'
      },
      clubs: {
        type: 'Object'
      },
      is_active: {
        type: 'Boolean'
      },
      created_by: {
        type: 'String'
      },
      created_date: {
        type: 'Date'
      },
      modified_by: {
        type: 'String'
      },
      modified_date: {
        type: 'Date'
      },
    })

    customModel.setModel(db.connection.model('members', member))

    return member
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

  create: async (schedule, token) => {
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
