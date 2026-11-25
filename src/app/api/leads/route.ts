import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { analyzeLead } from "@/lib/analyze";
import { insertLead } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";
import { LeadInput } from "@/lib/schema";
import { forwardLead } from "@/lib/webhook";

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
  const limit = checkRateLimit(ip);
  if (!limit.ok) {
    return NextResponse.json({ error: limit.reason }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = LeadInput.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please check the form", fields: z.flattenError(parsed.error).fieldErrors },
      { status: 400 },
    );
  }

  const { analysis, engine } = await analyzeLead(parsed.data, ip);
  const lead = insertLead(parsed.data, analysis, engine);
  const webhook = await forwardLead(lead);

  // In this demo the visitor sees the analysis the business would see. A real site would
  // return only a thank-you message: set SHOW_ANALYSIS_TO_VISITOR=false.
  if (process.env.SHOW_ANALYSIS_TO_VISITOR === "false") {
    return NextResponse.json({ ok: true }, { status: 201 });
  }
  return NextResponse.json({ ok: true, analysis, engine, webhook }, { status: 201 });
}
