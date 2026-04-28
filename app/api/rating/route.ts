import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const ticketId = body.ticketId;
    const normalizedTicketId = ticketId.replace(/^0+/,"");

    const rating = Number(body.rating);
    const comment = // trim comment
      typeof body.comment === "string"
      ? body.comment.trim()
      : "";

    if (!ticketId || !rating) {
      return NextResponse.json(
        { ok: false, error: "Missing ticketId or rating" },
        { status: 400 }
      );
    }

    // must have atleast 1 star
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json(
        { ok: false, error: "Rating must be an integer between 1 and 5" },
        { status: 400 }
      );
    }

    // check if this ticket was already rated
    const { data: existingRating, error: existingError } = await supabase
      .from("ratings")
      .select("ticket_id")
      .eq("ticket_id", normalizedTicketId));
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

    const { data: contextData, error: contextError } = await supabase
      .from("ticket_context")
      .select("technician_id, technician_name")
      .eq("ticket_id", normalizedTicketId))
      .single();

    if (contextError || !contextData) {
      console.error("Supabase ticket_context lookup error:", contextError);
      return NextResponse.json(
        { ok: false, error: "Ticket context not found" },
        { status: 404 }
      );
    }


    // save rating
    const { error } = await supabase.from("ratings").insert({
      ticket_id: String(ticketId),
      technician_id: contextData.technician_id,
      technician_name: contextData.technician_name,
      rating,
      comment: comment ? comment : null,
    });

    if (error) {
      console.error("Supabase rating insert error:", error);

      return NextResponse.json(
        { ok: false, error: "Failed to save rating" },
        { status: 500 }
      );
    }

    // disable further rating attempts for this ticket
    const { error: updateError } = await supabase
      .from("ticket_context")
      .update({ rating_allowed: false })
      .eq("ticket_id", normalizedTicketId));

    if (updateError) {
      console.error("Supabase rating_allowed update error:", updateError);
    }


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