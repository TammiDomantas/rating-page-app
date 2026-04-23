import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white p-8 rounded-2xl shadow w-full max-w-md text-center">

        <h1 className="text-2xl text-gray-800 font-bold mb-4">
          Įvertinimo sistema
        </h1>

        <p className="text-gray-600 mb-6">
          demo
        </p>

        <Link
          href="/rate/123"
          className="block bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition"
        >
          Atidaryti reitinga
        </Link>

      </div>
    </main>
  );
}