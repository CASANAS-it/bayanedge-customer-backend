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
      customer_id: {
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
      reference_no: {
        type: 'String'
      },
      next_payment_date: {
        type: 'String'
      },
      previous_payment_date: {
        type: 'String'
      },
      balance: {
        type: "Number"
      },
      is_completed: {
        type: 'Boolean',
      },
      is_beginning: {
        type: 'Boolean',
      },
      trans_type: {
        type: 'String'
      },
      is_boolean: {
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
      localField: 'customer_id',
      foreignField: 'customer_id',
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
  getByRef: async (id, name, client_id) => {
    const item = await customModel.model
      .findOne({
        reference_no: name,
        item_id: { $ne: id },
        client_id: client_id,
        is_active: true
      })
      .lean()
    return item
  },
  getPaginatedItems: async (limit, offset, client_id, filter) => {
    var options = {
      populate: ['item', 'customer'],
      lean: true
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
    return await customModel.getModel().paginate({ is_active: true, client_id: client_id, ...condition }, { ...options, offset: offset, limit: limit })

    // return await customModel.getModel().find().select().populate('item').populate('customer').lean()
  },
  getAllFiltered: async (type, client_id, filter) => {
    var options = {
      populate: ['item', 'customer'],
      lean: true
    }
    var condition = {
      $or: [
        { is_beginning: false },
        { is_beginning: { $exists: false } }
      ],
      trans_type : type,
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

    console.log(condition, 'condition-------')
    return await customModel.getModel().aggregate([
      { $match: condition },
      {
        $group: { _id: null, sum: { $sum: "$total_unit_selling" } }
      }
    ])
    // return await customModel.getModel().find({ is_active: true, client_id: client_id, ...condition }, [{ $sum: "total" }], { ...options })
  },
  getPaginatedARItems: async (limit, offset, client_id, filter) => {
    var options = {
      populate: ['item', 'customer'],
      lean: true
    }

    var condition = {

      $or: [
        { is_beginning: false },
        { is_beginning: { $exists: false } }
      ],
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

    // return await customModel.getModel().find().select().populate('item').populate('customer').lean()
  },
  getPaginatedBeginningItems: async (limit, offset, client_id, type) => {
    var options = {
      populate: ['item', 'customer'],
      lean: true
    }


    return await customModel.getModel().paginate({ is_active: true, client_id: client_id, trans_type: type, is_beginning: true }, { ...options, offset: offset, limit: limit })

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
      customer_id: params.customer_id,
      details: params.details,
      total_unit_cost: params.total_unit_cost,
      total_unit_selling: params.total_unit_selling,
      reference_no: params.reference_no,
      balance: params.balance,
      total: params.total,
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
  deleteBeginning: async (params) => {
    const user = await customModel.model.deleteMany(
      { is_beginning: true, client_id: params.client_id })
    return user
  },
  pay: async (params) => {
    const user = await customModel.model.findOneAndUpdate({ transaction_id: params.transaction_id }, {
      next_payment_date: params.next_payment_date,
      balance: params.balance,
      previous_payment_date: params.previous_payment_date,
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
  create: async (params) => {

    var displayId = "SA000001"
    if (params.trans_type == "On Cash") {
      if (params.is_beginning) {
        displayId = "SA000000"
      } else {
        const previousId = await customModel.model.findOne({ client_id: params.client_id, display_id: { $regex: 'SA' } }).sort({ display_id: -1 });
        if (previousId) {
          var disId = previousId.display_id
          disId = parseInt(disId.substring(2)) + 1;
          displayId = "SA" + padZeroes(disId)
        }
      }
    } else {
      if (params.is_beginning) {
        displayId = "AR000000"
      } else {
        displayId = "AR000001"
        const previousId = await customModel.model.findOne({ client_id: params.client_id, display_id: { $regex: 'AR' } }).sort({ display_id: -1 });
        if (previousId) {
          var disId = previousId.display_id
          disId = parseInt(disId.substring(2)) + 1;
          displayId = "AR" + padZeroes(disId)
        }
      }
    }

    const id = generateId()
    const item = new customModel.model({
      transaction_id: id,
      display_id: displayId,
      client_id: params.client_id,
      customer_id: params.customer_id,
      reference_no: params.reference_no,
      trans_type: params.trans_type,
      details: params.details,
      total_unit_cost: params.total_unit_cost,
      total_unit_selling: params.total_unit_selling,
      balance: params.balance,
      is_beginning: params.is_beginning,
      is_completed: params.is_completed,
      next_payment_date: params.next_payment_date,
      date: params.date,
      is_active: true,
      total: params.total,
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
