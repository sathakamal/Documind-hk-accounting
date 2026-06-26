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

    const accounts = await prisma.account.findMany({
      where: { organizationId: session.user.organizationId },
      orderBy: [{ type: "asc" }, { code: "asc" }],
    });

    return NextResponse.json({ success: true, data: accounts });
  } catch (error) {
    console.error("Accounts GET error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch accounts" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { code, name, type, classification } = body;

    if (!code || !name || !type || !classification) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const account = await prisma.account.create({
      data: {
        code,
        name,
        type,
        classification,
        balance: 0,
        organizationId: session.user.organizationId,
      },
    });

    return NextResponse.json({ success: true, data: account });
  } catch (error: any) {
    console.error("Accounts POST error:", error);
    if (error.code === "P2002") {
      return NextResponse.json({ success: false, error: "Account code already exists" }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: "Failed to create account" }, { status: 500 });
  }
}
