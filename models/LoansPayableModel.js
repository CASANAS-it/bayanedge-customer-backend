import mongoose, { Schema } from 'mongoose'
import Database from '../classes/Database'
import Logger from '../classes/Logger'
import { encrypt, generateId, decrypt } from '../utils/Crypto'
import mongoosePaginate from 'mongoose-paginate'
import { generateDisplayId } from '../utils/CommonUtil'
import { Config } from '../classes/Constants'

const customModel = {

  init() {
    const db = Database.getConnection()
    const itemSchema = new mongoose.Schema({
      loan_payable_id: {
        type: 'String'
      },
      display_id: {
        type : 'String'
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
      payment_terms: {
        type: "Number"
      },
      balance: {
        type: "Number"
      },
      is_completed: {
        type : 'Boolean',
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
    customModel.setModel(db.connection.model('loan_payable', itemSchema))

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
      })
      .lean()
    return items
  },
  getPaginatedItems: async (limit, offset, client_id) => {
    // var options = {
    //   populate: ['item', 'customer'],
    //   lean: true
    // }
    return await customModel.getModel().paginate({ is_active: true, client_id: client_id }, { offset: offset, limit: limit })

    // return await customModel.getModel().find().select().populate('item').populate('customer').lean()
  },
  getById: async (id) => {
    const item = await customModel.model
      .findOne({
        loan_payable_id: id,
        is_active: true
      })
      .lean()
    return item
  },
  updateTerms: async (params) => {
    const user = await customModel.model.findOneAndUpdate({ loan_payable_id: params.loan_payable_id }, {
      payment_terms: params.payment_terms,
      modified_by: params.admin_id,
      modified_date: new Date(),
    })
    return user
  },
  updateBalance : async(params)=>{
    
    const user = await customModel.model.findOneAndUpdate({ loan_payable_id: params.loan_payable_id }, {
      $inc : {balance : (params.amount_to_be_paid_per_term * -1)},
      modified_by: params.admin_id,
      modified_date: new Date(),
    })
    return user
  },
  update: async (params) => {
    const user = await customModel.model.findOneAndUpdate({ loan_payable_id: params.loan_payable_id }, {
      client_id: params.client_id,
      total: params.total,
      customer_id: params.customer_id,
      date: params.date,
      payment_terms  : Config.PAYMENT_TERMS,
      modified_by: params.admin_id,
      modified_date: new Date(),
    })
    return user
  },
  delete: async (params) => {
    const user = await customModel.model.findOneAndUpdate({ id: params.id }, {
      is_active: false,
      modified_by: params.admin_id,
      modified_date: new Date(),
    })
    return user
  },
  markAsComplete : async (id,admin_id) => {
    
    const user = await customModel.model.findOneAndUpdate({ loan_payable_id: id }, {
      is_completed: true,
      modified_by: admin_id,
      modified_date: new Date(),
    })
    return user
  },
  permanentDelete: async (id) => {
    const user = await customModel.model.deleteOne(
      { loan_payable_id: id })
    return user
  },
  create: async (params) => {
    const item = new customModel.model({
      display_id : generateDisplayId(),
      client_id: params.client_id,
    
      loan_payable_id: generateId(),
      total: params.total,
      balance : params.total,
      payment_terms  : Config.PAYMENT_TERMS,
      date: params.date,
      is_active: true,
      is_completed: false,
      created_by: params.admin_id,
      create_date: new Date(),
      modified_by: params.admin_id,
      modified_date: new Date(),
    })
    return await item.save()

  }
}

export default {
  ...customModel
}
