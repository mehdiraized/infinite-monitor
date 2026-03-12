import { syncState, getFullState } from "@/db/widgets";

export async function GET() {
  const state = getFullState();
  return Response.json(state);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { dashboards, widgets } = body as {
    dashboards: Array<{ id: string; title: string; widgetIds: string[]; createdAt: number }>;
    widgets: Array<{
      id: string;
      title: string;
      description: string;
      code: string | null;
      files: Record<string, string>;
      layout: unknown;
      messages: unknown[];
    }>;
  };

  syncState({ dashboards: dashboards ?? [], widgets: widgets ?? [] });
  return Response.json({ ok: true });
}
