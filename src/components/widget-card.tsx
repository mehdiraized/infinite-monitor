"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { GripVertical, X, Maximize2, Minimize2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useWidgetStore, type Widget } from "@/store/widget-store";

interface WidgetCardProps {
  widget: Widget;
  onRemove: (id: string) => void;
}

export function WidgetCard({ widget, onRemove }: WidgetCardProps) {
  const [expanded, setExpanded] = useState(false);
  const activeWidgetId = useWidgetStore((s) => s.activeWidgetId);
  const setActiveWidget = useWidgetStore((s) => s.setActiveWidget);
  const isActive = activeWidgetId === widget.id;

  const collapse = useCallback(() => setExpanded(false), []);

  useEffect(() => {
    if (!expanded) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") collapse();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [expanded, collapse]);

  const header = (isExpanded: boolean) => (
    <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-zinc-800">
      <div className="flex items-center gap-2 min-w-0">
        {!isExpanded && (
          <div className="drag-handle cursor-grab active:cursor-grabbing p-0.5 text-zinc-500 hover:text-zinc-300 transition-colors">
            <GripVertical className="h-4 w-4" />
          </div>
        )}
        <span className="text-xs font-medium uppercase tracking-wider text-zinc-300 truncate">
          {widget.title}
        </span>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800"
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(!isExpanded);
          }}
        >
          {isExpanded ? (
            <Minimize2 className="h-3 w-3" />
          ) : (
            <Maximize2 className="h-3 w-3" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-zinc-500 hover:text-red-400 hover:bg-zinc-800"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(widget.id);
          }}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );

  const content = (
    <CardContent className="flex-1 p-3 overflow-auto">
      <p className="text-xs text-zinc-500">{widget.description}</p>
    </CardContent>
  );

  return (
    <>
      <Card
        className={cn(
          "h-full flex flex-col rounded-none bg-zinc-900/80 border-zinc-800 ring-zinc-800 py-0 cursor-pointer transition-colors hover:bg-zinc-900",
          isActive && "ring-1 ring-zinc-600"
        )}
        onClick={() => setActiveWidget(widget.id)}
      >
        {header(false)}
        {content}
      </Card>

      {expanded &&
        createPortal(
          <div className="fixed inset-0 z-50 flex flex-col bg-zinc-950/80 backdrop-blur-sm animate-in fade-in duration-150">
            <Card className="m-4 flex-1 flex flex-col rounded-none bg-zinc-900 border-zinc-800 ring-zinc-800 py-0 overflow-hidden">
              {header(true)}
              <CardContent className="flex-1 p-6 overflow-auto">
                <p className="text-sm text-zinc-500">{widget.description}</p>
              </CardContent>
            </Card>
          </div>,
          document.body
        )}
    </>
  );
}
