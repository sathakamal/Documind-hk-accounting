import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { exportTrialBalanceToExcel } from "@/lib/excel";
import { Decimal } from "decimal.js";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const accounts = await prisma.account.findMany({
      where: { organizationId: session.user.organizationId },
      orderBy: { code: "asc" },
    });

    // Calculate totals
    let totalDebit = new Decimal(0);
    let totalCredit = new Decimal(0);

    for (const account of accounts) {
      const balance = new Decimal(account.balance);
      if (account.type === "ASSET" || account.type === "EXPENSE") {
        if (balance.greaterThanOrEqualTo(0)) {
          totalDebit = totalDebit.plus(balance);
        } else {
          totalCredit = totalCredit.plus(balance.abs());
        }
      } else {
        if (balance.greaterThanOrEqualTo(0)) {
          totalCredit = totalCredit.plus(balance);
        } else {
          totalDebit = totalDebit.plus(balance.abs());
        }
      }
    }

    const workbook = await exportTrialBalanceToExcel(accounts, totalDebit.toNumber(), totalCredit.toNumber());
    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": "attachment; filename=trial-balance.xlsx",
      },
    });
  } catch (error) {
    console.error("Export trial balance error:", error);
    return NextResponse.json({ success: false, error: "Failed to export trial balance" }, { status: 500 });
  }
}