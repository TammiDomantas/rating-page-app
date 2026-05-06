import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const GLPI_URL = process.env.GLPI_URL!;
const GLPI_API_BASE = process.env.GLPI_API_BASE!;
const GLPI_CLIENT_ID = process.env.GLPI_CLIENT_ID!;
const GLPI_CLIENT_SECRET = process.env.GLPI_CLIENT_SECRET!;
const GLPI_USERNAME = process.env.GLPI_USERNAME!;
const GLPI_PASSWORD = process.env.GLPI_PASSWORD!;

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

    // get tickets from supabase
    const { data, error } = await supabase
      .from("submitted_tickets")
      .select("glpi_ticket_id, title, status, created_at")
      .eq("email", email)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase load tickets error:", error);

      return NextResponse.json(
        { ok: false, error: "Failed to load tickets" },
        { status: 500 }
      );
    }

    const tickets = data ?? [];

    // if no tickets, return immediately
    if (tickets.length === 0) {
      return NextResponse.json({
        ok: true,
        tickets: [],
      });
    }

    // authenticate with GLPI
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

    // refresh ticket statuses from GLPI
    const updatedTickets = await Promise.all(
      tickets.map(async (ticket) => {
        try {
          const ticketRes = await fetch(
            `${GLPI_URL}/Assistance/Ticket/${ticket.glpi_ticket_id}`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            }
          );

          const glpiTicket = await ticketRes.json();

          if (!ticketRes.ok) {
            console.error(
              `GLPI ticket fetch error for ${ticket.glpi_ticket_id}:`,
              glpiTicket
            );

            return ticket;
          }

          const latestStatus = String(
            glpiTicket.status ?? ticket.status
          );

          // update supabase
          await supabase
            .from("submitted_tickets")
            .update({
              status: latestStatus,
            })
            .eq("glpi_ticket_id", ticket.glpi_ticket_id);

          return {
            ...ticket,
            status: latestStatus,
          };
        } catch (err) {
          console.error(
            `Ticket refresh error for ${ticket.glpi_ticket_id}:`,
            err
          );

          return ticket;
        }
      })
    );

    return NextResponse.json({
      ok: true,
      tickets: updatedTickets,
    });
  } catch (err) {
    console.error("my-tickets API error:", err);

    return NextResponse.json(
      { ok: false, error: "Server error" },
      { status: 500 }
    );
  }
}