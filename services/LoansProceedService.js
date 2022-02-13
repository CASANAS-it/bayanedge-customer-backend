import Errors from '../classes/Errors'
import VendorModel from '../models/VendorModel'
import LoansProceedModel from '../models/LoansProceedModel'
import LoansRepaymentModel from '../models/LoansRepaymentModel'
import InventoryModel from '../models/InventoryModel'
import CashJournalModel from '../models/CashJournalModel'
import { FlowType, TransactionType, TransType } from '../classes/Constants'
import moment from 'moment'
const loansProceedService = {
  getAll: async (limit, offset, client_id) => {
    return await LoansProceedModel.getPaginatedItems(limit, offset, client_id)
  },
  getAllRepayment: async (limit, offset, client_id) => {
    return await LoansRepaymentModel.getPaginatedItems(limit, offset, client_id)
  },
  getById: async (id) => {
    var loansProceed = await LoansProceedModel.getById(id)
    if (!loansProceed) {
      throw new Errors.NO_RECORDS_FOUND()
    }
    return loansProceed
  },
  getRepaymentById: async (id) => {
    var loansProceed = await LoansRepaymentModel.getById(id)
    if (!loansProceed) {
      throw new Errors.NO_RECORDS_FOUND()
    }
    return loansProceed
  },
  update: async (params) => {
    var hasData = await LoansRepaymentModel.getByParentId(params.transaction_id)

    if (hasData) {
      throw new Errors.EDIT_ERROR_WITH_EXISTING_DATA()
    }

    params.interest = parseFloat(params.total) + parseFloat(params.interest_fixed_amount)
    var date = moment(params.date, "YYYY-MM-DD").add(params.payment_terms, 'days').format("YYYY-MM-DD")
    params.next_payment_date = date;

    var loansProceed = await LoansProceedModel.update(params)
    await CashJournalModel.permanentDeleteByRefId(loansProceed.transaction_id)

    var transaction = JSON.parse(JSON.stringify(params));
    transaction.reference_id = loansProceed.transaction_id;
    transaction.type_id = TransType.LOANS_PROCEED;
    transaction.details = loansProceed;
    transaction.display_id = loansProceed.display_id
    transaction.flow_type_id = FlowType.INFLOW
    await CashJournalModel.create(transaction)

    return loansProceed
  },
  pay: async (params) => {
    var current = await LoansProceedModel.getById(params.transaction_id)

    var newBalance = parseFloat(current.balance) - parseFloat(params.amount_paid);
    var currentDate = moment().format("YYYY-MM-DD")
    var date = moment().add(params.payment_terms, 'days').format("YYYY-MM-DD")
    params.next_payment_date = date;
    params.balance = newBalance

    current.next_payment_date = date;
    current.balance = newBalance
    await LoansProceedModel.pay(params)
    if (newBalance === 0) {
      await LoansProceedModel.markAsCompleted(params.transaction_id, params.admin_id)
    }
    var postToCashJournal = moment(params.date).isSameOrBefore(currentDate)
    var loansRepayment = {
      parent_id: params.transaction_id,
      client_id: params.client_id,
      display_id: current.display_id,
      total: params.amount_paid,
      date: params.date,
      balance: newBalance,
      is_posted: postToCashJournal
    }
    await LoansRepaymentModel.create(loansRepayment)
    if (postToCashJournal) {
      var cashJournal = JSON.parse(JSON.stringify(params));

      cashJournal.reference_id = current.transaction_id;
      cashJournal.total = params.amount_paid;
      cashJournal.display_id = params.display_id;
      cashJournal.details = current;
      cashJournal.type_id = TransType.LOANS_PROCEED;
      cashJournal.flow_type_id = FlowType.OUTFLOW
      await CashJournalModel.create(cashJournal)
    }

  },
  delete: async (params) => {

    await LoansProceedModel.delete(params)
    await LoansRepaymentModel.permanentDeleteByParentId(params.transaction_id)
    await CashJournalModel.permanentDeleteByRefId(params.transaction_id)
  },
  
  updateRepayment: async (params) => {

    var current = await LoansRepaymentModel.getById(params.transaction_id)

    var loansProceed = await LoansProceedModel.update(params)
    await CashJournalModel.permanentDeleteByRefId(loansProceed.transaction_id)

    var transaction = JSON.parse(JSON.stringify(params));
    transaction.reference_id = loansProceed.transaction_id;
    transaction.type_id = TransType.LOANS_PROCEED;
    transaction.details = loansProceed;
    transaction.display_id = loansProceed.display_id
    transaction.flow_type_id = FlowType.INFLOW
    await CashJournalModel.create(transaction)

    return loansProceed
  },
  deleteRepayment: async (params) => {

    await LoansRepaymentModel.delete(params)
    await CashJournalModel.permanentDeleteByRefId(params.transaction_id)
  },
  create: async (params) => {
    params.interest = parseFloat(params.total) + parseFloat(params.interest_fixed_amount)
    var date = moment(params.date, "YYYY-MM-DD").add(params.payment_terms, 'days').format("YYYY-MM-DD")
    params.next_payment_date = date;

    var loansProceed = await LoansProceedModel.create(params)

    var transaction = JSON.parse(JSON.stringify(params));
    transaction.reference_id = loansProceed.transaction_id;
    transaction.type_id = TransType.LOANS_PROCEED;
    transaction.details = loansProceed;
    transaction.display_id = loansProceed.display_id
    transaction.flow_type_id = FlowType.INFLOW
    await CashJournalModel.create(transaction)

    return loansProceed
  },
}

export {
  loansProceedService
}
