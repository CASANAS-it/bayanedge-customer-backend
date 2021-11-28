import Errors from "../classes/Errors"
import jsonwebtoken from 'jsonwebtoken'
import properties from "../properties"
import userModel from "../models/UserModel"
import clientUserModel from '../models/ClientUserModel'
import { enterpriseService } from './EnterpriseService'
import { assetService } from "./AssetService"
import { liabilityService } from "./LiabilityService"
import { revenueService } from "./RevenueService"
import { expenseService } from "./ExpenseService"
import { equityService } from "./EquityService"
import { customerService } from "./CustomerService"
import { vendorService } from "./VendorService"
import { inventoryService } from "./InventoryService"


const userService = {
    login: async (props) => {
        const { login_id, password } = props

        if (!login_id || !password) {
            throw new Errors.UNKNOWN()
        }

        const user = await userModel.getByLoginIdAndPassword(login_id, password)
        if (!user) {
            throw new Errors.INVALID_LOGIN()
        }

        var client_user = await clientUserModel.getByUserId(user.id)
        if (client_user) {
            user.client_id = client_user.client_id
        }
        const token = jsonwebtoken.sign(user, properties.tokenSecret, {
            expiresIn: 10800 // 3 hours
        })
        user.token = token
        return user
    },
    getSummary: async (props) => {

        const { admin_id, client_id } = props
        var summary = {
            hasEnterpriseProfile: false,
            hasAsset: false,
            hasLiability: false,
            hasRevenue: false,
            hasExpense: false,
            hasEquity: false,
            hasCustomer: false,
            hasVendor: false,
            hasItem: false
        }

        summary.hasEnterpriseProfile = await enterpriseService.hasEnterpriseByClient(client_id)
        summary.hasAsset = await assetService.hasAssetByClient(client_id)
        summary.hasLiability = await liabilityService.hasLiabilityByClient(client_id)
        summary.hasRevenue = await revenueService.hasRevenueByClient(client_id)
        summary.hasExpense = await expenseService.hasExpenseByClient(client_id)
        summary.hasEquity = await equityService.hasEquityByClient(client_id)
        summary.hasCustomer = await customerService.hasCustomerByClient(client_id)
        summary.hasVendor = await vendorService.hasVendorByClient(client_id)
        summary.hasItem = await inventoryService.hasInventoryByClient(client_id)
        return summary
    },
    forgotPassword: async (props) => {
        const { email } = props

        if (!email) {
            throw new Errors.UNKNOWN()
        }

        const user = await userModel.getUserByEmail({ email })

        if (!user) {
            throw new Errors.NO_RECORDS_FOUND()
        }

        const token = jsonwebtoken.sign(user, properties.tokenSecret, {
            expiresIn: 10800 // 3 hours
        })
        return token
    },
    addAccount: async (props) => {
        const { email } = props

        if (!email) {
            throw new Errors.UNKNOWN()
        }

        await userModel.addUser(props)

    },
    getAll: async () => {
        return await userModel.getAll()

    }

}

export default userService