import { NextResponse } from "next/server";
import { departmentMap, categoryMap } from "@/lib/glpiMappings";

const GLPI_URL = process.env.GLPI_URL!;
const GLPI_CLIENT_ID = process.env.GLPI_CLIENT_ID!;
const GLPI_CLIENT_SECRET = process.env.GLPI_CLIENT_SECRET!;

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

    const tokenRes = await fetch(`${process.env.GLPI_API_BASE}/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        grant_type: "password",
        client_id: process.env.GLPI_CLIENT_ID,
        client_secret: process.env.GLPI_CLIENT_SECRET,
        username: process.env.GLPI_USERNAME,
        password: process.env.GLPI_PASSWORD,
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


    // get glpi user by email
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
      Email: ${email}
      Telefonas: ${phone || "-"}
      `.trim(),
        entities_id: departmentId,
        itilcategories_id: categoryId,
        ...(requesterId && {
          users_id_recipient: requesterId,
        }),
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