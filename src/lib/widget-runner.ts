import Docker from "dockerode";
import getPort, { portNumbers } from "get-port";
import fs from "fs/promises";
import path from "path";
const docker = new Docker();

const WIDGET_BASE_PATH =
  process.env.WIDGET_BASE_PATH || path.join(process.cwd(), "widgets");

const IMAGE_NAME = "widget-base:latest";
const CONTAINER_NAME = "widget-runtime";

// ── Types ──

interface WidgetStatus {
  status: "building" | "ready" | "error";
  port: number;
}

// ── Singleton runtime container ──

let runtimePort: number | null = null;
let runtimeContainerId: string | null = null;
let runtimeStarting: Promise<number> | null = null;

async function ensureRuntime(): Promise<number> {
  if (runtimePort && runtimeContainerId) {
    try {
      const c = docker.getContainer(runtimeContainerId);
      const info = await c.inspect();
      if (info.State.Running) return runtimePort;
    } catch {
      // Container gone, recreate
    }
    runtimePort = null;
    runtimeContainerId = null;
  }

  if (runtimeStarting) return runtimeStarting;

  runtimeStarting = (async () => {
    // Remove any stale container with our name
    try {
      const old = docker.getContainer(CONTAINER_NAME);
      await old.stop().catch(() => {});
      await old.remove({ force: true }).catch(() => {});
    } catch {
      // Doesn't exist
    }

    const port = await getPort({ port: portNumbers(3100, 3999) });

    const container = await docker.createContainer({
      Image: IMAGE_NAME,
      name: CONTAINER_NAME,
      ExposedPorts: { "3000/tcp": {} },
      HostConfig: {
        PortBindings: {
          "3000/tcp": [{ HostPort: String(port) }],
        },
      },
    });

    await container.start();
    runtimeContainerId = container.id;
    runtimePort = port;

    // Wait for serve to be listening
    await waitForReady(port, 30000);
    console.log(`[widget-runtime] Container started on port ${port}`);

    runtimeStarting = null;
    return port;
  })();

  try {
    return await runtimeStarting;
  } catch (err) {
    runtimeStarting = null;
    throw err;
  }
}

// ── Exec helper that waits for completion ──

async function execInRuntime(cmd: string): Promise<{ exitCode: number; output: string }> {
  const port = await ensureRuntime();
  const container = docker.getContainer(runtimeContainerId!);

  const exec = await container.exec({
    Cmd: ["sh", "-c", cmd],
    AttachStdout: true,
    AttachStderr: true,
  });

  return new Promise((resolve, reject) => {
    exec.start({ hijack: true, stdin: false }, (err: Error | null, stream: NodeJS.ReadableStream | undefined) => {
      if (err) return reject(err);
      if (!stream) return reject(new Error("No stream from exec"));

      const chunks: Buffer[] = [];
      stream.on("data", (chunk: Buffer) => chunks.push(chunk));
      stream.on("end", () => {
        exec.inspect().then((info: { ExitCode: number }) => {
          resolve({
            exitCode: info.ExitCode ?? 0,
            output: Buffer.concat(chunks).toString("utf-8"),
          });
        }).catch(reject);
      });
      stream.on("error", reject);
    });
  });
}

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

// ── File operations (write to host disk as staging) ──

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

