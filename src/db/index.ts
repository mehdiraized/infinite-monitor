import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import * as schema from "./schema";

const DB_PATH =
  process.env.DATABASE_PATH || path.join(process.cwd(), "data", "widgets.db");

const dir = path.dirname(DB_PATH);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

const sqlite = new Database(DB_PATH);

sqlite.pragma("journal_mode = WAL");

// Ensure tables and columns exist for migrations
const tables = sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as { name: string }[];
const tableNames = new Set(tables.map((t) => t.name));

if (!tableNames.has("dashboards")) {
  sqlite.exec(`CREATE TABLE dashboards (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL DEFAULT 'Dashboard',
    widget_ids_json TEXT,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch())
  )`);
}

// Add files_json to widgets if missing
if (tableNames.has("widgets")) {
  const cols = sqlite.prepare("PRAGMA table_info(widgets)").all() as { name: string }[];
  const colNames = new Set(cols.map((c) => c.name));
  if (!colNames.has("files_json")) {
    sqlite.exec("ALTER TABLE widgets ADD COLUMN files_json TEXT");
  }
}

export const db = drizzle(sqlite, { schema });

export { schema };
