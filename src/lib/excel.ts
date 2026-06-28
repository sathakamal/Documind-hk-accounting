import ExcelJS from "exceljs";
import { Bill, Invoice, Account, JournalEntry, JournalLine } from "@prisma/client";
import { Decimal } from "decimal.js";

export async function exportBillsToExcel(bills: (Bill & { vendor: { name: string } })[]) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("AP Bills");

  sheet.columns = [
    { header: "Bill #", key: "billNumber", width: 20 },
    { header: "Vendor", key: "vendor", width: 25 },
    { header: "Issue Date", key: "issueDate", width: 15 },
    { header: "Due Date", key: "dueDate", width: 15 },
    { header: "Currency", key: "currency", width: 10 },
    { header: "Amount", key: "amount", width: 15 },
    { header: "Rate to HKD", key: "rate", width: 15 },
    { header: "Amount (HKD)", key: "amountHkd", width: 15 },
    { header: "Paid", key: "paid", width: 15 },
    { header: "Balance", key: "balance", width: 15 },
    { header: "Status", key: "status", width: 15 },
    { header: "Notes", key: "notes", width: 30 },
  ];

  for (const bill of bills) {
    sheet.addRow({
      billNumber: bill.billNumber,
      vendor: bill.vendor.name,
      issueDate: bill.issueDate.toISOString().split("T")[0],
      dueDate: bill.dueDate.toISOString().split("T")[0],
      currency: bill.currency,
      amount: new Decimal(bill.totalAmount).toNumber(),
      rate: new Decimal(bill.exchangeRate).toNumber(),
      amountHkd: new Decimal(bill.totalHkd).toNumber(),
      paid: new Decimal(bill.paidAmount).toNumber(),
      balance: new Decimal(bill.balanceDue).toNumber(),
      status: bill.status,
      notes: bill.notes,
    });
  }

  return workbook;
}

export async function exportInvoicesToExcel(invoices: (Invoice & { customer: { name: string } })[]) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("AR Invoices");

  sheet.columns = [
    { header: "Invoice #", key: "invoiceNumber", width: 20 },
    { header: "Customer", key: "customer", width: 25 },
    { header: "Issue Date", key: "issueDate", width: 15 },
    { header: "Due Date", key: "dueDate", width: 15 },
    { header: "Currency", key: "currency", width: 10 },
    { header: "Amount", key: "amount", width: 15 },
    { header: "Rate to HKD", key: "rate", width: 15 },
    { header: "Amount (HKD)", key: "amountHkd", width: 15 },
    { header: "Received", key: "received", width: 15 },
    { header: "Balance", key: "balance", width: 15 },
    { header: "Status", key: "status", width: 15 },
    { header: "Notes", key: "notes", width: 30 },
  ];

  for (const invoice of invoices) {
    sheet.addRow({
      invoiceNumber: invoice.invoiceNumber,
      customer: invoice.customer.name,
      issueDate: invoice.issueDate.toISOString().split("T")[0],
      dueDate: invoice.dueDate.toISOString().split("T")[0],
      currency: invoice.currency,
      amount: new Decimal(invoice.totalAmount).toNumber(),
      rate: new Decimal(invoice.exchangeRate).toNumber(),
      amountHkd: new Decimal(invoice.totalHkd).toNumber(),
      received: new Decimal(invoice.paidAmount).toNumber(),
      balance: new Decimal(invoice.balanceDue).toNumber(),
      status: invoice.status,
      notes: invoice.notes,
    });
  }

  return workbook;
}

export async function exportTrialBalanceToExcel(accounts: Account[], totalDebit: number, totalCredit: number) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Trial Balance");

  sheet.columns = [
    { header: "Account Code", key: "code", width: 15 },
    { header: "Account Name", key: "name", width: 30 },
    { header: "Type", key: "type", width: 15 },
    { header: "Debit (HKD)", key: "debit", width: 18 },
    { header: "Credit (HKD)", key: "credit", width: 18 },
  ];

  for (const account of accounts) {
    const balance = new Decimal(account.balance);
    let debit = 0;
    let credit = 0;

    if (account.type === "ASSET" || account.type === "EXPENSE") {
      if (balance.greaterThanOrEqualTo(0)) {
        debit = balance.toNumber();
      } else {
        credit = balance.abs().toNumber();
      }
    } else {
      if (balance.greaterThanOrEqualTo(0)) {
        credit = balance.toNumber();
      } else {
        debit = balance.abs().toNumber();
      }
    }

    sheet.addRow({
      code: account.code,
      name: account.name,
      type: account.type,
      debit,
      credit,
    });
  }

  // Add totals
  sheet.addRow({
    code: "",
    name: "TOTAL",
    type: "",
    debit: totalDebit,
    credit: totalCredit,
  });

  // Style totals
  const lastRow = sheet.lastRow;
  if (lastRow) {
    lastRow.font = { bold: true };
  }

  return workbook;
}

