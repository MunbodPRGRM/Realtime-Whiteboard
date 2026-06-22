"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, username, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "สมัครสมาชิกไม่สำเร็จ");
      setLoading(false);
      return;
    }

    // Auto sign-in right after a successful registration.
    const signInRes = await signIn("credentials", {
      redirect: false,
      username,
      password,
    });

    setLoading(false);

    if (signInRes?.error) {
      // Account was created but auto login failed — send to login page.
      router.push("/login");
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4 rounded-xl bg-white p-8 shadow-md"
      >
        <h1 className="text-center text-2xl font-bold text-gray-900">
          สมัครสมาชิก
        </h1>

        {error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        )}

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            ชื่อที่แสดง
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            ชื่อผู้ใช้
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            รหัสผ่าน{" "}
            <span className="text-gray-400">(อย่างน้อย 6 ตัวอักษร)</span>
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-blue-600 py-2 font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "กำลังสมัคร..." : "สมัครสมาชิก"}
        </button>

        <p className="text-center text-sm text-gray-600">
          มีบัญชีอยู่แล้ว?{" "}
          <Link href="/login" className="text-blue-600 hover:underline">
            เข้าสู่ระบบ
          </Link>
        </p>
      </form>
    </main>
  );
}
