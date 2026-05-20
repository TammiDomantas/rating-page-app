import { NextResponse } from "next/server";

const GLPI_URL = process.env.GLPI_URL!;
const GLPI_API_BASE = process.env.GLPI_API_BASE!;
const GLPI_CLIENT_ID = process.env.GLPI_CLIENT_ID!;
const GLPI_CLIENT_SECRET = process.env.GLPI_CLIENT_SECRET!;
const GLPI_USERNAME = process.env.GLPI_USERNAME!;
const GLPI_PASSWORD = process.env.GLPI_PASSWORD!;

type GlpiTeamMember = {
  role?: string;
  id?: number | string;
  name?: string;
  display_name?: string;
};

type GlpiTicket = {
  id: number | string;
  name?: string;
  status?: unknown;
  date_creation?: string;
  date?: string;
  created_at?: string;
  content?: string;
  team?: GlpiTeamMember[];
};

type GlpiUser = {
  id?: number | string;
  name?: string;
  emails?: {
    email?: string;
  }[];
};

// Convert different GLPI status shapes into readable text
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

// Authenticate with GLPI API
async function getAccessToken() {
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
    throw new Error("GLPI authentication failed");
  }

  return tokenData.access_token as string;
}

// Find GLPI user by submitted email
async function findUserByEmail(accessToken: string, email: string) {
  const userRes = await fetch(
    `${GLPI_URL}/Administration/User?searchText=${encodeURIComponent(email)}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  const userData = await userRes.json();

  if (!userRes.ok || !Array.isArray(userData)) {
    console.error("GLPI user search error:", userData);
    return null;
  }

  // GLPI user can have multiple emails so check all email entries
  const matchedUser = userData.find((user: GlpiUser) =>
    Array.isArray(user.emails) &&
    user.emails.some(
      (entry) => entry.email?.toLowerCase() === email.toLowerCase()
    )
  );

  return matchedUser ?? null;
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

    const accessToken = await getAccessToken();

    // find the GLPI user matching the entered email
    const matchedUser = await findUserByEmail(accessToken, email);

    if (!matchedUser?.id) {
      return NextResponse.json({
        ok: true,
        tickets: [],
      });
    }

    console.log("Matched GLPI user:", {
      id: matchedUser.id,
      name: matchedUser.name,
      email,
    });

    // search tickets using matched user id.
    // GLPI returns tickets with a team array containing requester/assigned users.
    const ticketRes = await fetch(
      `${GLPI_URL}/Assistance/Ticket?searchText=${encodeURIComponent(
        String(matchedUser.id)
      )}&range=0-999`,
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

    const rawTickets: GlpiTicket[] = Array.isArray(ticketData)
      ? ticketData
      : [];

    console.log("GLPI raw ticket count:", rawTickets.length);

    // keep only tickets where this user is the requester.
    const filteredTickets = rawTickets.filter((ticket) => {
      const team = ticket.team;

      return (
        Array.isArray(team) &&
        team.some(
          (member) =>
            member.role === "requester" &&
            String(member.id) === String(matchedUser.id)
        )
      );
    });

    console.log("Filtered requester ticket count:", filteredTickets.length);

    // return data
    const tickets = filteredTickets.map((ticket) => ({
      glpi_ticket_id: String(ticket.id),
      title: ticket.name ?? `Užklausa #${ticket.id}`,
      status: getStatusLabel(ticket.status),
      created_at:
        ticket.date_creation ??
        ticket.created_at ??
        ticket.date ??
        new Date().toISOString(),
    }));

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