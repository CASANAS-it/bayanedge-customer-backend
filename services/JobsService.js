import CashJournalModel from '../models/CashJournalModel';
import JobsModel from '../models/JobsModel'
import LoansRepaymentModel from '../models/LoansRepaymentModel';
import { generateId } from '../utils/Crypto'
import moment from 'moment'

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
  }
}

export default {
  ...jobsService
}
