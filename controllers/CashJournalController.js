
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
import { UserType } from '../classes/Constants'
import { getPagination, getPagingData } from '../utils/CommonUtil'
import { cashJournalService } from '../services/CashJournalService'

const customControllers = {
    init: router => {
        const baseUrl = `${Properties.api}/cash_journal`
        router.post(baseUrl + '/get', authorize(), customControllers.get)
        router.post(baseUrl + '/', authorize(), customControllers.getById)
        router.post(baseUrl + '/summary', authorize(), customControllers.getSummary)
        // router.post(baseUrl + '/delete', authorize(), customControllers.delete)
    },


    get: async (req, res) => {
        try {

            const { pageIndex, pageSize, client_id, type } = req.body;

            const { limit, offset } = getPagination(pageIndex, pageSize);
            cashJournalService.getAll(limit, offset, client_id, type).then(data => {
                const response = getPagingData(data, pageIndex, limit);
                res.send(
                    new CommonMessage({
                        data: response
                    })
                )
            })

        } catch (err) {
            const safeErr = ErrorManager.getSafeError(err)
            res.status(safeErr.status).json(safeErr)
        }
    },
    getById: async (req, res) => {
        try {

            const { id } = req.body;
            res.send(
                new CommonMessage({
                    data: await cashJournalService.getById(id)
                })
            )
        } catch (err) {
            const safeErr = ErrorManager.getSafeError(err)
            res.status(safeErr.status).json(safeErr)
        }
    },

    getSummary: async (req, res) => {
        try {
            res.send(
                new CommonMessage({
                    data: await cashJournalService.getSummary(req.body)
                })
            )
        } catch (err) {
            const safeErr = ErrorManager.getSafeError(err)
            res.status(safeErr.status).json(safeErr)
        }
    },
}

export default {
    ...customControllers
}
