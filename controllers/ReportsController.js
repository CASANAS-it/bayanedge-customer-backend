
// Properties
import Properties from '../properties'

// Database
import UserModel from '../models/UserModel'

// Security
import { authorize } from '../security/SecurityManager'

import CommonMessage from '../classes/CommonMessage'
// Errors
import Errors from '../classes/Errors'
import ErrorManager from '../classes/ErrorManager'
import { salesService } from '../services/SalesService'
import { UserType } from '../classes/Constants'
import { getPagination, getPagingData } from '../utils/CommonUtil'
import { reportService } from '../services/TransactionService'

const customControllers = {
    init: router => {
        const baseUrl = `${Properties.api}/reports`
        router.post(baseUrl + '/income_statement', authorize(), customControllers.incomeStatement)
        router.post(baseUrl + '/cash_flow_statement', authorize(), customControllers.cashFlowStatement)
    },


    incomeStatement: async (req, res) => {
        try {

            reportService.getIncomeStatement(req.body).then(data => {
                res.send(
                    new CommonMessage({
                        data: data
                    })
                )
            })

        } catch (err) {
            const safeErr = ErrorManager.getSafeError(err)
            res.status(safeErr.status).json(safeErr)
        }
    },
    cashFlowStatement: async (req, res) => {
        try {

            reportService.getCashFlowStatement(req.body).then(data => {
                res.send(
                    new CommonMessage({
                        data: data
                    })
                )
            })

        } catch (err) {
            const safeErr = ErrorManager.getSafeError(err)
            res.status(safeErr.status).json(safeErr)
        }
    },
}

export default {
    ...customControllers
}
