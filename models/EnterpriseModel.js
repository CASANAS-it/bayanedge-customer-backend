import mongoose from 'mongoose'
import Database from '../classes/Database'
import Logger from '../classes/Logger'
import { encrypt, generateId, decrypt } from '../utils/Crypto'
import mongoosePaginate from 'mongoose-paginate'

const customModel = {

  init() {
    const db = Database.getConnection()
    const enterpriseSchema = new mongoose.Schema({
      id: {
        type: 'String'
      },
      client_id: {
        type: 'String'
      },
      name: {
        type: 'String'
      },
      owner: {
        type: 'String'
      },
      type_of_ownership: {
        type: "String"
      },
      industry: {
        type: 'String'
      },
      main_product: {
        type: 'String'
      },
      home_address: {
        type: 'String'
      },
      business_address: {
        type: 'String'
      },
      landline: {
        type: 'String'
      },
      mobile_number: {
        type: 'String'
      },
      email: {
        type: 'String'
      },
      website: {
        type: 'String'
      },
      year_established: {
        type: 'String'
      },
      years_of_existence: {
        type: 'String'
      },
      registration: {
        type: 'String'
      },
      registration_date: {
        type: 'String'
      },
      tin: {
        type: 'String'
      },
      sss: {
        type: 'String'
      },
      phic_no: {
        type: 'String'
      },
      salaried_workers: {
        type: 'String'
      },
      membership_date: {
        type: 'String'
      },
      edge_officer: {
        type: 'String'
      },
      team_leader: {
        type: 'String'
      },
      branch_name: {
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
    enterpriseSchema.plugin(mongoosePaginate)
    customModel.setModel(db.connection.model('enterprises', enterpriseSchema))

    return enterpriseSchema
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
  getByEnterpriseId: async (id) => {
    const enterprise = await customModel.model
      .findOne({
        id: id,
        is_active: true
      })
      .lean()
    return enterprise
  },
  getByClientId: async (id) => {
    const enterprise = await customModel.getModel()
      .findOne({
        client_id: id,
      })
      .lean()
    return enterprise
  },
  update: async (params) => {
    const user = await customModel.model.findOneAndUpdate({ id: params.id }, {
      name: params.name,
      owner: params.owner,
      type_of_ownership: params.type_of_ownership,
      industry: params.industry,
      main_product: params.main_product,
      home_address: params.home_address,
      business_address: params.business_address,
      landline: params.landline,
      mobile_number: params.mobile_number,
      email: params.email,
      website: params.website,
      year_established: params.year_established,
      years_of_existence: params.years_of_existence,
      registration: params.registration,
      registration_date: params.registration_date,
      tin: params.tin,
      sss: params.sss,
      phic_no: params.phic_no,
      salaried_workers: params.salaried_workers,
      membership_date: params.membership_date,
      edge_officer: params.edge_officer,
      team_leader: params.team_leader,
      branch_name: params.branch_name,
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
    Logger.info('Creating enterprise ' + params.name)
    const id = generateId()
    const enterprise = new customModel.model({
      id: id,
      client_id: params.client_id,
      name: params.name,
      owner: params.owner,
      type_of_ownership: params.type_of_ownership,
      industry: params.industry,
      main_product: params.main_product,
      home_address: params.home_address,
      business_address: params.business_address,
      landline: params.landline,
      mobile_number: params.mobile_number,
      email: params.email,
      website: params.website,
      year_established: params.year_established,
      years_of_existence: params.years_of_existence,
      registration: params.registration,
      registration_date: params.registration_date,
      tin: params.tin,
      sss: params.sss,
      phic_no: params.phic_no,
      salaried_workers: params.salaried_workers,
      membership_date: params.membership_date,
      edge_officer: params.edge_officer,
      team_leader: params.team_leader,
      branch_name: params.branch_name,
      is_active: true,
      created_by: params.admin_id,
      create_date: new Date(),
      modified_by: params.admin_id,
      modified_date: new Date(),
    })
    return await enterprise.save()
  }
}

export default {
  ...customModel
}
