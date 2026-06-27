"use client";

import { useRouter } from "next/navigation";
import { UploadZone } from "@/components/document/UploadZone";
import { ArrowLeft, Sparkles, ShieldCheck, Zap } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function UploadPage() {
  const router = useRouter();

  const handleAllUploaded = (documentIds: string[]) => {
    toast.success(`${documentIds.length} document${documentIds.length !== 1 ? "s" : ""} uploaded! Gemini AI is processing them.`);
    // Redirect to document inbox after short delay
    setTimeout(() => router.push("/documents"), 1500);
  };

  return (
    <div className="max-w-2xl mx-auto py-6 px-4">
      {/* Back link */}
      <Link
        href="/documents"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Document Hub
      </Link>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Upload Documents</h1>
        <p className="text-gray-500 mt-1">
          Upload invoices, bills, receipts, and bank statements. Gemini AI will extract all accounting data automatically.
        </p>
      </div>

      {/* Feature highlights */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { icon: <Zap className="w-4 h-4 text-blue-500" />, title: "Instant AI Extraction", desc: "Gemini 2.0 Flash" },
          { icon: <ShieldCheck className="w-4 h-4 text-emerald-500" />, title: "Duplicate Detection", desc: "No double entries" },
          { icon: <Sparkles className="w-4 h-4 text-purple-500" />, title: "Multi-language", desc: "EN, 中文, Hindi" },
        ].map((f) => (
          <div key={f.title} className="bg-white border border-gray-200 rounded-xl p-3 text-center">
            <div className="flex justify-center mb-1">{f.icon}</div>
            <p className="text-xs font-semibold text-gray-800">{f.title}</p>
            <p className="text-xs text-gray-400">{f.desc}</p>
          </div>
        ))}
      </div>

      {/* Upload zone */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <UploadZone onAllUploaded={handleAllUploaded} />
      </div>

      {/* Help text */}
      <p className="text-xs text-gray-400 text-center mt-4">
        Supported formats: PDF, PNG, JPG, WebP, GIF · Max 10MB per file · Up to 20 files at once
      </p>
    </div>
  );
}
