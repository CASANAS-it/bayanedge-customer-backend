import { FlowType, TransType } from '../classes/Constants'
import AccountReceivableModel from '../models/AccountReceivableModel'
import CashJournalModel from '../models/CashJournalModel'

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

    var retSales = sales + arPaid;
    var retCostOfGoods = sales + arTotal;
    var retGrosProfit = (retSales) - (retCostOfGoods);
    var retOperatingProfit = retGrosProfit - operatingExpense
    var retNetProfit = retOperatingProfit + otherCashIncome;
    return [
      {
        label: "Sales",
        detail: retSales
      },
      {
        label: "Less: Cost of Goods Sold",
        detail: retCostOfGoods
      },
      {
        label: "Gross Profit",
        detail: retGrosProfit
      },
      {
        label: "Less: Operating Expense",
        detail: operatingExpense
      },
      {
        label: "Operating Profit",
        detail: retOperatingProfit
      },
      {
        label: "Other Cash Income",
        detail: otherCashIncome
      },
      {
        label: "Net Profit before Interest Expense",
        detail: retNetProfit
      },
      {
        label: "Less: Interest Expense",
        detail: loansRepayment
      },
      {
        label: "Net Profit after Interest Expense",
        detail: retNetProfit - loansRepayment
      }
    ]
  },
}

export {
  reportService,
}