export async function listWidgetFiles(widgetId: string): Promise<string[]> {
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

// ── Build mutex ──

const buildLocks = new Map<string, Promise<void>>();
const widgetStatuses = new Map<string, WidgetStatus>();

// ── Build a widget inside the runtime container ──

async function doBuild(widgetId: string): Promise<void> {
  const port = await ensureRuntime();
  const widgetDir = path.join(WIDGET_BASE_PATH, widgetId);
  const container = docker.getContainer(runtimeContainerId!);

  widgetStatuses.set(widgetId, { status: "building", port });

  try {
    // Inject widget files via tar archive using putArchive
    const srcDir = path.join(widgetDir, "src");
    const tarStream = await createTarFromDir(widgetId, widgetDir);
    await container.putArchive(tarStream, { path: "/app/widgets/" });

    // Build script: set up the workspace, then vite build
    const setupAndBuild = [
      `mkdir -p /app/widgets/${widgetId}/src /app/dist/${widgetId}`,
      `cp /base/vite.config.ts /base/tsconfig.json /base/postcss.config.js /base/tailwind.config.ts /base/index.html /base/package.json /app/widgets/${widgetId}/`,
      `ln -sf /base/node_modules /app/widgets/${widgetId}/node_modules`,
      `test -d /base/src/components && cp -r /base/src/components /app/widgets/${widgetId}/src/ || true`,
      `test -d /base/src/lib && cp -r /base/src/lib /app/widgets/${widgetId}/src/ || true`,
      `cp /base/src/index.css /app/widgets/${widgetId}/src/index.css`,
      `cp /base/src/main.tsx /app/widgets/${widgetId}/src/main.tsx`,
      // Install extra deps if any
      `if [ -f /app/widgets/${widgetId}/deps.json ]; then cd /app/widgets/${widgetId} && npm install --no-save $(node -e "process.stdout.write(JSON.parse(require('fs').readFileSync('deps.json','utf8')).join(' '))") 2>/dev/null || true; fi`,
      // Vite build into the dist directory
      `cd /app/widgets/${widgetId} && npx vite build --outDir /app/dist/${widgetId} 2>&1`,
    ].join(" && ");

    const result = await execInRuntime(setupAndBuild);

    if (result.exitCode !== 0) {
      console.error(`[widget-runtime] Build failed for ${widgetId}:`, result.output);
      widgetStatuses.set(widgetId, { status: "error", port });
      return;
    }

    console.log(`[widget-runtime] Widget ${widgetId} built successfully`);
    widgetStatuses.set(widgetId, { status: "ready", port });
  } catch (err) {
    console.error(`[widget-runtime] Build error for ${widgetId}:`, err);
    widgetStatuses.set(widgetId, { status: "error", port });
  }
}

async function createTarFromDir(widgetId: string, widgetDir: string): Promise<Buffer> {
  const { pack } = await import("tar-stream");
  const p = pack();
  const chunks: Buffer[] = [];

  const srcDir = path.join(widgetDir, "src");

  async function addDir(dir: string, base: string) {
    let entries;
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const archivePath = path.join(base, entry.name);
      if (entry.isDirectory()) {
        await addDir(fullPath, archivePath);
      } else {
        const content = await fs.readFile(fullPath);
        p.entry({ name: archivePath }, content);
      }
    }
  }

  // Add src/ files under <widgetId>/src/
  await addDir(srcDir, `${widgetId}/src`);

  // Add deps.json if it exists
  try {
    const deps = await fs.readFile(path.join(widgetDir, "deps.json"));
    p.entry({ name: `${widgetId}/deps.json` }, deps);
  } catch {
    // No deps.json
  }

  p.finalize();

  return new Promise((resolve, reject) => {
    p.on("data", (chunk: Buffer) => chunks.push(chunk));
    p.on("end", () => resolve(Buffer.concat(chunks)));
    p.on("error", reject);
  });
}

// ── Public API ──

export async function buildWidget(widgetId: string): Promise<void> {
  const existing = buildLocks.get(widgetId);
  if (existing) await existing;

  const promise = doBuild(widgetId);
  buildLocks.set(widgetId, promise);
  try {
    await promise;
  } finally {
    buildLocks.delete(widgetId);
  }
}

export async function ensureWidget(widgetId: string): Promise<WidgetStatus> {
  const port = await ensureRuntime();

  const existing = widgetStatuses.get(widgetId);
  if (existing && existing.status === "ready") return existing;
  if (existing && existing.status === "building") return existing;

  // Check if already built in the container
  try {
    const result = await execInRuntime(`test -f /app/dist/${widgetId}/index.html && echo exists`);
    if (result.output.includes("exists")) {
      const status: WidgetStatus = { status: "ready", port };
      widgetStatuses.set(widgetId, status);
      return status;
    }
  } catch {
    // Not built yet
  }

  // Trigger async build, return building status
  const status: WidgetStatus = { status: "building", port };
  widgetStatuses.set(widgetId, status);
  buildWidget(widgetId).catch((err) => {
    console.error(`[widget-runtime] Background build failed for ${widgetId}:`, err);
  });
  return status;
}

export async function rebuildWidget(widgetId: string): Promise<WidgetStatus> {
  const port = await ensureRuntime();
  const status: WidgetStatus = { status: "building", port };
  widgetStatuses.set(widgetId, status);

  buildWidget(widgetId).catch((err) => {
    console.error(`[widget-runtime] Rebuild failed for ${widgetId}:`, err);
  });

  return status;
}

export async function stopWidget(widgetId: string): Promise<void> {
  widgetStatuses.delete(widgetId);
  if (!runtimeContainerId) return;
  try {
    await execInRuntime(`rm -rf /app/dist/${widgetId} /app/widgets/${widgetId}`);
  } catch {
    // Container might be gone
  }
  // Clean up staging files from host disk
  const widgetDir = path.join(WIDGET_BASE_PATH, widgetId);
  fs.rm(widgetDir, { recursive: true, force: true }).catch(() => {});
}

export function getWidgetStatus(widgetId: string): WidgetStatus | null {
  return widgetStatuses.get(widgetId) ?? null;
}

// ── Health check ──

async function waitForReady(port: number, timeout = 60000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const res = await fetch(`http://localhost:${port}/`, {
        signal: AbortSignal.timeout(3000),
      });
      // serve returns 200 for the directory listing even if /app/dist is empty
      if (res.ok || res.status === 404) return;
    } catch {
      // Not ready yet
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`Runtime container did not start within ${timeout}ms`);
}
