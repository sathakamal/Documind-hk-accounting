import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createJournalEntry } from "@/lib/journal";
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

    const result = await prisma.$transaction(async (tx) => {
      // Get the payroll run
      const payrollRun = await tx.payrollRun.findUnique({
        where: { id, organizationId: orgId },
        include: { lines: true },
      });

      if (!payrollRun) {
        throw new Error("Payroll run not found");
      }

      if (payrollRun.status !== "DRAFT") {
        throw new Error("Payroll run is not in DRAFT status");
      }

      // Get the necessary accounts
      const salariesExpense = await tx.account.findFirst({
        where: { organizationId: orgId, code: "6010" },
      });
      const mpfExpense = await tx.account.findFirst({
        where: { organizationId: orgId, code: "6020" },
      });
      const mpfPayable = await tx.account.findFirst({
        where: { organizationId: orgId, code: "2210" },
      });
      const cashAccount = await tx.account.findFirst({
        where: { organizationId: orgId, code: "1010" },
      });
      const salariesPayable = await tx.account.findFirst({
        where: { organizationId: orgId, code: "2200" },
      });

      if (!salariesExpense || !mpfExpense || !mpfPayable || !cashAccount || !salariesPayable) {
        throw new Error("Required accounts not found. Please set up your chart of accounts.");
      }

      // Create journal entry lines
      const journalLines = [
        {
          accountId: salariesExpense.id,
          debit: new Decimal(payrollRun.totalGrossPay),
          credit: new Decimal(0),
        },
        {
          accountId: mpfExpense.id,
          debit: new Decimal(payrollRun.totalEmployerMpf),
          credit: new Decimal(0),
        },
        {
          accountId: salariesPayable.id,
          debit: new Decimal(0),
          credit: new Decimal(payrollRun.totalNetPay),
        },
        {
          accountId: mpfPayable.id,
          debit: new Decimal(0),
          credit: new Decimal(payrollRun.totalEmployeeMpf.plus(payrollRun.totalEmployerMpf)),
        },
      ];

      // Create journal entry
      const journalEntry = await createJournalEntry(tx, {
        description: `Payroll ${payrollRun.runNumber} for period ${payrollRun.periodStart.toISOString().split('T')[0]} to ${payrollRun.periodEnd.toISOString().split('T')[0]}`,
        reference: payrollRun.runNumber,
        organizationId: orgId,
        date: payrollRun.paymentDate,
        lines: journalLines,
      });

      // Update payroll run status
      const updatedPayrollRun = await tx.payrollRun.update({
        where: { id, organizationId: orgId },
        data: {
          status: "APPROVED",
          journalEntryId: journalEntry.id,
        },
        include: { lines: { include: { employee: true } } },
      });

      return updatedPayrollRun;
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error("Payroll approve error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to approve payroll" }, { status: 500 });
  }
}
