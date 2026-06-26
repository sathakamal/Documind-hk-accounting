import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { exportBillsToExcel } from "@/lib/excel";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const bills = await prisma.bill.findMany({
      where: { organizationId: session.user.organizationId },
      include: { vendor: true },
    });

    const workbook = await exportBillsToExcel(bills as any);
    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": "attachment; filename=bills.xlsx",
      },
    });
  } catch (error) {
    console.error("Export bills error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to export bills" },
      { status: 500 }
    );
  }
}
