import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createJournalEntry } from "@/lib/journal";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const entries = await prisma.journalEntry.findMany({
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

    return NextResponse.json({ success: true, data: entries });
  } catch (error) {
    console.error("JournalEntries GET error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch journal entries" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { description, reference, date, lines } = body;

    if (!description || !lines || !Array.isArray(lines) || lines.length === 0) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    // Run transaction
    const entry = await prisma.$transaction(async (tx) => {
      return await createJournalEntry(tx, {
        description,
        reference,
        organizationId: session.user.organizationId,
        date: date ? new Date(date) : undefined,
        lines,
      });
    });

    return NextResponse.json({ success: true, data: entry });
  } catch (error: any) {
    console.error("JournalEntries POST error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to create journal entry" }, { status: 500 });
  }
}
