"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus } from "lucide-react";
import { createGroupEntityAction, updateGroupEntityAction } from "@/server/actions/group-investment.actions";
import { ActiveToggle, Field, FormFooter, Modal, inputCls } from "./group-form-ui";

type Props =
  | { mode?: "edit"; entity: { id: string; name: string; description: string; isActive: boolean }; groupId?: never }
  | { mode: "create"; groupId: string; entity?: never };

export function EditEntityDialog(props: Props) {
  const router = useRouter();
  const isCreate = props.mode === "create";
  const entity = props.entity;

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState(entity?.name ?? "");
  const [description, setDescription] = useState(entity?.description ?? "");
  const [isActive, setIsActive] = useState(entity?.isActive ?? true);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim()) { setError("Name is required."); return; }
    setLoading(true);
    const data = { name, description, isActive };
    const result = isCreate
      ? await createGroupEntityAction(props.groupId, data)
      : await updateGroupEntityAction(entity!.id, data);
    setLoading(false);
    if (!result.success) { setError(result.error ?? "Failed to save."); return; }
    setOpen(false);
    if (isCreate) { setName(""); setDescription(""); setIsActive(true); }
    router.refresh();
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 rounded border border-border px-2 py-1 text-xs transition-colors hover:bg-muted/40"
      >
        {isCreate ? <><Plus className="h-3 w-3" /> Add Entity</> : <><Pencil className="h-3 w-3" /> Edit Entity</>}
      </button>

      {open && (
        <Modal
          title={isCreate ? "Add Entity" : "Edit Entity"}
          subtitle={isCreate ? "A new operating entity inside this group." : entity!.name}
          onClose={() => setOpen(false)}
        >
          <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto p-5">
            <Field label="Entity Name">
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className={inputCls} />
            </Field>
            <Field label="Description">
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className={`${inputCls} resize-none`} />
            </Field>
            <ActiveToggle value={isActive} onChange={setIsActive} />
            <FormFooter error={error} loading={loading} submitLabel={isCreate ? "Add Entity" : "Save Changes"} onCancel={() => setOpen(false)} />
          </form>
        </Modal>
      )}
    </>
  );
}
