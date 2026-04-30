import { NextResponse } from "next/server";
import { departmentMap, categoryMap } from "@/lib/glpiMappings";

const GLPI_URL = process.env.GLPI_URL!;
const GLPI_API_TOKEN = process.env.GLPI_API_TOKEN!;

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

    if (!GLPI_URL || !GLPI_API_TOKEN) {
      return NextResponse.json(
        { ok: false, error: "Trūksta GLPI konfigūracijos." },
        { status: 500 }
      );
    }

    const ticketRes = await fetch(`${GLPI_URL}/Ticket`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `glpi-api-token ${GLPI_API_TOKEN}`,
      },
      body: JSON.stringify({
        input: {
          name: title,
          content: `
Aprašymas:
${description}

Vardas:
${name}

Email:
${email}

Telefonas:
${phone || "-"}

Skyrius:
${department} (${departmentId})

Kategorija:
${category} (${categoryId})
          `.trim(),
          entities_id: departmentId,
          itilcategories_id: categoryId,
        },
      }),
    });

    const responseText = await ticketRes.text();

    let ticketData;
    try {
      ticketData = JSON.parse(responseText);
    } catch {
      ticketData = responseText;
    }

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
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}