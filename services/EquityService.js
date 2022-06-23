import Errors from '../classes/Errors'
import EquityModel from '../models/EquityModel'

const equityService = {
  getAll: async (limit, offset,client_id) => {
    return await EquityModel.getPaginatedItems(limit, offset,client_id)
  },
  hasEquityByClient: async (id) => {
    var items = await EquityModel.getByClientId(id)
    return items !== null ? true  : false
  },
  getById: async (id) => {
    var equity = await EquityModel.getByEquityId(id)
    if (!equity) {
      throw new Errors.NO_RECORDS_FOUND()
    }
    return equity
  },
  update: async (params) => {
    return await EquityModel.update(params)
  },
  delete: async (params) => {
    return await EquityModel.delete(params)
  },
  create: async (params) => {
    return await EquityModel.create(params)
  }
}

export {
  equityService
}
