import Errors from '../classes/Errors'
import VendorModel from '../models/VendorModel'

const vendorService = {
  getAll: async (limit, offset, client_id) => {
    return await VendorModel.getPaginatedItems(limit, offset, client_id)
  },
  hasVendorByClient: async (id) => {
    var items = await VendorModel.getByClientId(id)
    return items !== null ? true : false
  },
  getById: async (id) => {
    var vendor = await VendorModel.getByVendorId(id)
    if (!vendor) {
      throw new Errors.NO_RECORDS_FOUND()
    }
    return vendor
  },
  update: async (params) => {
    var isVendorExist = await VendorModel.getByVendorName(params.vendor_id, params.vendor_name, params.client_id)

    if (isVendorExist)
      throw new Errors.RECORD_ALREADY_EXISTS()
    else
      return await VendorModel.update(params)
  },
  delete: async (params) => {
    return await VendorModel.delete(params)
  },
  create: async (params) => {
    var isVendorExist = await VendorModel.getByVendorName(0, params.vendor_name, params.client_id)

    if (isVendorExist)
      throw new Errors.RECORD_ALREADY_EXISTS()
    else
      return await VendorModel.create(params)
  }
}

export {
  vendorService
}
