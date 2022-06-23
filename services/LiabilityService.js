import Errors from '../classes/Errors'
import LiabilityModel from '../models/LiabilityModel'

const liabilityService = {
  getAll: async (limit, offset,client_id) => {
    return await LiabilityModel.getPaginatedItems(limit, offset,client_id)
  },
  hasLiabilityByClient: async (id) => {
    var items = await LiabilityModel.getByClientId(id)
    return items !== null ? true  : false
  },
  getById: async (id) => {
    var liability = await LiabilityModel.getByLiabilityId(id)
    if (!liability) {
      throw new Errors.NO_RECORDS_FOUND()
    }
    return liability
  },
  update: async (params) => {
    return await LiabilityModel.update(params)
  },
  delete: async (params) => {
    return await LiabilityModel.delete(params)
  },
  create: async (params) => {
    return await LiabilityModel.create(params)
  }
}

export {
  liabilityService
}
