import { NextRequest } from "next/server";
import { ensureWidget, readWidgetFile } from "@/lib/widget-runner";

const LOADING_HTML = `<!DOCTYPE html>
<html class="dark">
<head><meta charset="UTF-8"><meta http-equiv="refresh" content="2"></head>
<body style="margin:0;background:#27272a;display:flex;align-items:center;justify-content:center;height:100vh;font-family:ui-monospace,monospace;color:#71717a;font-size:12px;">
<div style="text-align:center">
<div style="animation:spin 1s linear infinite;display:inline-block;width:16px;height:16px;border:2px solid #52525b;border-top-color:#a1a1aa;border-radius:50%;margin-bottom:8px"></div>
<div>Building widget…</div>
</div>
<style>@keyframes spin{to{transform:rotate(360deg)}}</style>
</body>
</html>`;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; path?: string[] }> }
) {
  const { id, path: pathSegments } = await params;

  const code = await readWidgetFile(id, "src/App.tsx");
  if (!code) {
    return new Response("Widget not found", { status: 404 });
  }

  // Ensure container is running
  const container = await ensureWidget(id);

  // If still building, return loading HTML that auto-refreshes
  if (container.status !== "ready") {
    return new Response(LOADING_HTML, {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  const subPath = pathSegments?.join("/") ?? "";
  const targetUrl = `http://localhost:${container.port}/${subPath}${req.nextUrl.search}`;

  try {
    const upstream = await fetch(targetUrl, {
      headers: {
        Accept: req.headers.get("accept") ?? "*/*",
        "Accept-Encoding": req.headers.get("accept-encoding") ?? "",
      },
      signal: AbortSignal.timeout(10000),
    });

    const contentType =
      upstream.headers.get("content-type") ?? "text/html";

    // For the root HTML response, inject a <base> tag so relative asset
    // paths (./assets/...) resolve correctly even though Next.js strips
    // the trailing slash from the iframe URL.
    if (!subPath && contentType.includes("text/html")) {
      const html = await upstream.text();
      const baseTag = `<base href="/api/widget/${id}/">`;
      const patched = html.replace("<head>", `<head>${baseTag}`);
      return new Response(patched, {
        status: upstream.status,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-store",
        },
      });
    }

    return new Response(upstream.body, {
      status: upstream.status,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return new Response(LOADING_HTML, {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }
}
