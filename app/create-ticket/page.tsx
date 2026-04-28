"use client";
import Link from "next/link";
export default function CreateTicketPage() {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <form className="bg-white p-6 rounded-xl shadow w-full max-w-md space-y-4">

        <div>
          <label htmlFor="title" className="block mb-1 font-medium text-gray-600">
            Užklausos antraštė:
          </label>

          <input
            type="text"
            id="title"
            name="title"
            className="w-full border rounded-lg p-2 text-gray-600"
          />
        </div>

        <div>
          <label htmlFor="description" className="block mb-1 font-medium text-gray-600">
            Aprašymas:
          </label>

          <textarea
            id="description"
            name="description"
            className="w-full border rounded-lg p-2 h-40 text-gray-600"
          />
        </div>

        <div>
          <label htmlFor="email" className="block mb-1 font-medium text-gray-600">
            Jūsų email:
          </label>

          <input
            type="text"
            id="email"
            name="email"
            className="w-full border rounded-lg p-2 text-gray-600"
          />
        </div>  

        <div>
          <label htmlFor="name" className="block mb-1 font-medium text-gray-600">
            Jūsų vardas:
          </label>

          <input
            type="text"
            id="name"
            name="name"
            className="w-full border rounded-lg p-2 text-gray-600"
          />
        </div>

        <div>

        <label htmlFor="phone" className="block mb-1 font-medium text-gray-600">
        Jūsų telefono numeris:
        </label>

        <input
            id="phone"
            name="phone"
            type="tel"
            onInput={(e) =>
            (e.currentTarget.value = e.currentTarget.value.replace(/\D/g, ""))
            }
            className="w-full border rounded-lg p-2 text-gray-600"
        />
        </div>

        <div>
  
        <select className="w-full border rounded-lg p-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-600">
            <option value="">Pasirinkite savo skyrių</option>
            {/* 
            <option value=""></option>
            */}
            <option value="Administracija (MVK)">Administracija (MVK)</option>
            <option value="Administracija (OK)">Administracija (OK)</option>
            <option value="Administracija (PSI)">Administracija (PSI)</option>
            <option value="Administracija (SL)">Administracija (SL)</option>
            <option value="Administracija (TUB)">Administracija (TUV)</option>
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
            <option value="Laboratorinės diagnostikos skyriaus padalinys (MVK)"></option>
            <option value="Laboratorinės diagnostikos skyriaus padalinys (OK)"></option>
            <option value="Laboratorinės diagnostikos skyrius (SL)"></option>
            <option value=""></option>
            <option value=""></option>
        </select>    
        </div>

        <div>
        <select className="w-full border rounded-lg p-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-600">
            <option value="">Pasirinkite užklausos kategoriją</option>
            {/*
            <optgroup label=""> 
                <option value=""></option>
            </optgroup>
            */}
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

        <select className="w-full border rounded-lg p-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-600">
            <option value="">Pasirinkite užklausos pirmenybė</option>
            <option value="Pagrindinis">Pagrindinis</option>
            <option value="Labai aukštas">Labai aukštas</option>
            <option value="Aukštas">Aukštas</option>
            <option value="Vidutinis">Vidutinis</option>
            <option value="Žemas">Žemas</option>
            <option value="Labai žemas">Labai žemas</option>
        </select>    

        <button
            type="submit"
            className="w-full flex items-center justify-center bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition font-medium"
            >
            Pateikti užklausą
        </button>
        <Link
            href="/"
            className="block w-full bg-blue-600 text-white text-center py-3 rounded-xl hover:bg-blue-700 transition"
            >
              Gryžti atgal
        </Link>
      </form>
    </main>






  )
}