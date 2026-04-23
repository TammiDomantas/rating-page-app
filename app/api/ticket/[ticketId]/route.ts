import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  const { ticketId } = await params;

  // get ticket context
  const { data: contextData, error: contextError } = await supabase
    .from("ticket_context")
    .select("*")
    .eq("ticket_id", ticketId)
    .single();

  if (contextError || !contextData) {
    return NextResponse.json(
      { ok: false, error: "Ticket context not found" },
      { status: 404 }
    );
  }

  // check whether this ticket already has a rating
  const { data: ratingData, error: ratingError } = await supabase
    .from("ratings")
    .select("ticket_id")
    .eq("ticket_id", ticketId)
    .maybeSingle();

  if (ratingError) {
    return NextResponse.json(
      { ok: false, error: "Failed to check rating status" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    context: {
      ticketId: contextData.ticket_id,
      status: contextData.status,
      requester: contextData.requester_id || contextData.requester_name
        ? {
            id: contextData.requester_id ?? "",
            name: contextData.requester_name ?? "",
          }
        : null,
      technician: contextData.technician_id || contextData.technician_name
        ? {
            id: contextData.technician_id ?? "",
            name: contextData.technician_name ?? "",
          }
        : null,
      ratingAllowed: contextData.rating_allowed,
      createdAt: contextData.created_at,
      alreadyRated: !!ratingData,
    },
  });
}