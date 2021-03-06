
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
import { inventoryService } from '../services/InventoryService'
import { UserType } from '../classes/Constants'
import { getPagination, getPagingData } from '../utils/CommonUtil'
import JobsService from '../services/JobsService'
import csv from 'csvtojson'
import fs from 'fs'
import { Readable } from 'stream'


const customControllers = {
    init: router => {
        const baseUrl = `${Properties.api}/inventory`
        router.post(baseUrl + '/get', authorize(), customControllers.get)
        router.post(baseUrl + '/history', authorize(), customControllers.getDetailsById)
        router.post(baseUrl + '/save', authorize(), customControllers.save)
        router.post(baseUrl + '/', authorize(), customControllers.getById)
        router.post(baseUrl + '/delete', authorize(), customControllers.delete)
        router.post(baseUrl + '/upload', authorize(), customControllers.upload)
    },


    upload: async (req, res) => {
        try {

            const { pageIndex, pageSize, client_id, search, admin_id } = req.body;

            var stream = Readable.from(req.files.file.data.toString())
            var payload = await csv().fromStream(stream)

            var data = await inventoryService.uploadFile(admin_id, client_id, payload)
            res.send(
                new CommonMessage({
                    data: data,
                })
            )
            // })

        } catch (err) {
            const safeErr = ErrorManager.getSafeError(err)
            res.status(safeErr.status).json(safeErr)
        }
    },
    get: async (req, res) => {
        try {

            const { pageIndex, pageSize, client_id, search } = req.body;

            var total = await inventoryService.getSummary(client_id)
            const { limit, offset } = getPagination(pageIndex, pageSize);
            inventoryService.getAll(limit, offset, client_id, search).then(data => {
                const response = getPagingData(data, pageIndex, limit);
                response.total = total
                res.send(
                    new CommonMessage({
                        data: response,
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

            const { id, client_id } = req.body;
            await inventoryService.getSalesPurchaseById(client_id, id)
            res.send(
                new CommonMessage({
                    data: await inventoryService.getById(id)
                })
            )
        } catch (err) {
            const safeErr = ErrorManager.getSafeError(err)
            res.status(safeErr.status).json(safeErr)
        }
    },
    getDetailsById: async (req, res) => {
        try {

            const { id, client_id } = req.body;
            // JobsService.cleanUpInventory(client_id,id)
            res.send(
                new CommonMessage({
                    data: await inventoryService.getSalesPurchaseById(client_id, id)
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
            if (!req.body.item_id) {
                data = await inventoryService.create(req.body)
            } else {
                data = await inventoryService.update(req.body)
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
            var data = await inventoryService.delete(req.body)

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
