import Link from "next/link";
export default function TicketMadePage() {
  return (
    <main className="min-h-screen bg-[#f2f5f9] text-gray-800">

      {/* TOP BAR */}
      <div className="bg-[#1f5fa8] text-white px-10 py-4 text-lg font-bold">
        Respublikinės Šiaulių Ligoninės Pagalba
      </div>

      {/* WRAPPER */}
      <div className="mx-auto mt-16 max-w-xl border border-[#d9e1ec] bg-white text-center">

        {/* HEADER */}
        <div className="border-b border-[#e1e7f0] px-8 py-6">
          <h1 className="text-2xl font-bold text-[#1f5fa8]">
            Užklausa sukurta!
          </h1>
        </div>

        {/* CONTENT */}
        <div className="px-8 py-8 space-y-6">
          <p className="text-gray-600">
            Užklausa sukurta sėkmingai!
          </p>

          <Link
            href="/"
            className="inline-block bg-[#1f5fa8] px-6 py-3 text-sm font-medium text-white hover:bg-[#174a82] transition"
          >
            Grįžti atgal
          </Link>
        </div>

      </div>
    </main>
  );
}