import moment from 'moment'
import { TransType } from '../classes/Constants'
import Errors from '../classes/Errors'
import AccountPayableItemModel from '../models/AccountPayableItemModel'
import AccountPayableModel from '../models/AccountPayableModel'
import CashJournalModel from '../models/CashJournalModel'
import { generateId } from '../utils/Crypto'

const accountPayableService = {
  getAll: async (limit, offset, client_id) => {
    return await AccountPayableModel.getPaginatedItems(limit, offset, client_id)
  },
  getById: async (id) => {
    var accountPayable = await AccountPayableModel.getById(id)
    if (!accountPayable) {
      throw new Errors.NO_RECORDS_FOUND()
    }
    return accountPayable
  },
  update: async (params) => {

    var ap = await AccountPayableModel.updateTerms(params);
    var date = moment(params.date, "YYYY-MM-DD").add(params.payment_terms, 'days').format("YYYY-MM-DD")

    var item = {
      parent_id: params.ledger_id,
      client_id: params.client_id,
      transaction_date: date,
      admin_id: params.admin_id,
      balance : params.total
    }
    var item = await AccountPayableItemModel.create(item)

    var cashJournal = JSON.parse(JSON.stringify(params));
    
    
    cashJournal.reference_id = item.child_id;
    cashJournal.total =  params.amount_to_be_paid_per_term;
    cashJournal.type_id = TransType.ORDER;
    await CashJournalModel.create(cashJournal)
    return ap
  },

}

export {
  accountPayableService
}
