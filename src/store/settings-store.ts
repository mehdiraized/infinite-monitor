import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_MODEL } from "@/lib/model-registry";
import type { SearchProvider } from "@/lib/web-search";

export type McpTransportType = "command" | "sse" | "streamableHttp";

export interface McpServerConfig {
  id: string;
  name: string;
  type: McpTransportType;
  command?: string;
  args?: string[];
  url?: string;
  headers?: Record<string, string>;
  env?: Record<string, string>;
  enabled: boolean;
}

interface SettingsStore {
  selectedModel: string;
  apiKeys: Record<string, string>;
  searchProvider: SearchProvider | null;
  mcpServers: McpServerConfig[];
  setModel: (model: string) => void;
  setApiKey: (provider: string, key: string) => void;
  removeApiKey: (provider: string) => void;
  getApiKey: (provider: string) => string | undefined;
  setSearchProvider: (provider: SearchProvider | null) => void;
  addMcpServer: (server: McpServerConfig) => void;
  updateMcpServer: (id: string, updates: Partial<Omit<McpServerConfig, "id">>) => void;
  removeMcpServer: (id: string) => void;
  toggleMcpServer: (id: string) => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      selectedModel: DEFAULT_MODEL,
      apiKeys: {},
      searchProvider: null,
      mcpServers: [],

      setModel: (model) => set({ selectedModel: model }),

      setApiKey: (provider, key) =>
        set((state) => ({
          apiKeys: { ...state.apiKeys, [provider]: key },
        })),

      removeApiKey: (provider) =>
        set((state) => {
          const next = { ...state.apiKeys };
          delete next[provider];
          return { apiKeys: next };
        }),

      getApiKey: (provider) => get().apiKeys[provider],

      setSearchProvider: (provider) => set({ searchProvider: provider }),

      addMcpServer: (server) =>
        set((state) => ({
          mcpServers: [...state.mcpServers, server],
        })),

      updateMcpServer: (id, updates) =>
        set((state) => ({
          mcpServers: state.mcpServers.map((s) =>
            s.id === id ? { ...s, ...updates } : s
          ),
        })),

      removeMcpServer: (id) =>
        set((state) => ({
          mcpServers: state.mcpServers.filter((s) => s.id !== id),
        })),

      toggleMcpServer: (id) =>
        set((state) => ({
          mcpServers: state.mcpServers.map((s) =>
            s.id === id ? { ...s, enabled: !s.enabled } : s
          ),
        })),
    }),
    {
      name: "infinite-monitor-settings",
    }
  )
);