export async function exportGeneralLedgerToExcel(
  journalEntries: (JournalEntry & { lines: (JournalLine & { account: Account })[] })[]
) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("General Ledger");

  sheet.columns = [
    { header: "Date", key: "date", width: 15 },
    { header: "Reference", key: "reference", width: 20 },
    { header: "Description", key: "description", width: 40 },
    { header: "Account Code", key: "accountCode", width: 15 },
    { header: "Account Name", key: "accountName", width: 30 },
    { header: "Debit (HKD)", key: "debit", width: 18 },
    { header: "Credit (HKD)", key: "credit", width: 18 },
  ];

  for (const entry of journalEntries) {
    for (const line of entry.lines) {
      sheet.addRow({
        date: entry.date.toISOString().split("T")[0],
        reference: entry.reference || "",
        description: entry.description,
        accountCode: line.account.code,
        accountName: line.account.name,
        debit: new Decimal(line.debit).toNumber(),
        credit: new Decimal(line.credit).toNumber(),
      });
    }
    // Add a blank row between entries
    sheet.addRow({});
  }

  return workbook;
}

export async function exportFinancialStatementsToExcel(
  trialBalance: any,
  profitAndLoss: any,
  balanceSheet: any
) {
  const workbook = new ExcelJS.Workbook();

  // Trial Balance sheet
  const tbSheet = workbook.addWorksheet("Trial Balance");
  tbSheet.columns = [
    { header: "Account Code", key: "code", width: 15 },
    { header: "Account Name", key: "name", width: 30 },
    { header: "Debit (HKD)", key: "debit", width: 18 },
    { header: "Credit (HKD)", key: "credit", width: 18 },
  ];

  for (const line of trialBalance.lines) {
    tbSheet.addRow({
      code: line.code,
      name: line.name,
      debit: line.debit,
      credit: line.credit,
    });
  }

  tbSheet.addRow({
    code: "",
    name: "TOTAL",
    debit: trialBalance.totalDebit,
    credit: trialBalance.totalCredit,
  });

  // Profit & Loss sheet
  const plSheet = workbook.addWorksheet("Profit & Loss");
  plSheet.columns = [
    { header: "Account", key: "account", width: 30 },
    { header: "Amount (HKD)", key: "amount", width: 20 },
  ];

  plSheet.addRow({ account: "REVENUE", amount: "" });
  for (const item of profitAndLoss.revenue) {
    plSheet.addRow({ account: `${item.code} - ${item.name}`, amount: item.amount });
  }
  plSheet.addRow({ account: "Total Revenue", amount: profitAndLoss.totalRevenue });
  plSheet.addRow({});

  plSheet.addRow({ account: "EXPENSES", amount: "" });
  for (const item of profitAndLoss.expenses) {
    plSheet.addRow({ account: `${item.code} - ${item.name}`, amount: item.amount });
  }
  plSheet.addRow({ account: "Total Expenses", amount: profitAndLoss.totalExpense });
  plSheet.addRow({});

  plSheet.addRow({ account: "NET PROFIT / (LOSS)", amount: profitAndLoss.netProfit });

  // Balance Sheet sheet
  const bsSheet = workbook.addWorksheet("Balance Sheet");
  bsSheet.columns = [
    { header: "Account", key: "account", width: 30 },
    { header: "Amount (HKD)", key: "amount", width: 20 },
  ];

  bsSheet.addRow({ account: "ASSETS", amount: "" });
  for (const item of balanceSheet.assets) {
    bsSheet.addRow({ account: `${item.code} - ${item.name}`, amount: item.amount });
  }
  bsSheet.addRow({ account: "Total Assets", amount: balanceSheet.totalAssets });
  bsSheet.addRow({});

  bsSheet.addRow({ account: "LIABILITIES", amount: "" });
  for (const item of balanceSheet.liabilities) {
    bsSheet.addRow({ account: `${item.code} - ${item.name}`, amount: item.amount });
  }
  bsSheet.addRow({ account: "Total Liabilities", amount: balanceSheet.totalLiabilities });
  bsSheet.addRow({});

  bsSheet.addRow({ account: "EQUITY", amount: "" });
  for (const item of balanceSheet.equity) {
    bsSheet.addRow({ account: `${item.code} - ${item.name}`, amount: item.amount });
  }
  bsSheet.addRow({ account: "Total Equity", amount: balanceSheet.totalEquity });
  bsSheet.addRow({});

  bsSheet.addRow({ account: "Total Liabilities & Equity", amount: balanceSheet.totalLiabilitiesAndEquity });

  return workbook;
}
