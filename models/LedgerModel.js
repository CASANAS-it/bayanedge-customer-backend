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
      vendor_id: {
        type: 'String',
      },
      details: {
        type: "Object"
      },
      date: {
        type: 'String'
      },
      total: {
        type: "Number"
      },
      total_unit_cost: {
        type: "Number"
      },
      total_unit_selling: {
        type: "Number"
      },
      balance: {
        type: "Number"
      },
      next_payment_date: {
        type: 'String'
      },
      reference_no: {
        type: 'String'
      },
      previous_payment_date: {
        type: 'String'
      },
      is_completed: {
        type: 'Boolean',
      },
      trans_type: {
        type: 'String'
      },
      is_beginning: {
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

    itemSchema.virtual('vendor', {
      ref: 'vendors',
      localField: 'vendor_id',
      foreignField: 'vendor_id',
      justOne: true // for many-to-1 relationships
    });

    itemSchema.plugin(mongoosePaginate)
    customModel.setModel(db.connection.model('ledger', itemSchema))

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
        is_active: true
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
  getPaginatedItems: async (limit, offset, client_id, filter) => {
    var options = {
      populate: ['item', 'vendor'],
      lean: true,
      sort : {date : 1}
    }
    var condition = {
      $or: [
        { is_beginning: false },
        { is_beginning: { $exists: false } }
      ]
    }

    if (filter) {
      if (filter.search) {
        condition.$or = [{ display_id: { $regex: filter.search } }, { 'details.display_id': { $regex: filter.search } }]
      }
      if (filter.vendor_id) {
        condition.vendor_id = filter.vendor_id
      }
      if (filter.item_id) {
        condition['details.item_id'] = filter.item_id
      }
      if (filter.dateFrom && filter.dateTo) {
        condition.$and = [{ date: { $gte: filter.dateFrom } }, { date: { $lte: filter.dateTo } }]
      }
    }
    return await customModel.getModel().paginate({ is_active: true, client_id: client_id, ...condition }, { ...options, offset: offset, limit: limit })

    // return await customModel.getModel().find().select().populate('item').populate('vendor').lean()
  },
  getAllFiltered: async (client_id, filter) => {
    var options = {
      populate: ['item', 'customer'],
      lean: true
    }
    var condition = {
      $or: [
        { is_beginning: false },
        { is_beginning: { $exists: false } }
      ],
      is_active: true, client_id: client_id
    }
    if (filter) {
      if (filter.search) {
        condition.$or = [{ display_id: { $regex: filter.search } }, { 'details.display_id': { $regex: filter.search } }]
      }
      if (filter.customer_id) {
        condition.customer_id = filter.customer_id
      }
      if (filter.item_id) {
        condition['details.item_id'] = filter.item_id
      }
      if (filter.dateFrom && filter.dateTo) {
        condition.$and = [{ date: { $gte: filter.dateFrom } }, { date: { $lte: filter.dateTo } }]
      }

    }

    return await customModel.getModel().aggregate([
      { $match: condition },
      {
        $group: { _id: null, sum: { $sum: "$total_unit_cost" } }
      }
    ])
    // return await customModel.getModel().find({ is_active: true, client_id: client_id, ...condition }, [{ $sum: "total" }], { ...options })
  },
  getPaginatedAPItems: async (limit, offset, client_id, filter) => {
    var options = {
      populate: ['item', 'vendor'],
      lean: true,
      sort : {date : 1}
    }
    var condition = {

      // $or: [
      //   { is_beginning: false },
      //   { is_beginning: { $exists: false } }
      // ],
    }
    if (filter) {
      if (filter.search) {
        condition.$or = [{ display_id: { $regex: filter.search } }, { 'details.display_id': { $regex: filter.search } }]
      }
      if (filter.vendor_id) {
        condition.vendor_id = filter.vendor_id
      }
      if (filter.item_id) {
        condition['details.item_id'] = filter.item_id
      }
    }
    return await customModel.getModel().paginate({ is_active: true, client_id: client_id, trans_type: "On Credit", ...condition }, { ...options, offset: offset, limit: limit })

    // return await customModel.getModel().find().select().populate('item').populate('vendor').lean()
  },

  getPaginatedBeginningItems: async (limit, offset, client_id, type) => {
    var options = {
      populate: ['item', 'vendor'],
      lean: true
    }
    return await customModel.getModel().paginate({ is_active: true, client_id: client_id, trans_type: type, is_beginning: true }, { ...options, offset: offset, limit: limit })

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
  getByRef: async (id, name, client_id) => {
    const item = await customModel.model
      .findOne({
        reference_no: name,
        transaction_id: { $ne: id },
        client_id: client_id,
        is_active: true
      })
      .lean()
    return item
  },
  update: async (params) => {
    const user = await customModel.model.findOneAndUpdate({ transaction_id: params.transaction_id }, {
      client_id: params.client_id,
      vendor_id: params.vendor_id,
      details: params.details,
      total: params.total,
      total_unit_cost: params.total_unit_cost,
      total_unit_selling: params.total_unit_selling,
      balance: params.balance,
      next_payment_date : params.next_payment_date,
      reference_no: params.reference_no,
      is_completed: params.is_completed,
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
  pay: async (params) => {
    const user = await customModel.model.findOneAndUpdate({ transaction_id: params.transaction_id }, {
      next_payment_date: params.next_payment_date,
      previous_payment_date: params.previous_payment_date,
      balance: params.balance,
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

  deleteBeginning: async (params) => {
    const user = await customModel.model.deleteMany(
      { is_beginning: true, client_id: params.client_id })
    return user
  },
  create: async (params) => {

    var displayId = "IN000001"
    if (params.trans_type == "On Cash") {
      if (params.is_beginning) {
        displayId = "IN000000"
      } else {
        const previousId = await customModel.model.findOne({ client_id: params.client_id, display_id: { $regex: 'IN' } }).sort({ display_id: -1 });
        if (previousId) {
          var disId = previousId.display_id
          disId = parseInt(disId.substring(2)) + 1;
          displayId = "IN" + padZeroes(disId)
        }
      }
    } else {
      displayId = "AP000001"
      if (params.is_beginning) {
        displayId = "AP000000"
      } else {
        const previousId = await customModel.model.findOne({ client_id: params.client_id, display_id: { $regex: 'AP' } }).sort({ display_id: -1 });
        if (previousId) {
          var disId = previousId.display_id
          disId = parseInt(disId.substring(2)) + 1;
          displayId = "AP" + padZeroes(disId)
        }
      }
    }

    const id = generateId()
    const item = new customModel.model({
      transaction_id: id,
      display_id: displayId,
      client_id: params.client_id,
      vendor_id: params.vendor_id,
      trans_type: params.trans_type,
      details: params.details,
      reference_no: params.reference_no,
      total_unit_cost: params.total_unit_cost,
      total_unit_selling: params.total_unit_selling,
      balance: params.balance,
      total: params.total,
      is_completed: params.is_completed,
      next_payment_date: params.next_payment_date,
      is_beginning: params.is_beginning,
      date: params.date,
      is_active: true,
      created_by: params.admin_id,
      created_date: new Date(),
      modified_by: params.admin_id,
      modified_date: new Date(),
    })
    return await item.save()
  },
}

export default {
  ...customModel
}
