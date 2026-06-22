import { Liveblocks } from "@liveblocks/node";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const secret = process.env.LIVEBLOCKS_SECRET_KEY;

// POST /api/liveblocks-auth — issues a Liveblocks access token for the
// signed-in user. Called by the client's LiveblocksProvider.
export async function POST(req: Request) {
  if (!secret) {
    return new Response("Liveblocks is not configured", { status: 501 });
  }

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const liveblocks = new Liveblocks({ secret });

  const lbSession = liveblocks.prepareSession(session.user.id, {
    userInfo: { name: session.user.name ?? session.user.username },
  });

  const { room } = await req.json();
  if (typeof room === "string") {
    lbSession.allow(room, lbSession.FULL_ACCESS);
  }

  const { status, body } = await lbSession.authorize();
  return new Response(body, { status });
}
