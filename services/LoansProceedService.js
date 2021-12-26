import Errors from '../classes/Errors'
import VendorModel from '../models/VendorModel'
import LoansProceedModel from '../models/LoansProceedModel'
import InventoryModel from '../models/InventoryModel'
import CashJournalModel from '../models/CashJournalModel'
import { FlowType, TransactionType, TransType } from '../classes/Constants'
import AccountPayableModel from '../models/AccountPayableModel'

const loansProceedService = {
  getAll: async (limit, offset, client_id) => {
    return await LoansProceedModel.getPaginatedItems(limit, offset, client_id)
  },
  getById: async (id) => {
    var loansProceed = await LoansProceedModel.getById(id)
    if (!loansProceed) {
      throw new Errors.NO_RECORDS_FOUND()
    }
    return loansProceed
  },
  update: async (params) => {
    params.interest = parseFloat(params.total) * (1 + (parseFloat(params.interest_percentage) / 100))
    var loansProceed = await LoansProceedModel.update(params)
    await CashJournalModel.permanentDeleteByRefId(loansProceed.transaction_id)

    var transaction = JSON.parse(JSON.stringify(params));
    transaction.reference_id = loansProceed.transaction_id;
    transaction.type_id = TransType.LOANS_PROCEED;
    transaction.details = loansProceed;
    transaction.display_id = loansProceed.display_id
    transaction.flow_type_id = FlowType.INFLOW
    await CashJournalModel.create(transaction)

    return loansProceed
  },
  pay: async (params) => {
    var loansProceed = await LoansProceedModel.getById(params.transaction_id)
    var transaction = JSON.parse(JSON.stringify(loansProceed));
    transaction.reference_id = loansProceed.transaction_id;
    transaction.type_id = TransType.LOANS_PROCEED;
    transaction.details = loansProceed;
    transaction.total = loansProceed.interest
    transaction.display_id = loansProceed.display_id
    transaction.flow_type_id = FlowType.OUTFLOW
    await CashJournalModel.create(transaction)

    await LoansProceedModel.markAsPaid(params)

    return loansProceed
  },
  delete: async (params) => {
    return await LoansProceedModel.delete(params)
  },
  create: async (params) => {
    params.interest = parseFloat(params.total) * (1 + (parseFloat(params.interest_percentage) / 100))

    var loansProceed = await LoansProceedModel.create(params)

    var transaction = JSON.parse(JSON.stringify(params));
    transaction.reference_id = loansProceed.transaction_id;
    transaction.type_id = TransType.LOANS_PROCEED;
    transaction.details = loansProceed;
    transaction.display_id = loansProceed.display_id
    transaction.flow_type_id = FlowType.INFLOW
    await CashJournalModel.create(transaction)

    return loansProceed
  }
}

export {
  loansProceedService
}
