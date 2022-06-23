import mongoose, { Schema } from 'mongoose'
import Database from '../classes/Database'
import Logger from '../classes/Logger'
import { encrypt, generateId, decrypt } from '../utils/Crypto'
import mongoosePaginate from 'mongoose-paginate'
import { padZeroes } from '../utils/CommonUtil'

const customModel = {

  init() {
    const db = Database.getConnection()
    const itemSchema = new mongoose.Schema({
      parent_id: {
        type: 'String'
      },
      transaction_id: {
        type: 'String'
      },
      display_id: {
        type: 'String'
      },
      client_id: {
        type: 'String',
      },
      date: {
        type: 'String'
      },
      total: {
        type: "Number"
      },
      microsavings: {
        type: "Number"
      },
      balance: {
        type: "Number"
      },
      is_posted: {
        type: 'Boolean'
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
    },
      {
        toObject: { virtuals: true },
      })

    itemSchema.plugin(mongoosePaginate)
    customModel.setModel(db.connection.model('loans_repayments', itemSchema))

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
        is_active : true
      })
      .lean()
    return items
  },
  getByClientId: async (id) => {
    const items = await customModel.model
      .findOne({
        client_id: id,
        is_active: true
      })
      .lean()
    return items
  },
  getPaginatedItems: async (limit, offset, client_id) => {
    var options = {
      lean: true,
      offset: offset, limit: limit
    }
    return await customModel.getModel().paginate({ is_active: true, client_id: client_id }, options)

    // return await customModel.getModel().find().select().populate('item').populate('customer').lean()
  },
  getAllNonPosted: async (date) => {
    const items = await customModel.model
      .find({
        is_posted: false,
        date : date
      })
      .lean()
    return items
  },
  getById: async (id) => {
    const item = await customModel.model
      .findOne({
        transaction_id: id,
        is_active: true
      })
      .lean()
    return item
  },  
  getByParentId: async (id) => {
    const item = await customModel.model
      .findOne({
        parent_id: id,
        is_active: true
      })
      .lean()
    return item
  },

  pay: async (params) => {
    const user = await customModel.model.findOneAndUpdate({ transaction_id: params.transaction_id }, {
      balance: params.balance,
      next_payment_date: params.next_payment_date,
      modified_by: params.admin_id,
      modified_date: new Date(),
    })
    return user
  },
  markAsPosted: async (params) => {
    const user = await customModel.model.findOneAndUpdate({ transaction_id: params.transaction_id }, {
      is_posted: true,
      modified_by: params.admin_id,
      modified_date: new Date(),
    })
    return user
  },
  update: async (params) => {
    const user = await customModel.model.findOneAndUpdate({ transaction_id: params.transaction_id }, {
      client_id: params.client_id,
      total: params.total,
      date: params.date,
      balance: params.balance,
      modified_by: params.admin_id,
      modified_date: new Date(),
    })
    return user
  },
  delete: async (params) => {
    const user = await customModel.model.findOneAndUpdate({ transaction_id: params.transaction_id }, {
      is_active: false,
      modified_by: params.admin_id,
      modified_date: new Date(),
    })
    return user
  },

  
  deletePosted: async (params) => {
    const user = await customModel.model.deleteOne({ transaction_id: params.transaction_id })
    return user
  },
  
  permanentDeleteByParentId: async (id) => {
    const user = await customModel.model.deleteMany(
      { parent_id: id })
    return user
  },
  create: async (params) => {
    const id = generateId()
    const item = new customModel.model({
      transaction_id: id,
      parent_id : params.parent_id,
      client_id: params.client_id,
      display_id: params.display_id,
      total: params.total,
      date: params.date,
      microsavings : params.microsavings,
      balance: params.balance,
      is_active: true,
      is_posted: params.is_posted,
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
