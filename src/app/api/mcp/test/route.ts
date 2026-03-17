import { createMCPClient } from "@ai-sdk/mcp";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      type: "command" | "sse" | "streamableHttp";
      url?: string;
      command?: string;
      args?: string[];
      headers?: Record<string, string>;
      env?: Record<string, string>;
    };

    let client: Awaited<ReturnType<typeof createMCPClient>>;

    if (body.type === "command") {
      if (!body.command) {
        return Response.json({ ok: false, error: "Command is required" }, { status: 400 });
      }

      const { Experimental_StdioMCPTransport } = await import("@ai-sdk/mcp/mcp-stdio");
      client = await createMCPClient({
        transport: new Experimental_StdioMCPTransport({
          command: body.command,
          args: body.args ?? [],
          env: { ...process.env, ...(body.env ?? {}) } as Record<string, string>,
        }),
      });
    } else {
      if (!body.url) {
        return Response.json({ ok: false, error: "URL is required" }, { status: 400 });
      }

      const transportType = body.type === "streamableHttp" ? "http" : "sse";
      client = await createMCPClient({
        transport: {
          type: transportType,
          url: body.url,
          headers: body.headers ?? {},
        },
      });
    }

    const tools = await client.tools();
    const toolNames = Object.keys(tools);

    await client.close();

    return Response.json({
      ok: true,
      tools: toolNames,
      toolCount: toolNames.length,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return Response.json({ ok: false, error: message }, { status: 200 });
  }
}
