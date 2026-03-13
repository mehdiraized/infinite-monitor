export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const target = searchParams.get("url");

  if (!target) {
    return Response.json({ error: "url parameter required" }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(target);
  } catch {
    return Response.json({ error: "invalid url" }, { status: 400 });
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    return Response.json({ error: "only http/https allowed" }, { status: 400 });
  }

  try {
    const upstream = await fetch(target, {
      headers: {
        "User-Agent": "infinite-monitor/1.0",
        Accept: "application/json, text/plain, */*",
      },
      signal: AbortSignal.timeout(15000),
    });

    const contentType =
      upstream.headers.get("content-type") ?? "application/json";

    return new Response(upstream.body, {
      status: upstream.status,
      headers: {
        "Content-Type": contentType,
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    return Response.json(
      { error: "upstream fetch failed", detail: String(err) },
      { status: 502 }
    );
  }
}
