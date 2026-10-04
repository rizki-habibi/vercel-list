import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  const store = await cookies();
  if (store.get("admin_session")) {
    response.cookies.set("admin_session", "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: 0 });
  }
  return response;
}
