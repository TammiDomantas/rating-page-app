import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const ticketId = body.ticketId;
    const rating = body.rating;
    const comment = body.comment;

    if (!ticketId || !rating) {
      return NextResponse.json(
        { ok: false, error: "Missing ticketId or rating" },
        { status: 400 }
      );
    }

    // check if this ticket was already rated
    const { data: existingRating, error: existingError } = await supabase
      .from("ratings")
      .select("ticket_id")
      .eq("ticket_id", String(ticketId))
      .maybeSingle();

    if (existingError) {
      console.error("Supabase rating lookup error:", existingError);

      return NextResponse.json(
        { ok: false, error: "Failed to check existing rating" },
        { status: 500 }
      );
    }

    if (existingRating) {
      return NextResponse.json(
        { ok: false, error: "This ticket was already rated" },
        { status: 409 }
      );
    }

    const { error } = await supabase.from("ratings").insert({
      ticket_id: String(ticketId),
      rating: Number(rating),
      comment: comment ? String(comment) : null,
    });

    if (error) {
      console.error("Supabase rating insert error:", error);

      return NextResponse.json(
        { ok: false, error: "Failed to save rating" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Rating API error:", err);

    return NextResponse.json(
      { ok: false, error: "Invalid request" },
      { status: 400 }
    );
  }
}