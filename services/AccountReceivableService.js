import moment from 'moment'
import Errors from '../classes/Errors'
import AccountReceivableItemModel from '../models/AccountReceivableItemModel'
import AccountReceivableModel from '../models/AccountReceivableModel'

const accountReceivableService = {
  getAll: async (limit, offset, client_id) => {
    return await AccountReceivableModel.getPaginatedItems(limit, offset, client_id)
  },
  getById: async (id) => {
    var accountReceivable = await AccountReceivableModel.getById(id)
    if (!accountReceivable) {
      throw new Errors.NO_RECORDS_FOUND()
    }
    return accountReceivable
  },
  update: async (params) => {


    var newBalance = params.balance - params.amount_to_be_paid_per_term;

    var ap = await AccountReceivableModel.updateBalance(params);
    if (newBalance === 0) {
      await AccountReceivableModel.markAsComplete(params.sales_id)
    }

    var item = {
      parent_id: params.sales_id,
      client_id: params.client_id,
      transaction_date: new moment().format("YYYY-MM-DD"),
      amount_to_be_paid_per_term : params.amount_to_be_paid_per_term,
      admin_id: params.admin_id,
    }
    await AccountReceivableItemModel.create(item)
    return ap
  },

}

export {
  accountReceivableService
}
