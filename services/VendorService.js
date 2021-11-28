import Errors from '../classes/Errors'
import VendorModel from '../models/VendorModel'

const vendorService = {
  getAll: async (limit, offset,client_id) => {
    return await VendorModel.getPaginatedItems(limit, offset,client_id)
  },
  hasVendorByClient: async (id) => {
    var items = await VendorModel.getByClientId(id)
    return items !== null ? true  : false
  },
  getById: async (id) => {
    var vendor = await VendorModel.getByVendorId(id)
    if (!vendor) {
      throw new Errors.NO_RECORDS_FOUND()
    }
    return vendor
  },
  update: async (params) => {
    return await VendorModel.update(params)
  },
  delete: async (params) => {
    return await VendorModel.delete(params)
  },
  create: async (params) => {
    return await VendorModel.create(params)
  }
}

export {
  vendorService
}
