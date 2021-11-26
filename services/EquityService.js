import Errors from '../classes/Errors'
import EquityModel from '../models/EquityModel'

const equityService = {
  getAll: async (limit, offset) => {
    return await EquityModel.getPaginatedItems(limit, offset)
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
