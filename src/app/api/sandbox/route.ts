import { getSandbox, stopWidgetSandbox } from "@/lib/sandbox";

export async function POST(request: Request) {
  const { sandboxId, previewUrl } = (await request.json()) as {
    sandboxId?: string;
    previewUrl?: string;
  };

  if (!sandboxId || !previewUrl) {
    return Response.json({ error: "sandboxId and previewUrl required" }, { status: 400 });
  }

  // First verify the sandbox VM is still registered
  try {
    await getSandbox(sandboxId);
  } catch {
    return Response.json({ alive: false });
  }

  // Then check the dev server is responding — retry once with a generous timeout
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(previewUrl, {
        method: "GET",
        signal: AbortSignal.timeout(12000),
      });
      if (res.ok || res.status === 404) {
        // 404 means the server is up but the route doesn't exist yet — still alive
        return Response.json({ alive: true });
      }
    } catch {
      // timeout or network error — try once more before giving up
    }
    if (attempt === 0) await new Promise((r) => setTimeout(r, 2000));
  }

  return Response.json({ alive: false });
}

export async function DELETE(request: Request) {
  const { sandboxId } = (await request.json()) as { sandboxId: string };

  if (!sandboxId) {
    return Response.json({ error: "sandboxId is required" }, { status: 400 });
  }

  await stopWidgetSandbox(sandboxId);
  return Response.json({ ok: true });
}
