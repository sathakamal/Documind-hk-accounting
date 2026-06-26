import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Decimal } from "decimal.js";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const taxStatusFilter = searchParams.get("taxStatus"); // "ONSHORE" or "OFFSHORE" (for tax auditing)

    // Retrieve all accounts
    const accounts = await prisma.account.findMany({
      where: { organizationId: session.user.organizationId },
      orderBy: { code: "asc" },
    });

    // We can also compute on-the-fly filtering if a tax filter is active.
    // In that case, we sum lines from journal entries matching invoices/bills of that taxStatus.
    // But for a general report, using the pre-calculated account balances is extremely fast and reliable.
    
    // --- 1. TRIAL BALANCE ---
    let trialBalanceLines: any[] = [];
    let totalDebit = new Decimal(0);
    let totalCredit = new Decimal(0);

    for (const acc of accounts) {
      const balance = new Decimal(acc.balance);
      let debit = new Decimal(0);
      let credit = new Decimal(0);

      if (acc.type === "ASSET" || acc.type === "EXPENSE") {
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
        id: acc.id,
        code: acc.code,
        name: acc.name,
        type: acc.type,
        debit: debit.toNumber(),
        credit: credit.toNumber(),
      });
    }

    // --- 2. PROFIT & LOSS ---
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

    // --- 3. BALANCE SHEET ---
    const assetAccounts = accounts.filter((a) => a.type === "ASSET");
    const liabilityAccounts = accounts.filter((a) => a.type === "LIABILITY");
    const equityAccounts = accounts.filter((a) => a.type === "EQUITY");

    const totalAssets = assetAccounts.reduce((sum, a) => sum.plus(new Decimal(a.balance)), new Decimal(0));
    const totalLiabilities = liabilityAccounts.reduce((sum, a) => sum.plus(new Decimal(a.balance)), new Decimal(0));
    const rawEquity = equityAccounts.reduce((sum, a) => sum.plus(new Decimal(a.balance)), new Decimal(0));
    
    // Retained earnings includes Current Net Profit for the sheet to balance
    const totalEquity = rawEquity.plus(netProfit);

    const balanceSheet = {
      assets: assetAccounts.map((a) => ({ code: a.code, name: a.name, amount: new Decimal(a.balance).toNumber() })),
      liabilities: liabilityAccounts.map((a) => ({ code: a.code, name: a.name, amount: new Decimal(a.balance).toNumber() })),
      equity: [
        ...equityAccounts.map((a) => ({ code: a.code, name: a.name, amount: new Decimal(a.balance).toNumber() })),
        { code: "3100-NP", name: "Current Year Net Profit", amount: netProfit.toNumber() }
      ],
      totalAssets: totalAssets.toNumber(),
      totalLiabilities: totalLiabilities.toNumber(),
      totalEquity: totalEquity.toNumber(),
      totalLiabilitiesAndEquity: totalLiabilities.plus(totalEquity).toNumber(),
    };

    return NextResponse.json({
      success: true,
      data: {
        trialBalance: {
          lines: trialBalanceLines,
          totalDebit: totalDebit.toNumber(),
          totalCredit: totalCredit.toNumber(),
        },
        profitAndLoss,
        balanceSheet,
      },
    });
  } catch (error) {
    console.error("Financials GET error:", error);
    return NextResponse.json({ success: false, error: "Failed to generate financials" }, { status: 500 });
  }
}
