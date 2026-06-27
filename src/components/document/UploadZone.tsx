"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X, CheckCircle2, AlertCircle, Loader2, FileText, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadItem {
  file: File;
  status: "pending" | "uploading" | "done" | "error" | "duplicate";
  error?: string;
  documentId?: string;
}

interface UploadZoneProps {
  onAllUploaded?: (documentIds: string[]) => void;
}

function FileIcon({ mimeType }: { mimeType: string }) {
  if (mimeType.startsWith("image/")) return <ImageIcon className="w-5 h-5 text-purple-500" />;
  return <FileText className="w-5 h-5 text-red-500" />;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function UploadZone({ onAllUploaded }: UploadZoneProps) {
  const [queue, setQueue] = useState<FileUploadItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newItems: FileUploadItem[] = acceptedFiles.map((file) => ({
      file,
      status: "pending",
    }));
    setQueue((prev) => [...prev, ...newItems]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "image/*": [".png", ".jpg", ".jpeg", ".webp", ".gif"],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: true,
  });

  const removeFile = (index: number) => {
    setQueue((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadAll = async () => {
    setIsUploading(true);
    const uploadedIds: string[] = [];

    for (let i = 0; i < queue.length; i++) {
      if (queue[i].status !== "pending") continue;

      setQueue((prev) =>
        prev.map((item, idx) => (idx === i ? { ...item, status: "uploading" } : item))
      );

      try {
        const formData = new FormData();
        formData.append("file", queue[i].file);

        const res = await fetch("/api/documents", { method: "POST", body: formData });
        const data = await res.json();

        if (res.status === 409 && data.duplicate) {
          setQueue((prev) =>
            prev.map((item, idx) =>
              idx === i ? { ...item, status: "duplicate", error: "Duplicate file detected" } : item
            )
          );
        } else if (!res.ok) {
          throw new Error(data.error || "Upload failed");
        } else {
          uploadedIds.push(data.data.id);
          setQueue((prev) =>
            prev.map((item, idx) =>
              idx === i ? { ...item, status: "done", documentId: data.data.id } : item
            )
          );
        }
      } catch (err) {
        setQueue((prev) =>
          prev.map((item, idx) =>
            idx === i
              ? { ...item, status: "error", error: err instanceof Error ? err.message : "Upload failed" }
              : item
          )
        );
      }
    }

    setIsUploading(false);
    if (uploadedIds.length > 0) onAllUploaded?.(uploadedIds);
  };

  const pendingCount = queue.filter((q) => q.status === "pending").length;

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        {...getRootProps()}
        className={cn(
          "relative border-2 border-dashed rounded-2xl p-10 cursor-pointer transition-all duration-200 text-center",
          isDragActive
            ? "border-blue-500 bg-blue-50 scale-[1.01]"
            : "border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50/50"
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-3">
          <div className={cn(
            "w-16 h-16 rounded-2xl flex items-center justify-center transition-colors",
            isDragActive ? "bg-blue-100" : "bg-white border border-gray-200"
          )}>
            <Upload className={cn("w-8 h-8", isDragActive ? "text-blue-600" : "text-gray-400")} />
          </div>
          <div>
            <p className="text-base font-semibold text-gray-900">
              {isDragActive ? "Drop files here!" : "Drag & drop documents"}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              or <span className="text-blue-600 font-medium">click to browse</span>
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-2 text-xs text-gray-400">
            <span className="bg-white border border-gray-200 px-2 py-1 rounded-full">PDF</span>
            <span className="bg-white border border-gray-200 px-2 py-1 rounded-full">PNG</span>
            <span className="bg-white border border-gray-200 px-2 py-1 rounded-full">JPG</span>
            <span className="bg-white border border-gray-200 px-2 py-1 rounded-full">WebP</span>
            <span className="bg-gray-100 px-2 py-1 rounded-full text-gray-500">Max 10MB per file</span>
          </div>
        </div>
      </div>

      {/* File queue */}
      {queue.length > 0 && (
        <div className="space-y-2">
          {queue.map((item, index) => (
            <div
              key={index}
              className={cn(
                "flex items-center gap-3 p-3 rounded-xl border transition-colors",
                item.status === "done" ? "bg-emerald-50 border-emerald-200" :
                item.status === "error" || item.status === "duplicate" ? "bg-red-50 border-red-200" :
                item.status === "uploading" ? "bg-blue-50 border-blue-200" :
                "bg-white border-gray-200"
              )}
            >
              <FileIcon mimeType={item.file.type} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{item.file.name}</p>
                <p className="text-xs text-gray-500">{formatBytes(item.file.size)}</p>
                {item.error && <p className="text-xs text-red-500 mt-0.5">{item.error}</p>}
              </div>
              <div className="shrink-0">
                {item.status === "pending" && (
                  <button onClick={() => removeFile(index)} className="p-1 hover:bg-gray-200 rounded-lg">
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                )}
                {item.status === "uploading" && <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />}
                {item.status === "done" && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                {(item.status === "error" || item.status === "duplicate") && <AlertCircle className="w-5 h-5 text-red-500" />}
              </div>
            </div>
          ))}

          {/* Upload button */}
          {pendingCount > 0 && (
            <button
              onClick={uploadAll}
              disabled={isUploading}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
            >
              {isUploading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</>
              ) : (
                <><Upload className="w-4 h-4" /> Upload {pendingCount} file{pendingCount !== 1 ? "s" : ""}</>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
