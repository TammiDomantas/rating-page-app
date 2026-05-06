import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  const body = await req.json();
  const email = String(body.email || "").trim().toLowerCase();

  if (!email) {
    return NextResponse.json(
      { ok: false, error: "Email is required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("submitted_tickets")
    .select("glpi_ticket_id, title, status, created_at")
    .eq("email", email)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { ok: false, error: "Failed to load tickets" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, tickets: data });
}