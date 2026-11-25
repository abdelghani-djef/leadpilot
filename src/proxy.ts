import { NextResponse, type NextRequest } from "next/server";

/**
 * Protects the dashboard and lead updates.
 * - ADMIN_PASSWORD set: HTTP Basic auth (any username). Signed-in requests get full data.
 * - ADMIN_PASSWORD unset: the dashboard stays public but read-only, with names and emails masked,
 *   so the demo can be shown to anyone without exposing visitors' details.
 */
const ADMIN_HEADER = "x-leadpilot-admin";

/** Compares in constant time so the password can't be guessed from response timing. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function proxy(request: NextRequest) {
  const headers = new Headers(request.headers);
  headers.delete(ADMIN_HEADER); // never trust a client-sent value

  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    return NextResponse.next({ request: { headers } });
  }

  const auth = request.headers.get("authorization") ?? "";
  const [scheme, encoded] = auth.split(" ");
  let given = "";
  if (scheme === "Basic" && encoded) {
    const decoded = atob(encoded);
    given = decoded.slice(decoded.indexOf(":") + 1);
  }

  if (!safeEqual(given, password)) {
    return new NextResponse("Authentication required", {
      status: 401,
      headers: { "WWW-Authenticate": 'Basic realm="LeadPilot dashboard", charset="UTF-8"' },
    });
  }

  headers.set(ADMIN_HEADER, "1");
  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/leads/:id"],
};
