import mongoose from 'mongoose'
import mongoosePaginate from 'mongoose-paginate'
import Database from '../classes/Database'
import Logger from '../classes/Logger'
import { encrypt, generateId, decrypt } from '../utils/Crypto'

const customModel = {

  init() {
    const db = Database.getConnection()
    const assetSchema = new mongoose.Schema({
      id: {
        type: 'String'
      },
      client_id : {
        type : 'String'
      },
      name: {
        type: 'String'
      },

      type: {
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

    assetSchema.plugin(mongoosePaginate)
    customModel.setModel(db.connection.model('assets', assetSchema))
    return assetSchema
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
  getPaginatedItems : async (limit,offset,client_id) => {
    return await customModel.getModel().paginate({ is_active: true,client_id : client_id }, { offset: offset, limit: limit })    
  },
  getByClientId: async (id) => {
    const asset = await customModel.model
      .findOne({
        client_id: id,
        is_active : true
      })
      .lean()
    return asset
  },
  getByAssetId: async (id) => {
    const asset = await customModel.model
      .findOne({
        id: id,
        is_active: true
      })
      .lean()
    return asset
  },
  update: async (params) => {
    const user = await customModel.model.findOneAndUpdate({ id: params.id }, {
      name: params.name,
      type: params.type,
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
    Logger.info('Creating asset ' + params.name)
    const id = generateId()
    const asset = new customModel.model({
      id: id,
      name: params.name,
      client_id : params.client_id,
      type: params.type,
      is_active: true,
      created_by: params.admin_id,
      created_date: new Date(),
      modified_by: params.admin_id,
      modified_date: new Date(),
    })
    return await asset.save()

  }
}

export default {
  ...customModel
}
