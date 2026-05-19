import { NextResponse } from "next/server";

const GLPI_URL = process.env.GLPI_URL!;
const GLPI_API_BASE = process.env.GLPI_API_BASE!;
const GLPI_CLIENT_ID = process.env.GLPI_CLIENT_ID!;
const GLPI_CLIENT_SECRET = process.env.GLPI_CLIENT_SECRET!;
const GLPI_USERNAME = process.env.GLPI_USERNAME!;
const GLPI_PASSWORD = process.env.GLPI_PASSWORD!;

type GlpiTicket = {
  id: number | string;
  name?: string;
  status?: unknown;
  date_creation?: string;
  date?: string;
  created_at?: string;
  content?: string;
};

function getStatusLabel(status: unknown) {
  if (typeof status === "string") return status;
  if (typeof status === "number") return String(status);

  if (status && typeof status === "object") {
    const s = status as {
      name?: string;
      label?: string;
      value?: string | number;
    };

    return String(s.name ?? s.label ?? s.value ?? "");
  }

  return "";
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = String(body.email || "").trim().toLowerCase();

    if (!email) {
      return NextResponse.json(
        { ok: false, error: "Email is required" },
        { status: 400 }
      );
    }

    // authenticate with GLPI high-level API
    const tokenRes = await fetch(`${GLPI_API_BASE}/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        grant_type: "password",
        client_id: GLPI_CLIENT_ID,
        client_secret: GLPI_CLIENT_SECRET,
        username: GLPI_USERNAME,
        password: GLPI_PASSWORD,
        scope: "api",
      }),
    });

    const tokenData = await tokenRes.json();

    if (!tokenRes.ok) {
      console.error("GLPI OAuth error:", tokenData);

      return NextResponse.json(
        { ok: false, error: "GLPI authentication failed" },
        { status: 500 }
      );
    }

    const accessToken = tokenData.access_token;

    // Search tickets directly in GLPI via email
    const ticketRes = await fetch(
      `${GLPI_URL}/Assistance/Ticket?searchText=${encodeURIComponent(email)}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const ticketData = await ticketRes.json();

    if (!ticketRes.ok) {
      console.error("GLPI ticket search error:", ticketData);

      return NextResponse.json(
        { ok: false, error: "Failed to load tickets from GLPI" },
        { status: 500 }
      );
    }


    const rawTickets = Array.isArray(ticketData) ? ticketData : [];

    

    const filteredTickets = rawTickets.filter((ticket: GlpiTicket) => {
      const content = String(ticket.content ?? "").toLowerCase();
      const title = String(ticket.name ?? "").toLowerCase();

      return content.includes(email) || title.includes(email);
    });

    const tickets = filteredTickets.map((ticket: GlpiTicket) => ({
      glpi_ticket_id: String(ticket.id),
      title: ticket.name ?? `Užklausa #${ticket.id}`,
      status: getStatusLabel(ticket.status),
      created_at:
        ticket.date_creation ??
        ticket.created_at ??
        ticket.date ??
        new Date().toISOString(),
    }));

    console.log("GLPI ticket search count:", Array.isArray(ticketData) ? ticketData.length : "not array");
    console.log("Filtered ticket count:", tickets.length);
    
    return NextResponse.json({
      ok: true,
      tickets,
    });
  } catch (err) {
    console.error("my-tickets API error:", err);

    return NextResponse.json(
      { ok: false, error: "Server error" },
      { status: 500 }
    );
  }
}