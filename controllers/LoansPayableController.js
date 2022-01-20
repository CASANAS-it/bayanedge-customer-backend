
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
import { loansPayableService } from '../services/LoansPayableService'

const customControllers = {
    init: router => {
        const baseUrl = `${Properties.api}/loans_payable`
        router.post(baseUrl + '/get', authorize(), customControllers.get)
        // router.post(baseUrl + '/item/get', authorize(), customControllers.getItems)
        router.post(baseUrl + '/save', authorize(), customControllers.save)
        router.post(baseUrl + '/', authorize(), customControllers.getById)
        router.post(baseUrl + '/pay', authorize(), customControllers.pay)
        router.post(baseUrl + '/beginning_pay', authorize(), customControllers.beginningPay)
        router.post(baseUrl + '/delete', authorize(), customControllers.delete)
    },


    get: async (req, res) => {
        try {

            const { pageIndex, pageSize, client_id } = req.body;

            const { limit, offset } = getPagination(pageIndex, pageSize);
            loansPayableService.getAll(limit, offset, client_id).then(data => {
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
}

export default {
    ...customControllers
}
