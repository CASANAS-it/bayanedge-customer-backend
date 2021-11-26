import jsonwebtoken from 'jsonwebtoken'
import Errors from '../classes/Errors'
import Logger from '../classes/Logger'
import TransactionTypeModel from '../models/TransactionTypeModel'
import UserTypeModel from '../models/UserTypeModel'
import properties from '../properties'

function getUserFromToken(header) {
  const token = header.authorization.replace('Bearer ', '')
  Logger.info(token)
  const decodedUser = jsonwebtoken.verify(token, properties.tokenSecret)
  Logger.info(JSON.stringify(decodedUser))
  return decodedUser
}

async function getTransactionType(code) {
  return await TransactionTypeModel.findByCode(code)
}
async function getUserType(code) {
  return await UserTypeModel.findByCode(code)
}

function validateStringValue(val) {
  if (undefined === val || val === '') {
    return true
  }
  return false
}

function getPagination(page, size) {
  const limit = size ? +size : 3;
  const offset = page ? page * limit : 0;

  return { limit, offset };
}

function getPagingData(data, page, limit) {
  const { total: totalItems, docs: rows } = data;
  const currentPage = page ? + page : 0;
  const totalPages = Math.ceil(totalItems / limit);

  return { totalItems, rows, totalPages, currentPage };
}

export {
  getUserFromToken,
  getTransactionType,
  getUserType,
  validateStringValue,
  getPagination,
  getPagingData
}
