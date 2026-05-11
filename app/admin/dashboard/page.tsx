export const dynamic = "force-dynamic";

import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

type SubmittedTicketRow = {
  id: string;
  email: string | null;
  requester_name: string | null;
  title: string | null;
  glpi_ticket_id: string | null;
  status: string | null;
  created_at: string;
};

type RatingRow = {
  ticket_id: string | null;
  rating: number | null;
  comment: string | null;
  technician_name: string | null;
};

type PageProps = {
  searchParams: Promise<{
    page?: string;
  }>;
};

const PAGE_SIZE = 10;

export default async function AdminDashboardPage({ searchParams }: PageProps) {
  const cookieStore = await cookies();
  const isAdmin = cookieStore.get("admin-auth");

  if (!isAdmin) {
    redirect("/admin/login");
  }

  const params = await searchParams;
  const currentPage = Math.max(Number(params.page ?? "1"), 1);

  const from = (currentPage - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const {
    data: ticketsData,
    error: ticketsError,
    count,
  } = await supabase
    .from("submitted_tickets")
    .select("id, email, requester_name, title, glpi_ticket_id, status, created_at", {
      count: "exact",
    })
    .order("created_at", { ascending: false })
    .range(from, to);

  const { data: ratingsData, error: ratingsError } = await supabase
    .from("ratings")
    .select("ticket_id, rating, comment, technician_name");

  if (ticketsError || ratingsError) {
    return (
      <main className="min-h-screen bg-[#f2f5f9] px-4 py-10">
        <div className="mx-auto max-w-5xl border border-[#d9e1ec] bg-white p-6">
          <h1 className="mb-4 text-2xl font-bold text-[#1f5fa8]">
            Užklausų sąrašas
          </h1>
          <p className="text-red-600">Nepavyko užkrauti duomenų.</p>
        </div>
      </main>
    );
  }

  const tickets = (ticketsData ?? []) as SubmittedTicketRow[];
  const ratings = (ratingsData ?? []) as RatingRow[];

  const totalTickets = count ?? 0;
  const totalPages = Math.max(Math.ceil(totalTickets / PAGE_SIZE), 1);

  const ratingMap = new Map(
    ratings.map((rating) => [String(rating.ticket_id), rating])
  );

  return (
    <main className="min-h-screen bg-[#f2f5f9] text-gray-800">
      <div className="bg-[#1f5fa8] px-10 py-4 text-lg font-bold text-white">
        Respublikinės Šiaulių Ligoninės Pagalba
      </div>

      <div className="mx-auto mt-8 max-w-7xl border border-[#d9e1ec] bg-white">
        <div className="border-b border-[#e1e7f0] px-8 py-6">
          <h1 className="text-2xl font-bold text-[#1f5fa8]">
            Užklausų sąrašas
          </h1>

          <p className="mt-2 text-sm text-gray-600">
            Pateiktos užklausos ir jų naudotojų įvertinimai.
          </p>
        </div>

        <div className="overflow-x-auto px-8 py-6">
          <table className="min-w-full border-collapse text-sm">
            <thead>
              <tr className="border-b bg-[#f2f5f9] text-left">
                <th className="px-4 py-3 font-bold text-gray-700">GLPI ID</th>
                <th className="px-4 py-3 font-bold text-gray-700">Pavadinimas</th>
                <th className="px-4 py-3 font-bold text-gray-700">Vartotojas</th>
                <th className="px-4 py-3 font-bold text-gray-700">El. paštas</th>
                <th className="px-4 py-3 font-bold text-gray-700">Statusas</th>
                <th className="px-4 py-3 font-bold text-gray-700">Įvertinimas</th>
                <th className="px-4 py-3 font-bold text-gray-700">Komentaras</th>
                <th className="px-4 py-3 font-bold text-gray-700">Technikas</th>
                <th className="px-4 py-3 font-bold text-gray-700">Sukurta</th>
              </tr>
            </thead>

            <tbody>
              {tickets.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                    Užklausų dar nėra.
                  </td>
                </tr>
              ) : (
                tickets.map((ticket) => {
                  const rating = ratingMap.get(String(ticket.glpi_ticket_id));

                  return (
                    <tr
                      key={ticket.id}
                      className="border-b last:border-b-0 hover:bg-[#f8fafc]"
                    >
                      <td className="px-4 py-3 font-medium">
                        {ticket.glpi_ticket_id ?? "-"}
                      </td>
                      <td className="px-4 py-3">{ticket.title ?? "-"}</td>
                      <td className="px-4 py-3">{ticket.requester_name ?? "-"}</td>
                      <td className="px-4 py-3">{ticket.email ?? "-"}</td>
                      <td className="px-4 py-3">{ticket.status ?? "-"}</td>
                      <td className="px-4 py-3 font-medium">{rating?.rating ?? "-"}</td>
                      <td className="max-w-[280px] px-4 py-3">{rating?.comment ?? "-"}</td>
                      <td className="px-4 py-3">{rating?.technician_name ?? "-"}</td>
                      <td className="whitespace-nowrap px-4 py-3">
                        {new Date(ticket.created_at).toLocaleString("lt-LT")}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          <div className="mt-6 flex items-center justify-between border-t border-[#e1e7f0] pt-4">
            <p className="text-sm text-gray-600">
              Puslapis {currentPage} iš {totalPages} · Iš viso: {totalTickets}
            </p>

            <div className="flex gap-2">
              <Link
                href={`/admin/dashboard?page=${currentPage - 1}`}
                className={`border border-[#cfd7e3] px-4 py-2 text-sm transition ${
                  currentPage <= 1
                    ? "pointer-events-none opacity-40"
                    : "hover:bg-gray-100"
                }`}
              >
                Ankstesnis
              </Link>

              <Link
                href={`/admin/dashboard?page=${currentPage + 1}`}
                className={`border border-[#cfd7e3] px-4 py-2 text-sm transition ${
                  currentPage >= totalPages
                    ? "pointer-events-none opacity-40"
                    : "hover:bg-gray-100"
                }`}
              >
                Kitas
              </Link>
            </div>
          </div>

          <div className="flex gap-3 pt-6">
            <Link
              href="/rating-summary"
              className="inline-block border border-[#cfd7e3] px-5 py-2 text-sm hover:bg-gray-100 transition"
            >
              Grįžti į įvertinimų suvestinę
            </Link>

            <Link
              href="/"
              className="inline-block bg-[#1f5fa8] px-5 py-2 text-sm font-medium text-white hover:bg-[#174a82] transition"
            >
              Grįžti į pradžią
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}