import mongoose from 'mongoose'
import Database from '../classes/Database'
import Logger from '../classes/Logger'
import { encrypt, generateId, decrypt } from '../utils/Crypto'
import mongoosePaginate from 'mongoose-paginate'
const customModel = {

  init() {
    const db = Database.getConnection()
    const vendorSchema = new mongoose.Schema({
      id: {
        type: 'String'
      },
      name: {
        type: 'String'
      },
      address: {
        type: 'String'
      },
      contact_information: {
        type: 'Object'
      },
      account_number: {
        type: 'String'
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
    })

    vendorSchema.plugin(mongoosePaginate)
    customModel.setModel(db.connection.model('vendors', vendorSchema))

    return vendorSchema
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
  getPaginatedItems: async (limit, offset) => {
    return await customModel.getModel().paginate({ is_active: true }, { offset: offset, limit: limit })

  },
  getByVendorId: async (id) => {
    const vendor = await customModel.model
      .findOne({
        id: id,
        is_active : true
      })
      .lean()
    return vendor
  },
  update: async (params) => {
    const item = await customModel.model.findOneAndUpdate({ id: params.id }, {
      name: params.name,
      address: params.address,
      contact_information: params.contact_information,
      account_number: params.account_number,
      modified_by: params.admin_id,
      modified_date: new Date(),
    })
    return item
  },
  delete: async (params) => {
    const item = await customModel.model.findOneAndUpdate({ id: params.id }, {
      is_active: false,
      modified_by: params.admin_id,
      modified_date: new Date(),
    })
    return item
  },
  create: async (params) => {
    Logger.info('Creating vendor ' + params.name)
    const id = generateId()
    const vendor = new customModel.model({
      id: id,
      name: params.name,
      address: params.address,
      contact_information: params.contact_information,
      account_number : params.account_number,
      is_active: true,
      created_by: params.admin_id,
      create_date: new Date(),
      modified_by: params.admin_id,
      modified_date: new Date(),
    })
    return await vendor.save()

  }
}

export default {
  ...customModel
}
