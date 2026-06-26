import OpenAI from "openai";
import { Decimal } from "decimal.js";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface ExtractedDocument {
  documentType: "BILL" | "INVOICE" | "RECEIPT" | "BANK_STATEMENT" | "OTHER";
  confidence: number;
  vendorName?: string;
  vendorAddress?: string;
  vendorEmail?: string;
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
  }>;
  paymentTerms?: string;
  notes?: string;
  language?: string;
}

export async function extractDocumentData(
  fileBase64: string,
  mimeType: string,
  filename: string
): Promise<ExtractedDocument> {
  const prompt = `You are an expert accounting document parser for Hong Kong businesses.
Analyze this document and extract ALL accounting data in JSON format.
The document may be in English, Traditional Chinese, Simplified Chinese, or Hindi.
Hong Kong businesses commonly deal in HKD, USD, INR, and CNY.

Extract and return ONLY valid JSON with this exact structure:
{
  "documentType": "BILL|INVOICE|RECEIPT|BANK_STATEMENT|OTHER",
  "confidence": 0.95,
  "vendorName": "Company name if this is a bill/receipt we received",
  "vendorAddress": "Vendor address",
  "vendorEmail": "Vendor email if visible",
  "customerName": "Customer name if this is an invoice we issued",
  "customerAddress": "Customer address",
  "documentNumber": "Invoice or bill number from document",
  "issueDate": "YYYY-MM-DD",
  "dueDate": "YYYY-MM-DD",
  "currency": "HKD",
  "subtotal": 1000.00,
  "taxAmount": 0,
  "totalAmount": 1000.00,
  "lineItems": [
    {
      "description": "Item description",
      "quantity": 1,
      "unitPrice": 1000.00,
      "amount": 1000.00
    }
  ],
  "paymentTerms": "Net 30",
  "notes": "Any special notes",
  "language": "en"
}

Rules:
- confidence: 0.9+ means you can clearly read all data, 0.7-0.9 means some fields unclear, below 0.7 means document is poor quality
- If currency symbol is $, check context: HK context = HKD, otherwise check for "HK$" vs "$"
- All amounts must be numbers, not strings
- Dates must be YYYY-MM-DD format
- If a field is not found, omit it from JSON
- Return ONLY the JSON object, no explanation, no markdown`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    max_tokens: 2000,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: {
              url: `data:${mimeType};base64,${fileBase64}`,
              detail: "high",
            },
          },
          {
            type: "text",
            text: prompt,
          },
        ],
      },
    ],
  });

  const content = response.choices[0].message.content || "{}";
  const clean = content.replace(/```json|```/g, "").trim();
  return JSON.parse(clean) as ExtractedDocument;
}
