"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface UploadZoneProps {
  onDrop: (files: File[]) => void;
}

export function UploadZone({ onDrop }: UploadZoneProps) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "image/*": [".png", ".jpg", ".jpeg"],
    },
  });

  return (
    <Card
      {...getRootProps()}
      className={cn(
        "p-8 border-dashed cursor-pointer transition-colors",
        isDragActive
          ? "border-primary bg-primary/5"
          : "border-border hover:border-primary/50"
      )}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center text-center">
        <Upload className="w-12 h-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-1">
          {isDragActive ? "Drop files here..." : "Drag & drop files here"}
        </h3>
        <p className="text-sm text-muted-foreground">
          or click to select files (PDF, PNG, JPG)
        </p>
      </div>
    </Card>
  );
}
