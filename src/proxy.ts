import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Skip API routes (this must never get a locale prefix — Auth.js'
  // Google OAuth callback lives under /api/auth and has to stay put),
  // Next internals, and any request for a static file (contains a dot).
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
