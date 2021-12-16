import moment from 'moment'
import { TransType } from '../classes/Constants'
import Errors from '../classes/Errors'
import AccountReceivableItemModel from '../models/AccountReceivableItemModel'
import AccountReceivableModel from '../models/AccountReceivableModel'
import CashJournalModel from '../models/CashJournalModel'
import { generateId } from '../utils/Crypto'

const accountReceivableItemService = {
  getAll: async (limit, offset, client_id, is_paid) => {
    return await AccountReceivableItemModel.getPaginatedItems(limit, offset, client_id, is_paid)
  },
  getById: async (id) => {
    var accountReceivable = await AccountReceivableItemModel.getById(id)
    if (!accountReceivable) {
      throw new Errors.NO_RECORDS_FOUND()
    }
    return accountReceivable
  },
  update: async (params) => {
    const current = await AccountReceivableItemModel.getById(params.child_id)
    const ap = await AccountReceivableItemModel.markAsPaid(params)
    // amount_to_be_paid_per_term
    var newBalance = current.parent.balance - params.amount_to_be_paid_per_term;
    if (newBalance > 0) {

      var date = moment(current.transaction_date, "YYYY-MM-DD").add(current.parent.payment_terms, 'days').format("YYYY-MM-DD")
      var item = {
        parent_id: params.parent_id,
        client_id: params.client_id,
        transaction_date: date,
        admin_id: params.admin_id,
      }
      await AccountReceivableItemModel.create(item)
    }else{
      await AccountReceivableModel.markAsComplete(params.parent_id,params.admin_id)
    }

    var trans = JSON.parse(JSON.stringify(params))
    trans.amount = params.amount_to_be_paid_per_term * -1
    trans.ledger_id = params.parent_id
    await AccountReceivableModel.updateBalance(trans)

    var cashJournal = JSON.parse(JSON.stringify(current.parent));
    
    
    cashJournal.reference_id = params.child_id;
    cashJournal.total =  params.amount_to_be_paid_per_term * -1;
    cashJournal.type_id = TransType.SALES;
    await CashJournalModel.create(cashJournal)

    return ap
  },

}

export {
  accountReceivableItemService
}
