"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { nanoid } from "nanoid";
import {
  Cable,
  Plus,
  Trash2,
  RotateCw,
  ChevronDown,
  ChevronRight,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  useSettingsStore,
  type McpServerConfig,
  type McpTransportType,
} from "@/store/settings-store";

type ServerStatus = "unknown" | "loading" | "connected" | "error";

interface ToolInfo {
  name: string;
  description?: string;
}

interface ServerState {
  status: ServerStatus;
  tools: ToolInfo[];
  error?: string;
}

const serverStates = new Map<string, ServerState>();

function StatusDot({ status }: { status: ServerStatus }) {
  return (
    <span
      className={cn(
        "inline-block size-2 shrink-0",
        status === "connected" && "bg-emerald-400",
        status === "error" && "bg-red-400",
        status === "loading" && "bg-yellow-400 animate-pulse",
        status === "unknown" && "bg-zinc-600"
      )}
      style={{ borderRadius: "50%" }}
    />
  );
}

function useServerState(serverId: string): [ServerState, (s: ServerState) => void] {
  const [state, setState] = useState<ServerState>(
    () => serverStates.get(serverId) ?? { status: "unknown", tools: [] }
  );

  const update = useCallback(
    (next: ServerState) => {
      serverStates.set(serverId, next);
      setState(next);
    },
    [serverId]
  );

  return [state, update];
}

async function fetchServerTools(
  server: McpServerConfig,
  setServerState: (s: ServerState) => void
) {
  setServerState({ status: "loading", tools: [] });
  try {
    const res = await fetch("/api/mcp/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: server.type,
        url: server.url,
        command: server.command,
        args: server.args,
        headers: server.headers,
        env: server.env,
      }),
    });
    const data = await res.json();
    if (data.ok) {
      setServerState({
        status: "connected",
        tools: (data.tools ?? []).map((name: string) => ({ name })),
      });
    } else {
      setServerState({
        status: "error",
        tools: [],
        error: data.error ?? "Connection failed",
      });
    }
  } catch (err) {
    setServerState({
      status: "error",
      tools: [],
      error: String(err),
    });
  }
}

