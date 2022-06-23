
import mongoose from 'mongoose'
import Database from '../classes/Database'
import SuccessMessages from '../classes/SuccessMessages'
import { generateId } from '../utils/Crypto'

const customModel = {
  init () {
    const db = Database.getConnection()
    const jobsSchema = new mongoose.Schema({
      id: {
        type: 'String',
        required: true
      },
      job_id: {
        type: 'String'
      },
      status: {
        type: 'String'
      },
      description: {
        type: 'String'
      },
      created_date: {
        type: 'Date'
      },
      is_active: {
        type: 'Boolean'
      },
      is_default: {
        type: 'Boolean'
      },
      modified_by: {
        type: 'String'
      },
      modified_date: {
        type: 'Date'
      },
    })

    customModel.setModel(db.connection.model('job', jobsSchema))

    return jobsSchema
  },

  setModel: model => {
    customModel.model = model
  },

  getModel: () => {
    return customModel.model
  },

  getAllUnProcessedJob: async () => {
    return await customModel.getModel().find({ status: SuccessMessages.PROCESSING.message, is_active: true }).lean()
  },

  getJob: async (jobId) => {
    return await customModel.getModel().findOne({ job_id: jobId, is_active: true })
  },

  updateJob: async (jobId) => {
    const job = await customModel.getJob(jobId)

    job.status = SuccessMessages.SUCCESS.message

    await job.save()

    return job.transaction_id
  },

  createJob: async (jobId, description) => {
    const job = new customModel.model({
      id: generateId(),
      description : description,
      status: SuccessMessages.PROCESSING.message,
      job_id: jobId,
      is_active: true,
      created_by: '',
      created_date: new Date(),
      modified_by: '',
      modified_date: new Date()
    })

    await job.save()
  }

}

export default {
  ...customModel
}
