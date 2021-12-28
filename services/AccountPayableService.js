import moment from 'moment'
import { FlowType, TransType } from '../classes/Constants'
import Errors from '../classes/Errors'
import AccountPayableModel from '../models/AccountPayableModel'
import CashJournalModel from '../models/CashJournalModel'
import InventoryModel from '../models/InventoryModel'
import { generateId } from '../utils/Crypto'
import { beginningBalanceService } from './BeginningBalanceService'

const accountPayableService = {
  getAll: async (limit, offset, client_id) => {
    return await AccountPayableModel.getPaginatedItems(limit, offset, client_id)
  },
  getAllCompleted: async (limit, offset, client_id) => {
    return await CashJournalModel.getPaginatedItemsByTypeId(limit, offset, client_id, TransType.ACCOUNTS_PAYABLE)
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

    var revertInventory = await InventoryModel.subtractQuantity({ admin_id: params.admin_id, item_id: oldData.item_id, quantity: oldData.quantity })
    var inventor = await InventoryModel.addQuantity({ admin_id: params.admin_id, item_id: params.item_id, quantity: params.quantity })

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
    var inventor = await InventoryModel.addQuantity({ admin_id: params.admin_id, item_id: params.item_id, quantity: params.quantity })

    return ap
  },
  pay: async (params) => {
    var current = await AccountPayableModel.getById(params.transaction_id)

    var newBalance = parseFloat(current.balance) - parseFloat(params.amount_paid);
    var date = moment(current.next_payment_date, "YYYY-MM-DD").add(params.payment_terms, 'days').format("YYYY-MM-DD")
    params.next_payment_date = date;
    params.balance = newBalance

    current.next_payment_date = date;
    current.balance = newBalance


    var ap = await AccountPayableModel.pay(params);
    if (newBalance === 0) {
      await AccountPayableModel.markAsComplete(params.transaction_id, params.admin_id)
    }
    var cashJournal = JSON.parse(JSON.stringify(params));

    cashJournal.reference_id = current.transaction_id;
    cashJournal.total = params.amount_paid;
    cashJournal.display_id = params.display_id;
    cashJournal.details = current;
    cashJournal.type_id = TransType.ACCOUNTS_PAYABLE;
    cashJournal.flow_type_id = FlowType.OUTFLOW
    await CashJournalModel.create(cashJournal)
    return ap
  },

  delete: async (params) => {
    await CashJournalModel.permanentDeleteByRefId(params.transaction_id)
    await AccountPayableModel.delete(params)
  },
}

export {
  accountPayableService
}
