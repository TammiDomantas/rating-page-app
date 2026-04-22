"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RatingPage({
  params,
}: {
  params: { ticketId: string };
}) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const router = useRouter();

  async function submitRating() {
    await fetch("/api/rating", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ticketId: params.ticketId,
        rating,
        comment,
      }),
    });

    router.push("/thank-you");
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white p-8 rounded-2xl shadow w-full max-w-md">

        <h1 className="text-xl text-gray-600 font-bold text-center mb-2">
          Įvertinkite užklausos įvykdymą
        </h1>

        <p className="text-gray-600 text-center mb-6">
          Ticket #{params.ticketId}
        </p>

        <div className="flex justify-center gap-3 mb-6">
          {[1,2,3,4,5].map((star) => (
            <button
              key={star}
              onClick={() => setRating(star)}
              className={`text-3xl ${
                star <= rating ? "opacity-100" : "opacity-30"
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