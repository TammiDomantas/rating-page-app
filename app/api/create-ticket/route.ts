import { NextResponse } from "next/server";
import { departmentMap, categoryMap } from "@/lib/glpiMappings";

const GLPI_URL = process.env.GLPI_URL!;
const GLPI_API_BASE = process.env.GLPI_API_BASE!;
const GLPI_CLIENT_ID = process.env.GLPI_CLIENT_ID!;
const GLPI_CLIENT_SECRET = process.env.GLPI_CLIENT_SECRET!;
const GLPI_USERNAME = process.env.GLPI_USERNAME!;
const GLPI_PASSWORD = process.env.GLPI_PASSWORD!;

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const title = String(body.title || "").trim();
    const description = String(body.description || "").trim();
    const email = String(body.email || "").trim();
    const name = String(body.name || "").trim();
    const phone = String(body.phone || "").trim();
    const department = String(body.department || "").trim();
    const category = String(body.category || "").trim();

    if (!title || !description || !email || !name || !department || !category) {
      return NextResponse.json(
        { ok: false, error: "Užpildykite visus privalomus laukus." },
        { status: 400 }
      );
    }

    const departmentId = departmentMap[department];
    const categoryId = categoryMap[category];

    if (!departmentId || !categoryId) {
      return NextResponse.json(
        { ok: false, error: "Neteisingas skyrius arba kategorija." },
        { status: 400 }
      );
    }

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
      console.error("OAuth token error:", tokenData);

      return NextResponse.json(
        { ok: false, error: "OAuth authentication failed" },
        { status: 500 }
      );
    }

    const accessToken = tokenData.access_token;

    // Find GLPI user by submitted email
    let requesterId: number | null = null;

    const userRes = await fetch(
      `${GLPI_URL}/Administration/User?searchText=${encodeURIComponent(email)}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const userData = await userRes.json();

    console.log("GLPI user lookup result:", JSON.stringify(userData, null, 2));

    // get requester via email
    if (userRes.ok && Array.isArray(userData)) {
      const matchedUser = userData.find((user) =>
        Array.isArray(user.emails) &&
        user.emails.some(
          (entry: { email?: string }) =>
            entry.email?.toLowerCase() === email.toLowerCase()
        )
      );

      requesterId = matchedUser?.id ?? null;
    }

    console.log("Requester ID:", requesterId);

    // Create ticket first
    const ticketRes = await fetch(`${GLPI_URL}/Assistance/Ticket`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        name: title,
        content: `
        ${description}

        ---
        Vardas: ${name}
        Email: ${email}
        Telefonas: ${phone || "-"}
        Skyrius: ${department} (${departmentId})
        Kategorija: ${category} (${categoryId})
        `.trim(),

        category: categoryId, // assign category
      }),
    });

    const ticketData = await ticketRes.json();

    if (!ticketRes.ok) {
      console.error("GLPI ticket create error:", ticketData);

      return NextResponse.json(
        {
          ok: false,
          error: "Nepavyko sukurti užklausos GLPI.",
          details: ticketData,
        },
        { status: 500 }
      );
    }

    console.log("Created ticket data:", ticketData);

    const createdTicketId = ticketData.id;

    // Add requester after ticket creation
    if (requesterId && createdTicketId) {
      const requesterRes = await fetch(
        `${GLPI_URL}/Assistance/Ticket/${createdTicketId}/TeamMember`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            role: "requester",
            type: "User",
            id: requesterId,
          }),
        }
      );

      const requesterText = await requesterRes.text();

      console.log("Requester attach status:", requesterRes.status);
      console.log("Requester attach result:", requesterText);

      if (!requesterRes.ok) {
        console.error("GLPI requester attach error:", requesterText);
      }
    }

    return NextResponse.json({
      ok: true,
      ticket: ticketData,
      requesterId,
    });
  } catch (err) {
    console.error("Create ticket error:", err);

    return NextResponse.json(
      {
        ok: false,
        error: "Serverio klaida.",
      },
      { status: 500 }
    );
  }
}