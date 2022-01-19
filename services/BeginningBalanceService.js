import Errors from '../classes/Errors'
import VendorModel from '../models/VendorModel'
import BeginningBalanceModel from '../models/BeginningBalanceModel'
import InventoryModel from '../models/InventoryModel'
import CashJournalModel from '../models/CashJournalModel'
import { FlowType, TransactionType, TransType } from '../classes/Constants'
import AccountPayableModel from '../models/AccountPayableModel'
import { salesService } from './SalesService'
import { accountReceivableService } from './AccountReceivableService'
import { ledgerService } from './LedgerService'
import { accountPayableService } from './AccountPayableService'
import moment from 'moment'

const beginningBalanceService = {
  getAll: async (limit, offset, client_id) => {
    return await BeginningBalanceModel.getPaginatedItems(limit, offset, client_id)
  },
  getAllByClientId: async (client_id) => {
    return await BeginningBalanceModel.getAllByClientId(client_id)
  },
  hasDataByClient: async (params) => {
    const { client_id, type_id } = params
    var items = await BeginningBalanceModel.getByClientIdTypeId(client_id, type_id)
    return items !== null ? true : false
  },
  getById: async (id) => {
    var beginningBalance = await BeginningBalanceModel.getById(id)
    if (!beginningBalance) {
      throw new Errors.NO_RECORDS_FOUND()
    }
    return beginningBalance
  },

  getByTypeId: async (clientId, typeId) => {
    var beginningBalance = await BeginningBalanceModel.getByTypeIdClientId(clientId, typeId)
    if (!beginningBalance) {
      throw new Errors.NO_RECORDS_FOUND()
    }
    return beginningBalance
  },

  update: async (params) => {
    var beginningBalance = await BeginningBalanceModel.update(params)
    await CashJournalModel.permanentDeleteByRefId(beginningBalance.transaction_id)

    if (params.flow_type_id) {
      var transaction = JSON.parse(JSON.stringify(params));
      transaction.reference_id = params.transaction_id;
      transaction.type_id = beginningBalance.type_id;
      transaction.details = params;
      transaction.display_id = beginningBalance.display_id
      transaction.flow_type_id = beginningBalance.flow_type_id
      transaction.is_beginning = true;
      await CashJournalModel.create(transaction)
    }else if (params.type_id == TransType.SALES) {

      var transaction = JSON.parse(JSON.stringify(params));
      transaction.reference_id = beginningBalance.transaction_id;
      transaction.type_id = params.type_id;
      transaction.details = beginningBalance;
      transaction.display_id = params.display_id
      transaction.flow_type_id = FlowType.INFLOW
      transaction.is_beginning = true;
      transaction.total = parseFloat(params.details.selling_price) - parseFloat(params.details.cost_of_goods_sold)
      await CashJournalModel.create(transaction)

    }

    return beginningBalance
  },
  delete: async (id) => {
    var data = await BeginningBalanceModel.getById(id)
    var hasData = await CashJournalModel.getByClientIdTypeId(data.client_id, data.type_id)
    if (hasData) {
      throw new Errors.BEGINNING_BALANCE_DELETE_ERROR_DATA()
    }

    await CashJournalModel.permanentDeleteByRefId(id)
    return await BeginningBalanceModel.delete(id)
  },
  create: async (params) => {

    if (params.type_id == TransType.ACCOUNTS_PAYABLE || params.type_id == TransType.ACCOUNTS_RECEIVABLE) {
      var date = moment(params.date, "YYYY-MM-DD").add(params.details.payment_terms, 'days').format("YYYY-MM-DD")
      params.details.next_payment_date = date;
      params.details.is_completed = false;
      params.details.balance = params.total
    } else if (params.type_id == TransType.MICROSAVINGS) {
      params.total = params.details.beginning_amount
    }

    var beginningBalance = await BeginningBalanceModel.create(params)

    if (params.flow_type_id) {
      var transaction = JSON.parse(JSON.stringify(params));
      transaction.reference_id = beginningBalance.transaction_id;
      transaction.type_id = params.type_id;
      transaction.details = beginningBalance;
      transaction.display_id = params.display_id
      transaction.flow_type_id = params.flow_type_id
      transaction.is_beginning = true;
      await CashJournalModel.create(transaction)
    } else if (params.type_id == TransType.SALES) {

      var transaction = JSON.parse(JSON.stringify(params));
      transaction.reference_id = beginningBalance.transaction_id;
      transaction.type_id = params.type_id;
      transaction.details = beginningBalance;
      transaction.display_id = params.display_id
      transaction.flow_type_id = FlowType.INFLOW
      transaction.is_beginning = true;
      transaction.total = parseFloat(params.details.selling_price) - parseFloat(params.details.cost_of_goods_sold)
      await CashJournalModel.create(transaction)

    }
    return beginningBalance
  },
  getAvailableBeginningBalance: async (props) => {
    var data = []
    const { client_id } = props
    // sales
    var hasSales = await beginningBalanceService.hasDataByClient({ client_id: client_id, type_id: TransType.SALES })
    var salesData = await salesService.hasDataByClient(client_id)
    if (!hasSales && !salesData) {
      data.push({ name: TransType.SALES, value: TransType.SALES, flow_type: FlowType.INFLOW, display_id: "SA000000" })
    }
    // accounts receivable
    var hasAr = await beginningBalanceService.hasDataByClient({ client_id: client_id, type_id: TransType.ACCOUNTS_RECEIVABLE })
    var arData = await accountReceivableService.hasDataByClient(client_id)
    if (!hasAr && !arData) {
      data.push({ name: TransType.ACCOUNTS_RECEIVABLE, value: TransType.ACCOUNTS_RECEIVABLE, flow_type: FlowType.INFLOW, display_id: "AR000000" })
    }
    // ledger
    var hasLedger = await beginningBalanceService.hasDataByClient({ client_id: client_id, type_id: TransType.LEDGER })
    var ledgerData = await ledgerService.hasDataByClient(client_id)
    if (!hasLedger && !ledgerData) {
      data.push({ name: TransType.LEDGER, value: TransType.LEDGER, flow_type: FlowType.OUTFLOW, display_id: "IN000000" })
    }
    // accounts payable
    var hasAP = await beginningBalanceService.hasDataByClient({ client_id: client_id, type_id: TransType.ACCOUNTS_PAYABLE })
    var apData = await accountPayableService.hasDataByClient(client_id)
    if (!hasAP && !apData) {
      data.push({ name: TransType.ACCOUNTS_PAYABLE, value: TransType.ACCOUNTS_PAYABLE, flow_type: FlowType.OUTFLOW, display_id: "AP000000" })
    }
    return data
  },
  getInventoryTotal: async (client_id) => {
    var items = await InventoryModel.getAllByClientId(client_id);
    var total = 0;

    items.forEach(element => {
      total += parseFloat(element.unit_cost) * parseFloat(element.beginning_quantity)
    }); 
    return total;
  }
}

export {
  beginningBalanceService
}
