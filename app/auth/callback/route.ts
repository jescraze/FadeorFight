import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Email confirmation links land here and are swapped for a session.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}/dashboard`);
  }

  return NextResponse.redirect(
    `${origin}/login?error=${encodeURIComponent("That confirmation link has expired. Log in to get a new one.")}`,
  );
}
