import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/employees - Get all employees
export async function GET() {
  try {
    const employees = await prisma.employee.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: employees,
    });
  } catch (error) {
    console.error("Error fetching employees:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch employees" },
      { status: 500 }
    );
  }
}

// POST /api/employees - Create a new employee
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Generate employee code (EMP-001, EMP-002, etc.)
    const lastEmployee = await prisma.employee.findFirst({
      orderBy: { createdAt: "desc" },
    });
    
    let nextCode = "EMP-001";
    if (lastEmployee?.code) {
      const lastNumber = parseInt(lastEmployee.code.split("-")[1]);
      nextCode = `EMP-${(lastNumber + 1).toString().padStart(3, "0")}`;
    }

    const employee = await prisma.employee.create({
      data: {
        code: nextCode,
        name: body.name,
        hkid: body.hkid || null,
        position: body.position || null,
        department: body.department || null,
        startDate: new Date(body.startDate),
        basicSalary: parseFloat(body.basicSalary),
        housingAllowance: parseFloat(body.housingAllowance) || 0,
        mpfExempt: body.mpfExempt || false,
        status: "ACTIVE",
        notes: body.notes || null,
        organizationId: "demo-org", // Default organization for demo
      },
    });

    return NextResponse.json({
      success: true,
      data: employee,
      message: "Employee created successfully",
    });
  } catch (error) {
    console.error("Error creating employee:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create employee" },
      { status: 500 }
    );
  }
}