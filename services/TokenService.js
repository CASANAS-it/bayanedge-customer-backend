import TokenModel from '../models/TokenModel'
import properties from '../properties'
import jsonwebtoken from 'jsonwebtoken'

const tokenService = {

  createToken: async (user) => {
    console.log(user,'user')
    const token = jsonwebtoken.sign(user, properties.tokenSecret, {
      expiresIn: 10800 // 3 hours
    })
    await TokenModel.create(user.id, token)
    return token
  }
}

export default tokenService
