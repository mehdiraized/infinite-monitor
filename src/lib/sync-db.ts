import { useWidgetStore } from "@/store/widget-store";

let syncTimeout: ReturnType<typeof setTimeout> | null = null;

export function scheduleSyncToServer() {
  if (syncTimeout) clearTimeout(syncTimeout);
  syncTimeout = setTimeout(() => {
    const { dashboards, widgets, textBlocks } = useWidgetStore.getState();
    fetch("/api/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dashboards: dashboards.map((d) => ({
          id: d.id,
          title: d.title,
          widgetIds: d.widgetIds,
          textBlockIds: d.textBlockIds ?? [],
          createdAt: d.createdAt,
        })),
        widgets: widgets.map((w) => ({
          id: w.id,
          title: w.title,
          description: w.description,
          code: w.code,
          layout: w.layout,
          messages: w.messages,
        })),
        textBlocks: textBlocks.map((tb) => ({
          id: tb.id,
          text: tb.text,
          fontSize: tb.fontSize,
          layout: tb.layout,
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

export function deleteTextBlockFromDb(textBlockId: string) {
  fetch("/api/text-blocks", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: textBlockId }),
  }).catch(() => {});
  scheduleSyncToServer();
}
