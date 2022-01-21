import { FlowType, TransType } from '../classes/Constants'
import AccountPayableModel from '../models/AccountPayableModel'
import AccountReceivableModel from '../models/AccountReceivableModel'
import BeginningBalanceModel from '../models/BeginningBalanceModel'
import CashJournalModel from '../models/CashJournalModel'
import LoansPayableModel from '../models/LoansPayableModel'
import LoansProceedModel from '../models/LoansProceedModel'

const reportService = {
  getIncomeStatement: async (params) => {
    var cj = await CashJournalModel.getAllByClientId(params.client_id)
    var begBalance = await BeginningBalanceModel.getAllByClientId(params.client_id)
    var sales = 0;
    var salesUnitCost = 0;
    var arPaid = 0;
    var arTotal = 0;
    var arTotalUnitCost = 0;
    var otherCashIncome = 0;
    var loansRepayment = 0;
    var operatingExpense = 0;
    var loansProceedsInterest = 0;
    var loansProceedsPrincipal = 0;

    var salesBeginning = 0, salesBeginningSelling = 0;
    var opexBeginning = 0, nopexBeginning = 0;
    var otherBeginning = 0, nonFinancialBeginning = 0;

    if (params.isMonthly) {
      cj = cj.filter(x => x.date >= params.dateFrom && x.date <= params.dateTo)
    }

    salesBeginning = begBalance.find(x => x.type_id == TransType.SALES)
    salesBeginning = salesBeginning ? parseFloat(salesBeginning.total) : 0;
    salesBeginningSelling = begBalance.find(x => x.type_id == TransType.SALES)
    salesBeginningSelling = salesBeginningSelling ? parseFloat(salesBeginningSelling.details.selling_price) : 0;

    opexBeginning = begBalance.find(x => x.type_id == TransType.OPERATING_EXPENSE)
    opexBeginning = opexBeginning ? parseFloat(opexBeginning.total) : 0;

    nopexBeginning = begBalance.find(x => x.type_id == TransType.NON_OPERATING_EXPENSE)
    nopexBeginning = nopexBeginning ? parseFloat(nopexBeginning.total) : 0;

    otherBeginning = begBalance.find(x => x.type_id == TransType.OTHER_CASH_INCOME)
    otherBeginning = otherBeginning ? parseFloat(otherBeginning.total) : 0;

    nonFinancialBeginning = begBalance.find(x => x.type_id == TransType.NON_FINANCIAL_CHARGES)
    nonFinancialBeginning = nonFinancialBeginning ? parseFloat(nonFinancialBeginning.total) : 0;


    var allSales = cj.filter(x => x.type_id === TransType.SALES && !x.is_beginning)
    var allAr = cj.filter(x => x.type_id === TransType.ACCOUNTS_RECEIVABLE && !x.is_beginning)
    var allOpex = cj.filter(x => x.type_id === TransType.OPERATING_EXPENSE && !x.is_beginning)
    var allOtherCI = cj.filter(x => x.type_id === TransType.OTHER_CASH_INCOME && !x.is_beginning)
    var allLoansProceed = cj.filter(x => x.type_id === TransType.LOANS_PROCEED && !x.is_beginning && x.flow_type_id === FlowType.OUTFLOW)

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
    allLoansProceed.forEach(element => {
      loansProceedsInterest += parseFloat(element.details.interest_fixed_amount)
      loansProceedsPrincipal += parseFloat(element.details.interest) - parseFloat(element.details.interest_fixed_amount)
    });
    allOpex.forEach(element => {
      operatingExpense += parseFloat(element.total)
    });

    var retSales = (sales - salesBeginningSelling) + sales + arTotal;
    var retCostOfGoods = (sales - salesBeginningSelling) + salesUnitCost + arTotalUnitCost;
    var retGrosProfit = (retSales) - (retCostOfGoods);
    var retOperatingExpense = (opexBeginning - operatingExpense)
    var retOperatingProfit = retGrosProfit - retOperatingExpense

    var retOtherCashIncome = (otherCashIncome - otherBeginning)
    var retNetProfit = Number.isNaN(retOperatingProfit + retOtherCashIncome) ? 0 : retOperatingProfit + retOtherCashIncome;
    var retNetProfitInterest = retNetProfit - loansRepayment;
    var retNonOperatingExpenseInterest = nopexBeginning + loansProceedsInterest

    var retNonOperatingExpenseInterest = nopexBeginning + loansProceedsInterest
    var retNonOperatingExpenseNonFinancial = nonFinancialBeginning + nopexBeginning
    var retNonOperatingExpense = retNonOperatingExpenseInterest + retNonOperatingExpenseNonFinancial

    var retNetProfitAfterNopex = retNetProfit - retNonOperatingExpense
    return [
      {
        label: "Sales",
        detail: Number.isNaN(retSales) ? 0 : retSales,
        className: 'large-font'
      },
      {
        label: "Less: Cost of Goods Sold",
        detail: Number.isNaN(retCostOfGoods) ? 0 : retCostOfGoods,
      },
      {
        label: "Gross Profit",
        detail: Number.isNaN(retGrosProfit) ? 0 : retGrosProfit,
        className: 'large-font'
      },
      {
        label: "Less: Operating Expense",
        detail: Number.isNaN(retOperatingExpense) ? 0 : retOperatingExpense
      },
      {
        label: "Operating Profit",
        detail: Number.isNaN(retOperatingProfit) ? 0 : retOperatingProfit,
        className: 'large-font'
      },
      {
        label: "Other Cash Income",
        detail: Number.isNaN(retOtherCashIncome) ? 0 : retOtherCashIncome,
      },
      {
        label: "Net Profit before Interest Expense",
        detail: Number.isNaN(retNetProfit) ? 0 : retNetProfit,
        className: 'large-font'
      },

      {
        label: "Non Operating Expense",
        detail: Number.isNaN(retNonOperatingExpense) ? 0 : retNonOperatingExpense,
        className: 'large-font'
      },

      {
        label: "    Interest Expense",
        detail: Number.isNaN(retNonOperatingExpenseInterest) ? 0 : retNonOperatingExpenseInterest
      },
      {
        label: "    Non-financial Charges",
        detail: Number.isNaN(retNonOperatingExpenseNonFinancial) ? 0 : retNonOperatingExpenseNonFinancial,
      },

      {
        label: "Net Profit after Non-Operating Expense",
        detail: Number.isNaN(retNetProfitAfterNopex) ? 0 : retNetProfitAfterNopex,
        className: 'large-font'
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
    var microsavingWithdrawal = 0;
    var cashOnHandBeg = 0;
    var drawings = 0;
    var nonFinancial = 0;
    var loansProceedsInterest = 0;
    var loansProceedsPrincipal = 0;

    var allBeginning = await BeginningBalanceModel.getAllByClientId(params.client_id)

    cashOnHandBeg = allBeginning.find(x => x.type_id == TransType.CASH_ON_HAND)
    cashOnHandBeg = cashOnHandBeg ? parseFloat(cashOnHandBeg.total) : 0;

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
    var allMicrosavingsWithdrawal = cj.filter(x => x.type_id === TransType.MICROSAVINGS && !x.is_beginning && x.flow_type_id === FlowType.INFLOW)
    var allDrawings = cj.filter(x => x.type_id === TransType.DRAWINGS && !x.is_beginning)
    var allNonFinancial = cj.filter(x => x.type_id === TransType.NON_FINANCIAL_CHARGES && !x.is_beginning)
    var allLoansProceedCash = cj.filter(x => x.type_id === TransType.LOANS_PROCEED)

    var allArHistory = await AccountReceivableModel.getAllByClientId(params.client_id)
    var allApHistory = await AccountPayableModel.getAllByClientId(params.client_id)
    var allLoansProceeds = await LoansPayableModel.getAllByClientId(params.client_id)

    if (params.isMonthly) {
      allArHistory = allArHistory.filter(x => x.date >= params.dateFrom && x.date <= params.dateTo)
      allApHistory = allApHistory.filter(x => x.date >= params.dateFrom && x.date <= params.dateTo)
      allLoansProceeds = allLoansProceeds.filter(x => x.date >= params.dateFrom && x.date <= params.dateTo)
    }

    allLoansProceedCash.forEach(element => {
      if (element.is_beginning) {
        if (element.details.details) {

          if (element.details.details.interest_fixed_amount)
            loansProceedsInterest += parseFloat(element.details.details.interest_fixed_amount)
          if (element.details.details.interest && element.details.details.interest_fixed_amount)
            loansProceedsPrincipal += parseFloat(element.details.details.interest) - parseFloat(element.details.details.interest_fixed_amount)
        }

      } else {
        if (element.details) {
          if (element.details.interest_fixed_amount)
            loansProceedsInterest += parseFloat(element.details.interest_fixed_amount)
          if (element.details.interest && element.details.interest_fixed_amount)
            loansProceedsPrincipal += parseFloat(element.details.interest) - parseFloat(element.details.interest_fixed_amount)
        }
      }
    });

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
    allMicrosavingsWithdrawal.forEach(element => {
      microsavingWithdrawal += parseFloat(element.total)
    });
    allArHistory.forEach(element => {
      arTotal += parseFloat(element.total)
      arTotalUnitCost += parseFloat(element.item.unit_cost) * parseFloat(element.quantity)
    });

    allApHistory.forEach(element => {
      apTotal += parseFloat(element.total)
    });

    allDrawings.forEach(element => {
      drawings += parseFloat(element.total)
    });


    allLoansProceeds.forEach(element => {
      loansProceed += parseFloat(element.total)
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

    allNonFinancial.forEach(element => {
      nonFinancial += parseFloat(element.total)
    });

    allBeginning.forEach(element => {
      if (element.flow_type_id === FlowType.INFLOW)
        beginningBalance += parseFloat(element.total)
      else
        beginningBalance -= parseFloat(element.total)
    });

    var retCashOnHandBeg = cashOnHandBeg
    var retCashInflow = sales + otherCashIncome + arPaid + microsavingWithdrawal
    var retCashOutflow = ledger + apPaid + operatingExpense + drawings + nonFinancial
    var retCashFlow = retCashInflow - retCashOutflow
    var retCashBalanceEnd = retCashFlow + cashOnHandBeg
    var retDebtServicing = loansProceedsPrincipal + loansProceedsInterest + microsavingDeposit
    var retAfterDebt = retCashBalanceEnd - retDebtServicing
    var retFreshIfusion = loansProceed;
    var retCashBalance = retAfterDebt + retFreshIfusion
    return [
      {
        label: "Cash Balance Beg",
        detail: Number.isNaN(retCashOnHandBeg) ? 0 : retCashOnHandBeg
      },
      {
        label: "Add: Cash Inflows",
        detail: ''
      },
      {
        label: "Sales (On Cash)",
        detail: Number.isNaN(sales) ? 0 : sales
      },
      {
        label: "Collection of Accounts Receivables",
        detail: Number.isNaN(arPaid) ? 0 : arPaid
      },
      {
        label: "Microsavings Withdrawal",
        detail: Number.isNaN(microsavingWithdrawal) ? 0 : microsavingWithdrawal
      },
      {
        label: "Other Cash Income",
        detail: Number.isNaN(otherCashIncome) ? 0 : otherCashIncome
      },
      {
        label: "Total Cash Inflow",
        detail: Number.isNaN(retCashInflow) ? 0 : retCashInflow
      },
      {
        label: "Less: Cash Outflows",
        detail: "",
      },
      {
        label: "Cash Purchases",
        detail: Number.isNaN(ledger) ? 0 : ledger
      },
      {
        label: "Payment to Supplier",
        detail: Number.isNaN(apPaid) ? 0 : apPaid
      },
      {
        label: "Cash Operating Expense",
        detail: Number.isNaN(operatingExpense) ? 0 : operatingExpense
      },
      {
        label: "Owner's Drawings",
        detail: Number.isNaN(drawings) ? 0 : drawings
      },
      {
        label: "Non-Financial Charges",
        detail: Number.isNaN(nonFinancial) ? 0 : nonFinancial
      },
      {
        label: "Total Cash Outflow",
        detail: Number.isNaN(retCashOutflow) ? 0 : retCashOutflow
      },
      {
        label: (params.isMonthly ? "Monthly Net" : "Net") + " Cash Flow",
        detail: Number.isNaN(retCashFlow) ? 0 : retCashFlow
      },
      {
        label: "Cash Balance, END (Before Debt Servicing Fresh Fund Infusion)",
        detail: Number.isNaN(retCashBalanceEnd) ? 0 : retCashBalanceEnd
      },
      {
        label: "Debt Servicing ",
        detail: Number.isNaN(retDebtServicing) ? 0 : retDebtServicing
      },
      {
        label: "Principal",
        detail: Number.isNaN(loansProceedsPrincipal) ? 0 : loansProceedsPrincipal
      },
      {
        label: "Interest",
        detail: Number.isNaN(loansProceedsInterest) ? 0 : loansProceedsInterest
      },
      {
        label: "Microsavings",
        detail: Number.isNaN(microsavingDeposit) ? 0 : microsavingDeposit
      },
      {
        label: "Cash Balance, End (After Debt Servicing But Before Fresh Fund Infusion)",
        detail: Number.isNaN(retAfterDebt) ? 0 : retAfterDebt
      },

      {
        label: "Fresh Infusion from Bayan Edge",
        detail: Number.isNaN(retFreshIfusion) ? 0 : retFreshIfusion
      },


      {
        label: "Cash Balance, End",
        detail: Number.isNaN(retCashBalance) ? 0 : retCashBalance
      },

    ]
  },
}

export {
  reportService,
}
