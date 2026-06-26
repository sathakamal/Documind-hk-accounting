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

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create the Invoice
      const invoice = await tx.invoice.create({
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
          lines: {
            create: lines.map((l: any, idx: number) => ({
              description: l.description,
              quantity: new Decimal(l.quantity || 1),
              unitPrice: new Decimal(l.unitPrice),
              amount: new Decimal(l.amount),
              category: l.category || "Sales",
              sortOrder: idx,
            })),
          },
        },
      });

      // 2. Post Journal Entry: Debit Accounts Receivable (1200), Credit Sales Revenue (4000)
      const arAccount = await tx.account.findFirst({ where: { organizationId: orgId, code: "1200" } });
      const salesAccount = await tx.account.findFirst({ where: { organizationId: orgId, code: "4000" } });

      if (arAccount && salesAccount) {
        const totalHkd = new Decimal(totalAmount).times(new Decimal(exchangeRate || 1));
        await createJournalEntry(tx, {
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

      return invoice;
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error("Invoices POST error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to create invoice" }, { status: 500 });
  }
}
