import moment from 'moment'
import { FlowType, TransType } from '../classes/Constants'
import Errors from '../classes/Errors'
import AccountReceivableModel from '../models/AccountReceivableModel'
import CashJournalModel from '../models/CashJournalModel'
import { generateId } from '../utils/Crypto'
import { beginningBalanceService } from './BeginningBalanceService'

const accountReceivableService = {
  getAll: async (limit, offset, client_id) => {
    return await AccountReceivableModel.getPaginatedItems(limit, offset, client_id)
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
    
    var revertInventory = await InventoryModel.addQuantity({ admin_id: params.admin_id, item_id: oldData.item_id, quantity: oldData.quantity })
    var inventor = await InventoryModel.subtractQuantity({ admin_id: params.admin_id, item_id: params.item_id, quantity: params.quantity })

    var date = moment(params.date, "YYYY-MM-DD").add(params.payment_terms, 'days').format("YYYY-MM-DD")
    params.next_payment_date = date;
    return await AccountReceivableModel.update(params)
  },
  create: async (params) => {

    var hasBeginining = await beginningBalanceService.hasDataByClient({ client_id: params.client_id, type_id: TransType.ACCOUNTS_RECEIVABLE })

    if (!hasBeginining) {
      throw new Errors.NO_BEGINNING_BALANCE()
    }

    var date = moment(params.date, "YYYY-MM-DD").add(params.payment_terms, 'days').format("YYYY-MM-DD")
    params.next_payment_date = date;
    var ap = await AccountReceivableModel.create(params);
    var inventor = await InventoryModel.subtractQuantity({ admin_id: params.admin_id, item_id: params.item_id, quantity: params.quantity })

    return ap
  },

  pay: async (params) => {
    var current = await AccountReceivableModel.getById(params.transaction_id)

    var newBalance = parseFloat(current.balance) - parseFloat(params.amount_paid);
    var date = moment(current.next_payment_date, "YYYY-MM-DD").add(params.payment_terms, 'days').format("YYYY-MM-DD")
    params.next_payment_date = date;
    params.balance = newBalance

    current.next_payment_date = date;
    current.balance = newBalance


    var ap = await AccountReceivableModel.pay(params);
    if (newBalance === 0) {
      await AccountReceivableModel.markAsComplete(params.transaction_id, params.admin_id)
    }
    var cashJournal = JSON.parse(JSON.stringify(params));

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
    await CashJournalModel.permanentDeleteByRefId(params.id)
    return await AccountReceivableModel.delete(params)
  },
}

export {
  accountReceivableService
}
