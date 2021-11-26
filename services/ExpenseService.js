import Errors from '../classes/Errors'
import ExpenseModel from '../models/ExpenseModel'

const expenseService = {
  getAll: async (limit, offset) => {
    return await ExpenseModel.getPaginatedItems(limit, offset)
  },
  getById: async (id) => {
    var expense = await ExpenseModel.getByExpenseId(id)
    if (!expense) {
      throw new Errors.NO_RECORDS_FOUND()
    }
    return expense
  },
  update: async (params) => {
    return await ExpenseModel.update(params)
  },
  delete: async (params) => {
    return await ExpenseModel.delete(params)
  },
  create: async (params) => {
    return await ExpenseModel.create(params)
  }
}

export {
  expenseService
}
