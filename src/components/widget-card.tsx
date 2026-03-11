"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";

function StaticNoise() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    const W = canvas.width;
    const H = canvas.height;

    function draw() {
      const img = ctx!.createImageData(W, H);
      const d = img.data;
      for (let i = 0; i < d.length; i += 4) {
        const v = (Math.random() * 200) | 0;
        d[i] = v;
        d[i + 1] = v;
        d[i + 2] = v;
        d[i + 3] = Math.random() > 0.15 ? 180 : 0;
      }
      ctx!.putImageData(img, 0, 0);
      animId = requestAnimationFrame(draw);
    }

    draw();
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <canvas
        ref={canvasRef}
        width={80}
        height={60}
        className="w-full h-full opacity-60"
        style={{ imageRendering: "pixelated" }}
      />
      {/* scanlines */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.25) 2px, rgba(0,0,0,0.25) 4px)",
        }}
      />
    </div>
  );
}
import {
  GripVertical,
  X,
  Maximize2,
  Minimize2,
  Loader2,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useWidgetStore, type Widget } from "@/store/widget-store";

type SandboxStatus = "loading" | "alive" | "dead";

function useSandboxHealth(
  sandboxId: string | null,
  previewUrl: string | null,
  isBuilding: boolean
) {
  const [status, setStatus] = useState<SandboxStatus>(
    previewUrl ? "loading" : "dead"
  );

  useEffect(() => {
    if (isBuilding && previewUrl) {
      setStatus("alive");
      return;
    }

    if (!sandboxId || !previewUrl) {
      setStatus("dead");
      return;
    }

    let cancelled = false;
    setStatus("loading");

    fetch("/api/sandbox", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sandboxId, previewUrl }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setStatus(data.alive ? "alive" : "dead");
      })
      .catch(() => {
        if (!cancelled) setStatus("dead");
      });

    return () => {
      cancelled = true;
    };
  }, [sandboxId, previewUrl, isBuilding]);

  return status;
}

interface WidgetCardProps {
  widget: Widget;
  onRemove: (id: string) => void;
}

export function WidgetCard({ widget, onRemove }: WidgetCardProps) {
  const [expanded, setExpanded] = useState(false);
  const activeWidgetId = useWidgetStore((s) => s.activeWidgetId);
  const setActiveWidget = useWidgetStore((s) => s.setActiveWidget);
  const clearSandboxInfo = useWidgetStore((s) => s.clearSandboxInfo);
  const isBuilding = useWidgetStore((s) =>
    s.streamingWidgetIds.includes(widget.id)
  );
  const isActive = activeWidgetId === widget.id;

  const sandboxStatus = useSandboxHealth(widget.sandboxId, widget.previewUrl, isBuilding);

  const collapse = useCallback(() => setExpanded(false), []);

  useEffect(() => {
    if (!expanded) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") collapse();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [expanded, collapse]);

  const handleRebuild = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      clearSandboxInfo(widget.id);
      setActiveWidget(widget.id);
    },
    [widget.id, clearSandboxInfo, setActiveWidget]
  );

  const header = (isExpanded: boolean) => (
    <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-zinc-700">
      <div className="flex items-center gap-2 min-w-0">
        {!isExpanded && (
          <div className="drag-handle cursor-grab active:cursor-grabbing p-0.5 text-zinc-500 hover:text-zinc-300 transition-colors">
            <GripVertical className="h-4 w-4" />
          </div>
        )}
        <span className="text-xs font-medium uppercase tracking-wider text-zinc-300 truncate">
          {widget.title}
        </span>
        {isBuilding && (
          <Loader2 className="size-3 animate-spin text-teal-400 shrink-0" />
        )}
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

  const expiredOverlay = (
    <CardContent className="flex-1 flex flex-col items-center justify-center gap-3 p-0!">
      <AlertTriangle className="size-5 text-zinc-500" />
      <p className="text-xs text-zinc-500 text-center">
        Sandbox expired or unreachable.
      </p>
      <Button
        size="sm"
        variant="outline"
        className="gap-1.5 text-xs border-zinc-700 text-zinc-300 hover:bg-zinc-800"
        onClick={handleRebuild}
      >
        <RefreshCw className="size-3" />
        Rebuild
      </Button>
    </CardContent>
  );

  const loadingOverlay = (
    <CardContent className="flex-1 flex items-center justify-center p-0!">
      <div className="flex items-center gap-2 text-xs text-zinc-500">
        <Loader2 className="size-3.5 animate-spin" />
        Checking sandbox…
      </div>
    </CardContent>
  );

  const iframeContent = (
    <CardContent className="relative flex-1 min-h-0 p-0! overflow-hidden transform-[translateZ(0)]">
      <iframe
        key={widget.previewUrl}
        src={widget.previewUrl!}
        className="absolute inset-0 h-full w-full border-0"
        allow="cross-origin-isolated"
        referrerPolicy="no-referrer"
        title={widget.title}
      />
      {isBuilding && <StaticNoise />}
    </CardContent>
  );

  let widgetContent: React.ReactNode;

  if (widget.previewUrl) {
    if (sandboxStatus === "loading") {
      widgetContent = loadingOverlay;
    } else if (sandboxStatus === "dead") {
      widgetContent = expiredOverlay;
    } else {
      widgetContent = iframeContent;
    }
  } else if (isBuilding) {
    widgetContent = (
      <CardContent className="relative flex-1 min-h-0 p-0! overflow-hidden">
        <StaticNoise />
      </CardContent>
    );
  } else if (widget.sandboxId) {
    widgetContent = (
      <CardContent className="flex-1 flex items-center justify-center p-0!">
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <Loader2 className="size-3.5 animate-spin" />
          Provisioning sandbox…
        </div>
      </CardContent>
    );
  } else {
    widgetContent = (
      <CardContent className="flex-1 p-3 overflow-auto">
        <p className="text-xs text-zinc-500">
          {widget.description || "Open the chat to start building this widget."}
        </p>
      </CardContent>
    );
  }

  return (
    <>
      <Card
        className={cn(
          "h-full flex flex-col rounded-none bg-zinc-800 border-zinc-700 ring-zinc-700 py-0 gap-0 cursor-pointer transition-colors hover:bg-zinc-700/80",
          isActive && "ring-1 ring-teal-500/60 border-teal-500/40"
        )}
        onClick={() => setActiveWidget(widget.id)}
      >
        {header(false)}
        {widgetContent}
      </Card>

      {expanded &&
        createPortal(
          <div className="fixed inset-0 z-50 flex flex-col bg-zinc-950/80 backdrop-blur-sm animate-in fade-in duration-150">
            <Card className="m-4 flex-1 flex flex-col rounded-none bg-zinc-800 border-zinc-700 ring-zinc-700 py-0 gap-0 overflow-hidden">
              {header(true)}
              {widget.previewUrl && sandboxStatus === "alive" ? (
                <CardContent className="relative flex-1 min-h-0 p-0! overflow-hidden transform-[translateZ(0)]">
                  <iframe
                    key={widget.previewUrl}
                    src={widget.previewUrl}
                    className="absolute inset-0 h-full w-full border-0"
                    allow="cross-origin-isolated"
                    referrerPolicy="no-referrer"
                    title={widget.title}
                  />
                </CardContent>
              ) : widget.previewUrl && sandboxStatus === "dead" ? (
                expiredOverlay
              ) : (
                <CardContent className="flex-1 p-6 overflow-auto">
                  <p className="text-sm text-zinc-500">{widget.description}</p>
                </CardContent>
              )}
            </Card>
          </div>,
          document.body
        )}
    </>
  );
}
