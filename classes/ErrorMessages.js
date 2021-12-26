/**
 * Define cusom errors
 */
const ErrorMessages = Object.freeze({

  // ERROR WITH CODES
  // 100 series
  INVALID_LOGIN: { status: 200, message: 'Invalid Credentials', code: 101 },
  TRANSACTION_NOT_FOUND: { status: 200, message: 'Transaction not found', code: 102 },
  NO_RECORDS_FOUND: { status: 200, message: 'No records found', code: 103 },
  MISSING_PROPERTY: { status: 200, message: 'Missing Property {}', code: 104 },
  NO_API_DETAILS: { status: 200, message: 'No API Details', code: 105 },
  JWT_INVALID: { status: 200, message: 'Invalid Token', code: 105 },
  SENDER_IS_REQUIRED: { status: 200, message: 'Sender mobile number is required', code: 106 },
  RECEIVER_IS_REQUIRED: { status: 200, message: 'Receiver mobile number is required', code: 107 },
  REFERENCE_IS_REQUIRED: { status: 200, message: 'Reference Number is required', code: 108 },
  FIRSTNAME_IS_REQUIRED: { status: 200, message: 'First Name is required', code: 109 },
  LASTNAME_IS_REQUIRED: { status: 200, message: 'Last Name is required', code: 110 },
  SITENAME_IS_REQUIRED: { status: 200, message: 'Site Name is required', code: 111 },
  USERNAME_IS_REQUIRED: { status: 200, message: 'Account Reference is required', code: 112 },

  // 200 series
  INVALID_MERCHANT_CODE: { status: 200, message: 'Invalid merchant code', code: 201 },
  INVALID_TRANSACTION_TYPE: { status: 200, message: 'Invalid transaction type', code: 202 },
  INVALID_VOUCHER_CODE: { status: 200, message: 'Invalid voucher code', code: 203 },
  INVALID_AMOUNT: { status: 200, message: 'Invalid amount', code: 204 },
  DUPLICATE_REFERENCE: { status: 200, message: 'Duplicate reference number', code: 205 },

  // 300 series
  API_RESPONSE: { status: 200, message: '{}', code: 300 },

  // 400 series
  INVALID_AUTH_HEADER: { status: 200, message: 'Missing `authorization` header', code: 401 },

  // ERROR 400
  INVALID_BODY: { status: 400, message: 'Invalid JSON body' },
  INVALID_QUERY: { status: 400, message: 'Invalid query string' },
  JWT_EXPIRED: { status: 401, message: 'JWT is expired' },
  UNAUTHORIZED: { status: 401, message: 'Unauthorized' },
  NO_TOKEN: { status: 403, message: 'No token provided' },

  UNKNOWN: { status: 500, message: 'Unknown server error' },
  TRANSACTION_ERROR: { status: 500, message: 'Transaction Error Occured' },
  UNKNOWN_DB: { status: 500, message: 'Unknown DB error' },
  OLD_PWD_NOT_VALID: { status: 500, message: 'Old password not valid' },
  PWD_ADMIN_NOT_VALID: { status: 500, message: 'Password admin not valid' },


  
  TRANSACTION_DELETE_ERROR: { status: 400, message: 'Tranasction Completed, cannot delete the transaction' }
})

export default ErrorMessages
