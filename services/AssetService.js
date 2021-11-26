import Errors from '../classes/Errors'
import AssetModel from '../models/AssetModel'

const assetService = {
  getAll: async (limit, offset) => {
    return await AssetModel.getPaginatedItems(limit, offset)
  },
  getById: async (id) => {
    var asset = await AssetModel.getByAssetId(id)
    if (!asset) {
      throw new Errors.NO_RECORDS_FOUND()
    }
    return asset
  },
  update: async (params) => {
    return await AssetModel.update(params)
  },
  delete: async (params) => {
    return await AssetModel.delete(params)
  },
  create: async (params) => {
    return await AssetModel.create(params)
  }
}

export {
  assetService
}
