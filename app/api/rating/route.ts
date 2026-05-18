import { NextResponse } from "next/server";

const GLPI_RATING_ENDPOINT = process.env.GLPI_RATING_ENDPOINT!;
const GLPI_RATING_SECRET = process.env.GLPI_RATING_SECRET!;

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // make sure ticketId is string
    const ticketId =
      typeof body.ticketId === "string"
        ? body.ticketId.trim()
        : String(body.ticketId ?? "");

    // remove leading 0s
    const normalizedTicketId = ticketId.replace(/^0+/, "") || "0";

    const rating = Number(body.rating);

    // trim comment
    const comment =
      typeof body.comment === "string"
        ? body.comment.trim()
        : "";

    if (!normalizedTicketId || !rating) {
      return NextResponse.json(
        { ok: false, error: "Missing ticketId or rating" },
        { status: 400 }
      );
    }

    // must have at least 1 star
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json(
        { ok: false, error: "Rating must be an integer between 1 and 5" },
        { status: 400 }
      );
    }

    // send rating to custom PHP endpoint on GLPI server
    const glpiRes = await fetch(GLPI_RATING_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Rating-Secret": GLPI_RATING_SECRET,
      },
      body: JSON.stringify({
        ticketId: normalizedTicketId,
        rating,
        comment,
      }),
    });

    const glpiData = await glpiRes.json();

    if (!glpiRes.ok || !glpiData.ok) {
      console.error("Custom GLPI rating endpoint error:", glpiData);

      return NextResponse.json(
        {
          ok: false,
          error: glpiData.error || "Failed to save rating to GLPI",
        },
        { status: glpiRes.status || 500 }
      );
    }

    console.log("Rating successfully saved to GLPI:", {
      ticketId: normalizedTicketId,
      rating,
      comment,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Rating API error:", err);

    return NextResponse.json(
      { ok: false, error: "Invalid request" },
      { status: 400 }
    );
  }
}