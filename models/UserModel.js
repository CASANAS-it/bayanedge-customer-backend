import mongoose from 'mongoose'
import Database from '../classes/Database'
import Logger from '../classes/Logger'
import { encrypt, generateId, decrypt } from '../utils/Crypto'

const customModel = {

  init() {
    const db = Database.getConnection()
    const userSchema = new mongoose.Schema({
      id: {
        type: 'String'
      },
      login_id: {
        type: 'String'
      },
      password: {
        type: 'String'
      },
      first_name: {
        type: 'String'
      },
      middle_name: {
        type: 'String'
      },
      last_name: {
        type: 'String'
      },
      is_active: {
        type: 'Boolean'
      },
      created_by: {
        type: 'String'
      },
      created_date: {
        type: 'Date'
      },
      modified_by: {
        type: 'String'
      },
      modified_date: {
        type: 'Date'
      },

      
      user_type:  {
        type: 'Object',
        references: {
          model: "user_types",
          key: 'id',
        },
      },
    })

    customModel.setModel(db.connection.model('users', userSchema))

    return userSchema
  },
  setModel: model => {
    customModel.model = model
  },
  getModel: () => {
    return customModel.model
  },
  getByUsernameAndPassword: async (username, password) => {
    const user = await customModel.model
      .findOne({
        username: username,
        password: password
      })
      .lean()
    if (user) user.password = undefined
    return user
  },
  updatePassword: async (idUser, password) => {
    const user = await customModel.model.findOneAndUpdate({ _id: idUser }, {
      password: password
    })
    return user
  },
  getAll: async () => {
    return await customModel.getModel()
      .find()
      .select(['-_id', '-__v'])
      .lean()
  },
  getActiveAccounts: async () => {
    return await customModel.getModel().collection.countDocuments()
  },
  getByLoginIdAndPassword: async (loginId, password) => {
    const hashPassword = encrypt(password)
    const user = await customModel.getModel().findOne({
      login_id: loginId,
      password: hashPassword
    }).lean()

    if (user) user.password = undefined
    return user
  },
  createAdminUser: async () => {
    Logger.info('Override admin user')
    const id = generateId()
    const hashPassword = encrypt('password')
    Logger.info(hashPassword)

    Logger.info(decrypt(hashPassword))
  
    const admin = new customModel.model({
      id: id,
      login_id: 'client1',
      is_active: true,
      first_name: 'client1',
      middle_name: '',
      last_name: '',
      created_by: id,
      created_date: new Date(),
      modified_by: id,
      modified_date: new Date(),
      password: hashPassword
    })
    await admin.save()
    return id
  },
  create: async (loginId,password,clubId,userTypeName, firstName, middleName, lastName,  adminId) => {
    Logger.info('Creating user ' + firstName)
    const id = generateId()
    const hashPassword = encrypt(password)

    const user = new customModel.model({
      id: id,
      login_id: loginId,
      is_active: true,
      user_type_name : userTypeName,
      club_id : clubId,
      first_name: firstName,
      middle_name: middleName,
      last_name: lastName,
      created_by: adminId,
      created_date: new Date(),
      modified_by: adminId,
      modified_date: new Date(),
      password: hashPassword
    })
    await user.save()

    return id
  }
}

export default {
  ...customModel
}
