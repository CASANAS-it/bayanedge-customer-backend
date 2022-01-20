import moment from 'moment'
import { Config, TransType } from '../classes/Constants'
import Errors from '../classes/Errors'
import LoansPayableItemModel from '../models/LoansPayableItemModel'
import LoansPayableModel from '../models/LoansPayableModel'
import CashJournalModel from '../models/CashJournalModel'
import { generateId } from '../utils/Crypto'

const loanPayableItemService = {
  getAll: async (limit, offset, client_id) => {
    return await CashJournalModel.getPaginatedItemsByTypeId(limit, offset, client_id, TransType.NEW_LOANS)
  },
  getById: async (id) => {
    var loansPayable = await LoansPayableItemModel.getById(id)
    if (!loansPayable) {
      throw new Errors.NO_RECORDS_FOUND()
    }
    return loansPayable
  },
  update: async (params) => {
    const current = await LoansPayableItemModel.getById(params.child_id)
    var newBalance = current.parent.balance - params.amount_to_be_paid_per_term;

    params.balance = newBalance
  
    const ap = await LoansPayableItemModel.markAsPaid(params)
    // amount_to_be_paid_per_term
    var newBalance = current.parent.balance - params.amount_to_be_paid_per_term;
    if (newBalance > 0) {

      var date = moment(current.transaction_date, "YYYY-MM-DD").add(Config.PAYMENT_TERMS, 'days').format("YYYY-MM-DD")
      var item = {
        parent_id: params.parent_id,
        client_id: params.client_id,
        transaction_date: date,
        balance : newBalance,
        admin_id: params.admin_id,
      }
      await LoansPayableItemModel.create(item)
    }else{
      await LoansPayableModel.markAsComplete(params.parent_id,params.admin_id)
    }

    var trans = JSON.parse(JSON.stringify(params))
    trans.amount = params.amount_to_be_paid_per_term * -1
    trans.loan_payable_id = params.parent_id
    await LoansPayableModel.updateBalance(trans)

    var cashJournal = JSON.parse(JSON.stringify(current.parent));
    
    cashJournal.reference_id = params.child_id;
    cashJournal.total =  params.amount_to_be_paid_per_term * -1;
    cashJournal.type_id = TransType.LOANS_PAYABLE_OUTFLOW;
    await CashJournalModel.create(cashJournal)
    return ap
  },

}

export {
  loanPayableItemService
}
