import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { initialAccounts } from "@/lib/initialAccounts";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const orgId = session.user.organizationId;

    // 1. Seed necessary accounts first (required for payroll approval)
    // We use individual calls without upsert/transaction to avoid HTTP transaction limits
    for (const acc of initialAccounts) {
      const existingAcc = await prisma.account.findFirst({
        where: {
          organizationId: orgId,
          code: acc.code,
        },
      });

      if (!existingAcc) {
        await prisma.account.create({
          data: {
            ...acc,
            balance: 0,
            organizationId: orgId,
          },
        });
      }
    }

    // 2. Demo employees to seed
    const employees = [
      {
        code: "EMP-0001",
        name: "Arumugam OmSathasivam",
        hkid: "A123456(7)",
        position: "Managing Director",
        department: "Management",
        startDate: new Date("2023-01-01"),
        basicSalary: 60000,
        housingAllowance: 15000,
        mpfExempt: false,
        status: "ACTIVE",
      },
      {
        code: "EMP-0002",
        name: "Tan Mei Ling",
        hkid: "B987654(3)",
        position: "Senior Accountant",
        department: "Finance",
        startDate: new Date("2023-06-15"),
        basicSalary: 45000,
        housingAllowance: 8000,
        mpfExempt: false,
        status: "ACTIVE",
      },
      {
        code: "EMP-0003",
        name: "Rajesh Kumar",
        hkid: null,
        position: "Operations Manager",
        department: "Operations",
        startDate: new Date("2024-01-01"),
        basicSalary: 35000,
        housingAllowance: 5000,
        mpfExempt: false,
        status: "ACTIVE",
      },
      {
        code: "EMP-0004",
        name: "Sarah Johnson",
        hkid: null,
        position: "Marketing Executive",
        department: "Marketing",
        startDate: new Date("2024-03-01"),
        basicSalary: 28000,
        housingAllowance: 3000,
        mpfExempt: true, // Expat
        status: "ACTIVE",
      },
      {
        code: "EMP-0005",
        name: "Chan Tai Man",
        hkid: "C555555(0)",
        position: "Admin Assistant",
        department: "Admin",
        startDate: new Date("2024-01-01"),
        basicSalary: 18000,
        housingAllowance: 0,
        mpfExempt: false,
        status: "ACTIVE",
      },
    ];

    // 3. Insert employees one by one without upsert to avoid HTTP transaction limits
    for (const emp of employees) {
      const existingEmp = await prisma.employee.findFirst({
        where: {
          organizationId: orgId,
          code: emp.code,
        },
      });

      if (!existingEmp) {
        await prisma.employee.create({
          data: {
            ...emp,
            organizationId: orgId,
          },
        });
      } else {
        await prisma.employee.update({
          where: { id: existingEmp.id },
          data: {
            name: emp.name,
            position: emp.position,
            department: emp.department,
            basicSalary: emp.basicSalary,
            housingAllowance: emp.housingAllowance,
            mpfExempt: emp.mpfExempt,
            status: emp.status,
          },
        });
      }
    }

    return NextResponse.json({ success: true, message: "Payroll data and required accounts seeded successfully!" });
  } catch (error: any) {
    console.error("Payroll seed error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to seed payroll data" }, { status: 500 });
  }
}

