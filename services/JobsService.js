import CashJournalModel from '../models/CashJournalModel';
import JobsModel from '../models/JobsModel'
import LoansRepaymentModel from '../models/LoansRepaymentModel';
import { generateId } from '../utils/Crypto'
import moment from 'moment'
import InventoryModel from '../models/InventoryModel';
import { inventoryService } from './InventoryService';

const jobsService = {
  run: async () => {
    // loans repayment
    var jobId = generateId();
    await JobsModel.createJob(jobId, "Loans Repayment Posting")
    var data = await CashJournalModel.getAllNonPosted(date);
    var date = moment().format("YYYY-MM-DD")
    for (let index = 0; index < data.length; index++) {
      const element = data[index];
      await CashJournalModel.markAsPosted(element)
    }
    await JobsModel.updateJob(jobId)
  },
  cleanUpInventory: async (client_id, item_id) => {
    var inventories = await InventoryModel.getAllByClientId(client_id)
    // var inventories = await InventoryModel.getByItemId(item_id)
    for (let index = 0; index < inventories.length; index++) {
      const element = inventories[index];
      // const element = inventories
      var beginningQuantity = parseFloat(element.beginning_quantity)
      var details = await inventoryService.getSalesPurchaseById(client_id, element.item_id)
      for (let i = 0; i < details.length; i++) {
        const detail = details[i];
        // console.log(beginningQuantity + " = " + detail.data.quantity)
        if (detail.type == "Sell") {
          beginningQuantity -= parseFloat(detail.data.quantity)
        } else {
          beginningQuantity += parseFloat(detail.data.quantity)
        }
      }
      await InventoryModel.updateQuantity({ item_id: element.item_id, quantity: beginningQuantity })


      console.log(element.name + " : " + element.beginning_quantity + " : " + beginningQuantity, '-------------')
    }

  }
}

export default {
  ...jobsService
}
