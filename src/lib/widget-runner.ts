import Docker from "dockerode";
import getPort, { portNumbers } from "get-port";
import fs from "fs/promises";
import path from "path";

const docker = new Docker();

const WIDGET_BASE_PATH =
  process.env.WIDGET_BASE_PATH ||
  path.join(process.cwd(), "widgets");

const IMAGE_NAME = "widget-base:latest";

interface WidgetContainer {
  containerId: string;
  port: number;
  status: "starting" | "building" | "ready" | "error";
}

const registry = new Map<string, WidgetContainer>();

// ── Security ──

const VALID_PACKAGE_RE = /^(@[\w.-]+\/)?[\w.-]+(@[\w.^~>=<| -]+)?$/;

function sanitizePath(relativePath: string): string {
  const normalized = path.posix.normalize(relativePath);
  if (path.isAbsolute(normalized) || normalized.startsWith("..")) {
    throw new Error(`Invalid path: ${relativePath}`);
  }
  if (!normalized.startsWith("src/")) {
    throw new Error(`Path must be under src/: ${relativePath}`);
  }
  return normalized;
}

function validatePackages(packages: string[]): void {
  for (const pkg of packages) {
    if (!VALID_PACKAGE_RE.test(pkg)) {
      throw new Error(`Invalid package name: ${pkg}`);
    }
  }
}

// ── File operations ──

export async function writeWidgetFile(
  widgetId: string,
  relativePath: string,
  content: string,
): Promise<void> {
  const safePath = sanitizePath(relativePath);
  const fullPath = path.join(WIDGET_BASE_PATH, widgetId, safePath);
  await fs.mkdir(path.dirname(fullPath), { recursive: true });
  await fs.writeFile(fullPath, content, "utf-8");
}

export async function readWidgetFile(
  widgetId: string,
  relativePath: string,
): Promise<string | null> {
  try {
    const safePath = sanitizePath(relativePath);
    const fullPath = path.join(WIDGET_BASE_PATH, widgetId, safePath);
    return await fs.readFile(fullPath, "utf-8");
  } catch {
    return null;
  }
}

export async function listWidgetFiles(
  widgetId: string,
): Promise<string[]> {
  const srcDir = path.join(WIDGET_BASE_PATH, widgetId, "src");
  try {
    return await walkDir(srcDir, srcDir);
  } catch {
    return [];
  }
}

async function walkDir(dir: string, root: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walkDir(full, root)));
    } else {
      files.push("src/" + path.relative(root, full));
    }
  }
  return files.sort();
}

export async function deleteWidgetFile(
  widgetId: string,
  relativePath: string,
): Promise<void> {
  const safePath = sanitizePath(relativePath);
  if (safePath === "src/App.tsx") {
    throw new Error("Cannot delete the entry point App.tsx");
  }
  const fullPath = path.join(WIDGET_BASE_PATH, widgetId, safePath);
  await fs.unlink(fullPath).catch(() => {});
}

// ── Dependencies ──

export async function addWidgetDependencies(
  widgetId: string,
  packages: string[],
): Promise<string[]> {
  validatePackages(packages);
  const depsPath = path.join(WIDGET_BASE_PATH, widgetId, "deps.json");
  let existing: string[] = [];
  try {
    existing = JSON.parse(await fs.readFile(depsPath, "utf-8"));
  } catch {
    // no existing deps file yet
  }
  const merged = [...new Set([...existing, ...packages])];
  await fs.mkdir(path.dirname(depsPath), { recursive: true });
  await fs.writeFile(depsPath, JSON.stringify(merged), "utf-8");
  return merged;
}

// ── Container management ──

export async function ensureWidget(
  widgetId: string,
): Promise<WidgetContainer> {
  const existing = registry.get(widgetId);
  if (existing && existing.status === "ready") return existing;
  if (existing && existing.status === "building") return existing;
  return startWidget(widgetId);
}

const MAX_PORT_RETRIES = 3;

async function startWidget(widgetId: string): Promise<WidgetContainer> {
  await stopWidget(widgetId);

  const widgetDir = path.join(WIDGET_BASE_PATH, widgetId);
  await fs.mkdir(path.join(widgetDir, "src"), { recursive: true });

  const entry: WidgetContainer = {
    containerId: "",
    port: 0,
    status: "starting",
  };
  registry.set(widgetId, entry);

  for (let attempt = 0; attempt < MAX_PORT_RETRIES; attempt++) {
    const port = await getPort({ port: portNumbers(3100, 3999) });
    entry.port = port;

    try {
      const container = await docker.createContainer({
        Image: IMAGE_NAME,
        name: `widget-${widgetId}-${Date.now()}`,
        Cmd: [
          "sh",
          "-c",
          [
            "cp -r /base/. /app",
            "cp -r /widget/src/. /app/src/",
            "if [ -f /widget/deps.json ]; then cd /app && npm install --no-save $(node -e \"process.stdout.write(JSON.parse(require('fs').readFileSync('/widget/deps.json','utf8')).join(' '))\"); fi",
            "cd /app",
            "npx vite build",
            "npx vite preview --host 0.0.0.0 --port 3000",
          ].join(" && "),
        ],
        ExposedPorts: { "3000/tcp": {} },
        HostConfig: {
          PortBindings: {
            "3000/tcp": [{ HostPort: String(port) }],
          },
          Binds: [`${widgetDir}:/widget:ro`],
          AutoRemove: true,
        },
      });

      await container.start();
      entry.containerId = container.id;
      entry.status = "building";

      waitForReady(port)
        .then(() => {
          entry.status = "ready";
          console.log(
            `[widget-runner] Widget ${widgetId} ready on port ${port}`,
          );
        })
        .catch(() => {
          entry.status = "error";
          console.error(
            `[widget-runner] Widget ${widgetId} failed to start`,
          );
        });

      return entry;
    } catch (err) {
      const msg = String(err);
      // Clean up the failed container if it was created but couldn't start
      try {
        const stale = docker.getContainer(`widget-${widgetId}-${Date.now()}`);
        await stale.remove({ force: true }).catch(() => {});
      } catch {
        // Container may not exist
      }
      if (
        msg.includes("port is already allocated") &&
        attempt < MAX_PORT_RETRIES - 1
      ) {
        console.warn(
          `[widget-runner] Port ${port} conflict, retrying (${attempt + 1}/${MAX_PORT_RETRIES})`,
        );
        continue;
      }
      entry.status = "error";
      console.error("[widget-runner] Failed to create container:", err);
      return entry;
    }
  }

  entry.status = "error";
  return entry;
}

export async function stopWidget(widgetId: string): Promise<void> {
  const entry = registry.get(widgetId);
  if (!entry || !entry.containerId) return;

  try {
    const container = docker.getContainer(entry.containerId);
    await container.stop().catch(() => {});
    await container.remove().catch(() => {});
  } catch {
    // Container may already be gone (AutoRemove: true)
  }

  registry.delete(widgetId);
}

export async function rebuildWidget(
  widgetId: string,
): Promise<WidgetContainer> {
  return startWidget(widgetId);
}

export function getWidgetStatus(
  widgetId: string,
): WidgetContainer | null {
  return registry.get(widgetId) ?? null;
}

async function waitForReady(
  port: number,
  timeout = 60000,
): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const res = await fetch(`http://localhost:${port}/`, {
        signal: AbortSignal.timeout(3000),
      });
      if (res.ok || res.status === 404) return;
    } catch {
      // Not ready yet
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`Widget did not start within ${timeout}ms`);
}
