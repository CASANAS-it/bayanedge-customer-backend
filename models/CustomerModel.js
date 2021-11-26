import mongoose from 'mongoose'
import Database from '../classes/Database'
import Logger from '../classes/Logger'
import { encrypt, generateId, decrypt } from '../utils/Crypto'
import mongoosePaginate from 'mongoose-paginate'

const customModel = {

  init() {
    const db = Database.getConnection()
    const customerSchema = new mongoose.Schema({
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
  getPaginatedItems : async (limit,offset) => {
    return await customModel.getModel().paginate({ is_active: true }, { offset: offset, limit: limit })    
  },
  getByCustomerId: async (id) => {
    const customer = await customModel.model
      .findOne({
        id: id,
        is_active : true
      })
      .lean()
    return customer
  },
  update: async (params) => {
    const user = await customModel.model.findOneAndUpdate({ id: params.id }, {
      name: params.name,
      addresses: params.addresses,
      contact_information: params.contact_information,
      modified_by: params.admin_id,
      modified_date: new Date(),
    })
    return user
  },
  delete: async (params) => {
    const user = await customModel.model.findOneAndUpdate({ id: params.id }, {
      is_active : false,
      modified_by: params.admin_id,
      modified_date: new Date(),
    })
    return user
  },
  create: async (params) => {
    Logger.info('Creating customer ' + params.name)
    const id = generateId()
    const customer = new customModel.model({
      id: id,
      name: params.name,
      address: params.address,
      contact_information: params.contact_information,
      is_active : true,
      created_by: params.admin_id,
      create_date: new Date(),
      modified_by: params.admin_id,
      modified_date: new Date(),
    })
    return await customer.save()

  }
}

export default {
  ...customModel
}
