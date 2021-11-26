import Errors from '../classes/Errors'
import CustomerModel from '../models/CustomerModel'

const customerService = {
  getAll: async (limit, offset) => {
    return await CustomerModel.getPaginatedItems(limit, offset)
  },
  getById: async (id) => {
    var customer = await CustomerModel.getByCustomerId(id)
    if (!customer) {
      throw new Errors.NO_RECORDS_FOUND()
    }
    return customer
  },
  update: async (params) => {
    return await CustomerModel.update(params)
  },
  delete: async (params) => {
    return await CustomerModel.delete(params)
  },
  create: async (params) => {
    return await CustomerModel.create(params)
  }
}

export {
  customerService
}