function ServerRow({ server }: { server: McpServerConfig }) {
  const toggleMcpServer = useSettingsStore((s) => s.toggleMcpServer);
  const removeMcpServer = useSettingsStore((s) => s.removeMcpServer);
  const [expanded, setExpanded] = useState(false);
  const [serverState, setServerState] = useServerState(server.id);

  const subtitle =
    server.type === "command"
      ? [server.command, ...(server.args ?? [])].join(" ")
      : server.url ?? "";

  return (
    <div
      className={cn(
        "border border-zinc-800 transition-colors",
        !server.enabled && "opacity-50"
      )}
    >
      <div className="flex items-center gap-2.5 px-3 py-2.5">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          {expanded ? (
            <ChevronDown className="size-3.5" />
          ) : (
            <ChevronRight className="size-3.5" />
          )}
        </button>

        <StatusDot status={serverState.status} />

        <div className="flex-1 min-w-0">
          <div className="text-xs text-zinc-200 truncate">{server.name}</div>
          <div className="text-[10px] text-zinc-500 truncate font-mono">
            {subtitle}
          </div>
        </div>

        <button
          type="button"
          onClick={() => fetchServerTools(server, setServerState)}
          disabled={serverState.status === "loading"}
          className="text-zinc-600 hover:text-zinc-300 transition-colors disabled:opacity-40 p-1"
          title="Refresh tools"
        >
          {serverState.status === "loading" ? (
            <Loader2 className="size-3 animate-spin" />
          ) : (
            <RotateCw className="size-3" />
          )}
        </button>

        <Switch
          checked={server.enabled}
          onCheckedChange={() => toggleMcpServer(server.id)}
        />

        <button
          type="button"
          onClick={() => removeMcpServer(server.id)}
          className="text-zinc-600 hover:text-red-400 transition-colors p-1"
        >
          <Trash2 className="size-3" />
        </button>
      </div>

      {expanded && (
        <div className="border-t border-zinc-800 px-3 py-2 space-y-1.5">
          {serverState.status === "error" && serverState.error && (
            <p className="text-[10px] text-red-400">{serverState.error}</p>
          )}

          {serverState.status === "connected" &&
            serverState.tools.length > 0 && (
              <div className="space-y-0.5">
                <span className="text-[9px] uppercase tracking-wider text-zinc-500">
                  {serverState.tools.length} tool
                  {serverState.tools.length !== 1 && "s"} available
                </span>
                {serverState.tools.map((t) => (
                  <div
                    key={t.name}
                    className="flex items-center gap-2 py-0.5 text-[11px] text-zinc-400 font-mono"
                  >
                    <span className="size-1 bg-zinc-600 shrink-0" style={{ borderRadius: "50%" }} />
                    {t.name}
                  </div>
                ))}
              </div>
            )}

          {serverState.status === "connected" &&
            serverState.tools.length === 0 && (
              <p className="text-[10px] text-zinc-500">
                No tools discovered. The server may not expose any tools.
              </p>
            )}

          {serverState.status === "unknown" && (
            <p className="text-[10px] text-zinc-500">
              Click the refresh button to load tools from this server.
            </p>
          )}

          {serverState.status === "loading" && (
            <p className="text-[10px] text-zinc-500">Connecting…</p>
          )}

          <div className="pt-1 space-y-1">
            <div className="flex items-center gap-2 text-[10px]">
              <span className="text-zinc-600 uppercase tracking-wider w-14 shrink-0">Type</span>
              <span className="text-zinc-400">{server.type}</span>
            </div>
            {server.type === "command" && (
              <div className="flex items-center gap-2 text-[10px]">
                <span className="text-zinc-600 uppercase tracking-wider w-14 shrink-0">Cmd</span>
                <span className="text-zinc-400 font-mono truncate">
                  {[server.command, ...(server.args ?? [])].join(" ")}
                </span>
              </div>
            )}
            {server.url && (
              <div className="flex items-center gap-2 text-[10px]">
                <span className="text-zinc-600 uppercase tracking-wider w-14 shrink-0">URL</span>
                <span className="text-zinc-400 font-mono truncate">
                  {server.url}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const TRANSPORT_OPTIONS: { value: McpTransportType; label: string }[] = [
  { value: "command", label: "command" },
  { value: "sse", label: "sse" },
  { value: "streamableHttp", label: "streamableHttp" },
];

function AddServerForm({
  onSave,
  onCancel,
}: {
  onSave: (server: McpServerConfig) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [type, setType] = useState<McpTransportType>("command");
  const [value, setValue] = useState("");
  const [typeOpen, setTypeOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setTypeOpen(false);
      }
    }
    if (typeOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [typeOpen]);

  const isUrl = type === "sse" || type === "streamableHttp";
  const placeholder = isUrl
    ? "https://mcp-server.example.com/sse"
    : "npx -y @modelcontextprotocol/server-example";

  const canSave = name.trim() && value.trim();

  function handleSave() {
    if (!canSave) return;

    const server: McpServerConfig = {
      id: nanoid(),
      name: name.trim(),
      type,
      enabled: true,
    };

    if (isUrl) {
      server.url = value.trim();
    } else {
      const parts = value.trim().split(/\s+/);
      server.command = parts[0];
      server.args = parts.slice(1);
    }

    onSave(server);
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <label className="block text-[10px] uppercase tracking-wider text-zinc-500">
          Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="my-mcp-server"
          autoFocus
          className="w-full bg-zinc-950 border border-zinc-800 text-xs px-2.5 py-2 text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
        />
      </div>

      <div className="space-y-1.5">
        <label className="block text-[10px] uppercase tracking-wider text-zinc-500">
          Type
        </label>
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setTypeOpen(!typeOpen)}
            className="w-full flex items-center justify-between bg-zinc-950 border border-zinc-800 text-xs px-2.5 py-2 text-zinc-300 hover:border-zinc-600 transition-colors"
          >
            <span className="font-mono">{type}</span>
            <ChevronDown className="size-3 text-zinc-500" />
          </button>
          {typeOpen && (
            <div className="absolute top-full left-0 right-0 z-10 mt-0.5 border border-zinc-700 bg-zinc-900 shadow-xl">
              {TRANSPORT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    setType(opt.value);
                    setTypeOpen(false);
                    setValue("");
                  }}
                  className={cn(
                    "w-full text-left px-2.5 py-2 text-xs font-mono transition-colors",
                    opt.value === type
                      ? "bg-zinc-800 text-zinc-100"
                      : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="block text-[10px] uppercase tracking-wider text-zinc-500">
          {isUrl ? "URL" : "Command"}
        </label>
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSave()}
          placeholder={placeholder}
          className="w-full bg-zinc-950 border border-zinc-800 text-xs px-2.5 py-2 text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 font-mono"
        />
      </div>

      <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={!canSave}
          onClick={handleSave}
          className="px-3 py-1.5 text-xs bg-zinc-100 text-zinc-900 hover:bg-white transition-colors disabled:opacity-40"
        >
          Add
        </button>
      </div>
    </div>
  );
}

export function McpConfigDialog() {
  const mcpServers = useSettingsStore((s) => s.mcpServers);
  const addMcpServer = useSettingsStore((s) => s.addMcpServer);

  const [open, setOpen] = useState(false);
  const [showAdd, setShowAdd] = useState(false);

  const enabledCount = mcpServers.filter((s) => s.enabled).length;

  function handleAdd(server: McpServerConfig) {
    addMcpServer(server);
    setShowAdd(false);
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) setShowAdd(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-zinc-500 hover:text-zinc-300 uppercase tracking-wider !text-xs"
          />
        }
      >
        <Cable className="size-3.5" />
        MCP
        {enabledCount > 0 && (
          <span className="flex items-center justify-center min-w-[16px] h-4 px-1 text-[9px] bg-zinc-700 text-zinc-200">
            {enabledCount}
          </span>
        )}
      </DialogTrigger>
      <DialogContent
        className="sm:max-w-md bg-zinc-900 border-zinc-700 text-zinc-100 !rounded-none"
        showCloseButton
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm uppercase tracking-wider text-zinc-200">
            <Cable className="size-4" />
            MCP Servers
          </DialogTitle>
        </DialogHeader>

        {!showAdd && (
          <div className="space-y-2">
            {mcpServers.length === 0 && (
              <div className="py-6 text-center">
                <Cable className="size-8 mx-auto text-zinc-700 mb-3" />
                <p className="text-xs text-zinc-500 mb-1">
                  No MCP servers configured
                </p>
                <p className="text-[10px] text-zinc-600">
                  Connect tools and data sources to your agents via the Model
                  Context Protocol.
                </p>
              </div>
            )}

            {mcpServers.map((server) => (
              <ServerRow key={server.id} server={server} />
            ))}

            <button
              type="button"
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-2 w-full px-3 py-2.5 text-xs border border-dashed border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:border-zinc-500 transition-colors"
            >
              <Plus className="size-3.5" />
              Add new MCP server
            </button>
          </div>
        )}

        {showAdd && (
          <AddServerForm
            onSave={handleAdd}
            onCancel={() => setShowAdd(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
