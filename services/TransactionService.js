import moment from 'moment'
import { FlowType, TransType } from '../classes/Constants'
import AccountPayableModel from '../models/AccountPayableModel'
import AccountReceivableModel from '../models/AccountReceivableModel'
import BeginningBalanceModel from '../models/BeginningBalanceModel'
import CashJournalModel from '../models/CashJournalModel'
import LedgerModel from '../models/LedgerModel'
import LoansPayableModel from '../models/LoansPayableModel'
import LoansProceedModel from '../models/LoansProceedModel'
import SalesModel from '../models/SalesModel'

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
    var nonFinancial = 0;
    var cogBeginning = 0;
    var interestExpense = 0, nonFinancialCharges = 0;

    var salesBeginning = 0, salesBeginningSelling = 0;
    var opexBeginning = 0, nopexBeginning = 0;
    var otherBeginning = 0, nonFinancialBeginning = 0, loansBeginning = null;

    if (params.isMonthly) {
      cj = cj.filter(x => x.date >= params.dateFrom && x.date <= params.dateTo)
      begBalance = begBalance.filter(x => x.date >= params.dateFrom && x.date <= params.dateTo)

    }


    salesBeginning = begBalance.find(x => x.type_id == TransType.SALES)
    salesBeginning = salesBeginning ? parseFloat(salesBeginning.total) : 0;

    salesBeginningSelling = begBalance.find(x => x.type_id == TransType.SALES)
    salesBeginningSelling = salesBeginningSelling ? parseFloat(salesBeginningSelling.details.selling_price) : 0;

    cogBeginning = begBalance.find(x => x.type_id == TransType.SALES)
    cogBeginning = cogBeginning ? parseFloat(cogBeginning.details.cost_of_goods_sold) : 0;

    opexBeginning = begBalance.find(x => x.type_id == TransType.OPERATING_EXPENSE)
    opexBeginning = opexBeginning ? parseFloat(opexBeginning.total) : 0;

    nopexBeginning = begBalance.find(x => x.type_id == TransType.NON_OPERATING_EXPENSE)
    var nopexBeginningNF = nopexBeginning ? parseFloat(nopexBeginning.details.non_financial_charges) : 0;
    var nopexBeginningIF = nopexBeginning ? parseFloat(nopexBeginning.details.interest_fixed_amount) : 0;

    otherBeginning = begBalance.find(x => x.type_id == TransType.OTHER_CASH_INCOME)
    otherBeginning = otherBeginning ? parseFloat(otherBeginning.total) : 0;

    nonFinancialBeginning = begBalance.find(x => x.type_id == TransType.NON_FINANCIAL_CHARGES)
    nonFinancialBeginning = nonFinancialBeginning ? parseFloat(nonFinancialBeginning.total) : 0;

    loansBeginning = begBalance.find(x => x.type_id == TransType.LOANS_PAYABLE)

    var allSalesCJ = cj.filter(x => x.type_id === TransType.SALES)
    var allArCJ = cj.filter(x => x.type_id === TransType.ACCOUNTS_RECEIVABLE)
    var allOpexCJ = cj.filter(x => x.type_id === TransType.OPERATING_EXPENSE)
    var allOtherCICJ = cj.filter(x => x.type_id === TransType.OTHER_CASH_INCOME)
    var allLoansProceedCJ = cj.filter(x => x.type_id === TransType.LOANS_PROCEED && x.flow_type_id === FlowType.OUTFLOW)
    var allLoansProceedCashCJ = cj.filter(x => x.type_id === TransType.LOANS_PROCEED)
    var allNonFinancialCJ = cj.filter(x => x.type_id === TransType.NON_FINANCIAL_CHARGES)
    var allSales = await SalesModel.getAllByClientId(params.client_id)
    var allLedger = await LedgerModel.getAllByClientId(params.client_id)
    var allLoans = await LoansPayableModel.getAllByClientId(params.client_id)

    // if (loansBeginning) {
    //   nonFinancialBeginning += parseFloat(element.details.service_fee)
    // }

    allNonFinancialCJ.forEach(element => {
      nonFinancial += parseFloat(element.total)
      // interestExpense += parseFloat(element.details.details.interest_fixed_amount)
      // nonFinancialCharges += parseFloat(element.details.details.non_financial_charges)
    });

    var allArHistory = await AccountReceivableModel.getAllByClientId(params.client_id)
    if (params.isMonthly) {
      allArHistory = allArHistory.filter(x => x.date >= params.dateFrom && x.date <= params.dateTo)
      allSales = allSales.filter(x => x.date >= params.dateFrom && x.date <= params.dateTo)

      allLoans = allLoans.filter(x => x.date >= params.dateFrom && x.date <= params.dateTo)
    }

    allSalesCJ.forEach(element => {
      sales += parseFloat(element.details.total_unit_selling)
      salesUnitCost += parseFloat(element.details.total_unit_cost)
    });
    allArCJ.forEach(element => {
      arPaid += parseFloat(element.total)
    });
    allSales.forEach(element => {
      if (element.trans_type == "On Credit") {
        arTotal += parseFloat(element.total_unit_selling)
        arTotalUnitCost += parseFloat(element.total_unit_cost)
      }
    });

    // allLoans.forEach(element => {
    //   if (element.service_fee)
    //     nonFinancialCharges += parseFloat(element.service_fee)
    // });

    allOtherCICJ.forEach(element => {
      otherCashIncome += parseFloat(element.total)
    });

    allLoansProceedCashCJ.forEach(element => {
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

    allOpexCJ.forEach(element => {
      operatingExpense += parseFloat(element.total)
    });



    var retSales = (salesBeginningSelling) + sales + arTotal;
    var retCostOfGoods = (cogBeginning) + salesUnitCost + arTotalUnitCost;
    var retGrosProfit = (retSales) - (retCostOfGoods);
    var retOperatingExpense = (opexBeginning + operatingExpense)
    var retOperatingProfit = retGrosProfit - retOperatingExpense

    var retOtherCashIncome = (otherCashIncome + otherBeginning)
    var retNetProfit = retOperatingProfit + retOtherCashIncome;
    var retNetProfitInterest = retNetProfit - loansRepayment;
    // var retNonOperatingExpenseInterest = nopexBeginning + loansProceedsInterest

    var retNonOperatingExpenseInterest = nopexBeginningIF + loansProceedsInterest + interestExpense
    var retNonOperatingExpenseNonFinancial = nonFinancialBeginning + nonFinancial + nopexBeginningNF
    var retNonOperatingExpense = retNonOperatingExpenseInterest + retNonOperatingExpenseNonFinancial

    var retNetProfitAfterNopex = retNetProfit - retNonOperatingExpense
    return [
      {
        label: "Sales (Benta)",
        detail1: "",
        detail2: Number.isNaN(retSales) ? 0 : retSales,
        className: 'large-font report-highlight'
      },
      {
        label: "Less: Cost of Sales/Service (Puhunan)",
        detail1: "",
        detail2: Number.isNaN(retCostOfGoods) ? 0 : retCostOfGoods,
        className: "red-font"
      },
      {
        label: "Gross Profit (Tubo)",
        detail1: "",
        detail2: Number.isNaN(retGrosProfit) ? 0 : retGrosProfit,
        className: 'large-font report-highlight'
      },
      {
        label: "Less: Operating Expense (Gastos)",
        detail1: "",
        detail2: Number.isNaN(retOperatingExpense) ? 0 : retOperatingExpense,
        className: "red-font"
      },
      {
        label: "Operating Profit (Kita)",
        detail1: "",
        detail2: Number.isNaN(retOperatingProfit) ? 0 : retOperatingProfit,
        className: 'large-font report-highlight'
      },
      {
        label: "Other Income",
        detail1: "",
        detail2: Number.isNaN(retOtherCashIncome) ? 0 : retOtherCashIncome,
      },
      {
        label: "Net Profit before Non-Operating Expense",
        detail1: '',
        detail2: Number.isNaN(retNetProfit) ? 0 : retNetProfit,
      },

      {
        label: "Less : Non Operating Expense",
        detail1: '',
        detail2: Number.isNaN(retNonOperatingExpense) ? 0 : retNonOperatingExpense,
        className: "red-font"
      },

      {
        label: "Interest Expense",
        detail1: Number.isNaN(retNonOperatingExpenseInterest) ? 0 : retNonOperatingExpenseInterest,
        detail2: "",
      },
      {
        label: "Non-finance Charges",
        detail1: Number.isNaN(retNonOperatingExpenseNonFinancial) ? 0 : retNonOperatingExpenseNonFinancial,
        detail2: "",
      },

      {
        label: "Net Profit (Netong Kita)",
        detail1: '',
        detail2: Number.isNaN(retNetProfitAfterNopex) ? 0 : retNetProfitAfterNopex,
        className: 'large-font report-highlight'
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

    cashOnHandBeg = await reportService.getCashBeginningBalance(params)

    if (params.isMonthly) {
      cj = cj.filter(x => x.date >= params.dateFrom && x.date <= params.dateTo)
    }
    var allSalesCJ = cj.filter(x => x.type_id === TransType.SALES)
    // console.log(allSalesCJ.length,'allSalesCount----')
    var allArCJ = cj.filter(x => x.type_id === TransType.ACCOUNTS_RECEIVABLE)
    var allInventoryLedgerCJ = cj.filter(x => x.type_id === TransType.LEDGER)
    var allApCJ = cj.filter(x => x.type_id === TransType.ACCOUNTS_PAYABLE)
    var allOpexCJ = cj.filter(x => x.type_id === TransType.OPERATING_EXPENSE)
    var allOtherCICJ = cj.filter(x => x.type_id === TransType.OTHER_CASH_INCOME)
    var allLoansProceedInterestCJ = cj.filter(x => x.type_id === TransType.LOANS_PROCEED && x.flow_type_id === FlowType.OUTFLOW)
    var allMicrosavingsDepositCJ = cj.filter(x => x.type_id === TransType.MICROSAVINGS && x.flow_type_id === FlowType.OUTFLOW)
    var allMicrosavingsWithdrawalCJ = cj.filter(x => x.type_id === TransType.MICROSAVINGS && x.flow_type_id === FlowType.INFLOW)
    var allDrawingsCJ = cj.filter(x => x.type_id === TransType.DRAWINGS)
    var allNonFinancialCJ = cj.filter(x => x.type_id === TransType.NON_FINANCIAL_CHARGES)
    var allLoansProceedCashCJ = cj.filter(x => x.type_id === TransType.LOANS_PROCEED)

    var allArHistory = await AccountReceivableModel.getAllByClientId(params.client_id)
    var allApHistory = await AccountPayableModel.getAllByClientId(params.client_id)
    var allLoansProceeds = await LoansPayableModel.getAllByClientId(params.client_id)
    var allSales = await SalesModel.getAllByClientId(params.client_id)
    var allLedger = await LedgerModel.getAllByClientId(params.client_id)

    if (params.isMonthly) {
      allArHistory = allArHistory.filter(x => x.date >= params.dateFrom && x.date <= params.dateTo)
      allApHistory = allApHistory.filter(x => x.date >= params.dateFrom && x.date <= params.dateTo)
      allLoansProceeds = allLoansProceeds.filter(x => x.date >= params.dateFrom && x.date <= params.dateTo)
      allSales = allSales.filter(x => x.date >= params.dateFrom && x.date <= params.dateTo)
      allLedger = allLedger.filter(x => x.date >= params.dateFrom && x.date <= params.dateTo)
    }

    allLoansProceedCashCJ.forEach(element => {
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

    // allSalesCJ.forEach(element => {
    //   sales += parseFloat(element.details.total_unit_selling)
    //   salesUnitCost += parseFloat(element.details.total_unit_cost)
    // });
    allArCJ.forEach(element => {
      arPaid += parseFloat(element.total)
    });
    allApCJ.forEach(element => {
      apPaid += parseFloat(element.total)
    });
    allInventoryLedgerCJ.forEach(element => {
      ledger += parseFloat(element.total)
    });

    allMicrosavingsDepositCJ.forEach(element => {
      microsavingDeposit += parseFloat(element.total)
    });
    allMicrosavingsWithdrawalCJ.forEach(element => {
      microsavingWithdrawal += parseFloat(element.total)
    });
    allSales.forEach(element => {
      if (element.trans_type == "On Credit") {
        arTotal += parseFloat(element.total_unit_selling)
        arTotalUnitCost += parseFloat(element.total_unit_cost)
      } else {
        sales += parseFloat(element.total_unit_selling)
        salesUnitCost += parseFloat(element.total_unit_cost)

      }
    });

    allLedger.forEach(element => {
      if (element.trans_type == "On Credit")
        apTotal += parseFloat(element.total_unit_cost)
    });

    allDrawingsCJ.forEach(element => {
      drawings += parseFloat(element.total)
    });


    allLoansProceeds.forEach(element => {
      loansProceed += parseFloat(element.total)
      // if (element.service_fee)
      // nonFinancial += parseFloat(element.service_fee)
    });

    allOtherCICJ.forEach(element => {
      otherCashIncome += parseFloat(element.total)
    });
    allLoansProceedInterestCJ.forEach(element => {
      loansRepayment += parseFloat(element.total)
    });
    allOpexCJ.forEach(element => {
      operatingExpense += parseFloat(element.total)
    });

    allNonFinancialCJ.forEach(element => {
      nonFinancial += parseFloat(element.total)
    });

    allBeginning.forEach(element => {
      if (element.flow_type_id === FlowType.INFLOW)
        beginningBalance += parseFloat(element.total)
      else
        beginningBalance -= parseFloat(element.total)
    });

    var retCashOnHandBeg = cashOnHandBeg
    var retLoansRepayment = loansRepayment;
    var retCashInflow = sales + otherCashIncome + arPaid + microsavingWithdrawal + loansProceed
    var retDebtServicing = loansProceedsPrincipal + loansProceedsInterest + microsavingDeposit
    var retCashOutflow = ledger + apPaid + operatingExpense + drawings + nonFinancial + retDebtServicing
    var retCashFlow = retCashInflow - retCashOutflow
    var retCashBalanceEnd = retCashFlow + cashOnHandBeg
    var retAfterDebt = retCashBalanceEnd - retDebtServicing
    var retFreshIfusion = loansProceed;
    var retLoansProceeds = loansProceed;
    var retCashBalance = retAfterDebt + retFreshIfusion
    return [
      {
        label: "Cash Balance, Beginning",
        detail: Number.isNaN(retCashOnHandBeg) ? 0 : retCashOnHandBeg,
        className: "large-font report-highlight"
      },
      {
        label: "Cash Inflows (Perang Pumasok)",
        detail: ''
      },
      {
        label: "Cash Sales",
        detail: Number.isNaN(sales) ? 0 : sales
      },
      {
        label: "Collection of Accounts Receivables",
        detail: Number.isNaN(arPaid) ? 0 : arPaid
      },

      {
        label: "Loan Proceeds",
        detail: Number.isNaN(retLoansProceeds) ? 0 : retLoansProceeds
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
        detail: Number.isNaN(retCashInflow) ? 0 : retCashInflow,
        className: "large-font report-highlight"
      },
      {
        label: "Cash Outflows",
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
        label: "Cash Operating Expenses",
        detail: Number.isNaN(operatingExpense) ? 0 : operatingExpense
      },
      {
        label: "Loans Repayment (PIF)",
        detail: Number.isNaN(retDebtServicing) ? 0 : retDebtServicing
      },
      {
        label: "Owner's Drawings",
        detail: Number.isNaN(drawings) ? 0 : drawings
      },
      {
        label: "Cash Non-Finance Charges",
        detail: Number.isNaN(nonFinancial) ? 0 : nonFinancial
      },
      {
        label: "Total Cash Outflow",
        detail: Number.isNaN(retCashOutflow) ? 0 : retCashOutflow,
        className: "large-font report-highlight"
      },
      {
        label: (params.isMonthly ? "Monthly Net" : "Net") + " Cashflows",
        detail: Number.isNaN(retCashFlow) ? 0 : retCashFlow,
        className: "large-font report-highlight"
      },
      {
        label: "Cash Balance, END",
        detail: Number.isNaN(retCashBalanceEnd) ? 0 : retCashBalanceEnd,
        className: "large-font report-highlight"
      }
      // ,
      // {
      //   label: "Debt Servicing ",
      //   detail: Number.isNaN(retDebtServicing) ? 0 : retDebtServicing
      // },
      // {
      //   label: "Principal",
      //   detail: Number.isNaN(loansProceedsPrincipal) ? 0 : loansProceedsPrincipal
      // },
      // {
      //   label: "Interest",
      //   detail: Number.isNaN(loansProceedsInterest) ? 0 : loansProceedsInterest
      // },
      // {
      //   label: "Microsavings",
      //   detail: Number.isNaN(microsavingDeposit) ? 0 : microsavingDeposit
      // },
      // {
      //   label: "Cash Balance, End (After Debt Servicing But Before Fresh Fund Infusion)",
      //   detail: Number.isNaN(retAfterDebt) ? 0 : retAfterDebt
      // },

      // {
      //   label: "Cash Balance, End",
      //   detail: Number.isNaN(retCashBalance) ? 0 : retCashBalance
      // },

    ]
  },

  getDashboard: async (params) => {
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

    cashOnHandBeg = await reportService.getCashBeginningBalance(params)

    var allSalesCJ = cj.filter(x => x.type_id === TransType.SALES)
    var allArCJ = cj.filter(x => x.type_id === TransType.ACCOUNTS_RECEIVABLE)
    var allInventoryLedgerCJ = cj.filter(x => x.type_id === TransType.LEDGER)
    var allApCJ = cj.filter(x => x.type_id === TransType.ACCOUNTS_PAYABLE)
    var allOpexCJ = cj.filter(x => x.type_id === TransType.OPERATING_EXPENSE)
    var allOtherCICJ = cj.filter(x => x.type_id === TransType.OTHER_CASH_INCOME)
    var allLoansProceedInterestCJ = cj.filter(x => x.type_id === TransType.LOANS_PROCEED && x.flow_type_id === FlowType.OUTFLOW)
    var allMicrosavingsDepositCJ = cj.filter(x => x.type_id === TransType.MICROSAVINGS && x.flow_type_id === FlowType.OUTFLOW)
    var allMicrosavingsWithdrawalCJ = cj.filter(x => x.type_id === TransType.MICROSAVINGS && x.flow_type_id === FlowType.INFLOW)
    var allDrawingsCJ = cj.filter(x => x.type_id === TransType.DRAWINGS)
    var allNonFinancialCJ = cj.filter(x => x.type_id === TransType.NON_FINANCIAL_CHARGES)
    var allLoansProceedCashCJ = cj.filter(x => x.type_id === TransType.LOANS_PROCEED)

    var allArHistory = await AccountReceivableModel.getAllByClientId(params.client_id)
    var allApHistory = await AccountPayableModel.getAllByClientId(params.client_id)
    var allLoansProceeds = await LoansPayableModel.getAllByClientId(params.client_id)
    var allSales = await SalesModel.getAllByClientId(params.client_id)
    var allLedger = await LedgerModel.getAllByClientId(params.client_id)

    allLoansProceedCashCJ.forEach(element => {
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

    allSalesCJ.forEach(element => {
      sales += parseFloat(element.details.total_unit_selling)
      salesUnitCost += parseFloat(element.details.total_unit_cost)
    });
    allArCJ.forEach(element => {
      arPaid += parseFloat(element.total)
    });
    allApCJ.forEach(element => {
      apPaid += parseFloat(element.total)
    });
    // console.log(allInventoryLedgerCJ, 'all Ledger')
    allInventoryLedgerCJ.forEach(element => {
      ledger += parseFloat(element.total)
    });

    allMicrosavingsDepositCJ.forEach(element => {
      microsavingDeposit += parseFloat(element.total)
    });
    allMicrosavingsWithdrawalCJ.forEach(element => {
      microsavingWithdrawal += parseFloat(element.total)
    });
    allSales.forEach(element => {
      if (element.trans_type == "On Credit") {
        arTotal += parseFloat(element.total_unit_selling)
        arTotalUnitCost += parseFloat(element.total_unit_cost)
      }
    });

    allLedger.forEach(element => {
      if (element.trans_type == "On Credit")
        apTotal += parseFloat(element.total_unit_cost)
    });

    allDrawingsCJ.forEach(element => {
      drawings += parseFloat(element.total)
    });


    allLoansProceeds.forEach(element => {
      loansProceed += parseFloat(element.total)
      // if (element.service_fee)
      // nonFinancial += parseFloat(element.service_fee)
    });

    allOtherCICJ.forEach(element => {
      otherCashIncome += parseFloat(element.total)
    });
    allLoansProceedInterestCJ.forEach(element => {
      loansRepayment += parseFloat(element.total)
    });
    allOpexCJ.forEach(element => {
      operatingExpense += parseFloat(element.total)
    });

    allNonFinancialCJ.forEach(element => {
      nonFinancial += parseFloat(element.total)
    });

    var ledgerB, saleB, apB, loanB, arB = 0

    allBeginning.forEach(element => {
      if (element.flow_type_id === FlowType.INFLOW)
        beginningBalance += parseFloat(element.total)
      else
        beginningBalance -= parseFloat(element.total)

      switch (element.type_id) {
        case TransType.INVENTORY:
          ledgerB = parseFloat(element.total)
          break;
        case TransType.SALES:
          saleB = parseFloat(element.details.selling_price)
          break;
        case TransType.ACCOUNTS_PAYABLE:
          apB = parseFloat(element.total)
          break;
        case TransType.ACCOUNTS_RECEIVABLE:
          arB = parseFloat(element.total)
          break;
        case TransType.LOANS_PAYABLE:
          loanB = parseFloat(element.total)
          break;
        default:
          break;
      }
    });

    var retCashOnHandBeg = cashOnHandBeg
    var retLoansRepayment = loansRepayment;
    var retCashInflow = sales + otherCashIncome + arPaid + microsavingWithdrawal + loansProceed
    var retDebtServicing = loansProceedsPrincipal + loansProceedsInterest + microsavingDeposit
    var retCashOutflow = ledger + apPaid + operatingExpense + drawings + nonFinancial + retDebtServicing
    var retCashFlow = retCashInflow - retCashOutflow
    var retCashBalanceEnd = retCashFlow + cashOnHandBeg
    var retAfterDebt = retCashBalanceEnd - retDebtServicing
    var retFreshIfusion = loansProceed;
    var retLoansProceeds = loansProceed;
    var retCashBalance = retAfterDebt + retFreshIfusion


    var retNetProfitAfterNopex = await reportService.getProfit(params)
    return [

      {
        label: "Cash",
        detail: Number.isNaN(retCashBalanceEnd) ? "0" : retCashBalanceEnd,
      },

      {
        label: "Accounts Receivables",
        detail: Number.isNaN(arPaid) ? "0" : arPaid + arB,
      },
      {
        label: "Inventory",
        detail: Number.isNaN(ledger) ? "0" : ledger + ledgerB
      },

      {
        label: "Accounts Payable",
        detail: Number.isNaN(apPaid) ? "0" : apPaid + apB,
      },
      {
        label: "Loans Payable",
        detail: Number.isNaN(retLoansProceeds) ? "0" : retLoansProceeds + loanB
      },

      {
        label: "Sales",
        detail: Number.isNaN(sales) ? "0" : sales + saleB
      },

      {
        label: "Net Profit/ (Net Loss)",
        detail: Number.isNaN(retNetProfitAfterNopex) ? "0" : retNetProfitAfterNopex,
      }

    ]
  },

  getCashBeginningBalance: async (params) => {
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
    var cashOnHandBegDate = allBeginning.find(x => x.type_id == TransType.CASH_ON_HAND)
    cashOnHandBegDate = cashOnHandBegDate ? moment(cashOnHandBegDate.date, "YYYY-MM-01") : '';

    cashOnHandBeg = allBeginning.find(x => x.type_id == TransType.CASH_ON_HAND)
    cashOnHandBeg = cashOnHandBeg ? parseFloat(cashOnHandBeg.total) : 0;

    if (!params.isMonthly) {
      return cashOnHandBeg
    }

    if (moment(params.dateFrom).isBefore(moment(cashOnHandBegDate)) ||
      moment(params.dateTo).isBefore(moment(cashOnHandBegDate))) {

      return 0
    }
    var allCj = cj;
    if (params.isMonthly) {
      cj = cj.filter(x => x.date < params.dateFrom)
    }
    var allSalesCJ = cj.filter(x => x.type_id === TransType.SALES)
    var allArCJ = cj.filter(x => x.type_id === TransType.ACCOUNTS_RECEIVABLE)
    var allInventoryLedgerCJ = cj.filter(x => x.type_id === TransType.LEDGER)
    var allApCJ = cj.filter(x => x.type_id === TransType.ACCOUNTS_PAYABLE)
    var allOpexCJ = cj.filter(x => x.type_id === TransType.OPERATING_EXPENSE)
    var allOtherCICJ = cj.filter(x => x.type_id === TransType.OTHER_CASH_INCOME)
    var allLoansProceedInterestCJ = cj.filter(x => x.type_id === TransType.LOANS_PROCEED && x.flow_type_id === FlowType.OUTFLOW)
    var allMicrosavingsDepositCJ = cj.filter(x => x.type_id === TransType.MICROSAVINGS && x.flow_type_id === FlowType.OUTFLOW)
    var allMicrosavingsWithdrawalCJ = cj.filter(x => x.type_id === TransType.MICROSAVINGS && x.flow_type_id === FlowType.INFLOW)
    var allDrawingsCJ = cj.filter(x => x.type_id === TransType.DRAWINGS)
    var allNonFinancialCJ = cj.filter(x => x.type_id === TransType.NON_FINANCIAL_CHARGES)
    var allLoansProceedCashCJ = cj.filter(x => x.type_id === TransType.LOANS_PROCEED)

    var allArHistory = await AccountReceivableModel.getAllByClientId(params.client_id)
    var allApHistory = await AccountPayableModel.getAllByClientId(params.client_id)
    var allLoansProceeds = await LoansPayableModel.getAllByClientId(params.client_id)
    var allSales = await SalesModel.getAllByClientId(params.client_id)
    var allLedger = await LedgerModel.getAllByClientId(params.client_id)

    if (params.isMonthly) {
      allArHistory = allArHistory.filter(x => x.date < params.dateFrom)
      allApHistory = allApHistory.filter(x => x.date < params.dateFrom)
      allLoansProceeds = allLoansProceeds.filter(x => x.date < params.dateFrom)
    }

    allLoansProceedCashCJ.forEach(element => {
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

    allSalesCJ.forEach(element => {
      sales += parseFloat(element.details.total_unit_selling)
      salesUnitCost += parseFloat(element.details.total_unit_cost)
    });
    allArCJ.forEach(element => {
      arPaid += parseFloat(element.total)
    });
    allApCJ.forEach(element => {
      apPaid += parseFloat(element.total)
    });
    allInventoryLedgerCJ.forEach(element => {
      ledger += parseFloat(element.total)
    });

    allMicrosavingsDepositCJ.forEach(element => {
      microsavingDeposit += parseFloat(element.total)
    });
    allMicrosavingsWithdrawalCJ.forEach(element => {
      microsavingWithdrawal += parseFloat(element.total)
    });
    allSales.forEach(element => {
      if (element.trans_type == "On Credit") {
        arTotal += parseFloat(element.total_unit_selling)
        arTotalUnitCost += parseFloat(element.total_unit_cost)
      }
    });

    allLedger.forEach(element => {
      if (element.trans_type == "On Credit")
        apTotal += parseFloat(element.total_unit_cost)
    });

    allDrawingsCJ.forEach(element => {
      drawings += parseFloat(element.total)
    });


    allLoansProceeds.forEach(element => {
      loansProceed += parseFloat(element.total)
      // if (element.service_fee)
      // nonFinancial += parseFloat(element.service_fee)
    });

    allOtherCICJ.forEach(element => {
      otherCashIncome += parseFloat(element.total)
    });
    allLoansProceedInterestCJ.forEach(element => {
      loansRepayment += parseFloat(element.total)
    });
    allOpexCJ.forEach(element => {
      operatingExpense += parseFloat(element.total)
    });

    allNonFinancialCJ.forEach(element => {
      nonFinancial += parseFloat(element.total)
    });

    allBeginning.forEach(element => {
      if (element.flow_type_id === FlowType.INFLOW)
        beginningBalance += parseFloat(element.total)
      else
        beginningBalance -= parseFloat(element.total)
    });

    var retCashOnHandBeg = cashOnHandBeg
    var retLoansRepayment = loansRepayment;
    var retCashInflow = sales + otherCashIncome + arPaid + microsavingWithdrawal + loansProceed
    var retDebtServicing = loansProceedsPrincipal + loansProceedsInterest + microsavingDeposit
    var retCashOutflow = ledger + apPaid + operatingExpense + drawings + nonFinancial + retDebtServicing
    var retCashFlow = retCashInflow - retCashOutflow
    var retCashBalanceEnd = retCashFlow + cashOnHandBeg
    var retAfterDebt = retCashBalanceEnd - retDebtServicing
    var retFreshIfusion = loansProceed;
    var retLoansProceeds = loansProceed;
    var retCashBalance = retAfterDebt + retFreshIfusion

    return retCashBalanceEnd
  },

  getProfit: async (params) => {
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
    var nonFinancial = 0;
    var cogBeginning = 0;
    var interestExpense = 0, nonFinancialCharges = 0;

    var salesBeginning = 0, salesBeginningSelling = 0;
    var opexBeginning = 0, nopexBeginning = 0;
    var otherBeginning = 0, nonFinancialBeginning = 0, loansBeginning = null;

    if (params.isMonthly) {
      cj = cj.filter(x => x.date >= params.dateFrom && x.date <= params.dateTo)
      begBalance = begBalance.filter(x => x.date >= params.dateFrom && x.date <= params.dateTo)

    }


    salesBeginning = begBalance.find(x => x.type_id == TransType.SALES)
    salesBeginning = salesBeginning ? parseFloat(salesBeginning.total) : 0;

    salesBeginningSelling = begBalance.find(x => x.type_id == TransType.SALES)
    salesBeginningSelling = salesBeginningSelling ? parseFloat(salesBeginningSelling.details.selling_price) : 0;

    cogBeginning = begBalance.find(x => x.type_id == TransType.SALES)
    cogBeginning = cogBeginning ? parseFloat(cogBeginning.details.cost_of_goods_sold) : 0;

    opexBeginning = begBalance.find(x => x.type_id == TransType.OPERATING_EXPENSE)
    opexBeginning = opexBeginning ? parseFloat(opexBeginning.total) : 0;

    nopexBeginning = begBalance.find(x => x.type_id == TransType.NON_OPERATING_EXPENSE)
    var nopexBeginningNF = nopexBeginning ? parseFloat(nopexBeginning.details.non_financial_charges) : 0;
    var nopexBeginningIF = nopexBeginning ? parseFloat(nopexBeginning.details.interest_fixed_amount) : 0;

    otherBeginning = begBalance.find(x => x.type_id == TransType.OTHER_CASH_INCOME)
    otherBeginning = otherBeginning ? parseFloat(otherBeginning.total) : 0;

    nonFinancialBeginning = begBalance.find(x => x.type_id == TransType.NON_FINANCIAL_CHARGES)
    nonFinancialBeginning = nonFinancialBeginning ? parseFloat(nonFinancialBeginning.total) : 0;

    loansBeginning = begBalance.find(x => x.type_id == TransType.LOANS_PAYABLE)

    var allSalesCJ = cj.filter(x => x.type_id === TransType.SALES)
    var allArCJ = cj.filter(x => x.type_id === TransType.ACCOUNTS_RECEIVABLE)
    var allOpexCJ = cj.filter(x => x.type_id === TransType.OPERATING_EXPENSE)
    var allOtherCICJ = cj.filter(x => x.type_id === TransType.OTHER_CASH_INCOME)
    var allLoansProceedCJ = cj.filter(x => x.type_id === TransType.LOANS_PROCEED && x.flow_type_id === FlowType.OUTFLOW)
    var allLoansProceedCashCJ = cj.filter(x => x.type_id === TransType.LOANS_PROCEED)
    var allNonFinancialCJ = cj.filter(x => x.type_id === TransType.NON_FINANCIAL_CHARGES)
    var allSales = await SalesModel.getAllByClientId(params.client_id)
    var allLedger = await LedgerModel.getAllByClientId(params.client_id)
    var allLoans = await LoansPayableModel.getAllByClientId(params.client_id)

    // if (loansBeginning) {
    //   nonFinancialBeginning += parseFloat(element.details.service_fee)
    // }

    allNonFinancialCJ.forEach(element => {
      nonFinancial += parseFloat(element.total)
      // interestExpense += parseFloat(element.details.details.interest_fixed_amount)
      // nonFinancialCharges += parseFloat(element.details.details.non_financial_charges)
    });

    var allArHistory = await AccountReceivableModel.getAllByClientId(params.client_id)
    if (params.isMonthly) {
      allArHistory = allArHistory.filter(x => x.date >= params.dateFrom && x.date <= params.dateTo)
      allSales = allSales.filter(x => x.date >= params.dateFrom && x.date <= params.dateTo)

      allLoans = allLoans.filter(x => x.date >= params.dateFrom && x.date <= params.dateTo)
    }

    allSalesCJ.forEach(element => {
      sales += parseFloat(element.details.total_unit_selling)
      salesUnitCost += parseFloat(element.details.total_unit_cost)
    });
    allArCJ.forEach(element => {
      arPaid += parseFloat(element.total)
    });
    allSales.forEach(element => {
      if (element.trans_type == "On Credit") {
        arTotal += parseFloat(element.total_unit_selling)
        arTotalUnitCost += parseFloat(element.total_unit_cost)
      }
    });

    // allLoans.forEach(element => {
    //   if (element.service_fee)
    //     nonFinancialCharges += parseFloat(element.service_fee)
    // });

    allOtherCICJ.forEach(element => {
      otherCashIncome += parseFloat(element.total)
    });

    allLoansProceedCashCJ.forEach(element => {
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

    allOpexCJ.forEach(element => {
      operatingExpense += parseFloat(element.total)
    });



    var retSales = (salesBeginningSelling) + sales + arTotal;
    var retCostOfGoods = (cogBeginning) + salesUnitCost + arTotalUnitCost;
    var retGrosProfit = (retSales) - (retCostOfGoods);
    var retOperatingExpense = (opexBeginning + operatingExpense)
    var retOperatingProfit = retGrosProfit - retOperatingExpense

    var retOtherCashIncome = (otherCashIncome + otherBeginning)
    var retNetProfit = retOperatingProfit + retOtherCashIncome;
    var retNetProfitInterest = retNetProfit - loansRepayment;
    // var retNonOperatingExpenseInterest = nopexBeginning + loansProceedsInterest

    var retNonOperatingExpenseInterest = nopexBeginningIF + loansProceedsInterest + interestExpense
    var retNonOperatingExpenseNonFinancial = nonFinancialBeginning + nonFinancial + nopexBeginningNF
    var retNonOperatingExpense = retNonOperatingExpenseInterest + retNonOperatingExpenseNonFinancial

    var retNetProfitAfterNopex = retNetProfit - retNonOperatingExpense
    return Number.isNaN(retNetProfitAfterNopex) ? 0 : retNetProfitAfterNopex
  },
}

export {
  reportService,
}
