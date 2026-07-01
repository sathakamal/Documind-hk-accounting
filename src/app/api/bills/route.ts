import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createJournalEntry } from "@/lib/journal";
import { Decimal } from "decimal.js";
import { billSchema } from "@/lib/validations";

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
    
    const validation = billSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ 
        success: false, 
        error: "Validation failed",
        details: validation.error.errors 
      }, { status: 400 });
    }

    const { vendorBillRef, vendorId, issueDate, dueDate, currency, exchangeRate, subtotal, taxAmount, totalAmount, lines } = validation.data;
    const billNumber = body.billNumber;
    const taxStatus = body.taxStatus;

    const orgId = session.user.organizationId;

    // 1. Create the Bill WITHOUT nested writes to avoid HTTP transaction limits
    const bill = await prisma.bill.create({
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
      },
    });

    // Create lines separately
    await Promise.all(lines.map((l: any, idx: number) => 
      prisma.billLine.create({
        data: {
          description: l.description,
          quantity: new Decimal(l.quantity || 1),
          unitPrice: new Decimal(l.unitPrice),
          amount: new Decimal(l.amount),
          category: l.category || "COGS",
          sortOrder: idx,
          billId: bill.id,
        }
      })
    ));

    // 2. Post Journal Entry
    // Accounts Payable (2000) is credited.
    // The expense/COGS accounts are debited. We map line item categories.
    const apAccount = await prisma.account.findFirst({ where: { organizationId: orgId, code: "2000" } });
    const taxPayableAccount = await prisma.account.findFirst({ where: { organizationId: orgId, code: "2300" } });
    if (!apAccount) throw new Error("Accounts Payable Account (Code 2000) not found");

    const journalLines: any[] = [];
    const totalHkd = new Decimal(totalAmount).times(new Decimal(exchangeRate || 1));
    const taxHkd = new Decimal(taxAmount || 0).times(new Decimal(exchangeRate || 1));
    const expenseHkd = totalHkd.minus(taxHkd);
    
    // Debit expense accounts for the non-tax portion
    for (const line of lines) {
      let expenseCode = "5000";
      const cat = (line.category || "").toUpperCase();
      
      if (cat.includes("RENT")) expenseCode = "6000";
      else if (cat.includes("SALAR") || cat.includes("WAG")) expenseCode = "6010";
      else if (cat.includes("MPF")) expenseCode = "6020";
      else if (cat.includes("UTIL") || cat.includes("COMM") || cat.includes("INTERNET")) expenseCode = "6030";
      else if (cat.includes("AUDIT") || cat.includes("LEGAL") || cat.includes("TAX")) expenseCode = "6040";
      else if (cat.includes("TRAVEL") || cat.includes("ENTERTAIN")) expenseCode = "6050";
      else if (cat.includes("OFFICE") || cat.includes("SUPPL")) expenseCode = "6060";

      const mappedAcc = await prisma.account.findFirst({ where: { organizationId: orgId, code: expenseCode } });
      const lineAmount = new Decimal(line.amount);
      const lineTax = lineAmount.times(new Decimal(line.taxRate || 0)).dividedBy(100);
      const lineExpense = lineAmount.minus(lineTax);
      const lineExpenseHkd = lineExpense.times(new Decimal(exchangeRate || 1));
      
      if (mappedAcc) {
        journalLines.push({
          accountId: mappedAcc.id,
          debit: lineExpenseHkd,
          credit: 0,
        });
      }
    }

    // Debit Tax Payable for the tax portion (this represents the tax to be remitted)
    if (taxPayableAccount && taxHkd.greaterThan(0)) {
      journalLines.push({
        accountId: taxPayableAccount.id,
        debit: taxHkd,
        credit: 0,
      });
    }

    // Add Credit for Accounts Payable (total amount including tax)
    journalLines.push({
      accountId: apAccount.id,
      debit: 0,
      credit: totalHkd,
    });

    await createJournalEntry(prisma, {
      description: `Bill ${billNumber} created from Vendor`,
      reference: billNumber,
      organizationId: orgId,
      date: new Date(issueDate),
      lines: journalLines,
    });

    const result = await prisma.bill.findUnique({
      where: { id: bill.id },
      include: { lines: true },
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error("Bills POST error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to create bill" }, { status: 500 });
  }
}
