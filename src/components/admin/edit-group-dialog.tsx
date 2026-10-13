"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Loader2, Pencil } from "lucide-react";
import { updateGroupAction } from "@/server/actions/group-investment.actions";
import { uploadProjectCoverImageAction } from "@/server/actions/project.actions";
import { ActiveToggle, Field, FormFooter, Modal, inputCls } from "./group-form-ui";

type Props = {
  group: {
    id: string;
    name: string;
    tagline: string | null;
    description: string;
    coverUrl: string | null;
    logoUrl: string | null;
    isActive: boolean;
  };
};

export function EditGroupDialog({ group }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState(group.name);
  const [tagline, setTagline] = useState(group.tagline ?? "");
  const [description, setDescription] = useState(group.description);
  const [coverUrl, setCoverUrl] = useState(group.coverUrl ?? "");
  const [logoUrl, setLogoUrl] = useState(group.logoUrl ?? "");
  const [isActive, setIsActive] = useState(group.isActive);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) { setError("Image must be smaller than 3 MB."); return; }
    setError("");
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const result = await uploadProjectCoverImageAction(fd);
    setUploading(false);
    if (result.success) setCoverUrl(result.data.url);
    else setError(result.error ?? "Upload failed.");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim()) { setError("Name is required."); return; }
    setLoading(true);
    const result = await updateGroupAction(group.id, {
      name, tagline, description, coverUrl, logoUrl, isActive,
    });
    setLoading(false);
    if (result.success) { setOpen(false); router.refresh(); }
    else setError(result.error ?? "Failed to update.");
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 rounded border border-border px-2 py-1 text-xs transition-colors hover:bg-muted/40"
      >
        <Pencil className="h-3 w-3" /> Edit Group
      </button>

      {open && (
        <Modal title="Edit Group" subtitle="Changes appear on the public group pages immediately." onClose={() => setOpen(false)}>
          <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto p-5">
            <Field label="Group Name">
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className={inputCls} />
            </Field>
            <Field label="Tagline">
              <input type="text" value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="Short tagline" className={inputCls} />
            </Field>
            <Field label="Description">
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className={`${inputCls} resize-none`} />
            </Field>

            <Field label="Cover Image" hint="shown behind the group header">
              <div className="flex items-start gap-3">
                <div className="relative h-20 w-32 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
                  {coverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={coverUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="flex h-full items-center justify-center text-[10px] text-muted-foreground">Default image</span>
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted/40">
                    {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImagePlus className="h-3.5 w-3.5" />}
                    {uploading ? "Uploading…" : "Upload image"}
                    <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleUpload} disabled={uploading} className="hidden" />
                  </label>
                  <input type="text" value={coverUrl} onChange={(e) => setCoverUrl(e.target.value)} placeholder="…or paste an image URL" className={inputCls} />
                </div>
              </div>
            </Field>

            <Field label="Logo URL" hint="optional">
              <input type="text" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://…" className={inputCls} />
            </Field>

            <ActiveToggle value={isActive} onChange={setIsActive} />
            <FormFooter error={error} loading={loading || uploading} submitLabel="Save Changes" onCancel={() => setOpen(false)} />
          </form>
        </Modal>
      )}
    </>
  );
}
