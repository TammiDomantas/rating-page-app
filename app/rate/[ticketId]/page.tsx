"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type TicketContext = {
  ticketId: string;
  status: string;
  requester: {
    id: string;
    name: string;
  } | null;
  technician: {
    id: string;
    name: string;
  } | null;
  ratingAllowed: boolean;
  createdAt: string;
  alreadyRated: boolean;
};

export default function RatingPage() {
  const params = useParams();
  const ticketId = params.ticketId as string;
  // normalize GLPI ticket id from URL
  const normalizedTicketId = ticketId.replace(/^0+/, "") || "0";
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [context, setContext] = useState<TicketContext | null>(null);
  const [loadingContext, setLoadingContext] = useState(true);
  const [contextError, setContextError] = useState("");
  const router = useRouter();

  // Load ticket context
  useEffect(() => {
    async function loadContext() {
      try {
        
        // check that there is no missing ticketId
        if (!ticketId) {
          setContextError("Šios užklausos įvertinti negalima.");
          setLoadingContext(false);
          return;
        }

        // get ticket context from backend
        const res = await fetch(`/api/ticket/${normalizedTicketId}`);
        const data = await res.json();
        // if Error
        if (!res.ok) {
          setContextError("Šios užklausos įvertinti negalima.");
          return;
        }
        // save received ticket context
        setContext(data.context);
      } catch {
        // if request fails completely
        setContextError("Nepavyko užkrauti užklausos informacijos.");
      } finally {
        // stop loading when done (succes or failure)
        setLoadingContext(false);
      }
    }
    // load context

    loadContext();

  }, [normalizedTicketId]);


  // send rating to backend
  async function submitRating() {
  const res = await fetch("/api/rating", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ticketId: normalizedTicketId,
      rating,
      comment,
    }),
  });

  if (!res.ok) {
    const data = await res.json();
    alert(data.error || "Nepavyko išsaugoti įvertinimo.");
    return;
  }

  router.push("/thank-you");
  }

  // while still loading
  if (loadingContext) {
    return (
      <main className="min-h-screen bg-[#f2f5f9] text-gray-800">
        <div className="bg-[#1f5fa8] px-10 py-4 text-lg font-bold text-white">
          Respublikinės Šiaulių Ligoninės Pagalba
        </div>

        <div className="mx-auto mt-16 max-w-xl border border-[#d9e1ec] bg-white text-center">
          <div className="border-b border-[#e1e7f0] px-8 py-6">
            <h1 className="text-2xl font-bold text-[#1f5fa8]">
              Kraunama
            </h1>
          </div>

          <div className="px-8 py-8">
            <p className="text-sm text-gray-600">
              Kraunama užklausos informacija...
            </p>
          </div>
        </div>
      </main>
    );
  }


  // if failed to load or rating not allowed
  if (contextError || !context || !context.ratingAllowed) {
    return (
      <main className="min-h-screen bg-[#f2f5f9] text-gray-800">
        <div className="bg-[#1f5fa8] px-10 py-4 text-lg font-bold text-white">
          Respublikinės Šiaulių Ligoninės Pagalba
        </div>

        <div className="mx-auto mt-16 max-w-xl border border-[#d9e1ec] bg-white text-center">
          <div className="border-b border-[#e1e7f0] px-8 py-6">
            <h1 className="text-2xl font-bold text-[#1f5fa8]">
              Įvertinimas negalimas
            </h1>
          </div>

          <div className="px-8 py-8">
            <p className="text-sm text-gray-600">
              {contextError || "Šios užklausos įvertinti negalima."}
            </p>
          </div>
        </div>
      </main>
    );
  }

  // if ticket was already rated
  if (context.alreadyRated) {
    return (
      <main className="min-h-screen bg-[#f2f5f9] text-gray-800">
        <div className="bg-[#1f5fa8] px-10 py-4 text-lg font-bold text-white">
          Respublikinės Šiaulių Ligoninės Pagalba
        </div>

        <div className="mx-auto mt-16 max-w-xl border border-[#d9e1ec] bg-white text-center">
          <div className="border-b border-[#e1e7f0] px-8 py-6">
            <h1 className="text-2xl font-bold text-[#1f5fa8]">
              Įvertinimas jau pateiktas
            </h1>
          </div>

          <div className="px-8 py-8">
            <p className="text-sm text-gray-600">
              Ši užklausa jau įvertinta.
            </p>
          </div>
        </div>
      </main>
    );
  }

  // main rating form UI
  return (
    <main className="min-h-screen bg-[#f2f5f9] text-gray-800">
      <div className="bg-[#1f5fa8] px-10 py-4 text-lg font-bold text-white">
        Respublikinės Šiaulių Ligoninės Pagalba
      </div>

      <div className="mx-auto mt-8 max-w-2xl border border-[#d9e1ec] bg-white">
        <div className="border-b border-[#e1e7f0] px-8 py-6">
          <h1 className="text-2xl font-bold text-[#1f5fa8]">
            Įvertinkite užklausos įvykdymą
          </h1>

          <p className="mt-2 text-sm text-gray-600">
            Užklausa #{context.ticketId}
          </p>

          <p className="mt-1 text-sm text-gray-600">
            Technikas: {context.technician?.name || "Nenurodytas"}
          </p>
        </div>

        <div className="px-8 py-6 space-y-6">
          <div>
            <label className="mb-2 block text-sm font-bold">
              Įvertinimas
            </label>

            <div className="flex gap-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className={`text-3xl transition ${
                    star <= rating ? "opacity-100" : "opacity-30"
                  }`}
                >
                  ⭐
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-bold">
              Komentaras
            </label>

            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Komentaras"
              className="h-28 w-full resize-y border border-[#cfd7e3] px-3 py-2 text-sm focus:border-[#1f5fa8] focus:outline-none"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={submitRating}
              className="bg-[#1f5fa8] px-6 py-2 text-sm font-medium text-white transition hover:bg-[#174a82]"
            >
              Pateikti įvertinimą
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}