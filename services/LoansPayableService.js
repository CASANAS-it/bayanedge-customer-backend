import Errors from '../classes/Errors'
import VendorModel from '../models/VendorModel'
import LoansPayableModel from '../models/LoansPayableModel'
import LoansRepaymentModel from '../models/LoansRepaymentModel'
import InventoryModel from '../models/InventoryModel'
import CashJournalModel from '../models/CashJournalModel'
import { FlowType, TransactionType, TransType } from '../classes/Constants'
import moment from 'moment'
import BeginningBalanceModel from '../models/BeginningBalanceModel'
import { cashJournalService } from './CashJournalService'
const loansPayableService = {
  getAll: async (limit, offset, client_id) => {
    return await LoansPayableModel.getPaginatedItems(limit, offset, client_id)
  },
  getAllItems: async (limit, offset, client_id) => {
    return await CashJournalModel.getPaginatedItemsByTypeId(limit, offset, client_id, TransType.LOANS_PAYABLE)
  },

  getAllNewLoansItems: async (limit, offset, client_id) => {
    return await CashJournalModel.getPaginatedItemsByTypeId(limit, offset, client_id, TransType.LOANS_PROCEEDS)
  },
  getAllRepayment: async (limit, offset, client_id) => {
    return await LoansRepaymentModel.getPaginatedItems(limit, offset, client_id)
  },
  getById: async (id) => {
    var loansPayable = await LoansPayableModel.getById(id)
    if (!loansPayable) {
      throw new Errors.NO_RECORDS_FOUND()
    }
    return loansPayable
  },
  getRepaymentById: async (id) => {
    var loansPayable = await LoansRepaymentModel.getById(id)
    if (!loansPayable) {
      throw new Errors.NO_RECORDS_FOUND()
    }
    return loansPayable
  },
  update: async (params) => {
    var hasData = await LoansRepaymentModel.getByParentId(params.transaction_id)

    if (hasData) {
      throw new Errors.EDIT_ERROR_WITH_EXISTING_DATA()
    }

    params.interest = parseFloat(params.total) + parseFloat(params.interest_fixed_amount)
    var date = moment(params.date, "YYYY-MM-DD").add(params.payment_terms, 'days').format("YYYY-MM-DD")
    params.next_payment_date = date;

    var loansPayable = await LoansPayableModel.update(params)
    await CashJournalModel.permanentDeleteByRefId(loansPayable.transaction_id)

    var transaction = JSON.parse(JSON.stringify(params));
    transaction.reference_id = loansPayable.transaction_id;
    transaction.type_id = TransType.LOANS_PROCEED;
    transaction.details = loansPayable;
    transaction.display_id = loansPayable.display_id
    transaction.flow_type_id = FlowType.INFLOW
    await CashJournalModel.create(transaction)
    return loansPayable
  },
  pay: async (params) => {
    var current = await LoansPayableModel.getById(params.transaction_id)

    var newBalance = parseFloat(current.balance) - parseFloat(params.amount_paid);
    var currentDate = moment().format("YYYY-MM-DD")
    var date = moment().add(params.payment_terms, 'days').format("YYYY-MM-DD")
    params.next_payment_date = date;
    params.balance = newBalance


    current.next_payment_date = date;
    current.balance = newBalance
    current.interest_fixed_amount = params.interest_fixed_amount;
    current.interest = parseFloat(params.interest_fixed_amount) + parseFloat(params.amount_paid)
    var summary = await cashJournalService.getSummary(params)

    if (summary) {
      if (current.interest > summary.total) {
        throw new SafeError({
          status: 200,
          code: 209,
          message: "Insufficient Cash Balance",
          name: "Ledger"
        })
      }
    }

    var ap = await LoansPayableModel.pay(params)
    if (newBalance === 0) {
      await LoansPayableModel.markAsCompleted(params.transaction_id, params.admin_id)
    }
    var postToCashJournal = moment(params.date).isSameOrBefore(currentDate)

    var cashJournal = JSON.parse(JSON.stringify(params));

    cashJournal.reference_id = current.transaction_id;
    cashJournal.total = current.interest;
    cashJournal.display_id = params.display_id;
    cashJournal.details = current;
    cashJournal.type_id = TransType.LOANS_PROCEED;
    cashJournal.flow_type_id = FlowType.OUTFLOW
    cashJournal.is_posted = postToCashJournal;
    await CashJournalModel.create(cashJournal)

    var ms = JSON.parse(JSON.stringify(params));
    ms.reference_id = current.transaction_id;
    ms.total = params.microsavings;
    ms.display_id = "MS" + ap.display_id.substring(2);
    ms.details = current;
    ms.details.name = "Microsavings"
    ms.details.description = "Microsavings"
    ms.type_id = TransType.MICROSAVINGS;
    ms.flow_type_id = FlowType.OUTFLOW
    ms.is_posted = postToCashJournal;
    await CashJournalModel.create(ms)


    return ap

  },


  beginningPay: async (params) => {
    var current = await BeginningBalanceModel.getById(params.transaction_id)

    var newBalance = parseFloat(current.details.balance) - parseFloat(params.amount_paid);
    var date = moment().add(current.details.payment_terms, 'days').format("YYYY-MM-DD")
    var currentDate = moment().format("YYYY-MM-DD")

    current.details.next_payment_date = date;
    current.details.balance = newBalance
    current.details.interest_fixed_amount = params.interest_fixed_amount;
    current.details.interest = parseFloat(params.interest_fixed_amount) + parseFloat(params.amount_paid)

    var summary = await cashJournalService.getSummary(params)

    if (summary) {
      if (current.details.interest > summary.total) {
        throw new SafeError({
          status: 200,
          code: 209,
          message: "Insufficient Cash Balance",
          name: "Ledger"
        })
      }
    }

    
    var msBeginning = await BeginningBalanceModel.getByClientIdTypeId(params.client_id, TransType.MICROSAVINGS)
    if (msBeginning) {

      msBeginning.total = parseFloat(msBeginning.total) + parseFloat(params.microsavings);
      await BeginningBalanceModel.update(msBeginning)
    }else{
      throw new Errors.NO_BEGINNING_BALANCE()
    
    }

    if (newBalance === 0) {
      current.details.is_completed = true
    }
    var postToCashJournal = moment(params.date).isSameOrBefore(currentDate)
    current.is_posted = postToCashJournal
    var ap = await BeginningBalanceModel.pay(current);

    var cashJournal = JSON.parse(JSON.stringify(current));
    cashJournal.reference_id = current.transaction_id;
    cashJournal.total = current.details.interest;
    cashJournal.details = current;
    cashJournal.display_id = params.display_id;
    cashJournal.is_beginning = true
    cashJournal.type_id = TransType.LOANS_PROCEED;
    cashJournal.flow_type_id = FlowType.OUTFLOW
    cashJournal.is_posted = postToCashJournal
    await CashJournalModel.create(cashJournal)

    var ms = JSON.parse(JSON.stringify(params));

    ms.reference_id = current.transaction_id;
    ms.total = params.microsavings;
    ms.display_id = "MS" + ap.display_id.substring(2);
    ms.details = current;
    ms.details.name = "Microsavings"
    ms.details.description = "Microsavings"
    ms.type_id = TransType.MICROSAVINGS;
    ms.is_posted = postToCashJournal
    ms.is_beginning = true
    ms.flow_type_id = FlowType.OUTFLOW
    await CashJournalModel.create(ms)



    return ap
  },

  delete: async (params) => {

    await LoansPayableModel.delete(params)
    await LoansRepaymentModel.permanentDeleteByParentId(params.transaction_id)
    await CashJournalModel.permanentDeleteByRefId(params.transaction_id)
  },
  updateRepayment: async (params) => {

    var current = await LoansRepaymentModel.getById(params.transaction_id)

    var loansPayable = await LoansPayableModel.update(params)
    await CashJournalModel.permanentDeleteByRefId(loansPayable.transaction_id)

    var transaction = JSON.parse(JSON.stringify(params));
    transaction.reference_id = loansPayable.transaction_id;
    transaction.type_id = TransType.LOANS_PROCEEDS;
    transaction.details = loansPayable;
    transaction.display_id = loansPayable.display_id
    transaction.flow_type_id = FlowType.OUTFLOW
    await CashJournalModel.create(transaction)

    return loansPayable
  },
  deleteRepayment: async (params) => {

    await LoansRepaymentModel.delete(params)
    await CashJournalModel.permanentDeleteByRefId(params.transaction_id)
  },
  create: async (params) => {
    // params.interest = parseFloat(params.total) + parseFloat(params.interest_fixed_amount)
    var date = moment(params.date, "YYYY-MM-DD").add(params.payment_terms, 'days').format("YYYY-MM-DD")
    params.next_payment_date = date;

    var loansPayable = await LoansPayableModel.create(params)

    var transaction = JSON.parse(JSON.stringify(params));
    transaction.reference_id = loansPayable.transaction_id;
    transaction.type_id = TransType.LOANS_PROCEED;
    transaction.details = loansPayable;
    transaction.display_id = loansPayable.display_id
    transaction.flow_type_id = FlowType.INFLOW
    await CashJournalModel.create(transaction)

    return loansPayable
  },
}

export {
  loansPayableService
}
