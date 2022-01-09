import Errors from '../classes/Errors'
import EnterpriseModel from '../models/EnterpriseModel'

const enterpriseService = {
  getAll: async (limit, offset,client_id) => {
    return await EnterpriseModel.getPaginatedItems(limit, offset,client_id)
  },
  getById: async (id) => {
    var enterprise = await EnterpriseModel.getByEnterpriseId(id)
    if (!enterprise) {
      throw new Errors.NO_RECORDS_FOUND()
    }
    return enterprise
  },
  hasEnterpriseByClient: async (id) => {
    var items = await EnterpriseModel.getByClientId(id)
    return items !== null ? true  : false
  },
  getByClientId: async (id) => {
    var enterprise = await EnterpriseModel.getByClientId(id)
    return enterprise
  },
  update: async (params) => {
    return await EnterpriseModel.update(params)
  },
  delete: async (params) => {
    return await EnterpriseModel.delete(params)
  },
  create: async (params) => {
    return await EnterpriseModel.create(params)
  }
}

export {
  enterpriseService
}
