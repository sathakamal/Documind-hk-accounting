import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { exportInvoicesToExcel } from "@/lib/excel";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const invoices = await prisma.invoice.findMany({
      where: { organizationId: session.user.organizationId },
      include: { customer: true },
    });

    const workbook = await exportInvoicesToExcel(invoices as any);
    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": "attachment; filename=invoices.xlsx",
      },
    });
  } catch (error) {
    console.error("Export invoices error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to export invoices" },
      { status: 500 }
    );
  }
}
