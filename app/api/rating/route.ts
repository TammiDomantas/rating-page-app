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

// helper
async function readJsonResponse(res: Response, label: string) {
  const text = await res.text();

  try {
    return JSON.parse(text);
  } catch {
    console.error(`${label} returned non-JSON:`, text.slice(0, 500));
    throw new Error(`${label} returned non-JSON`);
  }
}


// create GLPI API session
async function initGlpiSession() {
  const res = await fetch(`${GLPI_REST_URL}/initSession`, {
    method: "GET",
    headers: {
      "App-Token": GLPI_APP_TOKEN,
      Authorization: `user_token ${GLPI_USER_TOKEN}`,
    },
  });

  const data = await readJsonResponse(res, "GLPI initSession");

  if (!res.ok) {
    console.error("GLPI initSession error:", data);
    throw new Error("Failed to initialize GLPI session");
  }

  return data.session_token as string;
}

// close GLPI API session
async function killGlpiSession(sessionToken: string) {
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

    // must have atleast 1 star
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json(
        { ok: false, error: "Rating must be an integer between 1 and 5" },
        { status: 400 }
      );
    }

    sessionToken = await initGlpiSession();

    // get all GLPI satisfaction records
    const satisfactionRes = await fetch(`${GLPI_REST_URL}/TicketSatisfaction`, {
      method: "GET",
      headers: {
        "App-Token": GLPI_APP_TOKEN,
        "Session-Token": sessionToken,
      },
    });

    const satisfactionData = await readJsonResponse(
      satisfactionRes,
      "GLPI TicketSatisfaction fetch"
    );

    if (!satisfactionRes.ok) {
      console.error("GLPI TicketSatisfaction fetch error:", satisfactionData);

      return NextResponse.json(
        { ok: false, error: "Failed to load GLPI satisfaction data" },
        { status: 500 }
      );
    }

    // find satisfaction record for this ticket
    const satisfaction = (satisfactionData as TicketSatisfaction[]).find(
      (item) => String(item.tickets_id) === normalizedTicketId
    );

    // ticket either not solved yet or no survey generated
    if (!satisfaction) {
      return NextResponse.json(
        {
          ok: false,
          error: "This ticket cannot be rated yet",
        },
        { status: 404 }
      );
    }

    // prevent duplicate ratings
    if (satisfaction.date_answered || satisfaction.satisfaction !== null) {
      return NextResponse.json(
        {
          ok: false,
          error: "This ticket was already rated",
        },
        { status: 409 }
      );
    }

    // save rating directly into GLPI
    const updateRes = await fetch(
      `${GLPI_REST_URL}/TicketSatisfaction/${satisfaction.id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "App-Token": GLPI_APP_TOKEN,
          "Session-Token": sessionToken,
        },
        body: JSON.stringify({
          input: {
            id: satisfaction.id,
            satisfaction: rating,
            comment: comment || null,
          },
        }),
      }
    );

    const updateData = await readJsonResponse(
      updateRes,
      "GLPI TicketSatisfaction update"
    );

    if (!updateRes.ok) {
      console.error("GLPI satisfaction update error:", updateData);

      return NextResponse.json(
        { ok: false, error: "Failed to save rating to GLPI" },
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
  } finally {
    // always close GLPI session
    if (sessionToken) {
      await killGlpiSession(sessionToken);
    }
  }
}