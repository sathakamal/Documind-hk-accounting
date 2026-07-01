import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createJournalEntry } from "@/lib/journal";
import { Decimal } from "decimal.js";
import { initialAccounts } from "@/lib/initialAccounts";
import { isAdmin } from "@/lib/rbac";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId || !isAdmin(session)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    const orgId = session.user.organizationId;

    // Get the payroll run
    const payrollRun = await prisma.payrollRun.findUnique({
      where: { id, organizationId: orgId },
      include: { lines: true },
    });

    if (!payrollRun) {
      throw new Error("Payroll run not found");
    }

    if (payrollRun.status !== "DRAFT") {
      throw new Error("Payroll run is not in DRAFT status");
    }

    // Helper to get or create account
    const getOrCreateAccount = async (code: string) => {
      let acc = await prisma.account.findFirst({
        where: { organizationId: orgId, code },
        select: { id: true, balance: true, type: true, code: true }
      });
      
      if (!acc) {
        const initial = initialAccounts.find(a => a.code === code);
        if (initial) {
          acc = await prisma.account.create({
            data: {
              ...initial,
              balance: 0,
              organizationId: orgId,
            },
            select: { id: true, balance: true, type: true, code: true }
          });
        }
      }
      return acc;
    };

    // Get the necessary accounts
    const salariesExpense = await getOrCreateAccount("6010");
    const housingAllowanceExpense = await getOrCreateAccount("6060");
    const mpfExpense = await getOrCreateAccount("6020");
    const mpfPayable = await getOrCreateAccount("2210");
    const cashAccount = await getOrCreateAccount("1010");
    const salariesPayable = await getOrCreateAccount("2200");

    if (!salariesExpense || !mpfExpense || !mpfPayable || !cashAccount || !salariesPayable) {
      throw new Error("Required accounts not found and could not be auto-created. Please set up your chart of accounts.");
    }

    // Calculate total housing allowance
    const totalHousingAllowance = payrollRun.lines.reduce((sum, line) => 
      sum.plus(new Decimal(line.housingAllowance)), new Decimal(0)
    );
    const totalBasicSalary = payrollRun.totalGrossPay.minus(totalHousingAllowance);

    // Create journal entry lines
    const journalLines: any[] = [
      {
        accountId: salariesExpense.id,
        debit: new Decimal(totalBasicSalary),
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

    if (housingAllowanceExpense && totalHousingAllowance.greaterThan(0)) {
      journalLines.push({
        accountId: housingAllowanceExpense.id,
        debit: new Decimal(totalHousingAllowance),
        credit: new Decimal(0),
      });
    }

    // Create journal entry WITHOUT transaction to avoid HTTP transaction limits
    const journalEntry = await createJournalEntry(prisma, {
      description: `Payroll ${payrollRun.runNumber} for period ${payrollRun.periodStart.toISOString().split('T')[0]} to ${payrollRun.periodEnd.toISOString().split('T')[0]}`,
      reference: payrollRun.runNumber,
      organizationId: orgId,
      date: payrollRun.paymentDate,
      lines: journalLines,
    });

    // Update payroll run status WITHOUT include to avoid implicit transactions
    await prisma.payrollRun.update({
      where: { id, organizationId: orgId },
      data: {
        status: "APPROVED",
        journalEntryId: journalEntry.id,
      },
      select: { id: true }
    });

    // Fetch the updated payroll run with all relations in a separate read operation
    const result = await prisma.payrollRun.findUnique({
      where: { id, organizationId: orgId },
      include: { 
        lines: { 
          include: { 
            employee: true 
          } 
        },
        journalEntry: {
          include: {
            lines: {
              include: {
                account: true
              }
            }
          }
        }
      },
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error("Payroll approve error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to approve payroll" }, { status: 500 });
  }
}
