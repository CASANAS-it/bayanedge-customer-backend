import { FlowType, TransType } from '../classes/Constants'
import Errors from '../classes/Errors'
import CashJournalModel from '../models/CashJournalModel'
import { padZeroes } from '../utils/CommonUtil'

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
    var transaction = JSON.parse(JSON.stringify(params));;
    transaction.details = params;
    transaction.flow_type_id = FlowType.OUTFLOW
    return await CashJournalModel.update(transaction)
  },
  delete: async (params) => {
    return await CashJournalModel.delete(params)
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


    var transaction = JSON.parse(JSON.stringify(params));;
    transaction.details = params;
    transaction.display_id = displayId
    transaction.flow_type_id = FlowType.OUTFLOW
    return await CashJournalModel.create(transaction)
  }
}

export {
  cashOutflowService
}
