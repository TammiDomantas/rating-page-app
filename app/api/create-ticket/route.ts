import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase"; 
import { departmentMap, categoryMap } from "@/lib/glpiMappings";

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

    // save request to Supabase instead of sending to GLPI for now
    const { data, error } = await supabase
      .from("pending_tickets")
      .insert({
        title,
        description,
        email,
        requester_name: name,
        phone: phone || null,
        department,
        category,
        department_id: departmentId,
        category_id: categoryId,
        status: "pending", // waiting for GLPI sync later
      })
      .select("id")
      .single();

    if (error) {
      console.error("Supabase pending_tickets insert error:", error);

      return NextResponse.json(
        { ok: false, error: "Nepavyko išsaugoti užklausos." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      pendingTicketId: data.id,
      status: "pending",
    });
  } catch (err) {
    console.error("Create pending ticket error:", err);

    return NextResponse.json(
      { ok: false, error: "Serverio klaida." },
      { status: 500 }
    );
  }
}