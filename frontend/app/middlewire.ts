import { NextResponse } from "next/server";
import { getSession } from "next-auth/react";

const protectedPaths = ["/dashboard", "/profile", "/settings"];

export async function middleware(req: any) {
  const session = await getSession({ req });

  if (!session && protectedPaths.some((path) => req.url.includes(path))) {
    const loginUrl = new URL("/auth", req.url);
    loginUrl.searchParams.set("redirect", req.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}
