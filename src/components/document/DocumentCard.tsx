"use client";

import { FileText, Image as ImageIcon, FileSpreadsheet, Building2, Calendar } from "lucide-react";
import { DocumentStatusBadge, type DocumentStatus } from "./DocumentStatusBadge";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export interface DocumentRecord {
  id: string;
  originalName: string;
  mimeType: string;
  fileSize: number;
  storageUrl: string;
  status: string;
  documentType: string | null;
  extractedData: {
    vendorName?: string;
    customerName?: string;
    totalAmount?: number;
    currency?: string;
    issueDate?: string;
    confidence?: number;
    documentNumber?: string;
  } | null;
  confidence: number | null;
  createdAt: string;
  billId: string | null;
  invoiceId: string | null;
}

interface DocumentCardProps {
  document: DocumentRecord;
  onClick: (document: DocumentRecord) => void;
  isSelected?: boolean;
}

function FileIcon({ mimeType }: { mimeType: string }) {
  if (mimeType.startsWith("image/")) return <ImageIcon className="w-8 h-8 text-purple-500" />;
  if (mimeType === "application/pdf") return <FileText className="w-8 h-8 text-red-500" />;
  return <FileSpreadsheet className="w-8 h-8 text-blue-500" />;
}

function ConfidenceBar({ confidence }: { confidence: number | null }) {
  if (!confidence) return null;
  const pct = Math.round(confidence * 100);
  const color = pct >= 85 ? "bg-emerald-500" : pct >= 70 ? "bg-amber-400" : "bg-red-500";

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${pct}%` }} />
      </div>
      <span className={cn("text-xs font-medium", pct >= 85 ? "text-emerald-600" : pct >= 70 ? "text-amber-600" : "text-red-600")}>
        {pct}%
      </span>
    </div>
  );
}

export function DocumentCard({ document, onClick, isSelected }: DocumentCardProps) {
  const extracted = document.extractedData;
  const partyName = extracted?.vendorName || extracted?.customerName || "—";
  const amount = extracted?.totalAmount;
  const currency = extracted?.currency || "HKD";
  const docDate = extracted?.issueDate || document.createdAt;

  const docTypeLabel: Record<string, string> = {
    BILL: "Bill",
    INVOICE: "Invoice",
    RECEIPT: "Receipt",
    BANK_STATEMENT: "Bank Stmt",
    OTHER: "Other",
  };

  return (
    <div
      onClick={() => onClick(document)}
      className={cn(
        "group relative bg-white border rounded-xl p-4 cursor-pointer transition-all duration-200",
        "hover:shadow-md hover:border-blue-300",
        isSelected ? "border-blue-500 shadow-md ring-2 ring-blue-200" : "border-gray-200"
      )}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="shrink-0 p-2 bg-gray-50 rounded-lg">
            <FileIcon mimeType={document.mimeType} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate max-w-[160px]" title={document.originalName}>
              {document.originalName}
            </p>
            {document.documentType && (
              <span className="inline-block text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded mt-0.5">
                {docTypeLabel[document.documentType] || document.documentType}
              </span>
            )}
          </div>
        </div>
        <DocumentStatusBadge status={document.status as DocumentStatus} className="shrink-0" />
      </div>

      {/* Party name */}
      {partyName !== "—" && (
        <div className="flex items-center gap-1.5 mb-2">
          <Building2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <span className="text-sm text-gray-700 truncate">{partyName}</span>
        </div>
      )}

      {/* Amount */}
      {amount !== undefined && amount !== null && (
        <div className="text-lg font-bold text-gray-900 mb-2">
          {currency} {amount.toLocaleString("en-HK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
      )}

      {/* Date & confidence */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-xs text-gray-500">
            {docDate ? format(new Date(docDate), "dd MMM yyyy") : "—"}
          </span>
        </div>
        {document.status === "REVIEWED" || document.status === "PUBLISHED" ? (
          <ConfidenceBar confidence={document.confidence} />
        ) : null}
      </div>

      {/* Published link indicator */}
      {document.status === "PUBLISHED" && (document.billId || document.invoiceId) && (
        <div className="mt-2 pt-2 border-t border-gray-100">
          <span className="text-xs text-emerald-600 font-medium">
            → Linked to {document.billId ? "Bill" : "Invoice"}
          </span>
        </div>
      )}
    </div>
  );
}
