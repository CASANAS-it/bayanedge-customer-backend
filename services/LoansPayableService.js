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
import { calc, padZeroes } from '../utils/CommonUtil'
import SafeError from '../classes/SafeError'
import { beginningBalanceService } from './BeginningBalanceService'
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
  getAllMicrosavingsItems: async (limit, offset, client_id) => {
    return await CashJournalModel.getPaginatedItemsByTypeId(limit, offset, client_id, TransType.MICROSAVINGS, true)
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

    params.interest = calc(params.total) + calc(params.interest_fixed_amount)
    var date = moment(params.date, "YYYY-MM-DD").add(params.payment_terms, 'days').format("YYYY-MM-DD")
    params.next_payment_date = date;

    // params.service_fee = calc(params.total) * calc(Config.SERVICE_FEE_PERCENT)

    var loansPayable = await LoansPayableModel.update(params)

    var oldNF = await CashJournalModel.getByClientIdTypeIdRefId(params.client_id, TransType.NON_FINANCIAL_CHARGES, params.transaction_id)
    await CashJournalModel.permanentDeleteByRefId(loansPayable.transaction_id)
    var transaction = JSON.parse(JSON.stringify(params));
    transaction.total = calc(params.total) - calc(params.service_fee)
    transaction.reference_id = loansPayable.transaction_id;
    transaction.type_id = TransType.LOANS_PROCEED;
    transaction.details = loansPayable;
    transaction.display_id = loansPayable.display_id
    transaction.flow_type_id = FlowType.INFLOW
    await CashJournalModel.create(transaction)

    var nf = JSON.parse(JSON.stringify(params));

    nf.total = calc(params.service_fee)
    nf.reference_id = loansPayable.transaction_id;
    nf.type_id = TransType.NON_FINANCIAL_CHARGES;
    nf.details = {
      isLoansPayable: true,
      name: params.name + ' (Service Fee)',
      description: params.description + '(Service Fee)'
    };
    if (oldNF.display_id) {
      nf.display_id = oldNF.display_id
    }
    nf.flow_type_id = FlowType.OUTFLOW
    await CashJournalModel.create(nf)

    return loansPayable
  },

  getSummary: async (client_id) => {
    var lp = await LoansPayableModel.getAllByClientId(client_id)
    var pif = await CashJournalModel.getAllPaginatedItemsByTypeIdFlowTypeId(client_id, TransType.LOANS_PROCEED, FlowType.OUTFLOW, false)
    var beginning = await beginningBalanceService.getByTypeIdV2(client_id, TransType.LOANS_PAYABLE)
    var beginningMicrosaving = await beginningBalanceService.getByTypeIdV2(client_id, TransType.MICROSAVINGS)

    var microsavingDeposit = await CashJournalModel.getAllPaginatedItemsByTypeIdFlowTypeId(client_id, TransType.MICROSAVINGS, FlowType.OUTFLOW, false)
    var microsavingWithdrawal = await CashJournalModel.getAllPaginatedItemsByTypeIdFlowTypeId(client_id, TransType.MICROSAVINGS, FlowType.INFLOW, false)

    var balance = 0;
    var pifTotal = 0;
    var microsavingTotal = 0;
    var totalLoan = 0;
    var principalTotal = 0;
    var interestTotal = 0;
    var loanPayment = 0
    var beginningBalance = beginningMicrosaving.details.beginning_amount;
    var microsavingDepositTotal = 0;
    var microsavingWithdrawalTotal = 0;
    microsavingDeposit.forEach(element => {
      microsavingDepositTotal += element.total
    })

    microsavingWithdrawal.forEach(element => {
      microsavingWithdrawalTotal += element.total
    })
    lp.forEach(element => {
      totalLoan += element.total
      balance += element.balance
    });

    totalLoan += beginning.total
    balance += beginning.details.balance

    loanPayment = totalLoan - balance
    pif.forEach(element => {
      pifTotal += element.total + element.microsaving.total
      microsavingTotal += element.microsaving.total
      principalTotal += element.total
      if (element.details && element.details.service_fee)
        interestTotal += calc(element.details.service_fee)
      if (element.is_beginning) {
        interestTotal += calc(element.details.details.interest_fixed_amount)
      }
    });


    return {
      balance, pifTotal, microsavingTotal, totalLoan, principalTotal, interestTotal,
      loanPayment, beginningBalance,microsavingDepositTotal,microsavingWithdrawalTotal
    }
  },
  payEdit: async (params) => {
    const { details } = params
    var oldData = await CashJournalModel.getById(details.transaction_id)
    var oldMicro = await CashJournalModel.getById(details.details.microsaving_id)

    var current = await LoansPayableModel.getById(details.reference_id)
    var oldPrincipal = calc(oldData.total) - calc(oldData.details.interest_fixed_amount)
    var newBalance = (calc(current.balance) + calc(oldPrincipal)) - calc(params.amount_paid);

    if (calc(current.balance) < calc(params.amount_paid)) {
      throw new Errors.AMOUNT_EXCEEDED()
    }
    current.balance = newBalance
    current.interest_fixed_amount = params.interest_fixed_amount;
    current.interest = calc(params.interest_fixed_amount) + calc(params.amount_paid)
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

      msBeginning.total = (calc(msBeginning.total) - calc(oldMicro.total)) + calc(params.microsavings);
      await BeginningBalanceModel.update(msBeginning)
    } else {
      throw new Errors.NO_BEGINNING_BALANCE()

    }

    //----------deleting old data
    await CashJournalModel.permanentDelete(details.transaction_id)
    await CashJournalModel.permanentDelete(oldMicro.transaction_id)


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
    ms.date = oldMicro.date
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

    cashJournal.details.name = "Total Amortization"
    cashJournal.details.description = "Total Amortization"
    cashJournal.details.reference_no = params.reference_no;
    cashJournal.type_id = TransType.LOANS_PROCEED;
    cashJournal.date = oldData.date
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
    var oldPrincipal = calc(oldData.total) - calc(oldData.details.interest_fixed_amount)
    var newBalance = (calc(current.balance) + calc(oldPrincipal))

    current.balance = newBalance
    current.interest_fixed_amount = params.interest_fixed_amount;
    current.interest = calc(params.interest_fixed_amount) + calc(params.amount_paid)
    current.next_payment_date = oldData.date

    var msBeginning = await BeginningBalanceModel.getByClientIdTypeId(params.client_id, TransType.MICROSAVINGS)
    if (msBeginning) {
      msBeginning.total = (calc(msBeginning.total) - calc(oldMicro.total));
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

    var newBalance = calc(current.balance) - calc(params.amount_paid);
    var currentDate = moment().format("YYYY-MM-DD")
    var date = moment().add(params.payment_terms, 'days').format("YYYY-MM-DD")
    params.next_payment_date = date;
    params.balance = newBalance

    if (calc(current.balance) < calc(params.amount_paid)) {
      throw new Errors.AMOUNT_EXCEEDED()
    }
    current.next_payment_date = date;
    current.balance = newBalance
    current.reference_no = params.reference_no;
    if (params.reference_no) {
      var isRefExists = await CashJournalModel.getByRef(params.transaction_id, params.reference_no, params.client_id, TransType.LOANS_PROCEED)
      if (isRefExists)
        throw new Errors.DUPLICATE_REFERENCE()
    }

    current.interest_fixed_amount = params.interest_fixed_amount;
    current.interest = calc(params.interest_fixed_amount) + calc(params.amount_paid)
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

      msBeginning.total = calc(msBeginning.total) + calc(params.microsavings);
      await BeginningBalanceModel.update(msBeginning)
    } else {
      throw new Errors.NO_BEGINNING_BALANCE()

    }

    var ap = await LoansPayableModel.pay(params)
    if (newBalance <= 0) {
      await LoansPayableModel.markAsCompleted(ap)
    } else {
      await LoansPayableModel.markAsInCompleted(ap)
    }
    var postToCashJournal = moment(params.date).isSameOrBefore(currentDate)

    var ms = JSON.parse(JSON.stringify(params));
    ms.reference_id = current.transaction_id;
    ms.total = params.microsavings;
    ms.display_id = "MS" + ap.display_id.substring(2);
    ms.details = current;
    ms.details.name = "Microsavings"
    ms.details.description = "Microsavings"
    ms.date = params.date;
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
    cashJournal.details.name = "Total Amortization"
    cashJournal.details.description = "Total Amortization"
    cashJournal.date = params.date;

    cashJournal.details.reference_no = params.reference_no;
    cashJournal.type_id = TransType.LOANS_PROCEED;
    cashJournal.flow_type_id = FlowType.OUTFLOW
    cashJournal.is_posted = postToCashJournal;
    await CashJournalModel.create(cashJournal)
    return ap
  },


  beginningPay: async (params) => {
    var current = await BeginningBalanceModel.getById(params.transaction_id)

    var newBalance = calc(current.details.balance) - calc(params.amount_paid);
    var date = moment().add(current.details.payment_terms, 'days').format("YYYY-MM-DD")
    var currentDate = moment(params.date).format("YYYY-MM-DD")

    if (calc(current.details.balance) < calc(params.amount_paid)) {
      throw new Errors.AMOUNT_EXCEEDED()
    }

    current.details.next_payment_date = date;
    current.details.balance = newBalance
    // current.details.reference_no = params.reference_no
    current.date = params.date;
    current.details.interest_fixed_amount = calc(params.interest_fixed_amount);
    current.details.interest = calc(params.interest_fixed_amount) + calc(params.amount_paid)



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

      msBeginning.total = calc(msBeginning.total) + calc(params.microsavings);
      await BeginningBalanceModel.update(msBeginning)
    } else {
      throw new Errors.NO_BEGINNING_BALANCE()

    }

    current.details.is_completed = newBalance === 0

    var postToCashJournal = moment(params.date).isSameOrBefore(currentDate)
    current.is_posted = postToCashJournal

    var ap = await BeginningBalanceModel.pay(current);

    var ms = JSON.parse(JSON.stringify(params));

    ms.reference_id = current.transaction_id;
    ms.total = params.microsavings;
    ms.display_id = "MS" + ap.display_id.substring(2);
    ms.details = current;
    ms.date = params.date;
    ms.details.date = params.date
    ms.details.name = "Microsavings"
    ms.details.reference_no = params.reference_no
    ms.details.description = "Microsavings"
    ms.type_id = TransType.MICROSAVINGS;
    ms.is_posted = postToCashJournal
    ms.is_beginning = true
    ms.flow_type_id = FlowType.OUTFLOW
    var micro = await CashJournalModel.create(ms)


    var cashJournal = JSON.parse(JSON.stringify(current));
    current.microsaving_id = micro.transaction_id
    cashJournal.reference_id = current.transaction_id;
    cashJournal.date = params.date;
    cashJournal.details.reference_no = params.reference_no;
    cashJournal.total = current.details.interest;
    cashJournal.details = current;
    cashJournal.details.name = "Total Amortization"
    cashJournal.details.description = "Total Amortization"
    cashJournal.details.reference_no = params.reference_no
    cashJournal.details.date = params.date
    cashJournal.display_id = params.display_id;
    cashJournal.is_beginning = true
    cashJournal.type_id = TransType.LOANS_PROCEED;
    cashJournal.flow_type_id = FlowType.OUTFLOW
    cashJournal.is_posted = postToCashJournal
    await CashJournalModel.create(cashJournal)
    return ap
  },


  payBeginningEdit: async (params) => {
    const { details } = params
    var oldData = await CashJournalModel.getById(details.transaction_id)
    var oldMicro = await CashJournalModel.getById(details.details.microsaving_id)

    var current = await BeginningBalanceModel.getById(details.reference_id)
    var oldPrincipal = calc(oldData.total) - calc(oldData.details.details.interest_fixed_amount)
    var newBalance = (calc(current.details.balance) + calc(oldPrincipal)) - calc(params.amount_paid);


    if (calc(current.details.balance) < calc(params.amount_paid)) {
      throw new Errors.AMOUNT_EXCEEDED()
    }
    current.details.balance = newBalance
    current.details.interest_fixed_amount = params.interest_fixed_amount;
    current.details.interest = calc(params.interest_fixed_amount) + calc(params.amount_paid)
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

      msBeginning.total = (calc(msBeginning.total) - calc(oldMicro.total)) + calc(params.microsavings);
      await BeginningBalanceModel.update(msBeginning)
    } else {
      throw new Errors.NO_BEGINNING_BALANCE()

    }

    //----------deleting old data
    await CashJournalModel.permanentDelete(details.transaction_id)
    await CashJournalModel.permanentDelete(oldMicro.transaction_id)


    current.details.is_completed = newBalance === 0

    var postToCashJournal = moment(current.date).isSameOrBefore(currentDate)
    current.details.is_posted = postToCashJournal

    var ap = await BeginningBalanceModel.pay(current);

    var ms = JSON.parse(JSON.stringify(params));

    ms.reference_id = current.transaction_id;
    ms.total = params.microsavings;
    ms.display_id = "MS" + ap.display_id.substring(2);
    ms.details = current;
    ms.date = oldMicro.date;
    ms.details.date = oldMicro.date
    ms.details.name = "Microsavings"
    ms.details.reference_no = params.reference_no
    ms.details.description = "Microsavings"
    ms.type_id = TransType.MICROSAVINGS;
    ms.is_posted = postToCashJournal
    ms.is_beginning = true
    ms.flow_type_id = FlowType.OUTFLOW
    var micro = await CashJournalModel.create(ms)


    var cashJournal = JSON.parse(JSON.stringify(current));
    current.microsaving_id = micro.transaction_id
    cashJournal.reference_id = current.transaction_id;
    cashJournal.details.reference_no = params.reference_no;
    cashJournal.total = current.details.interest;
    cashJournal.date = oldData.date
    cashJournal.details = current;
    cashJournal.details.name = "Total Amortization"
    cashJournal.details.description = "Total Amortization"
    cashJournal.details.reference_no = params.reference_no
    cashJournal.details.date = oldData.date
    cashJournal.display_id = params.display_id;
    cashJournal.is_beginning = true
    cashJournal.type_id = TransType.LOANS_PROCEED;
    cashJournal.flow_type_id = FlowType.OUTFLOW
    cashJournal.is_posted = postToCashJournal
    await CashJournalModel.create(cashJournal)
    return ap


  },


  beginningDeletePay: async (params) => {
    const { details } = params
    var oldData = await CashJournalModel.getById(details.transaction_id)
    var oldMicro = await CashJournalModel.getById(details.details.microsaving_id)

    //----------deleting old data
    await CashJournalModel.permanentDelete(details.transaction_id)
    await CashJournalModel.permanentDelete(oldMicro.transaction_id)

    var current = await BeginningBalanceModel.getById(details.reference_id)
    var oldPrincipal = calc(oldData.total) - calc(oldData.details.details.interest_fixed_amount)
    var newBalance = (calc(current.details.balance) + calc(oldPrincipal));

    current.details.balance = newBalance
    current.details.interest_fixed_amount = calc(current.details.interest_fixed_amount) - calc(oldData.details.details.interest_fixed_amount)
    current.details.interest = calc(current.details.interest) - calc(oldData.details.details.interest)
    var currentDate = moment().format("YYYY-MM-DD")

    current.details.is_completed = newBalance === 0

    var postToCashJournal = moment(current.date).isSameOrBefore(currentDate)
    current.details.is_posted = postToCashJournal

    var ap = await BeginningBalanceModel.pay(current);

    var msBeginning = await BeginningBalanceModel.getByClientIdTypeId(params.client_id, TransType.MICROSAVINGS)
    if (msBeginning) {
      msBeginning.total = (calc(msBeginning.total) - calc(oldMicro.total));
      await BeginningBalanceModel.update(msBeginning)
    }
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
    // params.interest = calc(params.total) + calc(params.interest_fixed_amount)
    var date = moment(params.date, "YYYY-MM-DD").add(params.payment_terms, 'days').format("YYYY-MM-DD")
    params.next_payment_date = date;
    // params.service_fee = calc(params.total) * calc(Config.SERVICE_FEE_PERCENT)
    var loansPayable = await LoansPayableModel.create(params)

    var transaction = JSON.parse(JSON.stringify(params));

    transaction.total = calc(params.total) - calc(params.service_fee)
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

    nf.total = calc(params.service_fee)
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
