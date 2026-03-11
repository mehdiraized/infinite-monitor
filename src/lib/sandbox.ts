import { Sandbox } from "@vercel/sandbox";
import { SCAFFOLD_FILES } from "@/lib/sandbox-template";

const RUNTIME = "node24" as const;
const PORT = 3000;
const TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

export async function createWidgetSandbox(): Promise<{
  sandboxId: string;
  previewUrl: string;
}> {
  const sandbox = await Sandbox.create({
    runtime: RUNTIME,
    ports: [PORT],
    timeout: TIMEOUT_MS,
  });

  const files = Object.entries(SCAFFOLD_FILES).map(([path, content]) => ({
    path,
    content: Buffer.from(content),
  }));

  await sandbox.writeFiles(files);

  await sandbox.runCommand("npm", ["install"]);

  await sandbox.runCommand({
    cmd: "npm",
    args: ["run", "dev"],
    detached: true,
  });

  await new Promise((r) => setTimeout(r, 5000));

  const previewUrl = sandbox.domain(PORT);
  console.log("[sandbox] created:", sandbox.sandboxId, "preview:", previewUrl);

  return { sandboxId: sandbox.sandboxId, previewUrl };
}

export async function getSandbox(sandboxId: string): Promise<Sandbox> {
  return Sandbox.get({ sandboxId });
}

export async function stopWidgetSandbox(
  sandboxId: string
): Promise<void> {
  try {
    const sandbox = await Sandbox.get({ sandboxId });
    await sandbox.stop();
  } catch {
    // Sandbox may already be stopped or expired
  }
}
