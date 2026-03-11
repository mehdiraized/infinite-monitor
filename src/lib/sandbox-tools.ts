import { tool } from "ai";
import { z } from "zod";
import type { Sandbox } from "@vercel/sandbox";

export function createSandboxTools(sandbox: Sandbox) {
  return {
    writeFile: tool({
      description:
        "Write or overwrite a file in the sandbox project. Use this to create or update source files (e.g. src/app/page.tsx, src/components/Widget.tsx, src/app/actions.ts).",
      inputSchema: z.object({
        path: z
          .string()
          .describe("File path relative to project root, e.g. src/app/page.tsx"),
        content: z.string().describe("The full file content to write"),
      }),
      execute: async ({ path, content }) => {
        try {
          await sandbox.writeFiles([{ path, content: Buffer.from(content) }]);
          return { success: true, path };
        } catch (err) {
          return { success: false, path, error: String(err) };
        }
      },
    }),

    readFile: tool({
      description:
        "Read the contents of a file in the sandbox project. Use this to inspect existing code before making changes.",
      inputSchema: z.object({
        path: z
          .string()
          .describe(
            "File path relative to project root, e.g. src/components/Widget.tsx"
          ),
      }),
      execute: async ({ path }) => {
        try {
          const stream = await sandbox.readFile({ path });
          if (!stream) return { path, content: "", error: "File not found" };
          const chunks: Buffer[] = [];
          for await (const chunk of stream) {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
          }
          return { path, content: Buffer.concat(chunks).toString("utf-8") };
        } catch (err) {
          return { path, content: "", error: String(err) };
        }
      },
    }),

    runCommand: tool({
      description:
        "Execute a shell command in the sandbox. Use this to check for build errors (npx tsc --noEmit), list files (ls, find), or inspect logs. Do NOT use this for long-running processes.",
      inputSchema: z.object({
        command: z
          .string()
          .describe("The command to run, e.g. ls, cat, npx, grep"),
        args: z
          .array(z.string())
          .describe("Arguments to pass to the command"),
      }),
      execute: async ({ command, args }) => {
        try {
          const result = await sandbox.runCommand(command, args);
          const stdout = await result.stdout();
          const stderr = await result.stderr();
          return {
            exitCode: result.exitCode,
            stdout: stdout.slice(0, 5000),
            stderr: stderr.slice(0, 5000),
          };
        } catch (err) {
          return { exitCode: -1, stdout: "", stderr: String(err) };
        }
      },
    }),
  };
}
