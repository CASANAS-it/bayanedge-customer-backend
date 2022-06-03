
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

const customControllers = {
    init: router => {
        const baseUrl = `${Properties.api}/sales`
        router.post(baseUrl + '/get', authorize(), customControllers.get)
        router.post(baseUrl + '/save', authorize(), customControllers.save)
        router.post(baseUrl + '/', authorize(), customControllers.getById)
        router.post(baseUrl + '/delete', authorize(), customControllers.delete)
        router.post(baseUrl + '/summary', authorize(), customControllers.getSummary)
    },
    getSummary: async (req, res) => {
        try {

            const { client_id } = req.body;

            res.send(
                new CommonMessage({
                    data: await salesService.getSummary(client_id)
                })
            )

        } catch (err) {
            const safeErr = ErrorManager.getSafeError(err)
            res.status(safeErr.status).json(safeErr)
        }
    },

    get: async (req, res) => {
        try {

            const { pageIndex, pageSize, client_id, filter } = req.body;

            const { limit, offset } = getPagination(pageIndex, pageSize);
            const total = await salesService.getAllTotal(client_id, filter)
            salesService.getAll(limit, offset, client_id, filter).then(data => {
                const response = getPagingData(data, pageIndex, limit);
                response.subTotal = total.length > 0 ? total[0].sum : 0
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
                    data: await salesService.getById(id)
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
                data = await salesService.create(req.body)
            } else {
                data = await salesService.update(req.body)
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
            var data = await salesService.delete(req.body)

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
