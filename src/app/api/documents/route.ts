import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { put } from "@vercel/blob";
import { extractDocumentWithGemini, computeFileHash } from "@/lib/gemini";

// ─── POST /api/documents — Upload + AI extract ─────────────────────────────
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId || !session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: "Invalid file type. Allowed: PDF, JPEG, PNG, WebP, GIF" },
        { status: 400 }
      );
    }

    // Validate file size (10MB max)
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { success: false, error: "File too large. Maximum size is 10MB" },
        { status: 400 }
      );
    }

    // Convert to buffer for hashing
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Compute hash for duplicate detection
    const fileHash = computeFileHash(buffer);

    // Check for duplicate within same organization
    const existing = await prisma.document.findFirst({
      where: {
        organizationId: session.user.organizationId,
        fileHash,
      },
    });

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: "Duplicate file detected",
          duplicate: true,
          existingDocumentId: existing.id,
        },
        { status: 409 }
      );
    }

    // Upload to Vercel Blob
    const blobFilename = `${session.user.organizationId}/${Date.now()}-${file.name.replace(/\s+/g, "_")}`;
    const blob = await put(blobFilename, buffer, {
      access: "public",
      contentType: file.type,
    });

    // Save document record with PROCESSING status
    const document = await prisma.document.create({
      data: {
        filename: blobFilename,
        originalName: file.name,
        mimeType: file.type,
        fileSize: file.size,
        storageUrl: blob.url,
        fileHash,
        status: "PROCESSING",
        organizationId: session.user.organizationId,
        uploadedById: session.user.id,
      },
    });

    // Run AI extraction asynchronously (non-blocking — update DB after)
    runAIExtraction(document.id, buffer, file.type, file.name).catch(async (error) => {
      console.error("AI extraction failed:", error);
      await prisma.document.update({
        where: { id: document.id },
        data: {
          status: "ERROR",
          processingError: error instanceof Error ? error.message : "Unknown AI extraction error",
        },
      });
    });

    return NextResponse.json({ 
      success: true, 
      data: document,
      message: "Document uploaded. AI extraction in progress — refresh to see results." 
    });
  } catch (error) {
    console.error("Documents POST error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to upload document" },
      { status: 500 }
    );
  }
}

// ─── GET /api/documents — List with filters ────────────────────────────────
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status"); // UPLOADED, PROCESSING, REVIEWED, PUBLISHED, ERROR
    const documentType = searchParams.get("type"); // BILL, INVOICE, RECEIPT, etc.
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {
      organizationId: session.user.organizationId,
    };

    if (status) where.status = status;
    if (documentType) where.documentType = documentType;
    if (search) {
      where.OR = [
        { originalName: { contains: search, mode: "insensitive" } },
        { extractedData: { contains: search, mode: "insensitive" } },
      ];
    }

    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.document.count({ where }),
    ]);

    // Parse extractedData JSON for each document
    const enriched = documents.map((doc) => ({
      ...doc,
      extractedData: doc.extractedData ? JSON.parse(doc.extractedData) : null,
    }));

    return NextResponse.json({
      success: true,
      data: enriched,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Documents GET error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch documents" },
      { status: 500 }
    );
  }
}

// ─── Background AI Extraction ──────────────────────────────────────────────
async function runAIExtraction(
  documentId: string,
  buffer: Buffer,
  mimeType: string,
  filename: string
) {
  const startTime = Date.now();
  try {
    const fileBase64 = buffer.toString("base64");
    const extracted = await extractDocumentWithGemini(fileBase64, mimeType, filename);
    const processingMs = Date.now() - startTime;

    await prisma.document.update({
      where: { id: documentId },
      data: {
        status: "REVIEWED",
        documentType: extracted.documentType,
        extractedData: JSON.stringify(extracted),
        confidence: extracted.confidence,
        processingMs,
        aiModel: "gemini-2.0-flash",
        processingError: null,
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown AI error";
    await prisma.document.update({
      where: { id: documentId },
      data: {
        status: "ERROR",
        processingError: errorMessage,
      },
    });
  }
}
