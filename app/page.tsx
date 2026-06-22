import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { LogoutButton } from "@/components/LogoutButton";

export default async function Home() {
  const session = await getServerSession(authOptions);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-gray-50 p-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900">Sketchsync</h1>
        <p className="mt-2 text-gray-600">ไวท์บอร์ดวาดร่วมกันแบบเรียลไทม์</p>
      </div>

      {session?.user ? (
        <div className="flex flex-col items-center gap-4">
          <p className="text-gray-700">
            สวัสดี, <span className="font-semibold">{session.user.name}</span>{" "}
            <span className="text-gray-400">(@{session.user.username})</span>
          </p>
          <div className="flex gap-3">
            <Link
              href="/dashboard"
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              ไปที่บอร์ดของฉัน
            </Link>
            <LogoutButton />
          </div>
        </div>
      ) : (
        <div className="flex gap-3">
          <Link
            href="/login"
            className="rounded-md bg-blue-600 px-5 py-2 font-medium text-white transition hover:bg-blue-700"
          >
            เข้าสู่ระบบ
          </Link>
          <Link
            href="/register"
            className="rounded-md border border-gray-300 px-5 py-2 font-medium text-gray-700 transition hover:bg-gray-100"
          >
            สมัครสมาชิก
          </Link>
        </div>
      )}
    </main>
  );
}
