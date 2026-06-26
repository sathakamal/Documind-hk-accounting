import ExcelJS from "exceljs";
import { Bill, Invoice } from "@prisma/client";
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
