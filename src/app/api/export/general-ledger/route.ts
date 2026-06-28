import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { exportGeneralLedgerToExcel } from "@/lib/excel";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const journalEntries = await prisma.journalEntry.findMany({
      where: { organizationId: session.user.organizationId },
      include: {
        lines: {
          include: {
            account: true,
          },
        },
      },
      orderBy: { date: "desc" },
    });

    const workbook = await exportGeneralLedgerToExcel(journalEntries);
    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": "attachment; filename=general-ledger.xlsx",
      },
    });
  } catch (error) {
    console.error("Export general ledger error:", error);
    return NextResponse.json({ success: false, error: "Failed to export general ledger" }, { status: 500 });
  }
}