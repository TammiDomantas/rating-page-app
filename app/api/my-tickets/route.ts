import { NextResponse } from "next/server";

const GLPI_URL = process.env.GLPI_URL!;
const GLPI_API_BASE = process.env.GLPI_API_BASE!;
const GLPI_CLIENT_ID = process.env.GLPI_CLIENT_ID!;
const GLPI_CLIENT_SECRET = process.env.GLPI_CLIENT_SECRET!;
const GLPI_USERNAME = process.env.GLPI_USERNAME!;
const GLPI_PASSWORD = process.env.GLPI_PASSWORD!;

const GLPI_REST_URL = process.env.GLPI_REST_URL!;
const GLPI_APP_TOKEN = process.env.GLPI_APP_TOKEN!;
const GLPI_USER_TOKEN = process.env.GLPI_USER_TOKEN!;

type GlpiUser = {
  id?: number | string;
  name?: string;
  emails?: {
    email?: string;
  }[];
};

type LegacyTicketRow = {
  id?: unknown;
  name?: unknown;
  status?: unknown;
  date_creation?: unknown;
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

// Authenticate with GLPI High-Level API
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

// Start GLPI legacy REST API session
async function initLegacySession() {
  const sessionRes = await fetch(`${GLPI_REST_URL}/initSession`, {
    method: "GET",
    headers: {
      "App-Token": GLPI_APP_TOKEN,
      Authorization: `user_token ${GLPI_USER_TOKEN}`,
    },
  });

  const sessionData = await sessionRes.json();

  if (!sessionRes.ok || !sessionData.session_token) {
    console.error("GLPI legacy initSession error:", sessionData);
    throw new Error("Failed to initialize GLPI legacy session");
  }

  return sessionData.session_token as string;
}

// Close GLPI legacy REST API session
async function killLegacySession(sessionToken: string) {
  await fetch(`${GLPI_REST_URL}/killSession`, {
    method: "GET",
    headers: {
      "App-Token": GLPI_APP_TOKEN,
      "Session-Token": sessionToken,
    },
  });
}

export async function POST(req: Request) {
  let sessionToken: string | null = null;

  try {
    const body = await req.json();

    // normalize submitted email
    const email = String(body.email || "").trim().toLowerCase();

    if (!email) {
      return NextResponse.json(
        { ok: false, error: "Email is required" },
        { status: 400 }
      );
    }

    // authenticate with GLPI High-Level API
    const accessToken = await getAccessToken();

    // find the GLPI user matching the entered email
    const matchedUser = await findUserByEmail(accessToken, email);

    // if no GLPI user has this email, there are no tickets to show
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

    // authenticate with GLPI legacy REST API
    sessionToken = await initLegacySession();

    // search tickets where requester = matched GLPI user
    // field 4 = Requester, found from /listSearchOptions/Ticket
    const ticketRes = await fetch(
      `${GLPI_REST_URL}/search/Ticket` +
        `?criteria[0][field]=4` +
        `&criteria[0][searchtype]=equals` +
        `&criteria[0][value]=${encodeURIComponent(String(matchedUser.id))}` +
        `&range=0-999`,
      {
        headers: {
          "App-Token": GLPI_APP_TOKEN,
          "Session-Token": sessionToken,
        },
      }
    );

    const ticketData = await ticketRes.json();

    if (!ticketRes.ok) {
      console.error("GLPI legacy ticket search error:", ticketData);

      return NextResponse.json(
        { ok: false, error: "Failed to load tickets from GLPI" },
        { status: 500 }
      );
    }

    console.log("GLPI requester ticket search result:", {
      totalcount: ticketData.totalcount,
      count: Array.isArray(ticketData.data) ? ticketData.data.length : 0,
    });

    // legacy search returns rows using search-option field numbers
    const legacyTickets: LegacyTicketRow[] = Array.isArray(ticketData.data)
      ? ticketData.data.map((row: Record<string, unknown>) => ({
          id: row["2"], // Ticket ID
          name: row["1"], // Ticket title
          status: row["12"], // Ticket status
          date_creation: row["15"], // Ticket created/opening date
        }))
      : [];

    // return data in the same shape the frontend already expects
    const tickets = legacyTickets.map((ticket) => ({
      glpi_ticket_id: String(ticket.id),
      title: String(ticket.name ?? `Užklausa #${ticket.id}`),
      status: getStatusLabel(ticket.status),
      created_at: String(ticket.date_creation ?? new Date().toISOString()),
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
  } finally {
    // always close legacy session if it was opened
    if (sessionToken) {
      await killLegacySession(sessionToken);
    }
  }
}