import { NextResponse } from "next/server";

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

    // log
    console.log("EXTRACTED FIELDS:");
    console.log({
      event,
      ticketId,
      status,
      requester,
      technician,
    });
    
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Webhook error:", err);

    return NextResponse.json(
      { ok: false, error: "Invalid request" },
      { status: 400 }
    );
  }
}