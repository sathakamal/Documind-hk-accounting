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

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { code, name, email, phone, address, country, currency, paymentTerms, bankDetails, notes } = body;

    if (!code || !name) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const vendor = await prisma.vendor.create({
      data: {
        code,
        name,
        email: email || null,
        phone: phone || null,
        address: address || null,
        country: country || "Hong Kong",
        currency: currency || "HKD",
        paymentTerms: paymentTerms || 30,
        bankDetails: bankDetails || null,
        notes: notes || null,
        organizationId: session.user.organizationId,
      },
    });

    return NextResponse.json({ success: true, data: vendor });
  } catch (error: any) {
    console.error("Vendors POST error:", error);
    if (error.code === "P2002") {
      return NextResponse.json({ success: false, error: "Vendor code already exists" }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: "Failed to create vendor" }, { status: 500 });
  }
}
