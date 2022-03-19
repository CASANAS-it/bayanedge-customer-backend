import mongoose from 'mongoose'
import Database from '../classes/Database'
import Logger from '../classes/Logger'
import { encrypt, generateId, decrypt } from '../utils/Crypto'
import mongoosePaginate from 'mongoose-paginate'
const customModel = {

  init() {
    const db = Database.getConnection()
    const vendorSchema = new mongoose.Schema({
      vendor_id: {
        type: 'String'
      },
      client_id: {
        type: 'String'
      },
      vendor_name: {
        type: 'String'
      },
      address: {
        type: 'String'
      },
      contact_information: {
        type: 'Object'
      },
      terms : {
        type : "Number"
      },
      credit_limit : {
        type : "Number"
      },
      available_credit : {
        type : "Number"
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
      })
      .lean()
    return items
  },
  getPaginatedItems: async (limit, offset, client_id) => {
    return await customModel.getModel().paginate({ is_active: true, client_id: client_id }, { offset: offset, limit: limit })
  },
  getByVendorId: async (id) => {
    const vendor = await customModel.model
      .findOne({
        vendor_id: id,
        is_active: true
      })
      .lean()
    return vendor
  },
  

  getByVendorName: async (id, name, clientId) => {
    const customer = await customModel.model
      .findOne({
        vendor_id: {$ne : id},
        vendor_name : name,
        client_id : clientId,
        is_active: true
      })
      .lean()
    return customer
  },
  updateCredit: async (params) => {
    const item = await customModel.model.findOneAndUpdate({ vendor_id: params.vendor_id }, {
      available_credit : params.available_credit,
      modified_by: params.admin_id,
      modified_date: new Date(),
    })
    return item
  },
  update: async (params) => {
    const item = await customModel.model.findOneAndUpdate({ vendor_id: params.vendor_id }, {
      vendor_name: params.vendor_name,
      address: params.address,
      contact_information: params.contact_information,
      account_number: params.account_number,
      terms : params.terms,
      credit_limit : params.credit_limit,
      available_credit : params.credit_limit,
      modified_by: params.admin_id,
      modified_date: new Date(),
    })
    return item
  },
  delete: async (params) => {
    const item = await customModel.model.findOneAndUpdate({ vendor_id: params.vendor_id }, {
      is_active: false,
      modified_by: params.admin_id,
      modified_date: new Date(),
    })
    return item
  },
  create: async (params) => {
    Logger.info('Creating vendor ' + params.vendor_name)
    const id = generateId()
    const vendor = new customModel.model({
      vendor_id: id,
      vendor_name: params.vendor_name,
      client_id: params.client_id,
      address: params.address,
      contact_information: params.contact_information,
      account_number: params.account_number,
      is_active: true,
      created_by: params.admin_id,
      created_date: new Date(),
      terms : params.terms,
      available_credit : params.credit_limit,
      credit_limit : params.credit_limit,
      modified_by: params.admin_id,
      modified_date: new Date(),
    })
    return await vendor.save()

  }
}

export default {
  ...customModel
}
