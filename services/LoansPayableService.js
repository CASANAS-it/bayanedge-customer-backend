import { application } from 'express'
import moment from 'moment'
import { Config, TransType } from '../classes/Constants'
import Errors from '../classes/Errors'
import LoansPayableItemModel from '../models/LoansPayableItemModel'
import LoansPayableModel from '../models/LoansPayableModel'
import CashJournalModel from '../models/CashJournalModel'
import { generateId } from '../utils/Crypto'

const loanPayableService = {
  getAll: async (limit, offset, client_id) => {
    return await LoansPayableModel.getPaginatedItems(limit, offset, client_id)
  },
  getById: async (id) => {
    var loanPayable = await LoansPayableModel.getById(id)
    if (!loanPayable) {
      throw new Errors.NO_RECORDS_FOUND()
    }
    return loanPayable
  },
  // update: async (params) => {
  //   var newBalance = params.balance - params.amount_to_be_paid_per_term;

  //   var ap = await LoansPayableModel.updateBalance(params);
  //   if (newBalance === 0) {
  //     await LoansPayableModel.markAsComplete(params.sales_id)
  //   }

  //   var item = {
  //     parent_id: params.sales_id,
  //     client_id: params.client_id,
  //     transaction_date: new moment().format("YYYY-MM-DD"),
  //     amount_to_be_paid_per_term: params.amount_to_be_paid_per_term,
  //     admin_id: params.admin_id,
  //   }
  //   const arItem = await LoansPayableItemModel.create(item)
  //   var cashJournal = JSON.parse(JSON.stringify(ap));
  //   cashJournal.reference_id = arItem.child_id;
  //   cashJournal.total = params.amount_to_be_paid_per_term;
  //   cashJournal.type_id = TransType.SALES;
  //   await CashJournalModel.create(cashJournal)

  //   return ap
  // },
  create: async (params) => {
    var loansPayable = await LoansPayableModel.create(params)
    
    var date = moment(params.date, "YYYY-MM-DD").add(Config.PAYMENT_TERMS, 'days').format("YYYY-MM-DD")

    var item = {
      parent_id: loansPayable.loan_payable_id,
      client_id: params.client_id,
      balance  : params.total,
      transaction_date: date,
      admin_id: params.admin_id,
    }
    const arItem = await LoansPayableItemModel.create(item)


    // insert into cash journal
    var transaction = JSON.parse(JSON.stringify(params));
    transaction.reference_id = loansPayable.loan_payable_id;
    transaction.total = transaction.total;
    transaction.type_id = TransType.LOANS_PAYABLE;
    await CashJournalModel.create(transaction)
    return loansPayable
  }

}

export {
  loanPayableService
}
