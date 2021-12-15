import moment from 'moment'
import Errors from '../classes/Errors'
import AccountPayableItemModel from '../models/AccountPayableItemModel'
import AccountPayableModel from '../models/AccountPayableModel'
import CashJournalModel from '../models/CashJournalModel'
import { generateId } from '../utils/Crypto'

const accountPayableItemService = {
  getAll: async (limit, offset, client_id, is_paid) => {
    return await AccountPayableItemModel.getPaginatedItems(limit, offset, client_id, is_paid)
  },
  getById: async (id) => {
    var accountPayable = await AccountPayableItemModel.getById(id)
    if (!accountPayable) {
      throw new Errors.NO_RECORDS_FOUND()
    }
    return accountPayable
  },
  update: async (params) => {
    const current = await AccountPayableItemModel.getById(params.child_id)
    var newBalance = current.parent.balance - params.amount_to_be_paid_per_term;

    params.balance = newBalance
    const ap = await AccountPayableItemModel.markAsPaid(params)
    // amount_to_be_paid_per_term
    if (newBalance > 0) {

      var date = moment(current.transaction_date, "YYYY-MM-DD").add(current.parent.payment_terms, 'days').format("YYYY-MM-DD")
      var item = {
        parent_id: params.parent_id,
        client_id: params.client_id,
        transaction_date: date,
        admin_id: params.admin_id,
      }
      await AccountPayableItemModel.create(item)
    }else{
      await AccountPayableModel.markAsComplete(params.parent_id,params.admin_id)
    }

    var trans = JSON.parse(JSON.stringify(params))
    trans.amount = params.amount_to_be_paid_per_term * -1
    trans.ledger_id = params.parent_id
    await AccountPayableModel.updateBalance(trans)

    var cashJournal = JSON.parse(JSON.stringify(current.parent));
    
    cashJournal.transaction_id = generateId();
    cashJournal.reference_id = params.child_id;
    cashJournal.total =  params.amount_to_be_paid_per_term * -1;
    await CashJournalModel.create(cashJournal)

    return ap
  },

}

export {
  accountPayableItemService
}
