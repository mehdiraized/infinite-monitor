import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_MODEL } from "@/lib/model-registry";

interface SettingsStore {
  selectedModel: string;
  apiKeys: Record<string, string>;
  setModel: (model: string) => void;
  setApiKey: (provider: string, key: string) => void;
  removeApiKey: (provider: string) => void;
  getApiKey: (provider: string) => string | undefined;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      selectedModel: DEFAULT_MODEL,
      apiKeys: {},

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
    }),
    {
      name: "infinite-monitor-settings",
    }
  )
);
