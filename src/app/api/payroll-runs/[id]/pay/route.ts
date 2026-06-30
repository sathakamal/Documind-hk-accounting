import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Decimal } from "decimal.js";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const orgId = session.user.organizationId;

    // Get the payroll run
    const payrollRun = await prisma.payrollRun.findUnique({
      where: { id, organizationId: orgId },
      include: { 
        lines: { include: { employee: true } },
        journalEntry: true 
      },
    });

    if (!payrollRun) {
      throw new Error("Payroll run not found");
    }

    if (payrollRun.status !== "APPROVED") {
      throw new Error("Payroll run must be in APPROVED status before marking as paid");
    }

    // Get necessary accounts
    const salariesPayable = await prisma.account.findFirst({
      where: { organizationId: orgId, code: "2200" },
      select: { id: true, balance: true }
    });

    const mpfPayable = await prisma.account.findFirst({
      where: { organizationId: orgId, code: "2210" },
      select: { id: true, balance: true }
    });

    const cashAccount = await prisma.account.findFirst({
      where: { organizationId: orgId, code: "1010" },
      select: { id: true, balance: true }
    });

    if (!salariesPayable || !mpfPayable || !cashAccount) {
      throw new Error("Required accounts not found. Please set up your chart of accounts.");
    }

    // Create payment journal entry
    const totalPayment = payrollRun.totalNetPay.plus(payrollRun.totalEmployeeMpf).plus(payrollRun.totalEmployerMpf);
    
    const paymentLines = [
      {
        accountId: salariesPayable.id,
        debit: payrollRun.totalNetPay,
        credit: new Decimal(0),
      },
      {
        accountId: mpfPayable.id,
        debit: payrollRun.totalEmployeeMpf.plus(payrollRun.totalEmployerMpf),
        credit: new Decimal(0),
      },
      {
        accountId: cashAccount.id,
        debit: new Decimal(0),
        credit: totalPayment,
      },
    ];

    // Create payment journal entry
    const paymentEntry = await prisma.journalEntry.create({
      data: {
        description: `Payment of payroll ${payrollRun.runNumber}`,
        reference: `PAY-${payrollRun.runNumber}`,
        organizationId: orgId,
        date: new Date(),
        lines: {
          create: paymentLines.map(line => ({
            accountId: line.accountId,
            debit: line.debit,
            credit: line.credit,
          })),
        },
      },
      select: { id: true }
    });

    // Update payroll run status to PAID
    const updatedPayrollRun = await prisma.payrollRun.update({
      where: { id, organizationId: orgId },
      data: {
        status: "PAID",
        paymentEntryId: paymentEntry.id,
      },
      include: { 
        lines: { include: { employee: true } },
        journalEntry: true,
      },
    });

    return NextResponse.json({ 
      success: true, 
      data: updatedPayrollRun,
      message: "Payroll marked as paid successfully" 
    });
  } catch (error: any) {
    console.error("Payroll mark as paid error:", error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || "Failed to mark payroll as paid" 
    }, { status: 500 });
  }
}