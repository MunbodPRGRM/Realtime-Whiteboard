import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { boards, strokes } from "@/db/schema";
import { BoardRoom } from "@/components/BoardRoom";
import type { LocalStroke } from "@/lib/types";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function BoardPage({
  params,
}: {
  params: { boardId: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  // Avoid passing a malformed id into a uuid column (Postgres would throw).
  if (!UUID_RE.test(params.boardId)) notFound();

  const board = await db.query.boards.findFirst({
    where: eq(boards.id, params.boardId),
  });
  if (!board) notFound();

  const rows = await db
    .select({
      id: strokes.id,
      points: strokes.points,
      color: strokes.color,
      width: strokes.width,
    })
    .from(strokes)
    .where(eq(strokes.boardId, board.id))
    .orderBy(asc(strokes.createdAt));

  const initialStrokes: LocalStroke[] = rows;
  const realtimeEnabled = !!process.env.LIVEBLOCKS_SECRET_KEY;

  return (
    <BoardRoom
      boardId={board.id}
      boardName={board.name}
      initialStrokes={initialStrokes}
      realtimeEnabled={realtimeEnabled}
    />
  );
}
