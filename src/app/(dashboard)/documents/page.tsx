"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Upload, Search, RefreshCw, FileText, CheckCircle2,
  Clock, AlertCircle, Inbox, TrendingUp
} from "lucide-react";
import Link from "next/link";
import { DocumentCard, type DocumentRecord } from "@/components/document/DocumentCard";
import { DocumentDetailPanel } from "@/components/document/DocumentDetailPanel";
import { cn } from "@/lib/utils";

// ─── Stats Card ─────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, color }: {
  icon: React.ReactNode; label: string; value: number; color: string
}) {
  return (
    <div className={cn("rounded-xl border p-4 flex items-center gap-3", color)}>
      <div className="shrink-0">{icon}</div>
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs font-medium opacity-70">{label}</p>
      </div>
    </div>
  );
}

// ─── Filter tabs ─────────────────────────────────────────────────────────────
const FILTERS = [
  { label: "All", value: "" },
  { label: "Needs Review", value: "REVIEWED" },
  { label: "Processing", value: "PROCESSING" },
  { label: "Published", value: "PUBLISHED" },
  { label: "Error", value: "ERROR" },
];

const TYPE_FILTERS = [
  { label: "All Types", value: "" },
  { label: "Bills", value: "BILL" },
  { label: "Invoices", value: "INVOICE" },
  { label: "Receipts", value: "RECEIPT" },
  { label: "Bank Stmts", value: "BANK_STATEMENT" },
];

export default function DocumentsPage() {
  const router = useRouter();
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState<DocumentRecord | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  // Stats
  const [stats, setStats] = useState({ total: 0, review: 0, published: 0, processing: 0, error: 0 });

  const fetchDocuments = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      if (typeFilter) params.set("type", typeFilter);
      if (search) params.set("search", search);
      params.set("limit", "50");

      const res = await fetch(`/api/documents?${params}`);
      const data = await res.json();
      if (data.success) {
        setDocuments(data.data);
        setTotal(data.pagination.total);
      }
    } catch {
      console.error("Failed to fetch documents");
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, typeFilter, search]);

  const fetchStats = useCallback(async () => {
    try {
      const [all, review, published, processing, error] = await Promise.all([
        fetch("/api/documents?limit=1").then((r) => r.json()),
        fetch("/api/documents?status=REVIEWED&limit=1").then((r) => r.json()),
        fetch("/api/documents?status=PUBLISHED&limit=1").then((r) => r.json()),
        fetch("/api/documents?status=PROCESSING&limit=1").then((r) => r.json()),
        fetch("/api/documents?status=ERROR&limit=1").then((r) => r.json()),
      ]);
      setStats({
        total: all.pagination?.total ?? 0,
        review: review.pagination?.total ?? 0,
        published: published.pagination?.total ?? 0,
        processing: processing.pagination?.total ?? 0,
        error: error.pagination?.total ?? 0,
      });
    } catch {
      console.error("Failed to fetch stats");
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Auto-refresh if any are processing
  useEffect(() => {
    const hasProcessing = documents.some((d) => d.status === "PROCESSING");
    if (!hasProcessing) return;
    const interval = setInterval(() => {
      fetchDocuments();
      fetchStats();
    }, 4000);
    return () => clearInterval(interval);
  }, [documents, fetchDocuments, fetchStats]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
  };

  const handleRefresh = () => {
    fetchDocuments();
    fetchStats();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b bg-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Inbox className="w-6 h-6 text-blue-600" />
              Document Hub
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Upload documents • AI extracts data • One-click publish to accounting records
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-500 transition-colors"
              title="Refresh"
            >
              <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
            </button>
            <Link
              href="/upload"
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-xl transition-colors text-sm"
            >
              <Upload className="w-4 h-4" />
              Upload Documents
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <StatCard
            icon={<FileText className="w-5 h-5 text-gray-500" />}
            label="Total Documents"
            value={stats.total}
            color="bg-gray-50 border-gray-200 text-gray-700"
          />
          <StatCard
            icon={<AlertCircle className="w-5 h-5 text-amber-500" />}
            label="Needs Review"
            value={stats.review}
            color="bg-amber-50 border-amber-200 text-amber-700"
          />
          <StatCard
            icon={<CheckCircle2 className="w-5 h-5 text-emerald-500" />}
            label="Published"
            value={stats.published}
            color="bg-emerald-50 border-emerald-200 text-emerald-700"
          />
          <StatCard
            icon={<Clock className="w-5 h-5 text-blue-500" />}
            label="Processing"
            value={stats.processing}
            color="bg-blue-50 border-blue-200 text-blue-700"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Status filter tabs */}
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                  statusFilter === f.value
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                )}
              >
                {f.label}
                {f.value === "REVIEWED" && stats.review > 0 && (
                  <span className="ml-1.5 bg-amber-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                    {stats.review}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Type filter */}
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            {TYPE_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setTypeFilter(f.value)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                  typeFilter === f.value
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex items-center gap-1 ml-auto">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search documents…"
                className="pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-52"
              />
            </div>
            <button type="submit" className="px-3 py-1.5 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-700">
              Go
            </button>
          </form>
        </div>
      </div>

      {/* Document grid */}
      <div className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <RefreshCw className="w-8 h-8 animate-spin mb-3" />
            <p className="text-sm">Loading documents…</p>
          </div>
        ) : documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center mb-4">
              <Inbox className="w-10 h-10 text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {search || statusFilter || typeFilter ? "No documents found" : "No documents yet"}
            </h3>
            <p className="text-sm text-gray-500 max-w-sm mb-5">
              {search || statusFilter || typeFilter
                ? "Try adjusting your filters or search terms."
                : "Upload your first document and let Gemini AI extract the data automatically."}
            </p>
            {!search && !statusFilter && !typeFilter && (
              <Link
                href="/upload"
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2.5 rounded-xl transition-colors"
              >
                <Upload className="w-4 h-4" />
                Upload Your First Document
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-500">
                Showing <span className="font-medium text-gray-900">{documents.length}</span> of{" "}
                <span className="font-medium text-gray-900">{total}</span> documents
              </p>
              {stats.review > 0 && (
                <div className="flex items-center gap-1.5 text-sm text-amber-600 font-medium">
                  <TrendingUp className="w-4 h-4" />
                  {stats.review} document{stats.review !== 1 ? "s" : ""} need review
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {documents.map((doc) => (
                <DocumentCard
                  key={doc.id}
                  document={doc}
                  onClick={setSelectedDoc}
                  isSelected={selectedDoc?.id === doc.id}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Detail panel slide-over */}
      {selectedDoc && (
        <DocumentDetailPanel
          document={selectedDoc}
          onClose={() => setSelectedDoc(null)}
          onUpdate={() => {
            fetchDocuments();
            fetchStats();
            setSelectedDoc(null);
          }}
        />
      )}
    </div>
  );
}
