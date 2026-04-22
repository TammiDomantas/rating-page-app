import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { event, ticketId, status, requester, team } = body;

    const technician = Array.isArray(team)
      ? team.find((member: any) => member.role === "assigned")
      : null;

    console.log("GLPI webhook parsed:");
    console.log({
      event,
      ticketId,
      status,
      requester,
      technician,
    });

    if (status !== "Solved") {
      return NextResponse.json({
        ok: true,
        message: "Ignored because ticket is not solved",
      });
    }

    return NextResponse.json({
      ok: true,
      ticketId,
      status,
      requester,
      technician,
    });
  } catch (err) {
    console.error("Webhook error:", err);

    return NextResponse.json(
      { ok: false, error: "Invalid request" },
      { status: 400 }
    );
  }
}