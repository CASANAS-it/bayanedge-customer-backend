import mongoose from 'mongoose'
import Database from '../classes/Database'
import Logger from '../classes/Logger'
import { encrypt, generateId, decrypt } from '../utils/Crypto'
import mongoosePaginate from 'mongoose-paginate'

const customModel = {

  init() {
    const db = Database.getConnection()
    const customerSchema = new mongoose.Schema({
      customer_id: {
        type: 'String'
      },
      client_id: {
        type: 'String'
      },
      customer_name: {
        type: 'String'
      },
      address: {
        type: 'String'
      },
      contact_information: {
        type: 'Object'
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
    customerSchema.plugin(mongoosePaginate)
    customModel.setModel(db.connection.model('customers', customerSchema))

    return customerSchema
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
  getPaginatedItems: async (limit, offset, client_id) => {
    return await customModel.getModel().paginate({ is_active: true, client_id: client_id }, { offset: offset, limit: limit })
  },
  getByClientId: async (id) => {
    const customer = await customModel.model
      .findOne({
        client_id: id,
      })
      .lean()
    return customer
  },
  
  getAllByClientId: async (id) => {
    const customer = await customModel.model
      .find({
        client_id: id,
      })
      .lean()
    return customer
  },
  getByCustomerId: async (id) => {
    const customer = await customModel.model
      .findOne({
        customer_id: id,
        is_active: true
      })
      .lean()
    return customer
  },
  update: async (params) => {
    const user = await customModel.model.findOneAndUpdate({ id: params.id }, {
      customer_name: params.customer_name,
      address: params.address,
      contact_information: params.contact_information,
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
  create: async (params) => {
    Logger.info('Creating customer ' + params.customer_name)
    const id = generateId()
    const customer = new customModel.model({
      customer_id: id,
      customer_name: params.customer_name,
      client_id: params.client_id,
      address: params.address,
      contact_information: params.contact_information,
      is_active: true,
      created_by: params.admin_id,
      created_date: new Date(),
      modified_by: params.admin_id,
      modified_date: new Date(),
    })
    return await customer.save()

  }
}

export default {
  ...customModel
}
