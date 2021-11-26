import Errors from '../classes/Errors'
import RevenueModel from '../models/RevenueModel'

const revenueService = {
  getAll: async (limit, offset) => {
    return await RevenueModel.getPaginatedItems(limit, offset)
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
