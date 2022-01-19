import { FlowType, TransType } from '../classes/Constants'
import AccountPayableModel from '../models/AccountPayableModel'
import AccountReceivableModel from '../models/AccountReceivableModel'
import CashJournalModel from '../models/CashJournalModel'
import LoansProceedModel from '../models/LoansProceedModel'

const reportService = {
  getIncomeStatement: async (params) => {
    var cj = await CashJournalModel.getAllByClientId(params.client_id)
    var sales = 0;
    var salesUnitCost = 0;
    var arPaid = 0;
    var arTotal = 0;
    var arTotalUnitCost = 0;
    var otherCashIncome = 0;
    var loansRepayment = 0;
    var operatingExpense = 0;

    cj = await CashJournalModel.getAllByClientId(params.client_id)
    if (params.isMonthly) {
      cj = cj.filter(x => x.date >= params.dateFrom && x.date <= params.dateTo)
    }
    var allSales = cj.filter(x => x.type_id === TransType.SALES && !x.is_beginning)
    var allAr = cj.filter(x => x.type_id === TransType.ACCOUNTS_RECEIVABLE && !x.is_beginning)
    var allOpex = cj.filter(x => x.type_id === TransType.OPERATING_EXPENSE && !x.is_beginning)
    var allOtherCI = cj.filter(x => x.type_id === TransType.OTHER_CASH_INCOME && !x.is_beginning)
    var allLoansProceedInterest = cj.filter(x => x.type_id === TransType.LOANS_PROCEED && !x.is_beginning && x.flow_type_id === FlowType.OUTFLOW)

    var allArHistory = await AccountReceivableModel.getAllByClientId(params.client_id)
    if (params.isMonthly) {
      allArHistory = allArHistory.filter(x => x.date >= params.dateFrom && x.date <= params.dateTo)
    }
    allSales.forEach(element => {
      sales += parseFloat(element.total)
      salesUnitCost += parseFloat(element.item.unit_cost) * parseFloat(element.quantity)
    });
    allAr.forEach(element => {
      arPaid += parseFloat(element.total)
    });
    allArHistory.forEach(element => {
      arTotal += parseFloat(element.total)
      arTotalUnitCost += parseFloat(element.item.unit_cost) * parseFloat(element.quantity)
    });
    allOtherCI.forEach(element => {
      otherCashIncome += parseFloat(element.total)
    });
    allLoansProceedInterest.forEach(element => {
      loansRepayment += parseFloat(element.total)
    });
    allOpex.forEach(element => {
      operatingExpense += parseFloat(element.total)
    });

    var retSales = sales + arTotal;
    var retCostOfGoods = salesUnitCost + arTotal;
    var retGrosProfit = (retSales) - (retCostOfGoods);
    var retOperatingProfit = retGrosProfit - operatingExpense
    var retNetProfit = retOperatingProfit + otherCashIncome;
    return [
      {
        label: "Sales",
        detail: retSales,
        className : 'large-font text-right'
      },
      {
        label: "Less: Cost of Goods Sold",
        detail: retCostOfGoods
      },
      {
        label: "Gross Profit",
        detail: retGrosProfit,
        className : 'large-font text-right'
      },
      {
        label: "Less: Operating Expense",
        detail: operatingExpense
      },
      {
        label: "Operating Profit",
        detail: retOperatingProfit,
        className : 'large-font text-right'
      },
      {
        label: "Other Cash Income",
        detail: otherCashIncome
      },
      {
        label: "Net Profit before Interest Expense",
        detail: retNetProfit,
        className : 'large-font text-right'
      },
      {
        label: "Less: Interest Expense",
        detail: loansRepayment
      },
      {
        label: "Net Profit after Interest Expense",
        detail: retNetProfit - loansRepayment,
        className : 'large-font text-right'
      }
    ]
  },
  getCashFlowStatement: async (params) => {
    var cj = await CashJournalModel.getAllByClientId(params.client_id)
    var sales = 0;
    var salesUnitCost = 0;
    var arPaid = 0;
    var arTotal = 0;
    var arTotalUnitCost = 0;
    var otherCashIncome = 0;
    var loansRepayment = 0;
    var loansProceed = 0;
    var loansProceedInterestPaid = 0;
    var loansProceedInterest = 0;
    var operatingExpense = 0;
    var ledger = 0;
    var apPaid = 0;
    var apTotal = 0;
    var beginningBalance = 0;
    var microsavingDeposit = 0;

    cj = await CashJournalModel.getAllByClientId(params.client_id)
    var allBeginning = cj.filter(x => x.is_beginning)

    if (params.isMonthly) {
      cj = cj.filter(x => x.date >= params.dateFrom && x.date <= params.dateTo)
    }
    var allSales = cj.filter(x => x.type_id === TransType.SALES && !x.is_beginning)
    var allAr = cj.filter(x => x.type_id === TransType.ACCOUNTS_RECEIVABLE && !x.is_beginning)
    var allInventoryLedger = cj.filter(x => x.type_id === TransType.LEDGER && !x.is_beginning)
    var allAp = cj.filter(x => x.type_id === TransType.ACCOUNTS_PAYABLE && !x.is_beginning)
    var allOpex = cj.filter(x => x.type_id === TransType.OPERATING_EXPENSE && !x.is_beginning)
    var allOtherCI = cj.filter(x => x.type_id === TransType.OTHER_CASH_INCOME && !x.is_beginning)
    var allLoansProceedInterest = cj.filter(x => x.type_id === TransType.LOANS_PROCEED && !x.is_beginning && x.flow_type_id === FlowType.OUTFLOW)
    var allMicrosavingsDeposit = cj.filter(x => x.type_id === TransType.MICROSAVINGS && !x.is_beginning && x.flow_type_id === FlowType.OUTFLOW)

    var allArHistory = await AccountReceivableModel.getAllByClientId(params.client_id)
    var allApHistory = await AccountPayableModel.getAllByClientId(params.client_id)
    var allLoansProceeds = await LoansProceedModel.getAllByClientId(params.client_id)

    if (params.isMonthly) {
      allArHistory = allArHistory.filter(x => x.date >= params.dateFrom && x.date <= params.dateTo)
      allApHistory = allApHistory.filter(x => x.date >= params.dateFrom && x.date <= params.dateTo)
      allLoansProceeds = allLoansProceeds.filter(x => x.date >= params.dateFrom && x.date <= params.dateTo)
    }

    allSales.forEach(element => {
      sales += parseFloat(element.total)
      salesUnitCost += parseFloat(element.item.unit_cost) * parseFloat(element.quantity)
    });
    allAr.forEach(element => {
      arPaid += parseFloat(element.total)
    });
    allAp.forEach(element => {
      apPaid += parseFloat(element.total)
    });
    allInventoryLedger.forEach(element => {
      ledger += parseFloat(element.total)
    });

    allMicrosavingsDeposit.forEach(element => {
      microsavingDeposit += parseFloat(element.total)
    });
    allArHistory.forEach(element => {
      arTotal += parseFloat(element.total)
      arTotalUnitCost += parseFloat(element.item.unit_cost) * parseFloat(element.quantity)
    });

    allApHistory.forEach(element => {
      apTotal += parseFloat(element.total)
    });

    allLoansProceeds.forEach(element => {
      loansProceed += parseFloat(element.total)
      if (element.is_completed)
        loansProceedInterestPaid += parseFloat(element.interest_fixed_amount)
      loansProceedInterest += parseFloat(element.interest_fixed_amount)
    });

    allOtherCI.forEach(element => {
      otherCashIncome += parseFloat(element.total)
    });
    allLoansProceedInterest.forEach(element => {
      loansRepayment += parseFloat(element.total)
    });
    allOpex.forEach(element => {
      operatingExpense += parseFloat(element.total)
    });

    allBeginning.forEach(element => {
      if (element.flow_type_id === FlowType.INFLOW)
        beginningBalance += parseFloat(element.total)
      else
        beginningBalance -= parseFloat(element.total)
    });


    var retCashInflow = sales + otherCashIncome + arPaid
    var retCashOutflow = ledger + apPaid + operatingExpense
    var retCashFlow = retCashInflow - retCashOutflow
    var retCashBalanceEnd = retCashFlow + beginningBalance
    var retLoansPayable = (loansProceed - loansRepayment) + (loansProceedInterest - loansProceedInterestPaid) + microsavingDeposit;
    var retPrincipal = (loansProceed - loansRepayment);
    var retInterest = (loansProceedInterest - loansProceedInterestPaid);
    var retAfterDebt = retCashBalanceEnd - retLoansPayable
    return [
      {
        label: "Sales (On Cash)",
        detail: sales
      },
      {
        label: "Accounts Receivable (Received)",
        detail: arPaid
      },
      {
        label: "Other Cash Income",
        detail: otherCashIncome
      },
      {
        label: "Cash Inflow",
        detail: retCashInflow
      },
      {
        label: "Inventory Ledger",
        detail: ledger
      },
      {
        label: "Inventory Payables",
        detail: apPaid
      },
      {
        label: "Operating Expense",
        detail: operatingExpense
      },
      {
        label: "Cash Outflow",
        detail: retCashOutflow
      },
      {
        label: (params.isMonthly ? "Monthly" : "Total") + " Cash Flow",
        detail: retCashFlow
      },
      {
        label: "Cash Balance Beg",
        detail: beginningBalance
      },

      {
        label: "Cash Balance, END (Before Debt Servicing Fresh Fund Infusion)",
        detail: retCashBalanceEnd
      },
      {
        label: "Debt Servicing ",
        detail: retLoansPayable
      },
      {
        label: "Principal",
        detail: retPrincipal
      },
      {
        label: "Interest",
        detail: retInterest
      },
      {
        label: "Microsavings",
        detail: microsavingDeposit
      },
      {
        label: "Cash Balance, End (After Debt Servicing)",
        detail: retAfterDebt
      },

      {
        label: "Fresh Infusion from Bayan Edge",
        detail: 0
      },


      {
        label: "Cash Balance, End",
        detail: retAfterDebt - 0
      },

    ]
  },
}

export {
  reportService,
}
