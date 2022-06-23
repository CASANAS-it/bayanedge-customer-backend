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
      next_payment_date: {
        type: 'String'
      },
      interest_fixed_amount: {
        type: 'String'
      },
      interest: {
        type: 'String'
      },
      balance: {
        type: "Number"
      },
      payment_terms: {
        type: "Number"
      },
      total: {
        type: "Number"
      },

      is_completed: {
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

    // itemSchema.virtual('item', {
    //   ref: 'items',
    //   localField: 'item_id',
    //   foreignField: 'item_id',
    //   justOne: true // for many-to-1 relationships
    // });

    itemSchema.plugin(mongoosePaginate)
    customModel.setModel(db.connection.model('loan_proceeds', itemSchema))

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
      balance: params.balance,
      next_payment_date: params.next_payment_date,
      modified_by: params.admin_id,
      modified_date: new Date(),
    })
    return user
  },
  markAsCompleted: async (params) => {
    const user = await customModel.model.findOneAndUpdate({ transaction_id: params.transaction_id }, {
      is_completed: true,
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
      name: params.name,
      description: params.description,
      total: params.total,
      next_payment_date: params.next_payment_date,
      date: params.date,
      interest_fixed_amount: params.interest_fixed_amount,
      payment_terms: params.payment_terms,
      balance: params.interest,
      interest: params.interest,
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
  create: async (params) => {
    var displayId = "LP000001"
    const previousId = await customModel.model.findOne({ client_id: params.client_id }).sort({ display_id: -1 });
    if (previousId) {
      var disId = previousId.display_id
      disId = parseInt(disId.substring(2)) + 1;
      displayId = "LP" + padZeroes(disId)
    }

    const id = generateId()
    const item = new customModel.model({
      transaction_id: id,
      client_id: params.client_id,
      display_id: displayId,
      name: params.name,
      description: params.description,
      total: params.total,
      next_payment_date: params.next_payment_date,
      date: params.date,
      interest_fixed_amount: params.interest_fixed_amount,
      balance: params.interest,
      interest: params.interest,
      payment_terms: params.payment_terms,
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
