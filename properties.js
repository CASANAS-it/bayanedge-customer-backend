
const dotenv = require('dotenv')
dotenv.config()

module.exports = {
  butler_db_dbUrl: (process.env.DB_HOST || 'localhost:27017/bayan_edge_db'),
  publicPath: '../client/build',
  port: process.env.NODE_PORT || 6110,
  tokenSecret: 'B@y@an3Dge!!M()n3yFl()w',
  api: process.env.NODE_API != null ? process.env.NODE_API : '/api',
 
  transporter: {
    host: 'smtp.gmail.com',
    port: '587',
    username: 'moneyflow.agents@gmail.com',
    password: 'gdjweasqbplmrcpz'
  },
  hostName : "https://casanas.io/moneyflow/agent/"
}
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
