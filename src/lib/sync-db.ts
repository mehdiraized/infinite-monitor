import { useWidgetStore } from "@/store/widget-store";

let syncTimeout: ReturnType<typeof setTimeout> | null = null;

export function scheduleSyncToServer() {
  if (syncTimeout) clearTimeout(syncTimeout);
  syncTimeout = setTimeout(() => {
    const { dashboards, widgets } = useWidgetStore.getState();
    fetch("/api/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dashboards: dashboards.map((d) => ({
          id: d.id,
          title: d.title,
          widgetIds: d.widgetIds,
          createdAt: d.createdAt,
        })),
        widgets: widgets.map((w) => ({
          id: w.id,
          title: w.title,
          description: w.description,
          code: w.code,
          files: w.files,
          layout: w.layout,
          messages: w.messages,
        })),
      }),
    }).catch(() => {});
  }, 2000);
}

export function syncWidgetToDb() {
  scheduleSyncToServer();
}

export function deleteWidgetFromDb(widgetId: string) {
  fetch("/api/widgets", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: widgetId }),
  }).catch(() => {});
  scheduleSyncToServer();
}
