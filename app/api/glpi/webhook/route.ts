import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const event = body.event;
    const ticket = body.ticket;

    // get ticket information
    const ticketId = ticket?.id;
    const status = ticket?.status;
    const requester = ticket?.requester;

    // "team" can arrive as JSON array or stringified JSON
    let team = ticket?.team;

    // If team is string, convert it to real JSON
    if (typeof team === "string") {
      try {
        team = JSON.parse(team);
      } catch {
        team = null;
      }
    }

    // get assigned technician from team array
    const technician = Array.isArray(team)
      ? team.find((member: any) => member.role === "assigned")
      : null;

    // Log 
    console.log("Parsed GLPI webhook:");
    console.log({
      event,
      ticketId,
      status,
      requester,
      technician,
    });

    // Return success response to GLPI
    return NextResponse.json({ ok: true });

  } catch (err) {
    console.error("Webhook error:", err);

    // Return error response if payload invalid
    return NextResponse.json(
      { ok: false, error: "Invalid request" },
      { status: 400 }
    );
  }
}