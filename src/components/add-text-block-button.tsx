"use client";

import { Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWidgetStore } from "@/store/widget-store";
import { scheduleSyncToServer } from "@/lib/sync-db";

export function AddTextBlockButton() {
  const addTextBlock = useWidgetStore((s) => s.addTextBlock);

  return (
    <Button
      size="sm"
      className="gap-1.5 border border-zinc-700 bg-zinc-800 text-zinc-200 hover:bg-zinc-700 uppercase tracking-wider text-xs"
      onClick={() => {
        addTextBlock();
        scheduleSyncToServer();
      }}
    >
      <Type className="h-4 w-4" />
      Add Text
    </Button>
  );
}
