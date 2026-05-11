import { supabase } from "@/lib/supabase";
import Link from "next/link";


export default async function AdminDashboardPage() {
  const { data: tickets, error: ticketsError } = await supabase
    .from("submitted_tickets")
    .select("*")
    .order("created_at", { ascending: false });

  const { data: ratings, error: ratingsError } = await supabase
    .from("ratings")
    .select("*");

  if (ticketsError || ratingsError) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f2f5f9] text-gray-800">
        <div className="border border-red-200 bg-white px-6 py-4 text-red-600">
          Klaida kraunant administratoriaus duomenis.
        </div>
      </main>
    );
  }

  const ratingMap = new Map(
    ratings?.map((rating) => [String(rating.ticket_id), rating]) ?? []
  );

  return (
    <main className="min-h-screen bg-[#f2f5f9] p-8 text-gray-800">
      <div className="mx-auto max-w-7xl border border-[#d9e1ec] bg-white">
        {/* HEADER */}
        <div className="border-b border-[#e1e7f0] px-8 py-6">
          <h1 className="text-2xl font-bold text-[#1f5fa8]">
            Administratoriaus skydelis
          </h1>

          <p className="mt-2 text-sm text-gray-600">
            Pateiktos užklausos ir jų įvertinimai.
          </p>
        </div>

        {/* TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#eef4ff] text-left">
              <tr>
                <th className="px-4 py-3">GLPI ID</th>
                <th className="px-4 py-3">Pavadinimas</th>
                <th className="px-4 py-3">Vartotojas</th>
                <th className="px-4 py-3">El. paštas</th>
                <th className="px-4 py-3">Statusas</th>
                <th className="px-4 py-3">Įvertinimas</th>
                <th className="px-4 py-3">Komentaras</th>
                <th className="px-4 py-3">Technikas</th>
                <th className="px-4 py-3">Sukurta</th>
              </tr>
            </thead>

            <tbody>
              {tickets && tickets.length > 0 ? (
                tickets.map((ticket) => {
                  const rating = ratingMap.get(String(ticket.glpi_ticket_id));

                  return (
                    <tr
                      key={ticket.id}
                      className="border-t border-[#edf1f5] hover:bg-[#f8fafc]"
                    >
                      <td className="px-4 py-3 font-medium">
                        {ticket.glpi_ticket_id}
                      </td>

                      <td className="px-4 py-3">
                        {ticket.title}
                      </td>

                      <td className="px-4 py-3">
                        {ticket.requester_name}
                      </td>

                      <td className="px-4 py-3">
                        {ticket.email}
                      </td>

                      <td className="px-4 py-3">
                        {ticket.status}
                      </td>

                      <td className="px-4 py-3 font-medium">
                        {rating?.rating ?? "-"}
                      </td>

                      <td className="max-w-[280px] px-4 py-3">
                        {rating?.comment ?? "-"}
                      </td>

                      <td className="px-4 py-3">
                        {rating?.technician_name ?? "-"}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3">
                        {new Date(ticket.created_at).toLocaleString("lt-LT")}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    Užklausų dar nėra.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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
    </main>
  );
}