import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { and, eq } from "drizzle-orm";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { boards, strokes } from "@/db/schema";

type Params = { params: { boardId: string; strokeId: string } };

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// DELETE /api/boards/:boardId/strokes/:strokeId — remove one stroke (undo).
export async function DELETE(_req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!UUID_RE.test(params.boardId) || !UUID_RE.test(params.strokeId)) {
    return NextResponse.json({ error: "ไม่พบเส้น" }, { status: 404 });
  }

  const board = await db.query.boards.findFirst({
    where: eq(boards.id, params.boardId),
  });
  if (!board) {
    return NextResponse.json({ error: "ไม่พบบอร์ด" }, { status: 404 });
  }

  const [deleted] = await db
    .delete(strokes)
    .where(
      and(eq(strokes.id, params.strokeId), eq(strokes.boardId, params.boardId))
    )
    .returning({ id: strokes.id });

  if (!deleted) {
    return NextResponse.json({ error: "ไม่พบเส้น" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
