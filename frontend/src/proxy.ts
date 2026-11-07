import { NextRequest, NextResponse } from "next/server";

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get("accessToken")?.value;
  const refreshToken = request.cookies.get("refreshToken")?.value;

  const userHasToken = accessToken || refreshToken;

  if (
    (pathname.startsWith("/login") || pathname.startsWith("/register")) &&
    userHasToken
  ) {
    //TODO:
    //in this redirect, if a user is logged in and but is deleted from the server,
    //then the user will still be redirected to the home page but the user will be logged out
    //the user won't be able to access the login or register page until their token expires
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public|api).*)"],
};
