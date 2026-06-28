import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { exportFinancialStatementsToExcel } from "@/lib/excel";
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

    // Build trial balance
    const trialBalanceLines: any[] = [];
    let totalDebit = new Decimal(0);
    let totalCredit = new Decimal(0);

    for (const account of accounts) {
      const balance = new Decimal(account.balance);
      let debit = new Decimal(0);
      let credit = new Decimal(0);

      if (account.type === "ASSET" || account.type === "EXPENSE") {
        if (balance.greaterThanOrEqualTo(0)) {
          debit = balance;
        } else {
          credit = balance.abs();
        }
      } else {
        if (balance.greaterThanOrEqualTo(0)) {
          credit = balance;
        } else {
          debit = balance.abs();
        }
      }

      totalDebit = totalDebit.plus(debit);
      totalCredit = totalCredit.plus(credit);

      trialBalanceLines.push({
        id: account.id,
        code: account.code,
        name: account.name,
        type: account.type,
        debit: debit.toNumber(),
        credit: credit.toNumber(),
      });
    }

    // Build profit & loss
    const revenueAccounts = accounts.filter((a) => a.type === "REVENUE");
    const expenseAccounts = accounts.filter((a) => a.type === "EXPENSE");
    const totalRevenue = revenueAccounts.reduce((sum, a) => sum.plus(new Decimal(a.balance)), new Decimal(0));
    const totalExpense = expenseAccounts.reduce((sum, a) => sum.plus(new Decimal(a.balance)), new Decimal(0));
    const netProfit = totalRevenue.minus(totalExpense);

    const profitAndLoss = {
      revenue: revenueAccounts.map((a) => ({ code: a.code, name: a.name, amount: new Decimal(a.balance).toNumber() })),
      expenses: expenseAccounts.map((a) => ({ code: a.code, name: a.name, amount: new Decimal(a.balance).toNumber() })),
      totalRevenue: totalRevenue.toNumber(),
      totalExpense: totalExpense.toNumber(),
      netProfit: netProfit.toNumber(),
    };

    // Build balance sheet
    const assetAccounts = accounts.filter((a) => a.type === "ASSET");
    const liabilityAccounts = accounts.filter((a) => a.type === "LIABILITY");
    const equityAccounts = accounts.filter((a) => a.type === "EQUITY");
    const totalAssets = assetAccounts.reduce((sum, a) => sum.plus(new Decimal(a.balance)), new Decimal(0));
    const totalLiabilities = liabilityAccounts.reduce((sum, a) => sum.plus(new Decimal(a.balance)), new Decimal(0));
    const rawEquity = equityAccounts.reduce((sum, a) => sum.plus(new Decimal(a.balance)), new Decimal(0));
    const totalEquity = rawEquity.plus(netProfit);

    const balanceSheet = {
      assets: assetAccounts.map((a) => ({ code: a.code, name: a.name, amount: new Decimal(a.balance).toNumber() })),
      liabilities: liabilityAccounts.map((a) => ({ code: a.code, name: a.name, amount: new Decimal(a.balance).toNumber() })),
      equity: [
        ...equityAccounts.map((a) => ({ code: a.code, name: a.name, amount: new Decimal(a.balance).toNumber() })),
        { code: "3100-NP", name: "Current Year Net Profit", amount: netProfit.toNumber() },
      ],
      totalAssets: totalAssets.toNumber(),
      totalLiabilities: totalLiabilities.toNumber(),
      totalEquity: totalEquity.toNumber(),
      totalLiabilitiesAndEquity: totalLiabilities.plus(totalEquity).toNumber(),
    };

    const trialBalance = {
      lines: trialBalanceLines,
      totalDebit: totalDebit.toNumber(),
      totalCredit: totalCredit.toNumber(),
    };

    const workbook = await exportFinancialStatementsToExcel(trialBalance, profitAndLoss, balanceSheet);
    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": "attachment; filename=financial-statements.xlsx",
      },
    });
  } catch (error) {
    console.error("Export financial statements error:", error);
    return NextResponse.json({ success: false, error: "Failed to export financial statements" }, { status: 500 });
  }
}