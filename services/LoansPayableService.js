import Errors from '../classes/Errors'
import VendorModel from '../models/VendorModel'
import LoansPayableModel from '../models/LoansPayableModel'
import LoansRepaymentModel from '../models/LoansRepaymentModel'
import InventoryModel from '../models/InventoryModel'
import CashJournalModel from '../models/CashJournalModel'
import { Config, FlowType, TransactionType, TransType } from '../classes/Constants'
import moment from 'moment'
import BeginningBalanceModel from '../models/BeginningBalanceModel'
import { cashJournalService } from './CashJournalService'
import { padZeroes } from '../utils/CommonUtil'
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

    // params.service_fee = parseFloat(params.total) * parseFloat(Config.SERVICE_FEE_PERCENT)

    var loansPayable = await LoansPayableModel.update(params)

    var oldNF = await CashJournalModel.getByClientIdTypeIdRefId(params.client_id, TransType.NON_FINANCIAL_CHARGES, loansPayable.transaction_id)
    await CashJournalModel.permanentDeleteByRefId(loansPayable.transaction_id)
    var transaction = JSON.parse(JSON.stringify(params));
    transaction.total = parseFloat(params.total) - parseFloat(params.service_fee)
    transaction.reference_id = loansPayable.transaction_id;
    transaction.type_id = TransType.LOANS_PROCEED;
    transaction.details = loansPayable;
    transaction.display_id = loansPayable.display_id
    transaction.flow_type_id = FlowType.INFLOW
    await CashJournalModel.create(transaction)

    var nf = JSON.parse(JSON.stringify(params));

    nf.total = parseFloat(params.service_fee)
    nf.reference_id = loansPayable.transaction_id;
    nf.type_id = TransType.NON_FINANCIAL_CHARGES;
    nf.details = {
      isLoansPayable: true,
      name: params.name + ' (Service Fee)',
      description: params.description + '(Service Fee)'
    };
    nf.display_id = oldNF.display_id
    nf.flow_type_id = FlowType.OUTFLOW
    await CashJournalModel.create(nf)

    return loansPayable
  },

  getSummary: async (client_id) => {
    var lp = await LoansPayableModel.getAllByClientId(client_id)
    var msBalance = await BeginningBalanceModel.getByClientIdTypeId(client_id, TransType.MICROSAVINGS)
    var balance = 0, microsavings = 0;
    microsavings = msBalance ? msBalance.total : 0
    lp.forEach(element => {
      balance += element.balance
    });
    var result = {
      balance,
      microsavings
    }
    return result
  },
  payEdit: async (params) => {
    const { details } = params
    var oldData = await CashJournalModel.getById(details.transaction_id)
    var oldMicro = await CashJournalModel.getById(details.details.microsaving_id)

    //----------deleting old data
    await CashJournalModel.permanentDelete(details.transaction_id)
    await CashJournalModel.permanentDelete(oldMicro.transaction_id)

    var current = await LoansPayableModel.getById(details.reference_id)
    var oldPrincipal = parseFloat(oldData.total) - parseFloat(oldData.details.interest_fixed_amount)
    var newBalance = (parseFloat(current.balance) + parseFloat(oldPrincipal)) - parseFloat(params.amount_paid);

    current.balance = newBalance
    current.interest_fixed_amount = params.interest_fixed_amount;
    current.interest = parseFloat(params.interest_fixed_amount) + parseFloat(params.amount_paid)
    var summary = await cashJournalService.getSummary(params)
    var currentDate = moment().format("YYYY-MM-DD")

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

    var msBeginning = await BeginningBalanceModel.getByClientIdTypeId(params.client_id, TransType.MICROSAVINGS)
    if (msBeginning) {

      msBeginning.total = (parseFloat(msBeginning.total) - parseFloat(oldMicro.total)) + parseFloat(params.microsavings);
      await BeginningBalanceModel.update(msBeginning)
    } else {
      throw new Errors.NO_BEGINNING_BALANCE()

    }

    var ap = await LoansPayableModel.pay(current)
    if (newBalance === 0) {
      await LoansPayableModel.markAsCompleted(ap)
    } else {
      await LoansPayableModel.markAsInCompleted(ap)
    }

    var postToCashJournal = moment(details.date).isSameOrBefore(currentDate)


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
    var micro = await CashJournalModel.create(ms)

    var cashJournal = JSON.parse(JSON.stringify(current));
    current.microsaving_id = micro.transaction_id
    cashJournal.reference_id = current.transaction_id;
    cashJournal.total = current.interest;
    cashJournal.display_id = params.display_id;
    cashJournal.details = current;
    cashJournal.type_id = TransType.LOANS_PROCEED;
    cashJournal.flow_type_id = FlowType.OUTFLOW
    cashJournal.is_posted = postToCashJournal;
    await CashJournalModel.create(cashJournal)

    return ap

  },


  deletePay: async (params) => {
    const { details } = params
    var oldData = await CashJournalModel.getById(details.transaction_id)
    var oldMicro = await CashJournalModel.getById(details.details.microsaving_id)

    var current = await LoansPayableModel.getById(details.reference_id)
    var oldPrincipal = parseFloat(oldData.total) - parseFloat(oldData.details.interest_fixed_amount)
    var newBalance = (parseFloat(current.balance) + parseFloat(oldPrincipal))

    current.balance = newBalance
    current.interest_fixed_amount = params.interest_fixed_amount;
    current.interest = parseFloat(params.interest_fixed_amount) + parseFloat(params.amount_paid)
    current.next_payment_date = oldData.date

    var msBeginning = await BeginningBalanceModel.getByClientIdTypeId(params.client_id, TransType.MICROSAVINGS)
    if (msBeginning) {
      msBeginning.total = (parseFloat(msBeginning.total) - parseFloat(oldMicro.total));
      await BeginningBalanceModel.update(msBeginning)
    }

    var ap = await LoansPayableModel.pay(current)
    if (newBalance > 0) {
      await LoansPayableModel.markAsInCompleted(ap)
    }


    //----------deleting old data
    await CashJournalModel.permanentDelete(details.transaction_id)
    await CashJournalModel.permanentDelete(oldMicro.transaction_id)
    return ap
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
    current.reference_no = params.reference_no;
    if (params.reference_no) {
      var isRefExists = await cashJournalService.getByRef(params.transaction_id, params.reference_no, params.client_id, TransType.LOANS_PROCEED)
      if (isRefExists)
        throw new Errors.DUPLICATE_REFERENCE()
    }
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

    var msBeginning = await BeginningBalanceModel.getByClientIdTypeId(params.client_id, TransType.MICROSAVINGS)
    if (msBeginning) {

      msBeginning.total = parseFloat(msBeginning.total) + parseFloat(params.microsavings);
      await BeginningBalanceModel.update(msBeginning)
    } else {
      throw new Errors.NO_BEGINNING_BALANCE()

    }

    var ap = await LoansPayableModel.pay(params)
    console.log(newBalance, '---------')
    if (newBalance >= 0) {
      await LoansPayableModel.markAsCompleted(ap)
    }
    var postToCashJournal = moment(params.date).isSameOrBefore(currentDate)

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
    var micro = await CashJournalModel.create(ms)


    var cashJournal = JSON.parse(JSON.stringify(params));
    current.microsaving_id = micro.transaction_id;
    cashJournal.reference_id = current.transaction_id;
    cashJournal.total = current.interest;
    cashJournal.display_id = params.display_id;
    cashJournal.details = current;
    cashJournal.type_id = TransType.LOANS_PROCEED;
    cashJournal.flow_type_id = FlowType.OUTFLOW
    cashJournal.is_posted = postToCashJournal;
    await CashJournalModel.create(cashJournal)
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
    } else {
      throw new Errors.NO_BEGINNING_BALANCE()

    }

    if (newBalance === 0) {
      current.details.is_completed = true
    }
    var postToCashJournal = moment(params.date).isSameOrBefore(currentDate)
    current.is_posted = postToCashJournal

    var ap = await BeginningBalanceModel.pay(current);

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
    var micro = await CashJournalModel.create(ms)


    var cashJournal = JSON.parse(JSON.stringify(current));
    current.microsaving_id = micro.transaction_id
    cashJournal.reference_id = current.transaction_id;
    cashJournal.total = current.details.interest;
    cashJournal.details = current;
    cashJournal.display_id = params.display_id;
    cashJournal.is_beginning = true
    cashJournal.type_id = TransType.LOANS_PROCEED;
    cashJournal.flow_type_id = FlowType.OUTFLOW
    cashJournal.is_posted = postToCashJournal
    await CashJournalModel.create(cashJournal)
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
    // params.service_fee = parseFloat(params.total) * parseFloat(Config.SERVICE_FEE_PERCENT)
    var loansPayable = await LoansPayableModel.create(params)

    var transaction = JSON.parse(JSON.stringify(params));

    transaction.total = parseFloat(params.total) - parseFloat(params.service_fee)
    transaction.reference_id = loansPayable.transaction_id;
    transaction.type_id = TransType.LOANS_PROCEED;
    transaction.details = loansPayable;
    transaction.display_id = loansPayable.display_id
    transaction.flow_type_id = FlowType.INFLOW
    await CashJournalModel.create(transaction)

    // service fee - non Finance Charges

    var nf = JSON.parse(JSON.stringify(params));
    var displayId = "NF000001";
    var lastDisplay = await CashJournalModel.getLastDisplayId(params.client_id, TransType.NON_FINANCIAL_CHARGES, FlowType.OUTFLOW)
    if (lastDisplay) {
      var disId = lastDisplay.display_id
      disId = parseInt(disId.substring(2)) + 1;
      displayId = "NF" + padZeroes(disId)
    }

    nf.total = parseFloat(params.service_fee)
    nf.reference_id = loansPayable.transaction_id;
    nf.type_id = TransType.NON_FINANCIAL_CHARGES;
    nf.details = {
      isLoansPayable: true,
      name: params.name + ' (Service Fee)',
      description: params.description + '(Service Fee)'
    };
    nf.display_id = displayId
    nf.flow_type_id = FlowType.OUTFLOW
    await CashJournalModel.create(nf)


    return loansPayable
  },
}

export {
  loansPayableService
}
