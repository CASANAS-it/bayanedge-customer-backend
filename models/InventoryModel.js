import mongoose from 'mongoose'
import Database from '../classes/Database'
import Logger from '../classes/Logger'
import { encrypt, generateId, decrypt } from '../utils/Crypto'
import mongoosePaginate from 'mongoose-paginate'

const customModel = {

  init() {
    const db = Database.getConnection()
    const itemSchema = new mongoose.Schema({
      item_id: {
        type: 'String'
      },
      client_id: {
        type: 'String'
      },
      name: {
        type: 'String'
      },
      unit_cost: {
        type: 'Number'
      },
      unit_selling_price: {
        type: 'Number'
      },
      unit_of_measurement: {
        type: 'String'
      },
      quantity: {
        type: 'Number'
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

    itemSchema.plugin(mongoosePaginate)
    customModel.setModel(db.connection.model('items', itemSchema))

    return itemSchema
  },
  setModel: model => {
    customModel.model = model
  },
  getModel: () => {
    return customModel.model
  },
  getAll: async () => {
    return await customModel.getModel()
      .find()
      .select(['-_id', '-__v'])
      .lean()
  },
  getAllByClientId: async (id) => {
    const items = await customModel.model
      .find({
        client_id: id,
      })
      .lean()
    return items
  },
  getByClientId: async (id) => {
    const items = await customModel.model
      .findOne({
        client_id: id,
      }).lean()
    return items
  },
  getPaginatedItems: async (limit, offset, client_id) => {
    return await customModel.getModel().paginate({ is_active: true, client_id: client_id }, { offset: offset, limit: limit })
  },
  getByItemId: async (id) => {
    const item = await customModel.model
      .findOne({
        item_id: id,
        is_active: true
      })
      .lean()
    return item
  },
  update: async (params) => {
    const user = await customModel.model.findOneAndUpdate({ item_id: params.item_id }, {
      name: params.name,
      unit_cost: parseFloat(params.unit_cost),
      unit_selling_price: parseFloat(params.unit_selling_price),
      unit_of_measurement: params.unit_of_measurement,
      quantity: params.quantity,
      modified_by: params.admin_id,
      modified_date: new Date(),
    })
    return user
  },

  addQuantity: async (params) => {
    console.log(params,'addQuantity')
    const user = await customModel.model.findOneAndUpdate({ item_id: params.item_id }, {
      $inc: { quantity: params.quantity },
      modified_by: params.admin_id,
      modified_date: new Date(),
    })
    return user
  },

  subtractQuantity: async (params) => {
    const user = await customModel.model.findOneAndUpdate({ item_id: params.item_id }, {
      $inc: { quantity: (params.quantity * -1) },
      modified_by: params.admin_id,
      modified_date: new Date(),
    })
    return user
  },
  delete: async (params) => {
    const user = await customModel.model.findOneAndUpdate({ item_id: params.id }, {
      is_active: false,
      modified_by: params.admin_id,
      modified_date: new Date(),
    })
    return user
  },
  create: async (params) => {
    Logger.info('Creating item ' + params.name)
    const id = generateId()
    const item = new customModel.model({
      item_id: id,
      name: params.name,
      client_id: params.client_id,
      unit_cost: parseFloat(params.unit_cost),
      unit_selling_price: parseFloat(params.unit_selling_price),
      unit_of_measurement: params.unit_of_measurement,
      quantity: params.quantity,
      is_active: true,
      created_by: params.admin_id,
      created_date: new Date(),
      modified_by: params.admin_id,
      modified_date: new Date(),
    })
    return await item.save()

  }
}

export default {
  ...customModel
}
