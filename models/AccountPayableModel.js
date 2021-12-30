import mongoose, { Schema } from 'mongoose'
import Database from '../classes/Database'
import Logger from '../classes/Logger'
import { encrypt, generateId, decrypt } from '../utils/Crypto'
import mongoosePaginate from 'mongoose-paginate'
import { generateDisplayId, padZeroes } from '../utils/CommonUtil'
import moment from 'moment'

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
      item_id: {
        type: 'String',
        ref: "items"
      },
      unit_cost: {
        type: 'String'
      },
      quantity: {
        type: 'String'
      },
      date: {
        type: 'String'
      },
      next_payment_date: {
        type: 'String'
      },
      total: {
        type: "Number"
      },
      payment_terms: {
        type: "Number"
      },
      balance: {
        type: "Number"
      },
      is_completed: {
        type: 'Boolean',
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


    // itemSchema.virtual('vendor', {
    //   ref: 'vendors',
    //   localField: 'vendor_id',
    //   foreignField: 'vendor_id',
    //   justOne: true // for many-to-1 relationships
    // });

    itemSchema.virtual('item', {
      ref: 'items',
      localField: 'item_id',
      foreignField: 'item_id',
      justOne: true // for many-to-1 relationships
    });

    itemSchema.plugin(mongoosePaginate)
    customModel.setModel(db.connection.model('account_payables', itemSchema))

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
  getPaginatedItems: async (limit, offset, client_id) => {
    var options = {
      populate: ['item'],
      lean: true,
      offset: offset, limit: limit
    }


    return await customModel.getModel().paginate({ is_active: true, client_id: client_id }, options)

    // return await customModel.getModel().find().select().populate('item').populate('vendor').lean()
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
  updateTerms: async (params) => {
    const user = await customModel.model.findOneAndUpdate({ transaction_id: params.transaction_id }, {
      payment_terms: params.payment_terms,
      modified_by: params.admin_id,
      modified_date: new Date(),
    })
    return user
  },
  updateBalance: async (params) => {

    const user = await customModel.model.findOneAndUpdate({ transaction_id: params.transaction_id }, {
      $inc: { balance: params.amount },
      modified_by: params.admin_id,
      modified_date: new Date(),
    })
    return user
  },
  update: async (params) => {
    const user = await customModel.model.findOneAndUpdate({ transaction_id: params.transaction_id }, {
      client_id: params.client_id,
      item_id: params.item_id,
      unit_cost: params.unit_cost,
      quantity: params.quantity,
      total: params.total, payment_terms: params.payment_terms,
      balance: params.total,
      date: params.date,
      next_payment_date: params.next_payment_date,
      modified_by: params.admin_id,
      modified_date: new Date(),
    })
    return user
  },

  updateTerms: async (params) => {
    const user = await customModel.model.findOneAndUpdate({ transaction_id: params.transaction_id }, {
      payment_terms: params.payment_terms,
      modified_by: params.admin_id,
      modified_date: new Date(),
    })
    return user
  },
  updateBalance: async (params) => {

    const user = await customModel.model.findOneAndUpdate({ transaction_id: params.transaction_id }, {
      $inc: { balance: params.amount },
      modified_by: params.admin_id,
      modified_date: new Date(),
    })
    return user
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
  delete: async (params) => {
    const user = await customModel.model.findOneAndUpdate({ transaction_id: params.transaction_id }, {
      is_active: false,
      modified_by: params.admin_id,
      modified_date: new Date(),
    })
    return user
  },
  markAsComplete: async (id, admin_id) => {
    const user = await customModel.model.findOneAndUpdate({ transaction_id: id }, {
      is_completed: true,
      modified_by: admin_id,
      modified_date: new Date(),
    })
    return user
  },
  permanentDelete: async (id) => {
    const user = await customModel.model.deleteOne(
      { transaction_id: id })
    return user
  },
  create: async (params) => {
    var displayId = "AP000001"
    const previousId = await customModel.model.findOne({ client_id: params.client_id }).sort({ display_id: -1 });
    if (previousId) {
      var disId = previousId.display_id
      disId = parseInt(disId.substring(2)) + 1;
      displayId = "AP" + padZeroes(disId)
    }
    
    const item = new customModel.model({
      display_id: displayId,
      transaction_id: generateId(),
      client_id: params.client_id,
      item_id: params.item_id,
      unit_cost: params.unit_cost,
      quantity: params.quantity,
      total: params.total,
      balance: params.total,
      type_id: params.type_id,
      payment_terms: params.payment_terms,
      next_payment_date: params.next_payment_date,
      date: params.date,
      is_active: true,
      is_completed: false,
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
