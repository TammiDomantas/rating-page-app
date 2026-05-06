"use client";

import { useState } from "react";
import Link from "next/link";

type TicketRow = {
  glpi_ticket_id: string;
  title: string;
  status: string;
  created_at: string;
};

export default function StatusPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [error, setError] = useState("");

  async function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setLoading(true);
    setError("");

    const res = await fetch("/api/my-tickets", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });

    const data = await res.json();

    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Nepavyko užkrauti užklausų.");
      return;
    }

    setTickets(data.tickets || []);
  }

  return (
    <main className="min-h-screen bg-[#f2f5f9] text-gray-800">

      {/* TOP BAR */}
      <div className="bg-[#1f5fa8] px-10 py-4 text-lg font-bold text-white">
        Respublikinės Šiaulių Ligoninės Pagalba
      </div>

      {/* WRAPPER */}
      <div className="mx-auto mt-8 max-w-4xl border border-[#d9e1ec] bg-white">

        {/* HEADER */}
        <div className="border-b border-[#e1e7f0] px-8 py-6">
          <h1 className="text-2xl font-bold text-[#1f5fa8]">
            Mano užklausos
          </h1>

          <p className="mt-2 text-sm text-gray-600">
            Įveskite savo el. paštą norėdami matyti pateiktų užklausų būsenas.
          </p>
        </div>

        {/* SEARCH FORM */}
        <form onSubmit={handleSearch} className="space-y-5 px-8 py-6">

          <div>
            <label className="mb-1 block text-sm font-bold">
              El. paštas
            </label>

            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-[#cfd7e3] px-3 py-2 text-sm focus:border-[#1f5fa8] focus:outline-none"
            />
          </div>

          <div className="flex justify-between pt-2">

            <Link
              href="/"
              className="border border-[#cfd7e3] px-5 py-2 text-sm hover:bg-gray-100 transition"
            >
              Grįžti atgal
            </Link>

            <button
              type="submit"
              disabled={loading}
              className="bg-[#1f5fa8] px-6 py-2 text-sm font-medium text-white hover:bg-[#174a82] transition disabled:opacity-50"
            >
              {loading ? "Ieškoma..." : "Ieškoti"}
            </button>

          </div>
        </form>

        {/* ERROR */}
        {error && (
          <div className="px-8 pb-4">
            <div className="border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          </div>
        )}

        {/* RESULTS */}
        <div className="px-8 pb-8">

          {tickets.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse text-sm">

                <thead>
                  <tr className="border-b bg-[#f2f5f9] text-left">
                    <th className="px-4 py-3 font-bold text-gray-700">
                      Užklausos ID
                    </th>

                    <th className="px-4 py-3 font-bold text-gray-700">
                      Pavadinimas
                    </th>

                    <th className="px-4 py-3 font-bold text-gray-700">
                      Būsena
                    </th>

                    <th className="px-4 py-3 font-bold text-gray-700">
                      Sukurta
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {tickets.map((ticket) => (
                    <tr
                      key={ticket.glpi_ticket_id}
                      className="border-b last:border-b-0"
                    >
                      <td className="px-4 py-3">
                        {ticket.glpi_ticket_id}
                      </td>

                      <td className="px-4 py-3">
                        {ticket.title}
                      </td>

                      <td className="px-4 py-3">
                        {ticket.status}
                      </td>

                      <td className="px-4 py-3">
                        {new Date(ticket.created_at).toLocaleString("lt-LT")}
                      </td>
                    </tr>
                  ))}
                </tbody>

              </table>
            </div>
          ) : (
            <p className="text-sm text-gray-600">
              Užklausų nerasta.
            </p>
          )}

        </div>
      </div>
    </main>
  );
}