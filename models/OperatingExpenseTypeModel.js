import { generateId } from '../utils/Crypto'
import mongoose from 'mongoose'
import Database from '../classes/Database'

const customModel = {

  init() {
    const db = Database.getConnection()

    /**
      * transactionType
      */
    const transactionTypeSchema = new mongoose.Schema({
      name: {
        type: 'String'
      }
    })

    customModel.setModel(db.connection.model('operating_expense_type', transactionTypeSchema))

    return transactionTypeSchema
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
  findByName: async (name) => {
    return await customModel.getModel().findOne({
      name: name,
    }).lean()
  },
  createType: async ({ name}) => {
    const transactionType = new customModel.model({
      name: name,
    })

    return await transactionType.save()
  }
}

export default {
  ...customModel
}
