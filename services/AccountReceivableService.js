import moment from 'moment'
import { FlowType, TransType } from '../classes/Constants'
import Errors from '../classes/Errors'
import AccountReceivableModel from '../models/AccountReceivableModel'
import BeginningBalanceModel from '../models/BeginningBalanceModel'
import CashJournalModel from '../models/CashJournalModel'
import CustomerModel from '../models/CustomerModel'
import InventoryModel from '../models/InventoryModel'
import SalesModel from '../models/SalesModel'
import { generateId } from '../utils/Crypto'
import { beginningBalanceService } from './BeginningBalanceService'

const accountReceivableService = {
  getAll: async (limit, offset, client_id) => {
    return await AccountReceivableModel.getPaginatedItems(limit, offset, client_id)
  },

  getAllCompleted: async (limit, offset, client_id) => {
    return await CashJournalModel.getPaginatedItemsByTypeId(limit, offset, client_id, TransType.ACCOUNTS_RECEIVABLE, true)
  },
  hasDataByClient: async (id) => {
    var items = await AccountReceivableModel.getByClientId(id)
    return items !== null ? true : false
  },
  getById: async (id) => {
    var accountReceivable = await AccountReceivableModel.getById(id)
    if (!accountReceivable) {
      throw new Errors.NO_RECORDS_FOUND()
    }
    return accountReceivable
  },
  update: async (params) => {
    var oldData = await AccountReceivableModel.getById(params.transaction_id);

    if (oldData.total > oldData.balance) {
      throw new Errors.EDIT_ERROR_WITH_EXISTING_DATA()
    }

    // var revertInventory = await InventoryModel.addQuantity({ admin_id: params.admin_id, item_id: oldData.item_id, quantity: oldData.quantity })
    // var inventor = await InventoryModel.subtractQuantity({ admin_id: params.admin_id, item_id: params.item_id, quantity: params.quantity })

    var date = moment(params.date, "YYYY-MM-DD").add(params.payment_terms, 'days').format("YYYY-MM-DD")
    params.next_payment_date = date;
    return await AccountReceivableModel.update(params)
  },
  create: async (params) => {


    // var hasSales = await beginningBalanceService.hasDataByClient({ client_id: params.client_id, type_id: TransType.SALES })

    // if (!hasSales) {
    //   throw new Errors.NO_BEGINNING_BALANCE()
    // }

    var ap = await AccountReceivableModel.create(params)
    // for (let index = 0; index < params.details.length; index++) {
    //   const item = params.details[index];

    //   var inventor = await InventoryModel.subtractQuantity({ admin_id: params.admin_id, item_id: item.item_id, quantity: item.quantity })
    // }

    return ap
  },

  // pay: async (params) => {
  //   var current = await AccountReceivableModel.getById(params.transaction_id)

  //   var newBalance = parseFloat(current.balance) - parseFloat(params.amount_paid);
  //   var date = moment().add(params.payment_terms, 'days').format("YYYY-MM-DD")
  //   params.next_payment_date = date;
  //   params.balance = newBalance

  //   current.next_payment_date = date;
  //   current.balance = newBalance


  //   var ap = await AccountReceivableModel.pay(params);
  //   if (newBalance === 0) {
  //     await AccountReceivableModel.markAsComplete(params.transaction_id, params.admin_id)
  //   }
  //   var cashJournal = JSON.parse(JSON.stringify(params));

  //   cashJournal.reference_id = current.transaction_id;
  //   cashJournal.total = params.amount_paid;
  //   cashJournal.details = current;
  //   cashJournal.display_id = params.display_id;
  //   cashJournal.type_id = TransType.ACCOUNTS_RECEIVABLE;
  //   cashJournal.flow_type_id = FlowType.INFLOW
  //   await CashJournalModel.create(cashJournal)
  //   return ap
  // },
  pay: async (params) => {
    var current = await SalesModel.getById(params.parent_id)
    var oldBalance = 0
    var previous = await CashJournalModel.getById(params.transaction_id);
    oldBalance = previous ? previous.total : 0;

    var customer = await CustomerModel.getByCustomerId(current.customer_id)
    var date = moment(params.date).add(customer.terms, 'days').format("YYYY-MM-DD")
    var newBalance = parseFloat(current.balance) - parseFloat(params.amount_paid) + parseFloat(oldBalance);
    params.next_payment_date = date;
    params.balance = newBalance
    current.balance = newBalance

    if (current.previous_payment_date == null || params.date > current.previous_payment_date)
      params.previous_payment_date = params.date
    else params.previous_payment_date = current.previous_payment_date

    current.next_payment_date = date;
    current.balance = newBalance
    current.reference_no = params.reference_no;
    if (params.reference_no) {
      var isRefExists = await CashJournalModel.getByRef(params.transaction_id, params.reference_no, params.client_id, TransType.ACCOUNTS_RECEIVABLE)

      if (isRefExists)
        throw new Errors.DUPLICATE_REFERENCE()
    }
    var ap = await SalesModel.pay(current);

    if (newBalance === 0) {
      await SalesModel.markAsComplete(params.parent_id, params.admin_id)
    } else {
      await SalesModel.markAsInComplete(params.parent_id, params.admin_id)
    }
    var cashJournal = JSON.parse(JSON.stringify(params));

    cashJournal.reference_id = params.parent_id;
    cashJournal.total = params.amount_paid;
    cashJournal.details = current;
    cashJournal.display_id = params.display_id;
    cashJournal.type_id = TransType.ACCOUNTS_RECEIVABLE;
    cashJournal.flow_type_id = FlowType.INFLOW
    if (previous) {
      await CashJournalModel.permanentDelete(params.transaction_id)
    }
    await CashJournalModel.create(cashJournal)
    if (customer.credit_limit) {
      customer.available_credit = parseFloat(customer.available_credit) + parseFloat(params.amount_paid) - parseFloat(oldBalance)
      if(parseFloat(customer.available_credit > parseFloat(customer.credit_limit))){
        customer.available_credit = parseFloat(customer.credit_limit)
      }
      await CustomerModel.updateCredit(customer)
    }

    return ap
  },

  beginningPay: async (params) => {
    var current = await BeginningBalanceModel.getById(params.transaction_id)
    var newBalance = parseFloat(current.details.balance) - parseFloat(params.amount_paid);
    var date = moment().add(current.details.payment_terms, 'days').format("YYYY-MM-DD")

    if (current.details.previous_payment_date == null || params.date > current.details.previous_payment_date)
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
    cashJournal.type_id = TransType.ACCOUNTS_RECEIVABLE;
    cashJournal.flow_type_id = FlowType.INFLOW
    await CashJournalModel.create(cashJournal)
    return ap
  },
  delete: async (params) => {
    var oldData = await AccountReceivableModel.getById(params.transaction_id);
    var revertInventory = await InventoryModel.addQuantity({ admin_id: params.admin_id, item_id: oldData.item_id, quantity: oldData.quantity })

    await CashJournalModel.permanentDeleteByRefId(params.transaction_id)
    return await AccountReceivableModel.delete(params)
  },
}

export {
  accountReceivableService
}
