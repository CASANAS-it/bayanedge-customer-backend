import mongoose, { Schema } from 'mongoose'
import Database from '../classes/Database'
import Logger from '../classes/Logger'
import { encrypt, generateId, decrypt } from '../utils/Crypto'
import mongoosePaginate from 'mongoose-paginate'
import moment from 'moment'

const customModel = {

  init() {
    const db = Database.getConnection()
    const itemSchema = new mongoose.Schema({
      parent_id: {
        type: 'String'
      },
      child_id: {
        type: 'String'
      },

      balance: {
        type: "Number"
      },
      amount_to_be_paid_per_term: {
        type: "Number"
      },
      is_paid: {
        type: 'Boolean'
      },
      is_active: {
        type: 'Boolean'
      },

      transaction_date: {
        type: 'String',
      },
      client_id: {
        type: 'String',
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


    itemSchema.virtual('parent', {
      ref: 'loan_payable',
      localField: 'parent_id',
      foreignField: 'loan_payable_id',
      justOne: true // for many-to-1 relationships
    });


    itemSchema.plugin(mongoosePaginate)
    customModel.setModel(db.connection.model('loan_payable_items', itemSchema))

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
        is_active : true
      })
      .lean()
    return items
  },
  getPaginatedItems: async (limit, offset, client_id,is_paid) => {
    var options = {
      populate: 'parent',
      lean: true,
      offset: offset, limit: limit, sort: { is_paid: 1, transaction_date: -1 }
    }
    var date = new moment().format("YYYY-MM-DD")
    return await customModel.getModel().paginate({ is_paid: is_paid, is_active: true, client_id: client_id, transaction_date: { $lte: date } }, options)

    // return await customModel.getModel().find().select().populate('item').populate('customer').lean()
  },
  getById: async (id) => {
    const item = await customModel.model
      .findOne({
        child_id: id,
        is_active: true
      }).populate('parent').lean()
    return item
  },
  markAsPaid: async (params) => {
    const user = await customModel.model.findOneAndUpdate({ child_id: params.child_id }, {
      is_paid: true,
      amount_to_be_paid_per_term: params.amount_to_be_paid_per_term,
      balance: params.balance,
      modified_by: params.admin_id,
      modified_date: new Date(),
    })
    return user
  },
  create: async (params) => {
    const id = generateId()
    const item = new customModel.model({
      parent_id: params.parent_id,
      child_id: id,
      client_id: params.client_id,
      amount_to_be_paid_per_term: params.amount_to_be_paid_per_term,
      transaction_date: params.transaction_date,
      balance: params.balance,
      is_active: true,
      is_paid: false,
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
