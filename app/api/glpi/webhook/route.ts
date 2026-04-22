import { NextResponse } from "next/server";


async function getAssignedTechnician(ticketId: string) {
  // 1. Start GLPI API session
  const sessionRes = await fetch(
    `${process.env.GLPI_URL}/apirest.php/initSession`,
    {
      method: "GET",
      headers: {
        "App-Token": process.env.GLPI_APP_TOKEN!,
        Authorization: `user_token ${process.env.GLPI_USER_TOKEN!}`,
      },
    }
  );

  const session = await sessionRes.json();

  // Request users linked to this ticket
  const usersRes = await fetch(
    `${process.env.GLPI_URL}/apirest.php/Ticket/${ticketId}/Ticket_User`,
    {
      method: "GET",
      headers: {
        "App-Token": process.env.GLPI_APP_TOKEN!,
        "Session-Token": session.session_token,
      },
    }
  );

  const users = await usersRes.json();

  // find technician (type 2 = assigned)
  return Array.isArray(users)
    ? users.find((user: any) => user.type === 2)
    : null;
}

export async function POST(req: Request) {
  try {
    // Read raw (for testing)
    const rawBody = await req.text();

    console.log("RAW WEBHOOK BODY:");
    console.log(rawBody);

    // Convert payload string into JSON object
    const body = JSON.parse(rawBody);

    // Extract fields
    const event = body.event;
    const ticket = body.ticket;

    const ticketId = ticket?.id;
    const status = ticket?.status;
    const requester = ticket?.requester;

    // get technician from glpi api
    const technician = ticketId
      ? await getAssignedTechnician(ticketId)
      : null;

    // Log 
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