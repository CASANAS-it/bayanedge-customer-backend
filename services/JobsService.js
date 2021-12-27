import JobsModel from '../models/JobsModel'
import LoansRepaymentModel from '../models/LoansRepaymentModel';
import { generateId } from '../utils/Crypto'

const jobsService = {
  run: async () => {
    // loans repayment
    var jobId = generateId();
    await JobsModel.createJob(jobId, "Loans Repayment Posting")
    var data = await LoansRepaymentModel.getAllNonPosted(date);
    var date = moment().format("YYYY-MM-DD")
    for (let index = 0; index < data.length; index++) {
      const element = data[index];
      await LoansRepaymentModel.markAsPosted(element)
      var cashJournal = JSON.parse(JSON.stringify(element));

      cashJournal.reference_id = element.transaction_id;
      cashJournal.total = element.total;
      cashJournal.display_id = element.display_id;
      cashJournal.details = element;
      cashJournal.type_id = TransType.LOANS_PROCEED;
      cashJournal.flow_type_id = FlowType.OUTFLOW
      await CashJournalModel.create(cashJournal)
    }
    await JobsModel.updateJob(jobId)
  }
}

export default {
  ...jobsService
}
