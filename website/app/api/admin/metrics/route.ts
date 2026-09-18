import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND_URL = process.env.INTERNAL_API_URL || "http://localhost:8002";
const ADMIN_KEY =
  process.env.ADMIN_DASHBOARD_KEY ||
  process.env.ADMIN_TEST_KEY ||
  "volc-admin-secret";

export async function GET() {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get("volc_admin_auth");

  if (authCookie?.value !== "authenticated") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const res = await fetch(`${BACKEND_URL}/api/admin/dashboard/metrics`, {
      headers: {
        "X-Admin-Key": ADMIN_KEY,
      },
      next: { revalidate: 3600 }, // 1 hour Next.js cache alignment
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json(
        { error: `Backend returned ${res.status}: ${err}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Failed to fetch admin metrics from backend:", error);
    return NextResponse.json(
      { error: `Backend connection error: ${error.message}` },
      { status: 502 }
    );
  }
}
