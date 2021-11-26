import Errors from "../classes/Errors"
import jsonwebtoken from 'jsonwebtoken'
import properties from "../properties"
import userModel from "../models/UserModel"

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
        const token = jsonwebtoken.sign(user, properties.tokenSecret, {
            expiresIn: 10800 // 3 hours
        })
        user.token = token
        return user
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