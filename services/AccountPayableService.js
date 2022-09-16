import moment from 'moment'
import { FlowType, TransType } from '../classes/Constants'
import Errors from '../classes/Errors'
import AccountPayableModel from '../models/AccountPayableModel'
import BeginningBalanceModel from '../models/BeginningBalanceModel'
import CashJournalModel from '../models/CashJournalModel'
import InventoryModel from '../models/InventoryModel'
import LedgerModel from '../models/LedgerModel'
import VendorModel from '../models/VendorModel'
import { calc } from '../utils/CommonUtil'
import { generateId } from '../utils/Crypto'
import { beginningBalanceService } from './BeginningBalanceService'
import { cashJournalService } from './CashJournalService'

const accountPayableService = {
  getAll: async (limit, offset, client_id) => {
    return await AccountPayableModel.getPaginatedItems(limit, offset, client_id)
  },
  getAllCompleted: async (limit, offset, client_id) => {
    return await CashJournalModel.getPaginatedItemsByTypeId(limit, offset, client_id, TransType.ACCOUNTS_PAYABLE, true)
  },
  hasDataByClient: async (id) => {
    var items = await AccountPayableModel.getByClientId(id)
    return items !== null ? true : false
  },
  getById: async (id) => {
    var accountPayable = await AccountPayableModel.getById(id)
    if (!accountPayable) {
      throw new Errors.NO_RECORDS_FOUND()
    }
    return accountPayable
  },
  update: async (params) => {

    var oldData = await AccountPayableModel.getById(params.transaction_id);

    if (oldData.total > oldData.balance) {
      throw new Errors.EDIT_ERROR_WITH_EXISTING_DATA()
    }

    // var revertInventory = await InventoryModel.subtractQuantity({ admin_id: params.admin_id, item_id: oldData.item_id, quantity: oldData.quantity })
    // var inventor = await InventoryModel.addQuantity({ admin_id: params.admin_id, item_id: params.item_id, quantity: params.quantity })

    var date = moment(params.date, "YYYY-MM-DD").add(params.payment_terms, 'days').format("YYYY-MM-DD")
    params.next_payment_date = date;
    return await AccountPayableModel.update(params)
  },
  create: async (params) => {

    var hasBeginining = await beginningBalanceService.hasDataByClient({ client_id: params.client_id, type_id: TransType.ACCOUNTS_PAYABLE })

    if (!hasBeginining) {
      throw new Errors.NO_BEGINNING_BALANCE()
    }

    var date = moment(params.date, "YYYY-MM-DD").add(params.payment_terms, 'days').format("YYYY-MM-DD")
    params.next_payment_date = date;
    var ap = await AccountPayableModel.create(params);
    // var inventor = await InventoryModel.addQuantity({ admin_id: params.admin_id, item_id: params.item_id, quantity: params.quantity })

    return ap
  },
  // pay: async (params) => {
  //   var current = await AccountPayableModel.getById(params.transaction_id)

  //   var newBalance = parseFloat(current.balance) - parseFloat(params.amount_paid);
  //   var date = moment().add(params.payment_terms, 'days').format("YYYY-MM-DD")
  //   params.next_payment_date = date;
  //   params.balance = newBalance

  //   current.next_payment_date = date;
  //   current.balance = newBalance


  //   var ap = await AccountPayableModel.pay(params);
  //   if (newBalance === 0) {
  //     await AccountPayableModel.markAsComplete(params.transaction_id, params.admin_id)
  //   }
  //   var cashJournal = JSON.parse(JSON.stringify(params));

  //   cashJournal.reference_id = current.transaction_id;
  //   cashJournal.total = params.amount_paid;
  //   cashJournal.display_id = params.display_id;
  //   cashJournal.details = current;
  //   cashJournal.type_id = TransType.ACCOUNTS_PAYABLE;
  //   cashJournal.flow_type_id = FlowType.OUTFLOW
  //   await CashJournalModel.create(cashJournal)
  //   return ap
  // },
  pay: async (params) => {
    var current = await LedgerModel.getById(params.parent_id)
    var oldBalance = 0
    var previous = await CashJournalModel.getById(params.transaction_id);
    oldBalance = previous ? previous.total : 0;
    var vendor = await VendorModel.getByVendorId(current.vendor_id)
    var date = moment(params.date).add(vendor.terms, 'days').format("YYYY-MM-DD")
    params.next_payment_date = date;
    current.next_payment_date = date
    var computedBalance = parseFloat(current.balance) + parseFloat(oldBalance)
    console.log(computedBalance,'hello')
    if (calc(computedBalance) < calc(params.amount_paid)) {
      throw new Errors.AMOUNT_EXCEEDED()
    }
    if (current.previous_payment_date == null || params.date > current.previous_payment_date)
      params.previous_payment_date = params.date
    else params.previous_payment_date = current.previous_payment_date
    var newBalance = parseFloat(current.balance) - parseFloat(params.amount_paid) + parseFloat(oldBalance);

    params.balance = newBalance
    current.balance = newBalance

    current.reference_no = params.reference_no;

    if (params.reference_no) {
      var isRefExists = await CashJournalModel.getByRef(params.transaction_id, params.reference_no, params.client_id, TransType.ACCOUNTS_PAYABLE)

      if (isRefExists)
        throw new Errors.DUPLICATE_REFERENCE()

    }

    var summary = await cashJournalService.getSummary(params)

    if (summary) {
      if (calc(params.amount_paid) > calc(summary.total)) {
        throw new SafeError({
          status: 200,
          code: 209,
          message: "Insufficient Cash Balance",
          name: "Ledger"
        })
      }
    }


    var ap = await LedgerModel.pay(current);
    if (newBalance === 0) {
      await LedgerModel.markAsComplete(params.parent_id, params.admin_id)
    } else {
      await LedgerModel.markAsInComplete(params.parent_id, params.admin_id)
    }

    var cashJournal = JSON.parse(JSON.stringify(params));

    cashJournal.reference_id = params.parent_id;
    cashJournal.total = params.amount_paid;
    cashJournal.display_id = params.display_id;
    cashJournal.details = current;
    cashJournal.type_id = TransType.ACCOUNTS_PAYABLE;
    cashJournal.flow_type_id = FlowType.OUTFLOW
    if (previous) {
      await CashJournalModel.permanentDelete(params.transaction_id)
    }

    await CashJournalModel.create(cashJournal)
    if (vendor.credit_limit) {
      vendor.available_credit = parseFloat(vendor.available_credit) + parseFloat(params.amount_paid) - parseFloat(oldBalance)
      await VendorModel.updateCredit(vendor)
    }

    return ap
  },



  beginningPay: async (params) => {
    var current = await BeginningBalanceModel.getById(params.transaction_id)
    var newBalance = parseFloat(current.details.balance) - parseFloat(params.amount_paid);
    var date = moment().add(current.details.payment_terms, 'days').format("YYYY-MM-DD")
    var summary = await cashJournalService.getSummary(params)

    if (calc(current.details.balance) < calc(params.amount_paid)) {
      throw new Errors.AMOUNT_EXCEEDED()
    }
    if (summary) {
      if (calc(params.amount_paid )> calc(summary.total)) {
        throw new SafeError({
          status: 200,
          code: 209,
          message: "Insufficient Cash Balance",
          name: "Ledger"
        })
      }
    }
    if (!current.details.previous_payment_date || params.date > current.details.previous_payment_date)
      current.details.previous_payment_date = params.date

    current.details.next_payment_date = date;
    current.details.balance = newBalance
    if (newBalance === 0) {
      current.details.is_completed = true
    }

    var ap = await BeginningBalanceModel.pay(current);

    var cashJournal = JSON.parse(JSON.stringify(current));
    cashJournal.reference_id = current.transaction_id;
    cashJournal.total = params.amount_paid;
    cashJournal.details = current;
    cashJournal.display_id = params.display_id;
    cashJournal.type_id = TransType.ACCOUNTS_PAYABLE;
    cashJournal.flow_type_id = FlowType.OUTFLOW
    await CashJournalModel.create(cashJournal)
    return ap
  },

  delete: async (params) => {
    var oldData = await AccountPayableModel.getById(params.transaction_id);
    // var revertInventory = await InventoryModel.subtractQuantity({ admin_id: params.admin_id, item_id: oldData.item_id, quantity: oldData.quantity })

    await CashJournalModel.permanentDeleteByRefId(params.transaction_id)
    await AccountPayableModel.delete(params)
  },
}

export {
  accountPayableService
}
