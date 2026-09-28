"use client";

import { useState, type ReactNode } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface FarmerDialogProps {
  title: string;
  description?: string;
  trigger?: ReactNode;
  children: (close: () => void) => ReactNode;
}

export function FarmerDialog({ title, description, trigger, children }: FarmerDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div onClick={() => setOpen(true)} className="cursor-pointer">
        {trigger ?? (
          <Button size="sm">
            <Plus className="mr-1.5 h-4 w-4" /> Add
          </Button>
        )}
      </div>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {open && children(() => setOpen(false))}
      </DialogContent>
    </Dialog>
  );
}
