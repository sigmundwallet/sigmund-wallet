import { NextMiddleware, NextResponse } from "next/server";

export const middleware: NextMiddleware = async (req) => {
  const session = req.cookies.get("sigmund_session");

  const getRedirectResponse = () => {
    const res = NextResponse.redirect(new URL("/wallet/open", req.url));
    return res;
  };

  if (
    ["/wallet/open", "/wallet/create"].includes(req.nextUrl.pathname) ||
    req.nextUrl.pathname.startsWith("/api/wallet-auth")
  ) {
  } else if (req.nextUrl.pathname.startsWith("/wallet")) {
    if (!session) {
      return getRedirectResponse();
    }
  } else if (req.nextUrl.pathname.startsWith("/api")) {
    // TODO fix for a wallet creation
    // if (!session) {
    //   return getRedirectResponse();
    // }
  }

  return NextResponse.next();
};
