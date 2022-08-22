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
  RECORD_ALREADY_EXISTS: { status: 200, message: 'Record already exists.', code: 113 },

  // 200 series
  INVALID_MERCHANT_CODE: { status: 200, message: 'Invalid merchant code', code: 201 },
  INVALID_TRANSACTION_TYPE: { status: 200, message: 'Invalid transaction type', code: 202 },
  INVALID_VOUCHER_CODE: { status: 200, message: 'Invalid voucher code', code: 203 },
  INVALID_AMOUNT: { status: 200, message: 'Invalid amount', code: 204 },
  DUPLICATE_REFERENCE: { status: 200, message: 'Duplicate reference number', code: 205 },
  NO_BEGINNING_BALANCE: { status: 200, message: 'Please set beginning balance first.',code : 206 },
  BEGINNING_BALANCE_DELETE_ERROR_DATA: { status: 200, message: 'Can not delete beginning balance. Transaction already exists.',code : 207 },
  EDIT_ERROR_WITH_EXISTING_DATA: { status: 200, message: 'Can not update data. Transaction already exists.',code : 208 },
  INSUFFICIENT_QUANTITY: { status: 200, message: 'Insufficient Quantity.',code : 209 },
  AMOUNT_EXCEEDED: { status: 200, message: 'Amount is greater than the balance',code : 210 },
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
  INVALID_CURRENT_PASSWORD: { status: 500, message: 'Invalid Current Password' },
  CHANGE_PASSWORD_FAILED: { status: 500, message: 'Change password failed' },
  
  TRANSACTION_DELETE_ERROR: { status: 400, message: 'Tranasaction Completed, cannot delete the transaction' },
  
  DUPLICATE_ENTRY: { status: 400, message: 'Name already exists', code: 601 },
  DUPLICATE_REF: { status: 200, message: 'REF already exists', code: 602 },
  NO_DATA: { status: 200, message: 'No data found.', code: 603 },
  
  SUBSCRIPTION_EXPIRED: { status: 200, message: 'Your Subscription has ended.', code: 604 },
  SUBSCRIPTION_NOT_STARTED: { status: 200, message: 'Your Subscription is not yet started.', code: 605 },
  NO_SUBSCRIPTION: { status: 200, message: 'You are not yet subscribe.', code: 606 },
  
})

export default ErrorMessages
