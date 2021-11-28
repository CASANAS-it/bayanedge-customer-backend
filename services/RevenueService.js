import Errors from '../classes/Errors'
import RevenueModel from '../models/RevenueModel'

const revenueService = {
  getAll: async (limit, offset,client_id) => {
    return await RevenueModel.getPaginatedItems(limit, offset,client_id)
  },
  hasRevenueByClient: async (id) => {
    var items = await RevenueModel.getByClientId(id)
    return items !== null ? true  : false
  },
  getById: async (id) => {
    var revenue = await RevenueModel.getByRevenueId(id)
    if (!revenue) {
      throw new Errors.NO_RECORDS_FOUND()
    }
    return revenue
  },
  update: async (params) => {
    return await RevenueModel.update(params)
  },
  delete: async (params) => {
    return await RevenueModel.delete(params)
  },
  create: async (params) => {
    return await RevenueModel.create(params)
  }
}

export {
  revenueService
}
