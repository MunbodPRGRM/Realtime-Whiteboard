import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { boards } from "@/db/schema";
import { BoardEditor } from "@/components/BoardEditor";

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

  return <BoardEditor boardId={board.id} boardName={board.name} />;
}
