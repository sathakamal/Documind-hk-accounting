import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/rbac";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId || !isAdmin(session)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const orgId = session.user.organizationId;

    // 1. Fetch all parent IDs first to avoid relational filtering in deleteMany
    // (Relational filtering can sometimes trigger implicit transactions)
    const payrollRunIds = (await prisma.payrollRun.findMany({ where: { organizationId: orgId }, select: { id: true } })).map(r => r.id);
    const invoiceIds = (await prisma.invoice.findMany({ where: { organizationId: orgId }, select: { id: true } })).map(i => i.id);
    const billIds = (await prisma.bill.findMany({ where: { organizationId: orgId }, select: { id: true } })).map(b => b.id);
    const journalEntryIds = (await prisma.journalEntry.findMany({ where: { organizationId: orgId }, select: { id: true } })).map(j => j.id);
    const documentIds = (await prisma.document.findMany({ where: { organizationId: orgId }, select: { id: true } })).map(d => d.id);

    // 2. Delete child records using flat ID lists
    if (payrollRunIds.length > 0) {
      await prisma.payrollLine.deleteMany({ where: { payrollRunId: { in: payrollRunIds } } });
    }
    if (invoiceIds.length > 0) {
      await prisma.invoiceLine.deleteMany({ where: { invoiceId: { in: invoiceIds } } });
    }
    if (billIds.length > 0) {
      await prisma.billLine.deleteMany({ where: { billId: { in: billIds } } });
    }
    if (journalEntryIds.length > 0) {
      await prisma.journalLine.deleteMany({ where: { journalEntryId: { in: journalEntryIds } } });
    }

    // 3. Delete parent records
    await prisma.payrollRun.deleteMany({ where: { organizationId: orgId } });
    await prisma.invoice.deleteMany({ where: { organizationId: orgId } });
    await prisma.bill.deleteMany({ where: { organizationId: orgId } });
    await prisma.journalEntry.deleteMany({ where: { organizationId: orgId } });
    await prisma.document.deleteMany({ where: { organizationId: orgId } });

    // 4. Delete standalone records
    await prisma.customer.deleteMany({ where: { organizationId: orgId } });
    await prisma.vendor.deleteMany({ where: { organizationId: orgId } });
    await prisma.bankTransaction.deleteMany({ where: { organizationId: orgId } });
    await prisma.exchangeRate.deleteMany({ where: { organizationId: orgId } });
    await prisma.orgCurrency.deleteMany({ where: { organizationId: orgId } });
    await prisma.employee.deleteMany({ where: { organizationId: orgId } });

    // 5. Delete accounts (except base accounts if needed)
    await prisma.account.deleteMany({ where: { organizationId: orgId } });

    return NextResponse.json({ success: true, message: "Organization data cleared successfully!" });
  } catch (error: any) {
    console.error("Reset data error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to reset data" }, { status: 500 });
  }
}
