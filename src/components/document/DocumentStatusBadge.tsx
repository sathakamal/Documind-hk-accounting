"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type DocumentStatus = "UPLOADED" | "PROCESSING" | "REVIEWED" | "PUBLISHED" | "ERROR";

const STATUS_CONFIG: Record<DocumentStatus, { label: string; classes: string; icon?: string }> = {
  UPLOADED: {
    label: "Uploaded",
    classes: "bg-slate-100 text-slate-700 border-slate-200",
  },
  PROCESSING: {
    label: "Processing",
    classes: "bg-blue-50 text-blue-700 border-blue-200",
  },
  REVIEWED: {
    label: "Needs Review",
    classes: "bg-amber-50 text-amber-700 border-amber-200",
  },
  PUBLISHED: {
    label: "Published",
    classes: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  ERROR: {
    label: "Error",
    classes: "bg-red-50 text-red-700 border-red-200",
  },
};

interface DocumentStatusBadgeProps {
  status: DocumentStatus;
  className?: string;
}

export function DocumentStatusBadge({ status, className }: DocumentStatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.UPLOADED;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border",
        config.classes,
        className
      )}
    >
      {status === "PROCESSING" && (
        <Loader2 className="w-3 h-3 animate-spin" />
      )}
      {status === "PUBLISHED" && <span>✓</span>}
      {status === "ERROR" && <span>✕</span>}
      {config.label}
    </span>
  );
}
