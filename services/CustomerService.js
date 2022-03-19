import Errors from '../classes/Errors'
import CustomerModel from '../models/CustomerModel'

const customerService = {
  getAll: async (limit, offset, client_id) => {
    return await CustomerModel.getPaginatedItems(limit, offset, client_id)
  },
  hasCustomerByClient: async (id) => {
    var items = await CustomerModel.getByClientId(id)
    return items !== null ? true : false
  },
  getById: async (id) => {
    var customer = await CustomerModel.getByCustomerId(id)
    if (!customer) {
      throw new Errors.NO_RECORDS_FOUND()
    }
    return customer
  },

  getByName: async (id, name, clientId) => {
    var customer = await CustomerModel.getByCustomerId(id)
    if (!customer) {
      throw new Errors.NO_RECORDS_FOUND()
    }
    return customer
  },
  update: async (params) => {
    var isCustomerExist = await CustomerModel.getByCustomerName(params.customer_id, params.customer_name, params.client_id)
    if (isCustomerExist)
      throw new Errors.RECORD_ALREADY_EXISTS()
    else
      return await CustomerModel.update(params)
  },
  delete: async (params) => {
    return await CustomerModel.delete(params)
  },
  create: async (params) => {
    var isCustomerExist = await CustomerModel.getByCustomerName(0, params.customer_name, params.client_id)

    if (isCustomerExist)
      throw new Errors.RECORD_ALREADY_EXISTS()
    else
      return await CustomerModel.create(params)
  }
}

export {
  customerService
}
