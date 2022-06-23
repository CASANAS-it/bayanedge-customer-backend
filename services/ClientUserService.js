import Errors from '../classes/Errors'
import ClientUserModel from '../models/ClientUserModel'

const clientUserService = {
  getAll: async () => {
    return await ClientUserModel.getAll()
  },
  // getById: async (id) => {
  //   var clientUser = await ClientUserModel.getByClientUserId(id)
  //   if (!clientUser) {
  //     throw new Errors.NO_RECORDS_FOUND()
  //   }
  //   return clientUser
  // },
}

export {
  clientUserService
}
