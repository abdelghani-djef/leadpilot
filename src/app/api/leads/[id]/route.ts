import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { setLeadStatus } from "@/lib/db";
import { LeadStatus } from "@/lib/schema";

const Body = z.object({ status: LeadStatus });

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // The proxy sets this header only after a correct ADMIN_PASSWORD.
  if (request.headers.get("x-leadpilot-admin") !== "1") {
    return NextResponse.json({ error: "Sign in to change leads" }, { status: 403 });
  }

  const id = Number((await params).id);
  if (!Number.isInteger(id) || id < 1) {
    return NextResponse.json({ error: "Invalid lead id" }, { status: 400 });
  }

  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  if (!setLeadStatus(id, parsed.data.status)) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
