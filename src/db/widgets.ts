import { eq, sql } from "drizzle-orm";
import { db, schema } from ".";

const { widgets, dashboards } = schema;

export type WidgetRecord = typeof widgets.$inferSelect;
export type DashboardRecord = typeof dashboards.$inferSelect;

// ── Widgets ──

export function getWidget(id: string): WidgetRecord | undefined {
  return db.select().from(widgets).where(eq(widgets.id, id)).get();
}

export function getAllWidgets(): WidgetRecord[] {
  return db.select().from(widgets).all();
}

export function upsertWidget(data: {
  id: string;
  title?: string;
  description?: string;
  code?: string | null;
  filesJson?: string | null;
  layoutJson?: string | null;
  messagesJson?: string | null;
}) {
  const existing = getWidget(data.id);
  if (existing) {
    db.update(widgets)
      .set({ ...data, updatedAt: sql`(unixepoch())` })
      .where(eq(widgets.id, data.id))
      .run();
  } else {
    db.insert(widgets)
      .values({
        id: data.id,
        title: data.title ?? "Untitled Widget",
        description: data.description ?? "",
        code: data.code ?? null,
        filesJson: data.filesJson ?? null,
        layoutJson: data.layoutJson ?? null,
        messagesJson: data.messagesJson ?? null,
      })
      .run();
  }
}

export function updateWidgetCode(id: string, code: string) {
  db.update(widgets)
    .set({ code, updatedAt: sql`(unixepoch())` })
    .where(eq(widgets.id, id))
    .run();
}

export function updateWidgetTitle(id: string, title: string) {
  db.update(widgets)
    .set({ title, updatedAt: sql`(unixepoch())` })
    .where(eq(widgets.id, id))
    .run();
}

export function deleteWidget(id: string) {
  db.delete(widgets).where(eq(widgets.id, id)).run();
}

export function getWidgetCode(id: string): string | null {
  const row = db
    .select({ code: widgets.code })
    .from(widgets)
    .where(eq(widgets.id, id))
    .get();
  return row?.code ?? null;
}

export function getWidgetFiles(id: string): Record<string, string> {
  const row = db
    .select({ filesJson: widgets.filesJson, code: widgets.code })
    .from(widgets)
    .where(eq(widgets.id, id))
    .get();
  if (!row) return {};
  if (row.filesJson) {
    try { return JSON.parse(row.filesJson); } catch { /* fall through */ }
  }
  if (row.code) return { "src/App.tsx": row.code };
  return {};
}

export function setWidgetFiles(id: string, files: Record<string, string>) {
  const code = files["src/App.tsx"] ?? null;
  db.update(widgets)
    .set({
      filesJson: JSON.stringify(files),
      code,
      updatedAt: sql`(unixepoch())`,
    })
    .where(eq(widgets.id, id))
    .run();
}

// ── Dashboards ──

export function getDashboard(id: string): DashboardRecord | undefined {
  return db.select().from(dashboards).where(eq(dashboards.id, id)).get();
}

export function getAllDashboards(): DashboardRecord[] {
  return db.select().from(dashboards).all();
}

export function upsertDashboard(data: {
  id: string;
  title?: string;
  widgetIdsJson?: string | null;
}) {
  const existing = getDashboard(data.id);
  if (existing) {
    db.update(dashboards)
      .set({ ...data, updatedAt: sql`(unixepoch())` })
      .where(eq(dashboards.id, data.id))
      .run();
  } else {
    db.insert(dashboards)
      .values({
        id: data.id,
        title: data.title ?? "Dashboard",
        widgetIdsJson: data.widgetIdsJson ?? null,
      })
      .run();
  }
}

export function deleteDashboard(id: string) {
  db.delete(dashboards).where(eq(dashboards.id, id)).run();
}

// ── Bulk sync (for local-first push/pull) ──

export function syncState(data: {
  dashboards: Array<{ id: string; title: string; widgetIds: string[]; createdAt: number }>;
  widgets: Array<{
    id: string;
    title: string;
    description: string;
    code: string | null;
    files: Record<string, string>;
    layout: unknown;
    messages: unknown[];
  }>;
}) {
  for (const d of data.dashboards) {
    upsertDashboard({
      id: d.id,
      title: d.title,
      widgetIdsJson: JSON.stringify(d.widgetIds),
    });
  }
  for (const w of data.widgets) {
    upsertWidget({
      id: w.id,
      title: w.title,
      description: w.description,
      code: w.code,
      filesJson: JSON.stringify(w.files),
      layoutJson: JSON.stringify(w.layout),
      messagesJson: JSON.stringify(w.messages),
    });
  }
}

export function getFullState() {
  const allDashboards = getAllDashboards().map((d) => ({
    id: d.id,
    title: d.title,
    widgetIds: d.widgetIdsJson ? JSON.parse(d.widgetIdsJson) : [],
    createdAt: d.createdAt instanceof Date ? d.createdAt.getTime() / 1000 : d.createdAt,
  }));
  const allWidgets = getAllWidgets().map((w) => ({
    id: w.id,
    title: w.title,
    description: w.description,
    code: w.code,
    files: w.filesJson ? JSON.parse(w.filesJson) : {},
    layout: w.layoutJson ? JSON.parse(w.layoutJson) : null,
    messages: w.messagesJson ? JSON.parse(w.messagesJson) : [],
  }));
  return { dashboards: allDashboards, widgets: allWidgets };
}
