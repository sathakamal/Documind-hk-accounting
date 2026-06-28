import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Decimal } from "@prisma/client";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const organizationId = session.user.organizationId;

    const [invoices, bills, documents] = await Promise.all([
      prisma.invoice.findMany({
        where: { organizationId, status: { not: "VOIDED" } },
        select: { totalHkd: true, balanceDue: true, status: true, dueDate: true },
      }),
      prisma.bill.findMany({
        where: { organizationId, status: { not: "VOIDED" } },
        select: { totalHkd: true, balanceDue: true, status: true, dueDate: true },
      }),
      prisma.document.count({
        where: {
          organizationId,
          status: "PROCESSED",
          billId: null,
          invoiceId: null,
        },
      }),
    ]);

    const totalAR = invoices.reduce(
      (sum, inv) => sum.add(new Decimal(inv.balanceDue || 0)),
      new Decimal(0)
    );

    const totalAP = bills.reduce(
      (sum, bill) => sum.add(new Decimal(bill.balanceDue || 0)),
      new Decimal(0)
    );

    const overdueBills = bills.filter(
      (bill) =>
        new Date(bill.dueDate) < new Date() &&
        bill.status !== "PAID" &&
        bill.status !== "VOIDED"
    );

    return NextResponse.json({
      success: true,
      data: {
        totalAR: parseFloat(totalAR.toString()),
        totalAP: parseFloat(totalAP.toString()),
        overdueBillsCount: overdueBills.length,
        overdueBillsAmount: overdueBills.reduce(
          (sum, bill) => sum.add(new Decimal(bill.balanceDue || 0)),
          new Decimal(0)
        ).toNumber(),
        pendingDocsCount: documents,
      },
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to get dashboard metrics" },
      { status: 500 }
    );
  }
}
