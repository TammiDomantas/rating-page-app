import { NextResponse } from "next/server";
import { getTicketContext } from "@/lib/ticketContextStore";


export async function GET(
  req: Request,

  { params }: { params: Promise<{ ticketId: string }> }
) {

  // get ticketId from url
  const { ticketId } = await params;


  // Look up stored ticket context in memory
  const context = getTicketContext(ticketId);


  // error if context not found
  if (!context) {
    return NextResponse.json(
      {
        ok: false,
        error: "Ticket context not found",
      },
      { status: 404 }
    );
  }

  // if context exists, return it
  return NextResponse.json({
    ok: true,
    context,
  });
}