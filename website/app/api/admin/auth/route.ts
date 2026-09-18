import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const ADMIN_SECRET =
  process.env.ADMIN_DASHBOARD_SECRET ||
  process.env.ADMIN_TEST_KEY ||
  "volc-admin-secret";

export async function POST(request: Request) {
  try {
    const { passphrase } = await request.json();

    if (!passphrase || passphrase !== ADMIN_SECRET) {
      return NextResponse.json(
        { error: "Invalid admin passphrase" },
        { status: 401 }
      );
    }

    const cookieStore = await cookies();
    cookieStore.set("volc_admin_auth", "authenticated", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return NextResponse.json({ success: true, message: "Authenticated" });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get("volc_admin_auth");

  if (authCookie?.value === "authenticated") {
    return NextResponse.json({ authenticated: true });
  }

  return NextResponse.json({ authenticated: false }, { status: 401 });
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete("volc_admin_auth");
  return NextResponse.json({ success: true, message: "Logged out" });
}
