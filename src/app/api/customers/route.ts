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

    const customers = await prisma.customer.findMany({
      where: { organizationId: session.user.organizationId },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ success: true, data: customers });
  } catch (error) {
    console.error("Customers GET error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch customers" },
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
    const { code, name, email, phone, address, country, currency, paymentTerms, creditLimit, notes } = body;

    if (!code || !name) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const customer = await prisma.customer.create({
      data: {
        code,
        name,
        email: email || null,
        phone: phone || null,
        address: address || null,
        country: country || "Hong Kong",
        currency: currency || "HKD",
        paymentTerms: paymentTerms || 30,
        creditLimit: creditLimit || 0,
        notes: notes || null,
        organizationId: session.user.organizationId,
      },
    });

    return NextResponse.json({ success: true, data: customer });
  } catch (error: any) {
    console.error("Customers POST error:", error);
    if (error.code === "P2002") {
      return NextResponse.json({ success: false, error: "Customer code already exists" }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: "Failed to create customer" }, { status: 500 });
  }
}
