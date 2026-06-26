"use client";

import { useState } from "react";
import { UploadZone } from "@/components/document/UploadZone";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function UploadPage() {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleDrop = async (files: File[]) => {
    setIsProcessing(true);

    try {
      const formData = new FormData();
      formData.append("file", files[0]);

      const res = await fetch("/api/documents", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        toast.success("Document uploaded!");
      } else {
        toast.error("Failed to upload document");
      }
    } catch (err) {
      toast.error("Error uploading document");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader
        title="Upload Document"
        description="Upload invoices, bills, receipts for AI extraction"
      />
      {isProcessing ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Processing document...</p>
        </div>
      ) : (
        <UploadZone onDrop={handleDrop} />
      )}
    </div>
  );
}
