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

    // =========================
    // GET OAuth token
    // =========================
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

    // find glpi user by email
    let requesterId: number | null = null;

    const userRes = await fetch(
      `${GLPI_URL}/Administration/User?searchText=${encodeURIComponent(email)}`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const userData = await userRes.json();

    if (userRes.ok && Array.isArray(userData) && userData.length > 0) {
      requesterId = userData[0].id;
    }

    // create ticket
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
        `.trim(),

        
        entity: departmentId,
        category: categoryId,

        // attach requester if found

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

    return NextResponse.json({
      ok: true,
      ticket: ticketData,
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