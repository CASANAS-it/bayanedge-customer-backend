
const dotenv = require('dotenv')
dotenv.config()

module.exports = {
  butler_db_dbUrl: (process.env.DB_HOST || '114.198.129.250:27017/bayan_edge_db_training'),
  butler_db_string: "mongodb://moneyflowAdmin:*m0n3y_flow001!DB@114.198.129.250:27017/bayan_edge_db_training?readPreference=primary&directConnection=true&ssl=false",
  publicPath: '../client/build',
  port: process.env.NODE_PORT || 9110,
  tokenSecret: 'B@y@an3Dge!!M()n3yFl()w',
  api: process.env.NODE_API != null ? process.env.NODE_API : '/api',
 
  transporter: {
    host: 'smtp.gmail.com',
    port: '587',
    username: 'moneyflow.agents@gmail.com',
    password: 'ozqimtpufurjpycl'
  },  
  // hostName : "https://casanas.io/moneyflow/agent/"
  hostName : "https://moneyflow.com.ph/"
  
}
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
