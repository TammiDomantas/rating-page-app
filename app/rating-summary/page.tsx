export const dynamic = "force-dynamic";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

type RatingRow = {
  technician_name: string | null;
  rating: number | null;
};

type SummaryRow = {
  technicianName: string;
  ratingCount: number;
  averageRating: number;
};

export default async function RatingsSummaryPage() {
  const { data, error } = await supabase
    .from("ratings")
    .select("technician_name, rating")
    .order("technician_name", { ascending: true });

  if (error) {
    console.error("Ratings summary Supabase error:", error);
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-10">
        <div className="mx-auto max-w-4xl rounded-2xl bg-white p-6 shadow">
          <h1 className="mb-4 text-2xl font-bold text-gray-800">
            Technikų įvertinimai
          </h1>
          <p className="text-red-600">Nepavyko užkrauti duomenų.</p>
        </div>
      </main>
    );
  }

  const ratings = (data ?? []) as RatingRow[];

  const grouped = new Map<string, { count: number; sum: number }>();

  for (const row of ratings) {
    const technicianName = row.technician_name?.trim() || "Nenurodytas";
    const rating = row.rating ?? 0;

    const existing = grouped.get(technicianName);

    if (existing) {
      existing.count += 1;
      existing.sum += rating;
    } else {
      grouped.set(technicianName, {
        count: 1,
        sum: rating,
      });
    }
  }

  const summary: SummaryRow[] = Array.from(grouped.entries())
    .map(([technicianName, values]) => ({
      technicianName,
      ratingCount: values.count,
      averageRating: Number((values.sum / values.count).toFixed(2)),
    }))
    .sort((a, b) => b.averageRating - a.averageRating);

  return (
  <main className="min-h-screen bg-[#f2f5f9] text-gray-800">
    <div className="bg-[#1f5fa8] px-10 py-4 text-lg font-bold text-white">
      Respublikinės Šiaulių Ligoninės Pagalba
    </div>

    <div className="mx-auto mt-8 max-w-4xl border border-[#d9e1ec] bg-white">
      <div className="border-b border-[#e1e7f0] px-8 py-6">
        <h1 className="text-2xl font-bold text-[#1f5fa8]">
          Technikų įvertinimai
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Technikų įvertinimų suvestinė pagal pateiktus naudotojų įvertinimus.
        </p>
      </div>

      <div className="px-8 py-6">
        {summary.length === 0 ? (
          <p className="text-sm text-gray-600">Įvertinimų dar nėra.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead>
                <tr className="border-b bg-[#f2f5f9] text-left">
                  <th className="px-4 py-3 font-bold text-gray-700">
                    Technikas
                  </th>
                  <th className="px-4 py-3 font-bold text-gray-700">
                    Įvertinimų skaičius
                  </th>
                  <th className="px-4 py-3 font-bold text-gray-700">
                    Vidutinis įvertinimas
                  </th>
                </tr>
              </thead>

              <tbody>
                {summary.map((row) => (
                  <tr key={row.technicianName} className="border-b last:border-b-0">
                    <td className="px-4 py-3">{row.technicianName}</td>
                    <td className="px-4 py-3">{row.ratingCount}</td>
                    <td className="px-4 py-3">{row.averageRating}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="pt-6">
          <Link
            href="/"
            className="inline-block border border-[#cfd7e3] px-5 py-2 text-sm hover:bg-gray-100 transition"
          >
            Grįžti atgal
          </Link>
        </div>
      </div>
    </div>
  </main>
  );
}