const TransactionType = Object.freeze({
  CASH: 'Cash',
  ACCOUNT: 'Account',
})

const Config = Object.freeze({
  PAYMENT_TERMS : 30 // in days
})

const TransType = Object.freeze({
  SALES : "Sales",
  ORDER : "Order",
  LOANS_PAYABLE : "Loans Payable Inflow",
  LOANS_PAYABLE_OUTFLOW : "Loans Payable Outflow"
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
  Config
}
