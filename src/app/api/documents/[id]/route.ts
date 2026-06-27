import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { del } from "@vercel/blob";

type Params = { params: Promise<{ id: string }> };

// ─── GET /api/documents/[id] ───────────────────────────────────────────────
export async function GET(_req: Request, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;

    const document = await prisma.document.findFirst({
      where: { id, organizationId: session.user.organizationId },
    });

    if (!document) {
      return NextResponse.json({ success: false, error: "Document not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        ...document,
        extractedData: document.extractedData ? JSON.parse(document.extractedData) : null,
      },
    });
  } catch (error) {
    console.error("Document GET error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch document" }, { status: 500 });
  }
}

// ─── PATCH /api/documents/[id] — Update extracted data ────────────────────
export async function PATCH(request: Request, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    const body = await request.json();

    // Find the document first
    const existing = await prisma.document.findFirst({
      where: { id, organizationId: session.user.organizationId },
    });
    if (!existing) {
      return NextResponse.json({ success: false, error: "Document not found" }, { status: 404 });
    }

    // Merge updated extractedData with existing
    const currentData = existing.extractedData ? JSON.parse(existing.extractedData) : {};
    const updatedData = body.extractedData ? { ...currentData, ...body.extractedData } : currentData;

    const updated = await prisma.document.update({
      where: { id },
      data: {
        extractedData: JSON.stringify(updatedData),
        documentType: body.documentType ?? existing.documentType,
        status: body.status ?? existing.status,
      },
    });

    return NextResponse.json({
      success: true,
      data: { ...updated, extractedData: updatedData },
    });
  } catch (error) {
    console.error("Document PATCH error:", error);
    return NextResponse.json({ success: false, error: "Failed to update document" }, { status: 500 });
  }
}

// ─── DELETE /api/documents/[id] ───────────────────────────────────────────
export async function DELETE(_req: Request, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;

    const document = await prisma.document.findFirst({
      where: { id, organizationId: session.user.organizationId },
    });
    if (!document) {
      return NextResponse.json({ success: false, error: "Document not found" }, { status: 404 });
    }

    // Delete from Vercel Blob
    try {
      await del(document.storageUrl);
    } catch {
      // Continue even if blob deletion fails (file may not exist)
    }

    await prisma.document.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Document deleted" });
  } catch (error) {
    console.error("Document DELETE error:", error);
    return NextResponse.json({ success: false, error: "Failed to delete document" }, { status: 500 });
  }
}
