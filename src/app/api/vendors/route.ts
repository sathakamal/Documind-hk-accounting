import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const vendors = await prisma.vendor.findMany({
      where: { organizationId: session.user.organizationId },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ success: true, data: vendors });
  } catch (error) {
    console.error("Vendors GET error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch vendors" },
      { status: 500 }
    );
  }
}
