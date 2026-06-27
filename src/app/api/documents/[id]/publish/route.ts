import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

// ─── POST /api/documents/[id]/publish ─────────────────────────────────────
// One-click: create Bill or Invoice from AI-extracted document data
export async function POST(request: Request, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    const body = await request.json();
    const { publishAs } = body; // "BILL" | "INVOICE"

    if (!publishAs || !["BILL", "INVOICE"].includes(publishAs)) {
      return NextResponse.json(
        { success: false, error: "publishAs must be BILL or INVOICE" },
        { status: 400 }
      );
    }

    // Fetch the document
    const document = await prisma.document.findFirst({
      where: { id, organizationId: session.user.organizationId },
    });
    if (!document) {
      return NextResponse.json({ success: false, error: "Document not found" }, { status: 404 });
    }
    if (document.status === "PUBLISHED") {
      return NextResponse.json({ success: false, error: "Document already published" }, { status: 409 });
    }

    const extracted = document.extractedData ? JSON.parse(document.extractedData) : {};
    const orgId = session.user.organizationId;

    if (publishAs === "BILL") {
      // Find or create vendor
      let vendor = await prisma.vendor.findFirst({
        where: {
          organizationId: orgId,
          name: extracted.vendorName || "Unknown Vendor",
        },
      });

      if (!vendor) {
        const vendorCount = await prisma.vendor.count({ where: { organizationId: orgId } });
        vendor = await prisma.vendor.create({
          data: {
            code: `VEN-${String(vendorCount + 1).padStart(4, "0")}`,
            name: extracted.vendorName || "Unknown Vendor",
            email: extracted.vendorEmail || null,
            address: extracted.vendorAddress || null,
            currency: extracted.currency || "HKD",
            organizationId: orgId,
          },
        });
      }

      // Generate bill number
      const billCount = await prisma.bill.count({ where: { organizationId: orgId } });
      const billNumber = `BILL-${new Date().getFullYear()}-${String(billCount + 1).padStart(4, "0")}`;

      const totalAmount = extracted.totalAmount || 0;
      const taxAmount = extracted.taxAmount || 0;
      const subtotal = extracted.subtotal || totalAmount - taxAmount;

      const bill = await prisma.bill.create({
        data: {
          billNumber,
          vendorBillRef: extracted.documentNumber || null,
          vendorId: vendor.id,
          issueDate: extracted.issueDate ? new Date(extracted.issueDate) : new Date(),
          dueDate: extracted.dueDate ? new Date(extracted.dueDate) : new Date(Date.now() + 30 * 86400000),
          status: "DRAFT",
          currency: extracted.currency || "HKD",
          subtotal,
          taxAmount,
          totalAmount,
          balanceDue: totalAmount,
          totalHkd: totalAmount, // Simplified; real FX conversion would be separate
          notes: extracted.notes || null,
          taxStatus: extracted.taxStatus || "ONSHORE",
          organizationId: orgId,
          lines: {
            create: (extracted.lineItems || [{ description: extracted.notes || "Service", quantity: 1, unitPrice: totalAmount, amount: totalAmount }]).map(
              (item: { description: string; quantity: number; unitPrice: number; amount: number; category?: string }, idx: number) => ({
                description: item.description,
                quantity: item.quantity || 1,
                unitPrice: item.unitPrice || 0,
                amount: item.amount || 0,
                taxRate: 0,
                category: item.category || null,
                sortOrder: idx,
              })
            ),
          },
        },
      });

      // Link document to bill
      await prisma.document.update({
        where: { id },
        data: { billId: bill.id, status: "PUBLISHED" },
      });

      return NextResponse.json({ success: true, data: { type: "BILL", record: bill } });
    }

    if (publishAs === "INVOICE") {
      // Find or create customer
      let customer = await prisma.customer.findFirst({
        where: {
          organizationId: orgId,
          name: extracted.customerName || "Unknown Customer",
        },
      });

      if (!customer) {
        const custCount = await prisma.customer.count({ where: { organizationId: orgId } });
        customer = await prisma.customer.create({
          data: {
            code: `CUST-${String(custCount + 1).padStart(4, "0")}`,
            name: extracted.customerName || "Unknown Customer",
            address: extracted.customerAddress || null,
            currency: extracted.currency || "HKD",
            organizationId: orgId,
          },
        });
      }

      // Generate invoice number
      const invCount = await prisma.invoice.count({ where: { organizationId: orgId } });
      const invoiceNumber = extracted.documentNumber || `INV-${new Date().getFullYear()}-${String(invCount + 1).padStart(4, "0")}`;

      const totalAmount = extracted.totalAmount || 0;
      const taxAmount = extracted.taxAmount || 0;
      const subtotal = extracted.subtotal || totalAmount - taxAmount;

      const invoice = await prisma.invoice.create({
        data: {
          invoiceNumber,
          customerId: customer.id,
          issueDate: extracted.issueDate ? new Date(extracted.issueDate) : new Date(),
          dueDate: extracted.dueDate ? new Date(extracted.dueDate) : new Date(Date.now() + 30 * 86400000),
          status: "DRAFT",
          currency: extracted.currency || "HKD",
          subtotal,
          taxAmount,
          totalAmount,
          balanceDue: totalAmount,
          totalHkd: totalAmount,
          notes: extracted.notes || null,
          taxStatus: extracted.taxStatus || "ONSHORE",
          organizationId: orgId,
          lines: {
            create: (extracted.lineItems || [{ description: extracted.notes || "Service", quantity: 1, unitPrice: totalAmount, amount: totalAmount }]).map(
              (item: { description: string; quantity: number; unitPrice: number; amount: number; category?: string }, idx: number) => ({
                description: item.description,
                quantity: item.quantity || 1,
                unitPrice: item.unitPrice || 0,
                amount: item.amount || 0,
                taxRate: 0,
                category: item.category || null,
                sortOrder: idx,
              })
            ),
          },
        },
      });

      // Link document to invoice
      await prisma.document.update({
        where: { id },
        data: { invoiceId: invoice.id, status: "PUBLISHED" },
      });

      return NextResponse.json({ success: true, data: { type: "INVOICE", record: invoice } });
    }
  } catch (error) {
    console.error("Publish error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to publish document" },
      { status: 500 }
    );
  }
}
