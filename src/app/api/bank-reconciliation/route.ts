import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createJournalEntry } from "@/lib/journal";
import { Decimal } from "decimal.js";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const txs = await prisma.bankTransaction.findMany({
      where: { organizationId: session.user.organizationId },
      orderBy: { date: "desc" },
    });

    return NextResponse.json({ success: true, data: txs });
  } catch (error) {
    console.error("BankReconciliation GET error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch bank transactions" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { bankTransactionId, matchType, matchId, accountId } = body;

    if (!bankTransactionId || !matchType) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const orgId = session.user.organizationId;

    // Process reconciliation WITHOUT transaction to avoid HTTP transaction limits
    // 1. Get bank transaction
    const bankTx = await prisma.bankTransaction.findFirst({
      where: { id: bankTransactionId, organizationId: orgId },
    });

    if (!bankTx) throw new Error("Bank transaction not found");
    if (bankTx.status === "RECONCILED") throw new Error("Transaction already reconciled");

    // Get cash/bank account (e.g. 1010 HSBC HKD Account)
    const bankAccount = await prisma.account.findFirst({
      where: { organizationId: orgId, code: "1010" },
    });
    if (!bankAccount) throw new Error("Default Bank Account (Code 1010) not found. Run seed script first.");

    let ref = bankTx.reference || "";

    if (matchType === "INVOICE") {
      // Match with Customer Invoice
      const invoice = await prisma.invoice.findFirst({
        where: { id: matchId, organizationId: orgId },
      });
      if (!invoice) throw new Error("Invoice not found");

      const amt = new Decimal(bankTx.amount);
      const newPaidAmount = new Decimal(invoice.paidAmount).plus(amt);
      const newBalanceDue = new Decimal(invoice.totalAmount).minus(newPaidAmount);

      // Update invoice status
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          paidAmount: newPaidAmount,
          balanceDue: newBalanceDue,
          status: newBalanceDue.lte(0) ? "PAID" : "PARTIALLY_PAID",
        },
      });

      // Debit Bank, Credit Accounts Receivable (1200)
      const arAccount = await prisma.account.findFirst({
        where: { organizationId: orgId, code: "1200" },
      });
      if (!arAccount) throw new Error("Accounts Receivable Account (Code 1200) not found");

      ref = invoice.invoiceNumber;
      await createJournalEntry(prisma, {
        description: `Bank payment received for Invoice ${invoice.invoiceNumber}`,
        reference: invoice.invoiceNumber,
        organizationId: orgId,
        date: bankTx.date,
        lines: [
          { accountId: bankAccount.id, debit: amt, credit: 0 },
          { accountId: arAccount.id, debit: 0, credit: amt },
        ],
      });
    } else if (matchType === "BILL") {
      // Match with Supplier Bill
      const bill = await prisma.bill.findFirst({
        where: { id: matchId, organizationId: orgId },
      });
      if (!bill) throw new Error("Bill not found");

      const amt = new Decimal(bankTx.amount).abs(); // bank outflow is negative
      const newPaidAmount = new Decimal(bill.paidAmount).plus(amt);
      const newBalanceDue = new Decimal(bill.totalAmount).minus(newPaidAmount);

      // Update bill status
      await prisma.bill.update({
        where: { id: bill.id },
        data: {
          paidAmount: newPaidAmount,
          balanceDue: newBalanceDue,
          status: newBalanceDue.lte(0) ? "PAID" : "PARTIALLY_PAID",
        },
      });

      // Debit Accounts Payable (2000), Credit Bank (1010)
      const apAccount = await prisma.account.findFirst({
        where: { organizationId: orgId, code: "2000" },
      });
      if (!apAccount) throw new Error("Accounts Payable Account (Code 2000) not found");

      ref = bill.billNumber;
      await createJournalEntry(prisma, {
        description: `Bank payment sent for Bill ${bill.billNumber}`,
        reference: bill.billNumber,
        organizationId: orgId,
        date: bankTx.date,
        lines: [
          { accountId: apAccount.id, debit: amt, credit: 0 },
          { accountId: bankAccount.id, debit: 0, credit: amt },
        ],
      });
    } else if (matchType === "DIRECT_EXPENSE") {
      // Match directly to an expense category (e.g. coffee, travel)
      if (!accountId) throw new Error("Expense account is required for direct expense");
      const expAccount = await prisma.account.findFirst({
        where: { id: accountId, organizationId: orgId },
      });
      if (!expAccount) throw new Error("Expense account not found");

      const amt = new Decimal(bankTx.amount).abs(); // money spent

      // Debit Expense Account, Credit Bank Account
      await createJournalEntry(prisma, {
        description: `Direct Bank Expense: ${bankTx.description}`,
        reference: "BANK-EXP",
        organizationId: orgId,
        date: bankTx.date,
        lines: [
          { accountId: expAccount.id, debit: amt, credit: 0 },
          { accountId: bankAccount.id, debit: 0, credit: amt },
        ],
      });
    } else {
      throw new Error("Invalid match type");
    }

    // Mark transaction as Reconciled
    const updatedTx = await prisma.bankTransaction.update({
      where: { id: bankTx.id },
      data: {
        status: "RECONCILED",
        reference: ref,
      },
    });

    return NextResponse.json({ success: true, data: updatedTx });
  } catch (error: any) {
    console.error("BankReconciliation POST error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to reconcile transaction" }, { status: 500 });
  }
}
