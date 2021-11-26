const crypto = require('crypto')

const algorithm = 'aes-256-ctr'
const secretKey = 'vOVH6sdmpNWjRRIqCc7rdxs01lwHzfr3'
const iv = '5c5f1c01637a6b904486754c02e66713'

const generateId = (count = 16) => {
  return crypto.randomBytes(count).toString('hex')
}

const encrypt = (text) => {
  const cipher = crypto.createCipheriv(algorithm, secretKey, Buffer.from(iv, 'hex'))

  const encrypted = Buffer.concat([cipher.update(text), cipher.final()])

  return encrypted.toString('hex')
}

const decrypt = (hash) => {
  const decipher = crypto.createDecipheriv(algorithm, secretKey, Buffer.from(iv, 'hex'))

  const decrpyted = Buffer.concat([decipher.update(Buffer.from(hash, 'hex')), decipher.final()])

  return decrpyted.toString()
}

const generateMD5 = (text) => {
  return crypto.createHash('md5').update(text).digest('hex')
}

module.exports = {
  encrypt,
  decrypt,
  generateId,
  generateMD5
}
