import { NextResponse } from "next/server";

const GLPI_REST_URL = process.env.GLPI_REST_URL!;
const GLPI_APP_TOKEN = process.env.GLPI_APP_TOKEN!;
const GLPI_USER_TOKEN = process.env.GLPI_USER_TOKEN!;

type TicketSatisfaction = {
  id: number;
  tickets_id: number;
  date_answered: string | null;
  satisfaction: number | null;
  comment: string | null;
};

type GlpiTicket = {
  id: number;
  name?: string;
  status?: number;
};

async function initGlpiSession() {
  const res = await fetch(`${GLPI_REST_URL}/initSession`, {
    method: "GET",
    headers: {
      "App-Token": GLPI_APP_TOKEN,
      Authorization: `user_token ${GLPI_USER_TOKEN}`,
    },
  });

  const data = await res.json();

  if (!res.ok) {
    console.error("GLPI initSession error:", data);
    throw new Error("Failed to initialize GLPI session");
  }

  return data.session_token as string;
}

async function killGlpiSession(sessionToken: string) {
  await fetch(`${GLPI_REST_URL}/killSession`, {
    method: "GET",
    headers: {
      "App-Token": GLPI_APP_TOKEN,
      "Session-Token": sessionToken,
    },
  });
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  let sessionToken: string | null = null;

  try {
    const { ticketId } = await params;

    const normalizedTicketId = ticketId.replace(/^0+/, "") || "0";

    sessionToken = await initGlpiSession();

    // get GLPI ticket info
    const ticketRes = await fetch(`${GLPI_REST_URL}/Ticket/${normalizedTicketId}`, {
      method: "GET",
      headers: {
        "App-Token": GLPI_APP_TOKEN,
        "Session-Token": sessionToken,
      },
    });

    const ticketData = await ticketRes.json();

    if (!ticketRes.ok) {
      return NextResponse.json(
        { ok: false, error: "Ticket not found" },
        { status: 404 }
      );
    }

    // get GLPI satisfaction records
    const satisfactionRes = await fetch(`${GLPI_REST_URL}/TicketSatisfaction`, {
      method: "GET",
      headers: {
        "App-Token": GLPI_APP_TOKEN,
        "Session-Token": sessionToken,
      },
    });

    const satisfactionData = await satisfactionRes.json();

    if (!satisfactionRes.ok) {
      console.error("GLPI TicketSatisfaction fetch error:", satisfactionData);

      return NextResponse.json(
        { ok: false, error: "Failed to load satisfaction data" },
        { status: 500 }
      );
    }

    // find satisfaction record for this ticket
    const satisfaction = (satisfactionData as TicketSatisfaction[]).find(
      (item) => String(item.tickets_id) === normalizedTicketId
    );

    const alreadyRated =
      !!satisfaction &&
      (satisfaction.date_answered !== null || satisfaction.satisfaction !== null);

    const ratingAllowed = !!satisfaction && !alreadyRated;

    const ticket = ticketData as GlpiTicket;

    return NextResponse.json({
      ok: true,
      context: {
        ticketId: normalizedTicketId,
        status: String(ticket.status ?? ""),
        requester: null,
        technician: null,
        ratingAllowed,
        createdAt: "",
        alreadyRated,
      },
    });
  } catch (err) {
    console.error("Ticket context API error:", err);

    return NextResponse.json(
      { ok: false, error: "Failed to load ticket context" },
      { status: 500 }
    );
  } finally {
    if (sessionToken) {
      await killGlpiSession(sessionToken);
    }
  }
}