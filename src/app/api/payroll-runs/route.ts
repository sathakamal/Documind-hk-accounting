import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateMPF, generatePayrollRunNumber } from "@/lib/payroll";
import { createJournalEntry } from "@/lib/journal";
import { Decimal } from "decimal.js";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const payrollRuns = await prisma.payrollRun.findMany({
      where: { organizationId: session.user.organizationId },
      include: { lines: { include: { employee: true } } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: payrollRuns });
  } catch (error) {
    console.error("Payroll runs GET error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch payroll runs" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { periodStart, periodEnd, paymentDate, employeeIds, notes } = body;
    
    const orgId = session.user.organizationId;
    
    // Get employees
    const employees = await prisma.employee.findMany({
      where: { 
        organizationId: orgId,
        id: { in: employeeIds },
        status: "ACTIVE",
      },
    });

    if (employees.length === 0) {
      return NextResponse.json({ success: false, error: "No active employees found" }, { status: 400 });
    }

    // Generate payroll run number
    const runNumber = generatePayrollRunNumber(new Date(paymentDate));

    // Calculate payroll for each employee
    let totalGrossPay = new Decimal(0);
    let totalEmployeeMpf = new Decimal(0);
    let totalEmployerMpf = new Decimal(0);
    let totalNetPay = new Decimal(0);
    let totalCost = new Decimal(0);

    const payrollLines = employees.map(emp => {
      const basic = new Decimal(emp.basicSalary);
      const housing = new Decimal(emp.housingAllowance);
      const gross = basic.plus(housing);
      
      const mpf = calculateMPF(basic, emp.mpfExempt);
      const net = gross.minus(mpf.employee);
      const cost = gross.plus(mpf.employer);

      totalGrossPay = totalGrossPay.plus(gross);
      totalEmployeeMpf = totalEmployeeMpf.plus(mpf.employee);
      totalEmployerMpf = totalEmployerMpf.plus(mpf.employer);
      totalNetPay = totalNetPay.plus(net);
      totalCost = totalCost.plus(cost);

      return {
        employeeId: emp.id,
        basicSalary: basic,
        housingAllowance: housing,
        grossPay: gross,
        employeeMpf: mpf.employee,
        netPay: net,
        employerMpf: mpf.employer,
        totalCost: cost,
      };
    });

    // Create payroll run WITHOUT nested writes to avoid HTTP transaction limits
    const payrollRun = await prisma.payrollRun.create({
      data: {
        runNumber,
        periodStart: new Date(periodStart),
        periodEnd: new Date(periodEnd),
        paymentDate: new Date(paymentDate),
        status: "DRAFT",
        totalGrossPay,
        totalEmployeeMpf,
        totalEmployerMpf,
        totalNetPay,
        totalCost,
        notes,
        organizationId: orgId,
      },
    });

    // Create lines separately
    await Promise.all(payrollLines.map(line => 
      prisma.payrollLine.create({
        data: {
          ...line,
          payrollRunId: payrollRun.id,
        }
      })
    ));

    const result = await prisma.payrollRun.findUnique({
      where: { id: payrollRun.id },
      include: { lines: { include: { employee: true } } },
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error("Payroll runs POST error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to create payroll run" }, { status: 500 });
  }
}
