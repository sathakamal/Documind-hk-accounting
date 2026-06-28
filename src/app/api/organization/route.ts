import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const organization = await prisma.organization.findUnique({
      where: { id: session.user.organizationId },
      select: {
        id: true,
        name: true,
        legalName: true,
        brNumber: true,
        address: true,
        baseCurrency: true,
        financialYearStartMonth: true,
        financialYearStartDay: true,
      },
    });

    if (!organization) {
      return NextResponse.json({ success: false, error: "Organization not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: organization });
  } catch (error) {
    console.error("Organization GET error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch organization" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      name,
      legalName,
      brNumber,
      address,
      baseCurrency,
      financialYearStartMonth,
      financialYearStartDay,
    } = body;

    const organization = await prisma.organization.update({
      where: { id: session.user.organizationId },
      data: {
        name,
        legalName,
        brNumber,
        address,
        baseCurrency,
        financialYearStartMonth,
        financialYearStartDay,
      },
    });

    return NextResponse.json({ success: true, data: organization });
  } catch (error: any) {
    console.error("Organization PUT error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to update organization" }, { status: 500 });
  }
}