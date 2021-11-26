import { generateId } from '../utils/Crypto'
import mongoose from 'mongoose'
import Database from '../classes/Database'

const customModel = {

  init() {
    const db = Database.getConnection()

    /**
      * Asset Type Model
      */
    const liabilityTypeSchema = new mongoose.Schema({
      name: {
        type: 'String'
      }
    })

    customModel.setModel(db.connection.model('liability_types', liabilityTypeSchema))

    return liabilityTypeSchema
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
  create: async ({ name }) => {
    const liabilityType = new customModel.model({
      name: name,
    })

    return await liabilityType.save()
  }
}

export default {
  ...customModel
}
