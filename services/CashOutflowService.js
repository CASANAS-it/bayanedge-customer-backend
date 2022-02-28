import { FlowType, TransType } from '../classes/Constants'
import Errors from '../classes/Errors'
import SafeError from '../classes/SafeError'
import BeginningBalanceModel from '../models/BeginningBalanceModel'
import CashJournalModel from '../models/CashJournalModel'
import { padZeroes } from '../utils/CommonUtil'
import { cashJournalService } from './CashJournalService'

const cashOutflowService = {
  getAll: async (limit, offset, client_id) => {
    return await CashJournalModel.getPaginatedItems(limit, offset, client_id, FlowType.OUTFLOW)
  },
  getById: async (id) => {
    var cashOutflow = await CashJournalModel.getById(id)
    if (!cashOutflow) {
      throw new Errors.NO_RECORDS_FOUND()
    }
    return cashOutflow
  },
  update: async (params) => {
    var previous = await CashJournalModel.getById(params.transaction_id)

    if (params.type_id == TransType.NON_FINANCIAL_CHARGES) {
      params.total = parseFloat(params.details.non_financial_charges) + parseFloat(params.details.interest_fixed_amount)
    }
    var transaction = JSON.parse(JSON.stringify(params));;
    transaction.details = params;
    transaction.flow_type_id = FlowType.OUTFLOW
    if (previous.type_id == TransType.MICROSAVINGS) {
      var msBeginning = await BeginningBalanceModel.getByClientIdTypeId(previous.client_id, TransType.MICROSAVINGS)
      if (msBeginning) {
        msBeginning.total = parseFloat(msBeginning.total) - parseFloat(previous.total) + parseFloat(transaction.total);
        await BeginningBalanceModel.update(msBeginning)
      }
    } else {
      var summary = await cashJournalService.getSummary(params)

      if (summary) {
        if (transaction.total > summary.total) {
          throw new SafeError({
            status: 200,
            code: 209,
            message: "Insufficient Cash Balance",
            name: "Ledger"
          })
        }
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
        msBeginning.total = parseFloat(msBeginning.total) - parseFloat(previous.total);
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
        initial = "MD"
        break;
      case "Operating Expense":
        initial = "OX"
        break;
      case "Drawings":
        initial = "DW"
        break;
      case "Non-financial Charges":
        initial = "NF"
        break;
      default:
        break;
    }

    var displayId = initial + "000001";
    var lastDisplay = await CashJournalModel.getLastDisplayId(params.client_id, params.type_id, FlowType.OUTFLOW)

    if (lastDisplay) {
      var disId = lastDisplay.display_id
      disId = parseInt(disId.substring(2)) + 1;
      displayId = initial + padZeroes(disId)
    }


    if (params.type_id == TransType.NON_FINANCIAL_CHARGES) {
      params.total = parseFloat(params.details.non_financial_charges) + parseFloat(params.details.interest_fixed_amount)
    }
    var transaction = JSON.parse(JSON.stringify(params));;
    transaction.details = params;
    transaction.display_id = displayId
    transaction.flow_type_id = FlowType.OUTFLOW

    if (params.type_id == TransType.MICROSAVINGS) {
      var msBeginning = await BeginningBalanceModel.getByClientIdTypeId(params.client_id, TransType.MICROSAVINGS)
      if (msBeginning) {

        msBeginning.total = parseFloat(msBeginning.total) + parseFloat(params.total);
        await BeginningBalanceModel.update(msBeginning)
      }
    } else {
      var summary = await cashJournalService.getSummary(params)

      if (summary) {
        if (params.total > summary.total) {
          throw new SafeError({
            status: 200,
            code: 209,
            message: "Insufficient Cash Balance",
            name: "Ledger"
          })
        }
      }

    }
    var created = await CashJournalModel.create(transaction)
    return created

  }
}

export {
  cashOutflowService
}
