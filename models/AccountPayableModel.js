import mongoose, { Schema } from 'mongoose'
import Database from '../classes/Database'
import Logger from '../classes/Logger'
import { encrypt, generateId, decrypt } from '../utils/Crypto'
import mongoosePaginate from 'mongoose-paginate'
import { generateAccountPayableId } from '../utils/CommonUtil'
import moment from 'moment'

const customModel = {

  init() {
    const db = Database.getConnection()
    const itemSchema = new mongoose.Schema({
      ledger_id: {
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
      unit_selling_price: {
        type: 'String'
      },
      unit_of_measurement: {
        type: 'String'
      },
      quantity: {
        type: 'String'
      },
      type_id: {
        type: 'String'
      },
      vendor_id: {
        type: 'String',
        ref: "vendors"
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


    itemSchema.virtual('vendor', {
      ref: 'vendors',
      localField: 'vendor_id',
      foreignField: 'vendor_id',
      justOne: true // for many-to-1 relationships
    });

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
    var options = {
      populate: ['item', 'vendor'],
      lean: true,
      offset: offset, limit: limit
    }

   
    return await customModel.getModel().paginate({ is_active: true, client_id: client_id }, options)

    // return await customModel.getModel().find().select().populate('item').populate('vendor').lean()
  },
  getById: async (id) => {
    const item = await customModel.model
      .findOne({
        ledger_id: id,
        is_active: true
      })
      .lean()
    return item
  },
  updateTerms: async (params) => {
    const user = await customModel.model.findOneAndUpdate({ ledger_id: params.ledger_id }, {
      payment_terms: params.payment_terms,
      modified_by: params.admin_id,
      modified_date: new Date(),
    })
    return user
  },
  updateBalance: async (params) => {

    const user = await customModel.model.findOneAndUpdate({ ledger_id: params.ledger_id }, {
      $inc: { balance: params.amount },
      modified_by: params.admin_id,
      modified_date: new Date(),
    })
    return user
  },
  update: async (params) => {
    const user = await customModel.model.findOneAndUpdate({ ledger_id: params.ledger_id }, {
      client_id: params.client_id,
      item_id: params.item_id,
      unit_cost: params.unit_cost,
      unit_selling_price: params.unit_selling_price,
      unit_of_measurement: params.unit_of_measurement,
      quantity: params.quantity,
      total: params.total,
      type_id: params.type_id,
      vendor_id: params.vendor_id,
      date: params.date,
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
  markAsComplete: async (id, admin_id) => {

    const user = await customModel.model.findOneAndUpdate({ ledger_id: id }, {
      is_completed: true,
      modified_by: admin_id,
      modified_date: new Date(),
    })
    return user
  },
  permanentDelete: async (id) => {
    const user = await customModel.model.deleteOne(
      { ledger_id: id })
    return user
  },
  create: async (params) => {
    const item = new customModel.model({
      display_id: generateAccountPayableId(),
      ledger_id: params.ledger_id,
      client_id: params.client_id,
      item_id: params.item_id,
      unit_cost: params.unit_cost,
      unit_selling_price: params.unit_selling_price,
      unit_of_measurement: params.unit_of_measurement,
      quantity: params.quantity,
      total: params.total,
      balance: params.total,
      type_id: params.type_id,
      vendor_id: params.vendor_id,
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
