import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();

  const password = String(body.password || "");

  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json(
      { ok: false, error: "Neteisingas slaptažodis." },
      { status: 401 }
    );
  }

  const response = NextResponse.json({
    ok: true,
  });

  response.cookies.set("admin-auth", "true", {
    httpOnly: true,
    sameSite: "lax",
    secure: false, // set true if using HTTPS
    path: "/",
    maxAge: 60 * 60 * 8,
  });

  return response;
}