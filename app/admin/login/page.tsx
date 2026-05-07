"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);
    setError("");

    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        password,
      }),
    });

    const data = await res.json();

    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Klaida.");
      return;
    }

    router.push("/rating-summary");
  }

  return (
    <main className="min-h-screen bg-[#f2f5f9] text-gray-800">
      <div className="bg-[#1f5fa8] px-10 py-4 text-lg font-bold text-white">
        Respublikinės Šiaulių Ligoninės Pagalba
      </div>

      <div className="mx-auto mt-16 max-w-md border border-[#d9e1ec] bg-white">
        <div className="border-b border-[#e1e7f0] px-8 py-6">
          <h1 className="text-2xl font-bold text-[#1f5fa8]">
            Administratoriaus prisijungimas
          </h1>
        </div>

        <form onSubmit={handleLogin} className="space-y-5 px-8 py-6">
          <div>
            <label className="mb-1 block text-sm font-bold">
              Slaptažodis
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full border border-[#cfd7e3] px-3 py-2 text-sm focus:border-[#1f5fa8] focus:outline-none"
            />
          </div>

          {error && (
            <div className="text-sm text-red-600">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="bg-[#1f5fa8] px-6 py-2 text-sm font-medium text-white hover:bg-[#174a82] transition"
          >
            {loading ? "Jungiamasi..." : "Prisijungti"}
          </button>
        </form>
      </div>
    </main>
  );
}