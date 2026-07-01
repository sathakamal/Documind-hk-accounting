import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const validation = registerSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ 
        success: false, 
        error: "Validation failed",
        details: validation.error.errors 
      }, { status: 400 });
    }

    const { name, email, password, orgName } = validation.data;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "User already exists" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const org = await prisma.organization.create({
      data: {
        name: orgName,
      },
    });

    await prisma.orgCurrency.createMany({
      data: [
        { code: "HKD", name: "Hong Kong Dollar", symbol: "$", isBase: true, organizationId: org.id },
        { code: "USD", name: "US Dollar", symbol: "$", isBase: false, organizationId: org.id },
      ],
    });

    await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "ADMIN",
        organizationId: org.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create account" },
      { status: 500 }
    );
  }
}
