import { withAuth } from "next-auth/middleware";

// Protects authenticated areas. Redirects unauthenticated users to /login
// (the custom sign-in page) instead of NextAuth's default page.
export default withAuth({
  pages: { signIn: "/login" },
});

export const config = {
  matcher: ["/dashboard/:path*", "/board/:path*"],
};
