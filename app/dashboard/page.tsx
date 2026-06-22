import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { boards } from "@/db/schema";
import { DashboardClient } from "@/components/DashboardClient";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const rows = await db
    .select()
    .from(boards)
    .where(eq(boards.ownerId, session.user.id))
    .orderBy(desc(boards.updatedAt));

  return (
    <DashboardClient
      initialBoards={rows}
      userName={session.user.name ?? session.user.username}
    />
  );
}
