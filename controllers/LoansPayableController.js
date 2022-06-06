
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
import { loansPayableService } from '../services/LoansPayableService'
import { beginningBalanceService } from '../services/BeginningBalanceService'

const customControllers = {
    init: router => {
        const baseUrl = `${Properties.api}/loans_payable`
        router.post(baseUrl + '/get', authorize(), customControllers.get)
        // router.post(baseUrl + '/item/get', authorize(), customControllers.getItems)
        router.post(baseUrl + '/save', authorize(), customControllers.save)
        router.post(baseUrl + '/', authorize(), customControllers.getById)
        router.post(baseUrl + '/pay', authorize(), customControllers.pay)
        router.post(baseUrl + '/beginning_pay', authorize(), customControllers.beginningPay)
        router.post(baseUrl + '/beginning_pay_edit', authorize(), customControllers.beginningPayEdit)
        router.post(baseUrl + '/beginning_pay_delete', authorize(), customControllers.beginningPayDelete)
        router.post(baseUrl + '/delete', authorize(), customControllers.delete)
        router.post(baseUrl + '/summary', authorize(), customControllers.getSummary)
        router.post(baseUrl + '/pay_edit', authorize(), customControllers.payEdit)
        router.post(baseUrl + '/pay_delete', authorize(), customControllers.deletePay)
    },

    getSummary: async (req, res) => {
        try {

            const { client_id } = req.body;
            res.send(
                new CommonMessage({
                    data: await loansPayableService.getSummary(client_id)
                })
            )
        } catch (err) {
            const safeErr = ErrorManager.getSafeError(err)
            res.status(safeErr.status).json(safeErr)
        }
    },


    get: async (req, res) => {
        try {

            const { pageIndex, pageSize, client_id } = req.body;

            const { limit, offset } = getPagination(pageIndex, pageSize);
            var beginning;
            if (pageIndex == 0)
                beginning = await beginningBalanceService.getByTypeId(client_id, TransType.LOANS_PAYABLE)
            loansPayableService.getAll(limit, offset, client_id).then(data => {
                const response = getPagingData(data, pageIndex, limit);
                if (beginning) {
                    beginning.is_beginning = true
                    response.rows.push(beginning)
                }
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

    getItems: async (req, res) => {
        try {

            const { pageIndex, pageSize, client_id } = req.body;

            const { limit, offset } = getPagination(pageIndex, pageSize);
            loansPayableService.getAllItems(limit, offset, client_id).then(data => {
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
                    data: await loansPayableService.getById(id)
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
                data = await loansPayableService.create(req.body)
            } else {
                data = await loansPayableService.update(req.body)
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
            await loansPayableService.delete(req.body)

            res.send(new CommonMessage({}))
        } catch (err) {
            const safeErr = ErrorManager.getSafeError(err)
            res.status(safeErr.status).json(safeErr)
        }
    },
    pay: async (req, res) => {
        try {
            var data = await loansPayableService.pay(req.body)

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

    deletePay: async (req, res) => {
        try {
            var data = await loansPayableService.deletePay(req.body)

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
    payEdit: async (req, res) => {
        try {
            var data = await loansPayableService.payEdit(req.body)

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
    beginningPay: async (req, res) => {
        try {
            var data = await loansPayableService.beginningPay(req.body)

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
    beginningPayEdit: async (req, res) => {
        try {
            var data = await loansPayableService.payBeginningEdit(req.body)

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
    beginningPayDelete: async (req, res) => {
        try {
            var data = await loansPayableService.beginningPay(req.body)

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
