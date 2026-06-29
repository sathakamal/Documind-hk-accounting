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

    const invoices = await prisma.invoice.findMany({
      where: { organizationId: session.user.organizationId },
      include: { customer: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: invoices });
  } catch (error) {
    console.error("Invoices GET error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch invoices" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { invoiceNumber, customerId, issueDate, dueDate, currency, exchangeRate, subtotal, taxAmount, totalAmount, lines, taxStatus } = body;

    const orgId = session.user.organizationId;

    // 1. Create the Invoice WITHOUT nested writes to avoid HTTP transaction limits
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        customerId,
        issueDate: new Date(issueDate),
        dueDate: new Date(dueDate),
        currency: currency || "HKD",
        exchangeRate: new Decimal(exchangeRate || 1),
        subtotal: new Decimal(subtotal),
        taxAmount: new Decimal(taxAmount || 0),
        totalAmount: new Decimal(totalAmount),
        balanceDue: new Decimal(totalAmount),
        totalHkd: new Decimal(totalAmount).times(new Decimal(exchangeRate || 1)),
        status: "SENT",
        taxStatus: taxStatus || "ONSHORE",
        organizationId: orgId,
      },
    });

    // Create lines separately
    await Promise.all(lines.map((l: any, idx: number) => 
      prisma.invoiceLine.create({
        data: {
          description: l.description,
          quantity: new Decimal(l.quantity || 1),
          unitPrice: new Decimal(l.unitPrice),
          amount: new Decimal(l.amount),
          category: l.category || "Sales",
          sortOrder: idx,
          invoiceId: invoice.id,
        }
      })
    ));

    // 2. Post Journal Entry: Debit Accounts Receivable (1200), Credit Sales Revenue (4000)
    const arAccount = await prisma.account.findFirst({ where: { organizationId: orgId, code: "1200" } });
    const salesAccount = await prisma.account.findFirst({ where: { organizationId: orgId, code: "4000" } });

    if (arAccount && salesAccount) {
      const totalHkd = new Decimal(totalAmount).times(new Decimal(exchangeRate || 1));
      await createJournalEntry(prisma, {
        description: `Invoice ${invoiceNumber} created for Customer`,
        reference: invoiceNumber,
        organizationId: orgId,
        date: new Date(issueDate),
        lines: [
          { accountId: arAccount.id, debit: totalHkd, credit: 0 },
          { accountId: salesAccount.id, debit: 0, credit: totalHkd },
        ],
      });
    }

    const result = await prisma.invoice.findUnique({
      where: { id: invoice.id },
      include: { lines: true },
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error("Invoices POST error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to create invoice" }, { status: 500 });
  }
}
