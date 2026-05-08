import { NextResponse } from "next/server";
import { departmentMap, categoryMap } from "@/lib/glpiMappings";
import { supabase } from "@/lib/supabase";

const GLPI_URL = process.env.GLPI_URL!;
const GLPI_API_BASE = process.env.GLPI_API_BASE!;
const GLPI_CLIENT_ID = process.env.GLPI_CLIENT_ID!;
const GLPI_CLIENT_SECRET = process.env.GLPI_CLIENT_SECRET!;
const GLPI_USERNAME = process.env.GLPI_USERNAME!;
const GLPI_PASSWORD = process.env.GLPI_PASSWORD!;

async function uploadAttachmentsToGlpi(ticketId: number, files: File[]) {
  const GLPI_REST_URL = process.env.GLPI_REST_URL!;
  const GLPI_APP_TOKEN = process.env.GLPI_APP_TOKEN!;
  const GLPI_USER_TOKEN = process.env.GLPI_USER_TOKEN!;

  if (!files.length) return;

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
    return;
  }

  const sessionToken = sessionData.session_token;

  try {
    for (const file of files) {
      const uploadForm = new FormData();

      uploadForm.append(
        "uploadManifest",
        new Blob(
          [
            JSON.stringify({
              input: {
                name: file.name,
                _filename: [file.name],
                tickets_id: String(ticketId),
              },
            }),
          ],
          { type: "application/json" }
        )
      );

      uploadForm.append("filename[0]", file, file.name);

      const uploadRes = await fetch(`${GLPI_REST_URL}/Document`, {
        method: "POST",
        headers: {
          "App-Token": GLPI_APP_TOKEN,
          "Session-Token": sessionToken,
        },
        body: uploadForm,
      });

      const uploadText = await uploadRes.text();

      if (!uploadRes.ok) {
        console.error("GLPI legacy attachment upload error:", uploadText);
      } else {
        console.log("GLPI legacy attachment uploaded:", uploadText);
      }
    }
  } finally {
    await fetch(`${GLPI_REST_URL}/killSession`, {
      method: "GET",
      headers: {
        "App-Token": GLPI_APP_TOKEN,
        "Session-Token": sessionToken,
      },
    });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.formData();

    const title = String(body.get("title") || "").trim();
    const description = String(body.get("description") || "").trim();
    const email = String(body.get("email") || "").trim();
    const name = String(body.get("name") || "").trim();
    const phone = String(body.get("phone") || "").trim();
    const department = String(body.get("department") || "").trim();
    const category = String(body.get("category") || "").trim();

    const attachments = body.getAll("attachments").filter(
      (file): file is File => file instanceof File && file.size > 0
    );

    const maxSize = 10 * 1024 * 1024; // 10 MB

    for (const file of attachments) {
      if (file.size > maxSize) {
        return NextResponse.json(
          {
            ok: false,
            error: "Failas per didelis. Maksimalus dydis: 10 MB.",
          },
          { status: 400 }
        );
      }
    }

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
    await uploadAttachmentsToGlpi(createdTicketId, attachments);

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


    // store ticket in supabase
    await supabase.from("submitted_tickets").insert({
      email,
      requester_name: name,
      title,
      glpi_ticket_id: String(ticketData.id),
      status: "created",
    });


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