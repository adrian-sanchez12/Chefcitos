import { NextResponse } from "next/server";
import { supabase } from "./src/lib/supabaseClient";

export async function middleware(req) {
  const { data } = await supabase.auth.getUser();
  
  if (!data.user && req.nextUrl.pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
