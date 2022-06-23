import Errors from '../classes/Errors'
import AssetModel from '../models/AssetModel'

const assetService = {
  getAll: async (limit, offset,client_id) => {
    return await AssetModel.getPaginatedItems(limit, offset,client_id)
  },
  getById: async (id) => {
    var asset = await AssetModel.getByAssetId(id)
    if (!asset) {
      throw new Errors.NO_RECORDS_FOUND()
    }
    return asset
  },
  hasAssetByClient: async (id) => {
    var assets = await AssetModel.getByClientId(id)
    return assets !== null ? true  : false
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
