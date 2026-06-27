import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export interface ExtractedDocument {
  documentType: "BILL" | "INVOICE" | "RECEIPT" | "BANK_STATEMENT" | "OTHER";
  confidence: number;
  vendorName?: string;
  vendorAddress?: string;
  vendorEmail?: string;
  vendorBRNumber?: string; // HK Business Registration Number
  customerName?: string;
  customerAddress?: string;
  documentNumber?: string;
  issueDate?: string;
  dueDate?: string;
  currency?: string;
  subtotal?: number;
  taxAmount?: number;
  totalAmount?: number;
  lineItems?: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
    category?: string;
  }>;
  paymentTerms?: string;
  bankDetails?: string;
  notes?: string;
  language?: string;
  taxStatus?: "ONSHORE" | "OFFSHORE"; // HK profit tax classification
}

const EXTRACTION_PROMPT = `You are an expert accounting document parser for Hong Kong businesses.
Analyze this document carefully and extract ALL accounting data in JSON format.

The document may be in English, Traditional Chinese (繁體中文), Simplified Chinese (简体中文), Hindi, or mixed languages.
Hong Kong businesses commonly deal in HKD (港幣), USD, CNY (人民幣), EUR, GBP, and INR.

Extract and return ONLY valid JSON with this exact structure (omit fields not found):
{
  "documentType": "BILL|INVOICE|RECEIPT|BANK_STATEMENT|OTHER",
  "confidence": 0.95,
  "vendorName": "Supplier company name (if this is a bill/receipt we RECEIVED)",
  "vendorAddress": "Supplier full address",
  "vendorEmail": "Supplier email if visible",
  "vendorBRNumber": "HK Business Registration number if visible (format: XXXXXXXX-XXX-XX-XX)",
  "customerName": "Customer/buyer name (if this is an invoice we ISSUED)",
  "customerAddress": "Customer address",
  "documentNumber": "Invoice/bill/receipt number from document",
  "issueDate": "YYYY-MM-DD",
  "dueDate": "YYYY-MM-DD",
  "currency": "HKD",
  "subtotal": 1000.00,
  "taxAmount": 0,
  "totalAmount": 1000.00,
  "lineItems": [
    {
      "description": "Item or service description",
      "quantity": 1,
      "unitPrice": 1000.00,
      "amount": 1000.00,
      "category": "OPERATING_EXPENSE"
    }
  ],
  "paymentTerms": "Net 30",
  "bankDetails": "Bank account info for payment if shown",
  "notes": "Any special notes, PO numbers, or references",
  "language": "en",
  "taxStatus": "ONSHORE"
}

IMPORTANT RULES:
- confidence: 0.9+ = clearly readable, 0.7-0.9 = some fields unclear, <0.7 = poor quality
- Currency detection: "HK$" or "港幣" = HKD; bare "$" in HK context = HKD; "RMB" or "人民幣" = CNY
- documentType logic: BILL = we received it (vendor charges us); INVOICE = we issued it (we charge customer); RECEIPT = proof of payment
- taxStatus: OFFSHORE if document mentions offshore services, non-HK work location, or "offshore claim"
- All monetary amounts must be numbers (not strings)
- Dates MUST be in YYYY-MM-DD format
- Return ONLY the JSON object, no markdown, no explanation`;

export async function extractDocumentWithGemini(
  fileBase64: string,
  mimeType: string,
  filename: string
): Promise<ExtractedDocument> {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    safetySettings: [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
    ],
  });

  const imagePart = {
    inlineData: {
      data: fileBase64,
      mimeType: mimeType as string,
    },
  };

  const result = await model.generateContent([EXTRACTION_PROMPT, imagePart]);
  const text = result.response.text();
  // Strip any markdown code fences if present
  const clean = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();

  try {
    return JSON.parse(clean) as ExtractedDocument;
  } catch {
    // If JSON parse fails, return minimal fallback
    return {
      documentType: "OTHER",
      confidence: 0.1,
      notes: `AI extraction returned non-JSON response: ${clean.substring(0, 200)}`,
    };
  }
}

/** Compute a simple hash from a Buffer for duplicate detection */
export function computeFileHash(buffer: Buffer): string {
  const crypto = require("crypto") as typeof import("crypto");
  return crypto.createHash("md5").update(buffer).digest("hex");
}
