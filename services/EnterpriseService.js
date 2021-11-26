import Errors from "../classes/Errors"
import enterpriseModel from "../models/enterprise.model"

const enterpriseService = {
    addEnterprise: async (props) => {
        const { email } = props

        if (!email) {
            throw new Errors.UNKNOWN()
        }

        await enterpriseModel.addUser(props)

    },
    getAll: async () => {
        return await enterpriseModel.getAll()

    }

}

export default enterpriseService