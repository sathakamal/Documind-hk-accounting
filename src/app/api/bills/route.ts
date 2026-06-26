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

    const bills = await prisma.bill.findMany({
      where: { organizationId: session.user.organizationId },
      include: { vendor: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: bills });
  } catch (error) {
    console.error("Bills GET error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch bills" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { billNumber, vendorBillRef, vendorId, issueDate, dueDate, currency, exchangeRate, subtotal, taxAmount, totalAmount, lines, taxStatus } = body;

    const orgId = session.user.organizationId;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create the Bill
      const bill = await tx.bill.create({
        data: {
          billNumber,
          vendorBillRef,
          vendorId,
          issueDate: new Date(issueDate),
          dueDate: new Date(dueDate),
          currency: currency || "HKD",
          exchangeRate: new Decimal(exchangeRate || 1),
          subtotal: new Decimal(subtotal),
          taxAmount: new Decimal(taxAmount || 0),
          totalAmount: new Decimal(totalAmount),
          balanceDue: new Decimal(totalAmount),
          totalHkd: new Decimal(totalAmount).times(new Decimal(exchangeRate || 1)),
          status: "APPROVED",
          taxStatus: taxStatus || "ONSHORE",
          organizationId: orgId,
          lines: {
            create: lines.map((l: any, idx: number) => ({
              description: l.description,
              quantity: new Decimal(l.quantity || 1),
              unitPrice: new Decimal(l.unitPrice),
              amount: new Decimal(l.amount),
              category: l.category || "COGS",
              sortOrder: idx,
            })),
          },
        },
      });

      // 2. Post Journal Entry
      // Accounts Payable (2000) is credited.
      // The expense/COGS accounts are debited. We map line item categories.
      const apAccount = await tx.account.findFirst({ where: { organizationId: orgId, code: "2000" } });
      if (!apAccount) throw new Error("Accounts Payable Account (Code 2000) not found");

      const journalLines: any[] = [];
      const totalHkd = new Decimal(totalAmount).times(new Decimal(exchangeRate || 1));
      
      // We will debit the default COGS account (5000) or check standard category mapping
      // For simplicity, sum all lines and debit the mapped account(s)
      for (const line of lines) {
        let expenseCode = "5000"; // default to COGS
        const cat = (line.category || "").toUpperCase();
        
        if (cat.includes("RENT")) expenseCode = "6000";
        else if (cat.includes("SALAR") || cat.includes("WAG")) expenseCode = "6010";
        else if (cat.includes("MPF")) expenseCode = "6020";
        else if (cat.includes("UTIL") || cat.includes("COMM") || cat.includes("INTERNET")) expenseCode = "6030";
        else if (cat.includes("AUDIT") || cat.includes("LEGAL") || cat.includes("TAX")) expenseCode = "6040";
        else if (cat.includes("TRAVEL") || cat.includes("ENTERTAIN")) expenseCode = "6050";
        else if (cat.includes("OFFICE") || cat.includes("SUPPL")) expenseCode = "6060";

        const mappedAcc = await tx.account.findFirst({ where: { organizationId: orgId, code: expenseCode } });
        const lineHkd = new Decimal(line.amount).times(new Decimal(exchangeRate || 1));
        
        if (mappedAcc) {
          journalLines.push({
            accountId: mappedAcc.id,
            debit: lineHkd,
            credit: 0,
          });
        }
      }

      // Add Credit for Accounts Payable
      journalLines.push({
        accountId: apAccount.id,
        debit: 0,
        credit: totalHkd,
      });

      await createJournalEntry(tx, {
        description: `Bill ${billNumber} created from Vendor`,
        reference: billNumber,
        organizationId: orgId,
        date: new Date(issueDate),
        lines: journalLines,
      });

      return bill;
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error("Bills POST error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to create bill" }, { status: 500 });
  }
}
