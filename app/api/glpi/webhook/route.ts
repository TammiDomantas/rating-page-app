import { NextResponse } from "next/server";
import crypto from "crypto";
import { supabase } from "@/lib/supabase";

const recentTickets = new Map<string, number>(); // temporarilly store recently processed ticket IDs

export async function POST(req: Request) {
  try {
    // get and output raw body (for testing)
    const rawBody = await req.text();

    console.log("RAW WEBHOOK BODY:");
    console.log(rawBody);

    // extract json
    const body = JSON.parse(rawBody);

    const event = body.event;
    const ticket = body.ticket;

    const ticketId = ticket?.id;
    const status = ticket?.status;
    const requester = ticket?.requester;
    const technician = ticket?.technician;

    // prevent proccesing duplicates 

    if (ticketId) {
      const now = Date.now();
      const lastSeen = recentTickets.get(ticketId);
      // if same ticket triggered webhook within last 30 seconds → ignore it
      if (lastSeen && now - lastSeen < 30_000) {
        console.log(`Duplicate webhook ignored for ticket ${ticketId}`);

        return NextResponse.json({
          ok: true,
          ignored: true,
        });
      }

      // remember this ticket as recently processed
      recentTickets.set(ticketId, now);
    }


    // save ticket context to Supabase
    if (ticketId) {
      const { error } = await supabase.from("ticket_context").upsert(
        {
          ticket_id: String(ticketId),
          status: String(status ?? ""),
          requester_id: requester?.id ? String(requester.id) : null,
          requester_name: requester?.name ? String(requester.name) : null,
          technician_id: technician?.id ? String(technician.id) : null,
          technician_name: technician?.name ? String(technician.name) : null,
          rating_allowed: status === "Solved",
        },
        {
          onConflict: "ticket_id",
        }
      );

      if (error) {
        console.error("Supabase save error:", error);

        return NextResponse.json(
          { ok: false, error: "Failed to save ticket context" },
          { status: 500 }
        );
      }
    }

    // log
    console.log("EXTRACTED FIELDS:");
    console.log({
      event,
      ticketId,
      status,
      requester,
      technician,
    });

    // generate link
    const ratingLink = `${process.env.APP_URL}/rate/${ticketId}`;

    // log the link
    console.log("Rating link:", ratingLink);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Webhook error:", err);

    return NextResponse.json(
      { ok: false, error: "Invalid request" },
      { status: 400 }
    );
  }
}