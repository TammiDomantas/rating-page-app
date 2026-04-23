import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  const { ticketId } = await params;

  const { data, error } = await supabase
    .from("ticket_context")
    .select("*")
    .eq("ticket_id", ticketId)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { ok: false, error: "Ticket context not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    ok: true,
    context: {
      ticketId: data.ticket_id,
      status: data.status,
      requester: data.requester_id || data.requester_name
        ? {
            id: data.requester_id ?? "",
            name: data.requester_name ?? "",
          }
        : null,
      technician: data.technician_id || data.technician_name
        ? {
            id: data.technician_id ?? "",
            name: data.technician_name ?? "",
          }
        : null,
      ratingAllowed: data.rating_allowed,
      createdAt: data.created_at,
    },
  });
}