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
        const res = await fetch(`/api/ticket/${ticketId}`);
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

  }, [ticketId]);


  // send rating to backend
  async function submitRating() {
  const res = await fetch("/api/rating", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ticketId,
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
      <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white p-8 rounded-2xl shadow w-full max-w-md text-center">

          <p className="text-gray-600">

            Kraunama užklausos informacija...

          </p>

        </div>
      </main>
    );
  }


  // if failed to load or rating not allowed
  if (contextError || !context || !context.ratingAllowed) {

    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white p-8 rounded-2xl shadow w-full max-w-md text-center">

          <h1 className="text-xl text-gray-700 font-bold mb-3">

            Įvertinimas negalimas

          </h1>

          <p className="text-gray-600">

            {contextError || "Šios užklausos įvertinti negalima."}

          </p>

        </div>
      </main>
    );
  }

  // if ticket was already rated
  if (context.alreadyRated) {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white p-8 rounded-2xl shadow w-full max-w-md text-center">
        <h1 className="text-xl text-gray-700 font-bold mb-3">
          Įvertinimas jau pateiktas
        </h1>

        <p className="text-gray-600">
          Ši užklausa jau įvertinta.
        </p>
      </div>
    </main>
  );
  }

  // main rating form UI
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white p-8 rounded-2xl shadow w-full max-w-md">
        <h1 className="text-xl text-gray-600 font-bold text-center mb-2">
          Įvertinkite užklausos įvykdymą
        </h1>
        
        <p className="text-gray-600 text-center mb-2">
          Užklausa #{context.ticketId}
        </p>

        <p className="text-gray-600 text-center mb-6">
          Technikas: {context.technician?.name || "Nenurodytas"}
        </p>

        <div className="flex justify-center gap-3 mb-6">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => setRating(star)}
              className={`text-3xl ${
                star <= rating
                  ? "opacity-100"
                  : "opacity-30"
              }`}
            >
              ⭐
            </button>
          ))}
        </div>

        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Komentaras"
          className="w-full border rounded-lg p-2 h-28 mb-4 text-gray-400"
        />

        <button
          onClick={submitRating}
          className="w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition"
        >
          Pateikti įvertinimą
        </button>

      </div>

    </main>
  );
}