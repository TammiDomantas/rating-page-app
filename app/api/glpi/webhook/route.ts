import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const text = await req.text();

    console.log("GLPI webhook raw body:");
    console.log(text);

    console.log("Headers:");
    console.log(Object.fromEntries(req.headers.entries()));

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Webhook error:", err);

    return NextResponse.json({ ok: true });
  }
}