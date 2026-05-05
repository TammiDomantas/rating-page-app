import Link from "next/link";
export default function TicketMadePage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <h1 className="text-2xl text-gray-600 font-bold">
        Užklausa sukurta sėkmingai!
      </h1>
      <Link
        href="/"
        className="block w-full bg-blue-600 text-white text-center py-3 rounded-xl hover:bg-blue-700 transition"
        >
        Grįžti atgal
      </Link>
    </main>
  );
}