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
      transaction_id: {
        type: 'String'
      },
      display_id: {
        type: 'String'
      },
      client_id: {
        type: 'String',
      },
      
      type_id: {
        type: 'String',
      },
      flow_type_id: {
        type: 'String',
      },
      name: {
        type: 'String',
      },
      description: {
        type: 'String',
      },
      total: {
        type: 'String'
      },
      date: {
        type: 'String'
      },
      total: {
        type: "Number"
      },
      details: {
        type: "Object"
      },
      has_record: {
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
    customModel.setModel(db.connection.model('beginning_balance', itemSchema))

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
  
  getByTypeIdClientId: async (id,typeId) => {
    const items = await customModel.model
      .findOne({
        client_id: id,
        type_id : typeId,
        is_active : true
      })
      .lean()
    return items
  },
  getByClientId: async (id) => {
    const items = await customModel.model
      .findOne({
        client_id: id,
        is_active : true
      })
      .lean()
    return items
  },
  
  getByClientIdTypeId: async (id,type_id) => {
    const items = await customModel.model
      .findOne({
        client_id: id,
        type_id : type_id
      })
      .lean()
    return items
  },
  getPaginatedItems: async (limit, offset, client_id) => {
    var options = {
      populate: ['item'],
      lean: true,
      offset: offset, limit: limit,
      sort : {date : 1}
    }
    return await customModel.getModel().paginate({ is_active: true, client_id: client_id }, options)

    // return await customModel.getModel().find().select().populate('item').populate('customer').lean()
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

  pay: async (params) => {
    const user = await customModel.model.findOneAndUpdate({ transaction_id: params.transaction_id }, {
      details : params.details,
      modified_by: params.admin_id,
      modified_date: new Date(),
    })
    return user
  },
  
  markHasRecord: async (params) => {
    const user = await customModel.model.findOneAndUpdate({ transaction_id: params.transaction_id }, {
      has_record: true,
      modified_by: params.admin_id,
      modified_date: new Date(),
    })
    return user
  },
  update: async (params) => {
    const user = await customModel.model.findOneAndUpdate({ transaction_id: params.transaction_id }, {
      client_id: params.client_id,
      name: params.name,
      description: params.description,
      details : params.details,
      total: params.total,
      date: params.date,
      modified_by: params.admin_id,
      modified_date: new Date(),
    })
    return user
  },
  delete: async (id) => {
    const user = await customModel.model.deleteOne(
      { transaction_id: id })
    return user
  },
  create: async (params) => {

    const id = generateId()
    const item = new customModel.model({
      transaction_id: id,
      client_id: params.client_id,
      display_id: params.display_id,
      name: params.name,
      description: params.description,
      flow_type_id : params.flow_type_id,
      details : params.details,
      total: params.total,
      date: params.date,
      type_id : params.type_id,
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
