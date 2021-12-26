import mongoose, { Schema } from 'mongoose'
import Database from '../classes/Database'
import Logger from '../classes/Logger'
import { encrypt, generateId, decrypt } from '../utils/Crypto'
import mongoosePaginate from 'mongoose-paginate'

const customModel = {

  init() {
    const db = Database.getConnection()
    const itemSchema = new mongoose.Schema({
      transaction_id: {
        type: 'String'
      },
      display_id : {
        type : 'String'
      },
      client_id: {
        type: 'String',
      },
      item_id: {
        type: 'String',
        ref: "items"
      },
      unit_selling_price: {
        type: 'String'
      },
      quantity: {
        type: 'String'
      },
      date: {
        type: 'String'
      },
      total : {
        type : "Number"
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

    itemSchema.virtual('item', {
      ref: 'items',
      localField: 'item_id',
      foreignField: 'item_id',
      justOne: true // for many-to-1 relationships
    });

    itemSchema.plugin(mongoosePaginate)
    customModel.setModel(db.connection.model('sales', itemSchema))

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
        is_active : true
      })
      .lean()
    return items
  },
  getPaginatedItems: async (limit, offset, client_id) => {
    var options = {
      populate: ['item','customer'],
      lean : true
    }
    return await customModel.getModel().paginate({is_active: true, client_id: client_id }, {...options, offset: offset, limit: limit })
   
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
  update: async (params) => {
    const user = await customModel.model.findOneAndUpdate({ transaction_id: params.transaction_id }, {
      client_id: params.client_id,
      item_id: params.item_id,
      unit_selling_price: params.unit_selling_price,
      quantity: params.quantity,
      total: params.total,
      date: params.date,
      modified_by: params.admin_id,
      modified_date: new Date(),
    })
    return user
  },
  delete: async (params) => {
    const user = await customModel.model.findOneAndUpdate({ transaction_id: params.id }, {
      is_active: false,
      modified_by: params.admin_id,
      modified_date: new Date(),
    })
    return user
  },
  create: async (params) => {

    var displayId = "SA000001"
    const previousId = await customModel.model.findOne({ client_id: params.client_id }).sort({ display_id: -1 });
    if (previousId) {
      var disId = previousId.display_id
      disId = parseInt(disId.substring(2)) + 1;
      displayId = "SA" + padZeroes(disId)
    }
    const id = generateId()
    const item = new customModel.model({
      transaction_id: id,
      display_id : displayId,
      client_id: params.client_id,
      item_id: params.item_id,
      unit_selling_price: params.unit_selling_price,
      quantity: params.quantity,
      total: params.total,
      date: params.date,
      is_active : true,
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
