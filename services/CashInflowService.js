import { FlowType, TransType } from '../classes/Constants'
import Errors from '../classes/Errors'
import SafeError from '../classes/SafeError'
import BeginningBalanceModel from '../models/BeginningBalanceModel'
import CashJournalModel from '../models/CashJournalModel'
import { padZeroes } from '../utils/CommonUtil'

const cashInflowService = {
  getAll: async (limit, offset, client_id) => {
    return await CashJournalModel.getPaginatedItems(limit, offset, client_id, FlowType.INFLOW)
  },
  getById: async (id) => {
    var cashInflow = await CashJournalModel.getById(id)
    if (!cashInflow) {
      throw new Errors.NO_RECORDS_FOUND()
    }
    return cashInflow
  },
  update: async (params) => {
    var previous = await CashJournalModel.getById(params.transaction_id)
    var transaction = JSON.parse(JSON.stringify(params));
    transaction.details = params;
    transaction.flow_type_id = FlowType.INFLOW
    if (previous.type_id == TransType.MICROSAVINGS) {
      var msBeginning = await BeginningBalanceModel.getByClientIdTypeId(previous.client_id, TransType.MICROSAVINGS)
      if (msBeginning) {
        if (msBeginning.total > params.total) {
          throw new SafeError({
            status: 200,
            code: 209,
            message: "Insufficient Cash Balance",
            name: "Ledger"
          })
        }
        msBeginning.total = parseFloat(msBeginning.total) + parseFloat(previous.total) - parseFloat(transaction.total);
        await BeginningBalanceModel.update(msBeginning)
      }
    }
    var updated = await CashJournalModel.update(transaction)
    return updated
  },
  delete: async (params) => {
    var previous = await CashJournalModel.getById(params.id)
    if (previous.type_id == TransType.MICROSAVINGS) {
      var msBeginning = await BeginningBalanceModel.getByClientIdTypeId(previous.client_id, TransType.MICROSAVINGS)
      if (msBeginning) {
        msBeginning.total = parseFloat(msBeginning.total) + parseFloat(previous.total);
        await BeginningBalanceModel.update(msBeginning)
      }
    }
    var deleted = await CashJournalModel.delete(params)
    return deleted
  },
  create: async (params) => {
    var initial;
    switch (params.type_id) {
      case "Microsavings":
        initial = "MW"
        break;
      case "Other Cash Income":
        initial = "OC"
      default:
        break;
    }



    var displayId = initial + "000001";
    var lastDisplay = await CashJournalModel.getLastDisplayId(params.client_id, params.type_id, FlowType.INFLOW)

    if (lastDisplay) {
      var disId = lastDisplay.display_id
      disId = parseInt(disId.substring(2)) + 1;
      displayId = initial + padZeroes(disId)
    }

    var transaction = JSON.parse(JSON.stringify(params));;
    transaction.details = params;
    transaction.flow_type_id = FlowType.INFLOW
    transaction.display_id = displayId;
    if (params.type_id == TransType.MICROSAVINGS) {
      var msBeginning = await BeginningBalanceModel.getByClientIdTypeId(params.client_id, TransType.MICROSAVINGS)
      if (msBeginning) {

        if (msBeginning.total < params.total) {
          throw new SafeError({
            status: 200,
            code: 209,
            message: "Insufficient Cash Balance",
            name: "Ledger"
          })
        }


        msBeginning.total = parseFloat(msBeginning.total) - parseFloat(params.total);
        await BeginningBalanceModel.update(msBeginning)
      }
    }
    var created = await CashJournalModel.create(transaction)

    return created
  }
}

export {
  cashInflowService
}
