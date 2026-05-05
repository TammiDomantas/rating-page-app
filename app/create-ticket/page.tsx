"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateTicketPage() {

  const [loading, setLoading] = useState(false); 
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    const res = await fetch("/api/create-ticket", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: formData.get("title"),
        description: formData.get("description"),
        email: formData.get("email"),
        name: formData.get("name"),
        phone: formData.get("phone"),
        department: formData.get("department"), 
        category: formData.get("category"), 
      }),
    });

    const data = await res.json();

    setLoading(false);

    if (!res.ok) {
      alert(JSON.stringify(data, null, 2));
      return;
    }

    router.push("/ticket-made");

    e.currentTarget.reset(); 
  }

  return (
  <main className="min-h-screen bg-[#f2f5f9] text-gray-800">
    {/* TOP BAR */}
    <div className="bg-[#1f5fa8] text-white px-10 py-4 text-lg font-bold">
      Respublikinės Šiaulių Ligoninės Pagalba
    </div>

    {/* WRAPPER */}
    <div className="mx-auto mt-8 max-w-4xl border border-[#d9e1ec] bg-white">
      {/* HEADER */}
      <div className="border-b border-[#e1e7f0] px-8 py-6">
        <h1 className="text-2xl font-bold text-[#1f5fa8]">
          Užklausos sukūrimas
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Norėdami užregistruoti savo užklausą, užpildykite formą.
        </p>
      </div>

      {/* FORM */}
      <form onSubmit={handleSubmit} className="px-8 py-6 space-y-5">

        <div>
          <label className="mb-1 block text-sm font-bold">
            Užklausos antraštė:
          </label>
          <input
            name="title"
            required
            className="w-full border border-[#cfd7e3] px-3 py-2 text-sm focus:border-[#1f5fa8] focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-bold">
            Aprašymas:
          </label>
          <textarea
            name="description"
            required
            className="h-40 w-full resize-y border border-[#cfd7e3] px-3 py-2 text-sm focus:border-[#1f5fa8] focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

          <div>
            <label className="mb-1 block text-sm font-bold">
              Vardas
            </label>
            <input
              name="name"
              required
              className="w-full border border-[#cfd7e3] px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-bold">
              El. paštas
            </label>
            <input
              name="email"
              required
              className="w-full border border-[#cfd7e3] px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-bold">
            Telefono nr.
          </label>
          <input
            name="phone"
            type="tel"
            onInput={(e) =>
              (e.currentTarget.value = e.currentTarget.value.replace(/\D/g, ""))
            }
            className="w-full border border-[#cfd7e3] px-3 py-2 text-sm focus:border-[#1f5fa8] focus:outline-none"
          />
        </div>

        <div>
          <select
            name="department"
            required
            className="w-full border border-[#cfd7e3] bg-white px-3 py-2 text-sm focus:border-[#1f5fa8] focus:outline-none"
          >
            <option value="">Pasirinkite savo skyrių</option>
            <option value="Administracija (MVK)">Administracija (MVK)</option>
            <option value="Administracija (OK)">Administracija (OK)</option>
            <option value="Administracija (PSI)">Administracija (PSI)</option>
            <option value="Administracija (SL)">Administracija (SL)</option>
            <option value="Administracija (TUB)">Administracija (TUB)</option>
            <option value="Akių ligų skyrius (SL)">Akių ligų skyrius (SL)</option>
            <option value="Akušerijos skyrius (MVK)">Akušerijos skyrius (MVK)</option>
            <option value="Ambulatorinės chirurgijos skyrius (SL)">Ambulatorinės chirurgijos skyrius (SL)</option>
            <option value="Anesteziologijos - operacijų skyrius (SL)">Anesteziologijos - operacijų skyrius (SL)</option>
            <option value="Apskaitos ir biudžeto skyrius (SL)">Apskaitos ir biudžeto skyrius (SL)</option>
            <option value="Ausų, nosies, gerklės ligų skyrius (SL)">Ausų, nosies, gerklės ligų skyrius (SL)</option>
            <option value="Onkologijos skyrius (OK)">Onkologijos skyrius (OK)</option>
            <option value="Chirurgijos reanimacijos ir intensyviosios terapijos skyrius (SL)">Chirurgijos reanimacijos ir intensyviosios terapijos skyrius (SL)</option>
            <option value="Energetikos skyrius (SL)">Energetikos skyrius (SL)</option>
            <option value="Ginekologijos skyrius (MVK)">Ginekologijos skyrius (MVK)</option>
            <option value="I chirurgijos skyrius (SL)">I chirurgijos skyrius (SL)</option>
            <option value="Pulmonologijos skyrius (TUB)">Pulmonologijos skyrius (TUB)</option>
            <option value="II chirurgijos skyrius (SL)">II chirurgijos skyrius (SL)</option>
            <option value="Tuberkuliozės skyrius (TUB)">Tuberkuliozės skyrius (TUB)</option>
            <option value="Infekcijų kontrolės skyrius (SL)">Infekcijų kontrolės skyrius (SL)</option>
            <option value="Informacinių technologijų skyrius (SL)">Informacinių technologijų skyrius (SL)</option>
            <option value="Infrastruktūros skyrius (SL)">Infrastruktūros skyrius (SL)</option>
            <option value="Dokumentų valdymo ir klientų aptarnavimo skyrius (SL)">Dokumentų valdymo ir klientų aptarnavimo skyrius (SL)</option>
            <option value="Kardiologijos reanimacijos ir intensyviosios terapijos skyrius (SL)">Kardiologijos reanimacijos ir intensyviosios terapijos skyrius (SL)</option>
            <option value="Klinikinės diagnostikos laboratorija (TUB)">Klinikinės diagnostikos laboratorija (TUB)</option>
            <option value="Klinikinės fiziologijos skyrius (SL)">Klinikinės fiziologijos skyrius (SL)</option>
            <option value="Konsultacijų skyrius (OK)">Konsultacijų skyrius (OK)</option>
            <option value="Konsultacijų skyrius (SL)">Konsultacijų skyrius (SL)</option>
            <option value="Konsultacijų skyrius (TUB)">Konsultacijų skyrius (TUB)</option>
            <option value="Kraujo bankas (SL)">Kraujo bankas (SL)</option>
            <option value="Laboratorinės diagnostikos skyriaus padalinys (MVK)">Laboratorinės diagnostikos skyriaus padalinys (MVK)</option>
            <option value="Laboratorinės diagnostikos skyriaus padalinys (OK)">Laboratorinės diagnostikos skyriaus padalinys (OK)</option>
            <option value="Laboratorinės diagnostikos skyrius (SL)">Laboratorinės diagnostikos skyrius (SL)</option>
          </select>
        </div>

        <div>
          <select
            name="category"
            required
            className="w-full border border-[#cfd7e3] bg-white px-3 py-2 text-sm focus:border-[#1f5fa8] focus:outline-none"
          >
            <option value="">Pasirinkite užklausos kategoriją</option>
            <optgroup label="Informacinių technologijų skyrius">
              <option value="DVS">DVS</option>
              <option value="Elektroninis paštas">Elektroninis paštas</option>
              <option value="ESIS">Esis</option>
              <option value="Kita (NE KROVIMO DARBAI)">Kita (NE KROVIMO DARBAI)</option>
              <option value="Kompiuteris">Kompiuteris</option>
              <option value="medDream">medDream</option>
              <option value="Pirkimai">Pirkimai</option>
              <option value="Spausdintuvas">Spausdintuvas</option>
              <option value="Tabeliai-Grafikai">Tabeliai-Grafikai</option>
              <option value="Vartotojai">Vartotojai</option>
            </optgroup>
          </select>
        </div>

        <div className="pt-3">
          <button
            type="submit"
            disabled={loading}
            className="bg-[#1f5fa8] px-6 py-3 text-sm font-medium text-white hover:bg-[#174a82] transition disabled:opacity-50"
          >
            {loading ? "Siunčiama..." : "Pateikti užklausą"}
          </button>
        </div>

        <Link
          href="/"
          className="inline-block bg-[#1f5fa8] px-6 py-3 text-sm font-medium text-white hover:bg-[#174a82] transition"
        >
          Grįžti atgal
        </Link>
      </form>
    </div>
  </main>
  )
}