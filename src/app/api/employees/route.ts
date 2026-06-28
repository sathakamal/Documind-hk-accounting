import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateEmployeeCode } from "@/lib/payroll";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const employees = await prisma.employee.findMany({
      where: { organizationId: session.user.organizationId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: employees });
  } catch (error) {
    console.error("Employees GET error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch employees" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, hkid, position, department, startDate, basicSalary, housingAllowance, mpfExempt, notes } = body;
    
    const orgId = session.user.organizationId;
    
    // Get next employee number
    const lastEmployee = await prisma.employee.findFirst({
      where: { organizationId: orgId },
      orderBy: { createdAt: "desc" },
    });
    
    const nextNumber = lastEmployee 
      ? parseInt(lastEmployee.code.split("-")[1]) + 1 
      : 1;
    
    const code = generateEmployeeCode(nextNumber);

    const employee = await prisma.employee.create({
      data: {
        code,
        name,
        hkid,
        position,
        department,
        startDate: new Date(startDate),
        basicSalary,
        housingAllowance: housingAllowance || 0,
        mpfExempt: mpfExempt || false,
        notes,
        organizationId: orgId,
      },
    });

    return NextResponse.json({ success: true, data: employee });
  } catch (error: any) {
    console.error("Employees POST error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to create employee" }, { status: 500 });
  }
}
