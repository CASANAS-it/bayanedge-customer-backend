
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
import { assetService } from '../services/AssetService'
import { UserType } from '../classes/Constants'
import { getPagination, getPagingData } from '../utils/CommonUtil'

const customControllers = {
    init: router => {
        const baseUrl = `${Properties.api}/asset`
        router.post(baseUrl + '/get', authorize(), customControllers.get)
        router.post(baseUrl + '/save', authorize(), customControllers.save)
        router.post(baseUrl + '/', customControllers.getById)
        router.post(baseUrl + '/delete', customControllers.delete)
    },


    get: async (req, res) => {
        try {

            const { pageNo, pageSize } = req.body;

            const { limit, offset } = getPagination(pageNo, pageSize);
            assetService.getAll(limit, offset).then(data => {
                const response = getPagingData(data, pageNo, limit);
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
                    data: await assetService.getById(id)
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
            if (!req.body.id) {
                data = await assetService.create(req.body)
            } else {
                data = await assetService.update(req.body)
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
            var data = await assetService.delete(req.body)

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
