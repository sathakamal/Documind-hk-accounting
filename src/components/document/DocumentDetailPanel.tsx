"use client";

import { useState, useEffect } from "react";
import { X, ExternalLink, CheckCircle2, AlertTriangle, Loader2, FileText, Trash2, Edit3, Save } from "lucide-react";
import { DocumentStatusBadge, type DocumentStatus } from "./DocumentStatusBadge";
import type { DocumentRecord } from "./DocumentCard";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface DocumentDetailPanelProps {
  document: DocumentRecord | null;
  onClose: () => void;
  onUpdate: () => void; // Refresh list after changes
}

function ConfidenceIndicator({ confidence }: { confidence: number | null }) {
  if (!confidence) return null;
  const pct = Math.round(confidence * 100);
  const level = pct >= 85 ? "high" : pct >= 70 ? "medium" : "low";
  const config = {
    high: { label: "High confidence", color: "text-emerald-600 bg-emerald-50 border-emerald-200", icon: <CheckCircle2 className="w-4 h-4" /> },
    medium: { label: "Medium confidence", color: "text-amber-600 bg-amber-50 border-amber-200", icon: <AlertTriangle className="w-4 h-4" /> },
    low: { label: "Low confidence — please verify", color: "text-red-600 bg-red-50 border-red-200", icon: <AlertTriangle className="w-4 h-4" /> },
  }[level];

  return (
    <div className={cn("flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium", config.color)}>
      {config.icon}
      {config.label} ({pct}%)
    </div>
  );
}

