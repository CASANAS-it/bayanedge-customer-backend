import UserTypeModel from '../models/UserTypeModel'

const userTypeService = {
  getAll: async () => {
    return await UserTypeModel.getAll()
  }
}

export default userTypeService
