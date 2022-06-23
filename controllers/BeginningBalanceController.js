
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
import { TransType, UserType } from '../classes/Constants'
import { getPagination, getPagingData } from '../utils/CommonUtil'
import { beginningBalanceService } from '../services/BeginningBalanceService'
import { loansPayableService } from '../services/LoansPayableService'
import { cashJournalService } from '../services/CashJournalService'

const customControllers = {
    init: router => {
        const baseUrl = `${Properties.api}/beginning_balance`
        router.post(baseUrl + '/get', authorize(), customControllers.get)
        router.post(baseUrl + '/all', authorize(), customControllers.getAll)
        router.post(baseUrl + '/save', authorize(), customControllers.save)
        router.post(baseUrl + '/', authorize(), customControllers.getById)
        router.post(baseUrl + '/pay', authorize(), customControllers.pay)
        router.post(baseUrl + '/types', authorize(), customControllers.setup)
        router.post(baseUrl + '/delete', authorize(), customControllers.delete)
        router.post(baseUrl + '/microsavings', authorize(), customControllers.getBeginningMicroItems)

        router.post(baseUrl + '/get_inventory_total', authorize(), customControllers.getInventoryTotal)

    },
    getBeginningMicroItems: async (req, res) => {
        try {

            const { pageIndex, pageSize, client_id } = req.body;

            var total = await cashJournalService.getSummaryByType(client_id, TransType.MICROSAVINGS)
            var beginning;
            if (pageIndex == 0)
                beginning = await beginningBalanceService.getByTypeId(client_id, TransType.MICROSAVINGS)

            const { limit, offset } = getPagination(pageIndex, pageSize);
            loansPayableService.getAllMicrosavingsItems(limit, offset, client_id).then(data => {
                const response = getPagingData(data, pageIndex, limit);
                response.total = total
                if (beginning) {
                    beginning.is_beginning = true
                    response.rows.unshift(beginning)
                }

                res.send(
                    new CommonMessage({
                        data: response
                    })
                )
            }).catch(ex => { })

        } catch (err) {
            const safeErr = ErrorManager.getSafeError(err)
            res.status(safeErr.status).json(safeErr)
        }
    },


    get: async (req, res) => {
        try {

            const { pageIndex, pageSize, client_id } = req.body;

            const { limit, offset } = getPagination(pageIndex, pageSize);
            beginningBalanceService.getAll(limit, offset, client_id).then(data => {
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


    getAll: async (req, res) => {
        try {
            const { client_id } = req.body;
            res.send(
                new CommonMessage({
                    data: await beginningBalanceService.getAllByClientId(client_id)
                })
            )

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
                    data: await beginningBalanceService.getById(id)
                })
            )
        } catch (err) {
            const safeErr = ErrorManager.getSafeError(err)
            res.status(safeErr.status).json(safeErr)
        }
    },

    getByTypeId: async (req, res) => {
        try {

            const { client_id, id } = req.body;
            res.send(
                new CommonMessage({
                    data: await beginningBalanceService.getByTypeId(client_id, id)
                })
            )
        } catch (err) {
            const safeErr = ErrorManager.getSafeError(err)
            res.status(safeErr.status).json(safeErr)
        }
    },

    getInventoryTotal: async (req, res) => {
        try {

            const { client_id, id } = req.body;
            res.send(
                new CommonMessage({
                    data: await beginningBalanceService.getInventoryTotal(client_id)
                })
            )
        } catch (err) {
            const safeErr = ErrorManager.getSafeError(err)
            res.status(safeErr.status).json(safeErr)
        }
    },
    save: async (req, res) => {
        try {

            var data;
            if (!req.body.transaction_id) {
                data = await beginningBalanceService.create(req.body)
            } else {
                data = await beginningBalanceService.update(req.body)
            }
            res.send(
                new CommonMessage({
                    data: data
                })
            )
        } catch (err) {
            const safeErr = ErrorManager.getSafeError(err)
            res.status(safeErr.status).json(safeErr)
        }
    },
    delete: async (req, res) => {
        try {
            var data = await beginningBalanceService.delete(req.body.id)

            res.send(
                new CommonMessage({
                    data: data
                })
            )
        } catch (err) {
            const safeErr = ErrorManager.getSafeError(err)
            res.status(safeErr.status).json(safeErr)
        }
    },
    pay: async (req, res) => {
        try {
            var data = await beginningBalanceService.pay(req.body)

            res.send(
                new CommonMessage({
                    data: data
                })
            )
        } catch (err) {
            const safeErr = ErrorManager.getSafeError(err)
            res.status(safeErr.status).json(safeErr)
        }
    },
    setup: async (req, res) => {
        try {
            var data = await beginningBalanceService.getAvailableBeginningBalance(req.body)
            res.send(
                new CommonMessage({
                    data: data
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
