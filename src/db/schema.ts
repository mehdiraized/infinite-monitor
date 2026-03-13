import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const dashboards = sqliteTable("dashboards", {
  id: text("id").primaryKey(),
  title: text("title").notNull().default("Dashboard"),
  widgetIdsJson: text("widget_ids_json"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const widgets = sqliteTable("widgets", {
  id: text("id").primaryKey(),
  title: text("title").notNull().default("Untitled Widget"),
  description: text("description").notNull().default(""),
  code: text("code"),
  filesJson: text("files_json"),
  layoutJson: text("layout_json"),
  messagesJson: text("messages_json"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export type DashboardRow = typeof dashboards.$inferSelect;
export type WidgetRow = typeof widgets.$inferSelect;
export type NewWidget = typeof widgets.$inferInsert;
