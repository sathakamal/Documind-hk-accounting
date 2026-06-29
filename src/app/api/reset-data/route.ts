import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const orgId = session.user.organizationId;

    // 1. Delete records in correct order to respect foreign keys
    // We use individual calls to avoid HTTP transaction limits
    
    // Payroll
    await prisma.payrollLine.deleteMany({ where: { payrollRun: { organizationId: orgId } } });
    await prisma.payrollRun.deleteMany({ where: { organizationId: orgId } });
    
    // Accounting
    await prisma.journalLine.deleteMany({ where: { journalEntry: { organizationId: orgId } } });
    await prisma.journalEntry.deleteMany({ where: { organizationId: orgId } });
    
    // AR / AP
    await prisma.invoiceLine.deleteMany({ where: { invoice: { organizationId: orgId } } });
    await prisma.invoice.deleteMany({ where: { organizationId: orgId } });
    await prisma.billLine.deleteMany({ where: { bill: { organizationId: orgId } } });
    await prisma.bill.deleteMany({ where: { organizationId: orgId } });
    
    // Banking & Documents
    await prisma.bankTransaction.deleteMany({ where: { organizationId: orgId } });
    await prisma.document.deleteMany({ where: { organizationId: orgId } });
    
    // Master Data
    await prisma.employee.deleteMany({ where: { organizationId: orgId } });
    await prisma.vendor.deleteMany({ where: { organizationId: orgId } });
    await prisma.customer.deleteMany({ where: { organizationId: orgId } });
    
    // Finally, accounts (reset balances to 0 instead of deleting, to keep basic setup)
    await prisma.account.updateMany({
      where: { organizationId: orgId },
      data: { balance: 0 }
    });

    return NextResponse.json({ success: true, message: "Organization data cleared successfully!" });
  } catch (error: any) {
    console.error("Reset data error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to reset data" }, { status: 500 });
  }
}
