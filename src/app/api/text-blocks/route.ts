import { deleteTextBlock } from "@/db/widgets";

export async function DELETE(request: Request) {
  const { id } = (await request.json()) as { id: string };
  if (!id) {
    return Response.json({ error: "Missing id" }, { status: 400 });
  }
  deleteTextBlock(id);
  return Response.json({ ok: true });
}
