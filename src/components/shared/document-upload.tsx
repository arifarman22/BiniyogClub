"use client";

import { useState, useRef } from "react";
import { uploadDocumentAction } from "@/server/actions/document.actions";
import { Spinner } from "@/components/ui/loading";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, FileText, X, AlertTriangle } from "lucide-react";
import type { DocumentCategory, DocumentEntityType } from "@/types/prisma";

export const CATEGORY_LABELS: Record<DocumentCategory, string> = {
  KYC:                    "KYC Document",
  PROJECT_DOCUMENT:       "Project Document",
  INVESTMENT_AGREEMENT:   "Investment Agreement",
  PAYMENT_RECEIPT:        "Payment Receipt",
  INVESTMENT_RECEIPT:     "Investment Receipt",
  DISTRIBUTION_STATEMENT: "Distribution Statement",
  HARVEST_REPORT:         "Harvest Report",
  FARM_DOCUMENT:          "Farm Document",
};

interface DocumentUploadProps {
  category: DocumentCategory;
  entityType: DocumentEntityType;
  entityId: string;
  onSuccess?: (documentId: string) => void;
  allowedCategories?: DocumentCategory[];
}

export function DocumentUpload({
  category,
  entityType,
  entityId,
  onSuccess,
  allowedCategories,
}: DocumentUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<DocumentCategory>(category);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const categories = allowedCategories ?? [category];

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    if (!name) setName(f.name.replace(/\.[^.]+$/, ""));
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !name.trim()) return;

    setUploading(true);
    setError(null);

    const fd = new FormData();
    fd.append("file", file);
    fd.append("category", selectedCategory);
    fd.append("entityType", entityType);
    fd.append("entityId", entityId);
    fd.append("name", name.trim());
    if (description.trim()) fd.append("description", description.trim());

    const result = await uploadDocumentAction(fd);
    setUploading(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    setSuccess(true);
    setFile(null);
    setName("");
    setDescription("");
    if (inputRef.current) inputRef.current.value = "";
    onSuccess?.(result.data.documentId);
    setTimeout(() => setSuccess(false), 3000);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive" className="rounded-xl">
          <AlertTriangle className="size-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert className="rounded-xl border-success/30 bg-success/10">
          <AlertDescription className="text-success">Document uploaded successfully.</AlertDescription>
        </Alert>
      )}

      {/* Category selector */}
      {categories.length > 1 && (
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Category</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as DocumentCategory)}
            className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {categories.map((c) => (
              <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
            ))}
          </select>
        </div>
      )}

      {/* File picker */}
      <div
        onClick={() => inputRef.current?.click()}
        className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/30 px-6 py-8 transition-colors hover:border-primary/50 hover:bg-muted/50"
      >
        {file ? (
          <div className="flex items-center gap-2 text-sm">
            <FileText className="h-5 w-5 text-primary" />
            <span className="font-medium">{file.name}</span>
            <span className="text-muted-foreground">({(file.size / 1024).toFixed(0)} KB)</span>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setFile(null); if (inputRef.current) inputRef.current.value = ""; }}
              className="ml-1 text-muted-foreground hover:text-destructive"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <>
            <Upload className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Click to select a file</p>
            <p className="text-xs text-muted-foreground">JPEG, PNG, WebP, or PDF · Max 10 MB</p>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* Name */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Document name <span className="text-destructive">*</span></label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. NID Front Side"
          className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          required
        />
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-muted-foreground">Description (optional)</label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brief description"
          className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <button
        type="submit"
        disabled={!file || !name.trim() || uploading}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {uploading && <Spinner size="xs" />}
        Upload Document
      </button>
    </form>
  );
}
