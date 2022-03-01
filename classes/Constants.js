const TransactionType = Object.freeze({
  CASH: 'Cash',
  ACCOUNT: 'Account',
})

const FlowType = Object.freeze({
  INFLOW: 'Inflow',
  OUTFLOW: 'Outflow',
})

const Config = Object.freeze({
  PAYMENT_TERMS : 30, // in days
  SERVICE_FEE_PERCENT : 0.02
})

const TransType = Object.freeze({
  SALES : "Sales",
  ORDER : "Order",
  LEDGER : "Ledger",
  ACCOUNTS_PAYABLE : 'Accounts Payable',
  ACCOUNTS_RECEIVABLE : 'Accounts Receivable',
  MICROSAVINGS : "Microsavings",
  DRAWINGS: "Drawings",
  LOANS_PROCEED : "Loans Proceed",
  LOANS_PAYABLE : "Loans Payable",
  NEW_LOANS : "New Loans",
  OTHER_CASH_INCOME: "Other Cash Income",
  OPERATING_EXPENSE : "Operating Expense",
  OTHER_INCOME : "Other Income",
  INVENTORY : "Inventory",
  CASH_ON_HAND : "Cash on Hand",
  NON_FINANCIAL_CHARGES : "Non-financial Charges",
  NON_OPERATING_EXPENSE : "Non-Operating Expense"
})

const AssetType = Object.freeze({
  CASH: 'Cash',
  CASH_IN_BANK: 'Cash in Bank',
  PETTY_CASH_FUND: 'Petty Cash Fund',
  ACCOUNTS_RECEIVABLE: 'Accounts Receivable',
  ADVANCES: 'Advances',
  INVENTORY : 'Inventory',
  MEMBER_FUND: "Member's Fund",
  FIXED_ASSET: "Fixed Assets",
  ACCUMULATED_DEPRECIATION : "Accumulated Depreciation",
  OTHER_ASSETS : "Other Assets"
})


const OpexType = Object.freeze({
  SALARIES_WAGES : "Salaries & Wages",
  MONTH_PAY : "13th Month Pay",
  LIGHT_WATER : "Light & Water",
  RENTAL  : "Rental",
  COMMUNICATIONS : "Communications",
  TRANSPORTATION : "Transportation",
  REPRESENTATION : "Representation",
  EXPENSE_ACCOUNT : "Expense Account",
  ADVERTISING_PROMO : "Advertising & Promo",
  OFFICE_SUPPLIES : "Office Supplies",
  REPAIRS_MAINTENANCE : "Repairs & Maintenance Expense",
  SUBSCRIPTION_FEES : "Subscription Fees",
  TAXES_LICENSES : "Taxes & Licenses",

})

const LiabilityType = Object.freeze({
  ACCOUNTS_PAYABLE: 'Accounts Payable',
  LOANS_PAYABLE: 'Loans Payable',
  PETTY_CASH_FUND: 'Petty Cash Fund',
  INTEREST_PAYABLE: 'Interest Payable',
  OTHER_CURRENT_LIABILITY: 'Other Current Liabilities',
  DEBT : 'Debt',
  OTHER_PAYABLE: "Other Payable",
})

const EquityType = Object.freeze({
  EQUITY: 'Equity',
})


const RevenueType = Object.freeze({
  INCOME: 'Income',
  OTHER_INCOME: "Other Income",
})


const ExpenseType = Object.freeze({
  COST_GOODS: 'Cost of Goods Sold',
  OPERATING_EXPENSE: "Operating Expenses",
})

const UserType = Object.freeze({
  BUTLER_ADMIN: 'Tee Butler Admin',
  BUTLER_STAFF: 'Tee Butler Staff',
  CLUB_ADMIN: 'Club Admin',
  CLUB_MANAGER: 'Club Manager',
  CLUB_ATTENDANT: 'Club Attendant',
  CLUB_RECEPTION: 'Club Reception',
  CLUB_STARTER: 'Club Starter'
})


export {
  AssetType,
  LiabilityType,
  RevenueType,
  ExpenseType,
  UserType,
  EquityType,
  TransactionType,
  TransType,
  Config,
  FlowType,OpexType
}