export function DocumentDetailPanel({ document, onClose, onUpdate }: DocumentDetailPanelProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editData, setEditData] = useState<Record<string, unknown>>({});

  useEffect(() => {
    if (document?.extractedData) {
      setEditData(document.extractedData as Record<string, unknown>);
    }
    setIsEditing(false);
  }, [document?.id]);

  if (!document) return null;

  const extracted = document.extractedData || {};

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/documents/${document.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ extractedData: editData }),
      });
      if (!res.ok) throw new Error("Failed to save");
      toast.success("Changes saved");
      setIsEditing(false);
      onUpdate();
    } catch {
      toast.error("Failed to save changes");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async (publishAs: "BILL" | "INVOICE") => {
    setIsPublishing(true);
    try {
      const res = await fetch(`/api/documents/${document.id}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publishAs }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to publish");
      toast.success(`✅ ${publishAs === "BILL" ? "Bill" : "Invoice"} created successfully!`);
      onUpdate();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to publish");
    } finally {
      setIsPublishing(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this document? This cannot be undone.")) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/documents/${document.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Document deleted");
      onUpdate();
      onClose();
    } catch {
      toast.error("Failed to delete document");
    } finally {
      setIsDeleting(false);
    }
  };

  const Field = ({ label, field, type = "text" }: { label: string; field: string; type?: string }) => {
    const value = (isEditing ? editData[field] : (extracted as Record<string, unknown>)[field]) as string | number | undefined;
    if (!isEditing && !value) return null;
    return (
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-0.5">{label}</label>
        {isEditing ? (
          <input
            type={type}
            value={String(value ?? "")}
            onChange={(e) => setEditData((prev) => ({ ...prev, [field]: type === "number" ? parseFloat(e.target.value) || 0 : e.target.value }))}
            className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        ) : (
          <p className="text-sm text-gray-900 font-medium">{String(value)}</p>
        )}
      </div>
    );
  };

  const docType = document.documentType || (extracted as Record<string, unknown>).documentType as string;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-w-xl bg-white shadow-2xl flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b bg-gray-50">
          <div className="min-w-0">
            <h2 className="font-semibold text-gray-900 truncate">{document.originalName}</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Uploaded {format(new Date(document.createdAt), "dd MMM yyyy HH:mm")}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <DocumentStatusBadge status={document.status as DocumentStatus} />
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors">
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Document preview */}
          <div className="rounded-xl border border-gray-200 overflow-hidden bg-gray-50">
            {document.mimeType.startsWith("image/") ? (
              <img src={document.storageUrl} alt={document.originalName} className="w-full max-h-72 object-contain" />
            ) : document.mimeType === "application/pdf" ? (
              <div className="relative">
                <iframe src={document.storageUrl} className="w-full h-64" title="PDF preview" />
                <a
                  href={document.storageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute top-2 right-2 flex items-center gap-1 bg-white border px-2 py-1 rounded text-xs text-blue-600 hover:bg-blue-50"
                >
                  <ExternalLink className="w-3 h-3" /> Open PDF
                </a>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                <FileText className="w-10 h-10 mb-2" />
                <p className="text-sm">Preview not available</p>
                <a href={document.storageUrl} target="_blank" rel="noopener noreferrer" className="mt-2 text-xs text-blue-600 flex items-center gap-1">
                  <ExternalLink className="w-3 h-3" /> Open file
                </a>
              </div>
            )}
          </div>

          {/* AI Confidence */}
          {document.status !== "PROCESSING" && document.status !== "UPLOADED" && (
            <ConfidenceIndicator confidence={document.confidence} />
          )}

          {/* Processing state */}
          {document.status === "PROCESSING" && (
            <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl border border-blue-200">
              <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
              <div>
                <p className="text-sm font-medium text-blue-800">AI is analysing this document…</p>
                <p className="text-xs text-blue-600">Gemini 2.0 Flash is extracting data. Refresh in a moment.</p>
              </div>
            </div>
          )}

          {/* Error state */}
          {document.status === "ERROR" && (
            <div className="p-4 bg-red-50 rounded-xl border border-red-200">
              <p className="text-sm font-medium text-red-800">Extraction failed</p>
              <p className="text-xs text-red-600 mt-1">The AI could not process this document. You can still publish it manually after entering the data below.</p>
            </div>
          )}

          {/* Extracted fields */}
          {(document.status === "REVIEWED" || document.status === "PUBLISHED" || document.status === "ERROR") && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">Extracted Data</h3>
                {document.status !== "PUBLISHED" && (
                  <button
                    onClick={() => setIsEditing((v) => !v)}
                    className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-medium"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    {isEditing ? "Cancel" : "Edit"}
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Document Type" field="documentType" />
                <Field label="Document Number" field="documentNumber" />
                <Field label="Vendor / Supplier" field="vendorName" />
                <Field label="Customer" field="customerName" />
                <Field label="Issue Date" field="issueDate" type="date" />
                <Field label="Due Date" field="dueDate" type="date" />
                <Field label="Currency" field="currency" />
                <Field label="Total Amount" field="totalAmount" type="number" />
                <Field label="Subtotal" field="subtotal" type="number" />
                <Field label="Tax Amount" field="taxAmount" type="number" />
                <Field label="Payment Terms" field="paymentTerms" />
                <Field label="Tax Status" field="taxStatus" />
              </div>

              {/* Notes */}
              {((isEditing ? editData.notes : (extracted as Record<string, unknown>).notes) as string) && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-0.5">Notes</label>
                  {isEditing ? (
                    <textarea
                      value={String(editData.notes ?? "")}
                      onChange={(e) => setEditData((prev) => ({ ...prev, notes: e.target.value }))}
                      rows={2}
                      className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                  ) : (
                    <p className="text-sm text-gray-900">{String((extracted as Record<string, unknown>).notes)}</p>
                  )}
                </div>
              )}

              {/* Line items summary */}
              {Array.isArray((extracted as Record<string, unknown>).lineItems) && ((extracted as Record<string, unknown>).lineItems as unknown[]).length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Line Items</h4>
                  <div className="rounded-lg border border-gray-200 overflow-hidden">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-gray-500 font-medium">Description</th>
                          <th className="px-3 py-2 text-right text-gray-500 font-medium">Qty</th>
                          <th className="px-3 py-2 text-right text-gray-500 font-medium">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {((extracted as Record<string, unknown>).lineItems as { description: string; quantity: number; amount: number }[]).map((item, i) => (
                          <tr key={i}>
                            <td className="px-3 py-2 text-gray-700">{item.description}</td>
                            <td className="px-3 py-2 text-right text-gray-700">{item.quantity}</td>
                            <td className="px-3 py-2 text-right font-medium text-gray-900">
                              {typeof item.amount === "number"
                                ? item.amount.toLocaleString("en-HK", { minimumFractionDigits: 2 })
                                : item.amount}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-5 py-4 border-t bg-gray-50 space-y-2.5">
          {/* Save edits */}
          {isEditing && (
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-xl transition-colors disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Changes
            </button>
          )}

          {/* Publish actions */}
          {(document.status === "REVIEWED" || document.status === "ERROR") && !isEditing && (
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handlePublish("BILL")}
                disabled={isPublishing}
                className={cn(
                  "flex items-center justify-center gap-2 font-medium py-2.5 px-4 rounded-xl transition-colors text-sm",
                  docType === "INVOICE"
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-orange-500 hover:bg-orange-600 text-white"
                )}
                title={docType === "INVOICE" ? "Document is an Invoice — use Create Invoice" : "Create a bill in Accounts Payable"}
              >
                {isPublishing ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Create Bill (AP)
              </button>
              <button
                onClick={() => handlePublish("INVOICE")}
                disabled={isPublishing}
                className={cn(
                  "flex items-center justify-center gap-2 font-medium py-2.5 px-4 rounded-xl transition-colors text-sm",
                  docType === "BILL" || docType === "RECEIPT"
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-emerald-600 hover:bg-emerald-700 text-white"
                )}
                title={docType === "BILL" ? "Document is a Bill — use Create Bill" : "Create an invoice in Accounts Receivable"}
              >
                {isPublishing ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Create Invoice (AR)
              </button>
            </div>
          )}

          {/* Published state */}
          {document.status === "PUBLISHED" && (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-xl border border-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <p className="text-sm text-emerald-700 font-medium">
                Published → {document.billId ? "Bill" : "Invoice"} created
              </p>
            </div>
          )}

          {/* Delete */}
          {document.status !== "PUBLISHED" && !isEditing && (
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="w-full flex items-center justify-center gap-2 text-red-600 hover:bg-red-50 border border-red-200 font-medium py-2 px-4 rounded-xl transition-colors text-sm"
            >
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              Delete Document
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
