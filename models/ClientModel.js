import { generateId } from '../utils/Crypto'
import mongoose from 'mongoose'
import Database from '../classes/Database'

const customModel = {

  init() {
    const db = Database.getConnection()
    const clientUserSchema = new mongoose.Schema({
      id: {
        type: 'String'
      },
      name: {
        type: 'String'
      },
      to: {
        type: 'String'
      },
      from: {
        type: 'String'
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

    customModel.setModel(db.connection.model('client', clientUserSchema, 'client'))
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
  getById: async (id) => {
    return await customModel.model.findOne({
      id: id
    }).lean()
  },

  update: async (params) => {
    const user = await customModel.model.findOneAndUpdate({ id: params.id }, {
      ...params,
      modified_by: params.admin_id,
      modified_date: new Date(),
    })
    return user
  },

  
  updateSubscription: async (params) => {
    const user = await customModel.model.findOneAndUpdate({ id: params.client_id }, {
      from : params.from,
      to : params.to,
      modified_by: params.admin_id,
      modified_date: new Date(),
    })
    return user
  },
  delete: async (params) => {
    const user = await customModel.model.findOneAndUpdate({ customer_id: params.customer_id }, {
      is_active: false,
      modified_by: params.admin_id,
      modified_date: new Date(),
    })
    return user
  },
  create: async (params) => {
    const id = generateId()
    const customer = new customModel.model({
      id,
      ...params,
      created_by: params.admin_id,
      modified_by: params.admin_id,
      created_date: new Date(),
      modified_date: new Date(),
    })
    return await customer.save()
  }
}

export default {
  ...customModel
}
