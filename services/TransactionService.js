import TransactionDetailStatusModel from '../models/TransactionDetailStatusModel'
import TransactionTypeModel from '../models/TransactionTypeModel'

const transactionDetailStatusService = {
  getAll: async () => {
    return await TransactionDetailStatusModel.getAll()
  }
}
const transactionTypeService = {
  getAll: async () => {
    return await TransactionTypeModel.getAll()
  }
}

export {
  transactionDetailStatusService,
  transactionTypeService
}
