
const dotenv = require('dotenv')
dotenv.config()

module.exports = {
  butler_db_dbUrl: (process.env.DB_HOST || 'localhost:27018/bayan_edge_db'),
  publicPath: '../client/build',
  port: process.env.NODE_PORT || 3002,
  tokenSecret: 'B@y@an3Dge!!M()n3yFl()w',
  api: process.env.NODE_API != null ? process.env.NODE_API : '/api'
}
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
