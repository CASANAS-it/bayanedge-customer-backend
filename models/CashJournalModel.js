import mongoose, { Schema } from 'mongoose'
import Database from '../classes/Database'
import Logger from '../classes/Logger'
import { encrypt, generateId, decrypt } from '../utils/Crypto'
import mongoosePaginate from 'mongoose-paginate'
import { TransType } from '../classes/Constants'

const customModel = {

  init() {
    const db = Database.getConnection()
    const itemSchema = new mongoose.Schema({
      transaction_id: {
        type: 'String'
      },
      reference_id: {
        type: 'String'
      },
      display_id: {
        type: 'String'
      },
      client_id: {
        type: 'String',
      },
      details: {
        type: 'Object'
      },
      type_id: {
        type: 'String'
      },
      flow_type_id: {
        type: 'String',
      },
      date: {
        type: 'String'
      },
      total: {
        type: "Number"
      },
      is_beginning: {
        type: 'Boolean'
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


    itemSchema.virtual('customer', {
      ref: 'customers',
      localField: 'details.customer_id',
      foreignField: 'customer_id',
      justOne: true // for many-to-1 relationships
    });

    itemSchema.virtual('vendor', {
      ref: 'vendors',
      localField: 'details.vendor_id',
      foreignField: 'vendor_id',
      justOne: true // for many-to-1 relationships
    });

    itemSchema.virtual('item', {
      ref: 'items',
      localField: 'details.item_id',
      foreignField: 'item_id',
      justOne: true // for many-to-1 relationships
    });

    itemSchema.virtual('microsaving', {
      ref: 'cash_journal',
      localField: 'details.microsaving_id',
      foreignField: 'transaction_id',
      justOne: true // for many-to-1 relationships
    });
    itemSchema.plugin(mongoosePaginate)
    customModel.setModel(db.connection.model('cash_journal', itemSchema))

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
    const items = await customModel.getModel()
      .find({
        client_id: id,
        is_active: true,
        $or: [
          { is_posted: true },
          { is_posted: { $exists: false } }
        ]
      }).populate('item')
      .lean()
    return items
  },

  getAllByClientIdRefId: async (id, refId) => {
    const items = await customModel.getModel()
      .find({
        client_id: id,
        reference_id: refId,
      })
      .lean()
    return items
  },
  getByClientIdTypeIdRefId: async (id, typeId, refId) => {
    const items = await customModel.getModel()
      .findOne({
        client_id: id,
        type_id: typeId,
        reference_id: refId,
      })
      .lean()
    return items
  },
  getByClientId: async (id) => {
    const items = await customModel.getModel()
      .findOne({
        client_id: id,
        is_active: true
      })
      .lean()
    return items
  },
  getLastDisplayId: async (client_id, type_id, flow_type_id) => {
    const items = await customModel.getModel()
      .findOne({
        client_id: client_id,
        type_id: type_id,
        flow_type_id: flow_type_id
      })
      .lean()
    return items
  },
  getPaginatedItems: async (limit, offset, client_id, flow_id, search = "", type_id = "", filter) => {

    var options = {
      populate: ['item', 'customer', 'vendor', 'microsaving'],
      lean: true,
      offset: offset, limit: limit,
      sort: { created_date: -1 }
    }

    var condition = {
      flow_type_id: flow_id,
      $or: [
        { is_beginning: false },
        { is_beginning: { $exists: false } }
      ]
    };
    if (search)
      condition.$or = [{ display_id: { $regex: search } }, { 'details.display_id': { $regex: search } }]
    if (type_id)
      condition.type_id = type_id
    if (filter) {
      condition.$and = [{ date: { $gte: filter.dateFrom } }, { date: { $lte: filter.dateTo } }]
    }
    return await customModel.getModel().paginate({ is_active: true, client_id: client_id, ...condition }, options)

    // return await customModel.getModel().find().select().populate('item').populate('customer').lean()
  },

  getAllFiltered: async (client_id, flow_id, search = "", type_id = "", filter) => {

    var options = {
      populate: ['item', 'customer', 'vendor', 'microsaving'],
      lean: true,
      sort: { created_date: -1 }
    }

    var condition = {
      flow_type_id: flow_id,
      $or: [
        { is_beginning: false },
        { is_beginning: { $exists: false } },
      ],
      is_active: true,
      client_id: client_id,
    };
    if (search)
      condition.$or = [{ display_id: { $regex: search } }, { 'details.display_id': { $regex: search } }]
    if (type_id)
      condition.type_id = type_id
    if (filter) {
      condition.$and = [{ date: { $gte: filter.dateFrom } }, { date: { $lte: filter.dateTo } }]
    }

    return await customModel.getModel().aggregate([
      { $match: condition },
      {
        $group: { _id: null, sum: { $sum: "$total" } }
      }
    ])
    // return await customModel.getModel().find({ is_active: true, client_id: client_id, ...condition }, [{ $sum: "total" }], { ...options })
  },

  getPaginatedItemsByTypeIdFlowTypeId: async (limit, offset, client_id, type_id, flow_type_id, is_beginning) => {

    var options = {
      populate: ['item', 'customer', 'vendor', 'microsaving'],
      lean: true,
      offset: offset, limit: limit,
      sort: { created_date: -1 }
    }

    var condition = {
      flow_type_id: flow_type_id,
      type_id: type_id,
    };
    if (is_beginning) {
      condition['$or'] = [
        { is_beginning: is_beginning },
        { is_beginning: { $exists: is_beginning } }
      ]
    }
    return await customModel.getModel().paginate({ is_active: true, client_id: client_id, ...condition }, options)

    // return await customModel.getModel().find().select().populate('item').populate('customer').lean()
  },

  getPaginatedItemsByTypeId: async (limit, offset, client_id, type_id, is_beginning_balance_included = false) => {

    var options = {
      populate: ['item', 'customer', 'vendor', 'microsaving'],
      lean: true,
      offset: offset, limit: limit,
      sort: { created_date: -1 }
    }

    var condition = {
      type_id: type_id,
    };
    if (!is_beginning_balance_included) {
      condition['$and'] = [
        {
          $or: [
            { is_beginning: false },
            { is_beginning: { $exists: false } }
          ]
        },

        {
          $or: [
            { 'details.is_beginning': false },
            { 'details.is_beginning': { $exists: false } }
          ]
        }]
    }
    return await customModel.getModel().paginate({ is_active: true, client_id: client_id, ...condition }, options)

    // return await customModel.getModel().find().select().populate('item').populate('customer').lean()
  },

  getPaginatedItemsByRefId: async (limit, offset, client_id, search, refId, type_id, is_beginning) => {

    var options = {
      populate: ['item', 'customer', 'vendor', 'microsaving'],
      lean: true,
      offset: offset, limit: limit,
      sort: { created_date: -1 }
    }

    var condition = {
      reference_id: refId,

    };

    if (is_beginning) {
      condition['$or'] = [
        { is_beginning: is_beginning },
        { is_beginning: { $exists: is_beginning } }
      ]
    }

    if (type_id) {
      condition.type_id = type_id
    }
    return await customModel.getModel().paginate({ is_active: true, client_id: client_id, ...condition }, options)

    // return await customModel.getModel().find().select().populate('item').populate('customer').lean()
  },
  getById: async (id) => {
    const item = await customModel.getModel()
      .findOne({
        transaction_id: id,
        is_active: true
      })
      .lean()
    return item
  },
  getAllNonPosted: async (date) => {
    const items = await customModel.getModel()
      .find({
        $and: [
          { is_posted: false },
          { is_posted: { $exists: true } }
        ],
        date: date
      })
      .lean()
    return items
  },

  markAsPosted: async (params) => {
    const user = await customModel.getModel().findOneAndUpdate({ transaction_id: params.transaction_id }, {
      is_posted: true
    })
    return user
  },
  getByClientIdTypeId: async (id, type_id) => {
    const items = await customModel.getModel()
      .findOne({
        client_id: id,
        type_id: type_id,
        is_active: true,
        $or: [
          { is_beginning: false },
          { is_beginning: { $exists: false } }]
      })
      .lean()
    return items
  },
  update: async (params) => {
    const user = await customModel.getModel().findOneAndUpdate({ transaction_id: params.transaction_id }, {
      client_id: params.client_id,
      details: params.details,
      total: params.total,
      type_id: params.type_id,
      date: params.date,
      modified_by: params.admin_id,
      modified_date: new Date(),
    })
    return user
  },
  getByRef: async (id, name, client_id, type) => {
    const item = await customModel.model
      .findOne({
        "details.reference_no": name,
        type_id: type,
        transaction_id: { $ne: id },
        client_id: client_id,
        is_active: true
      })
      .lean()
    return item
  },
  updateByReferenceId: async (params) => {
    const user = await customModel.getModel().findOneAndUpdate({ reference_id: params.reference_id }, {
      client_id: params.client_id,
      details: params.details,
      total: params.total,
      type_id: params.type_id,
      date: params.date,
      modified_by: params.admin_id,
      modified_date: new Date(),
    })
    return user
  },
  delete: async (params) => {
    const user = await customModel.getModel().findOneAndUpdate({ transaction_id: params.transaction_id }, {
      is_active: false,
      modified_by: params.admin_id,
      modified_date: new Date(),
    })
    return user
  },

  permanentDelete: async (id) => {
    const user = await customModel.getModel().deleteOne(
      { transaction_id: id })
    return user
  },

  permanentDeleteByRefId: async (id) => {
    const user = await customModel.getModel().deleteMany(
      { reference_id: id })
    return user
  },
  create: async (params) => {
    const id = generateId()
    const item = new customModel.model({
      transaction_id: id,
      display_id: params.display_id,
      reference_id: params.reference_id,
      client_id: params.client_id,
      details: params.details,
      total: params.total,
      type_id: params.type_id,
      flow_type_id: params.flow_type_id,
      date: params.date,
      is_posted: params.hasOwnProperty('is_posted') ? params.is_posted : true,
      is_active: true,
      is_beginning: params.is_beginning,
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
