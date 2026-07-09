// Programmatically seeds a test user + a valid JWT session cookie so
// e2e runs can skip the manual Google OAuth flow in auth.setup.ts.
//
// With the JWT session strategy, Auth.js no longer stores sessions in the
// database, so we can't insert a Session row and hand out its id as a
// cookie. Instead we sign a JWT with next-auth/jwt's `encode()` — the same
// function Auth.js uses internally — using the cookie name as the salt,
// and write it straight into a Playwright storageState file.
import { encode } from "next-auth/jwt";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import bcrypt from "bcryptjs";
import fs from "node:fs";
import path from "node:path";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
const TEST_USER_EMAIL = process.env.PLAYWRIGHT_TEST_USER_EMAIL ?? "e2e-test@example.com";
const TEST_USER_PASSWORD = process.env.PLAYWRIGHT_TEST_USER_PASSWORD ?? "e2e-test-password";
const AUTH_SECRET = process.env.AUTH_SECRET;

const authFile = path.join(__dirname, ".auth/user.json");

const DEFAULT_CATEGORIES = [
  { name: "Development", color: "#3b82f6" },
  { name: "Bug Fix", color: "#ef4444" },
  { name: "Learning", color: "#8b5cf6" },
  { name: "Meeting", color: "#f59e0b" },
  { name: "Documentation", color: "#10b981" },
  { name: "Testing", color: "#ec4899" },
  { name: "Deployment", color: "#6366f1" },
  { name: "Personal", color: "#64748b" },
];

async function main() {
  if (!AUTH_SECRET) {
    throw new Error("AUTH_SECRET must be set in the environment to seed a session.");
  }

  const prisma = new PrismaClient({
    adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL! }),
  });

  try {
    const hashedPassword = await bcrypt.hash(TEST_USER_PASSWORD, 10);

    const user = await prisma.user.upsert({
      where: { email: TEST_USER_EMAIL },
      update: {},
      create: {
        email: TEST_USER_EMAIL,
        name: "E2E Test User",
        password: hashedPassword,
      },
    });

    const categoryCount = await prisma.category.count({ where: { userId: user.id } });
    if (categoryCount === 0) {
      await prisma.category.createMany({
        data: DEFAULT_CATEGORIES.map((cat, i) => ({
          userId: user.id,
          name: cat.name,
          color: cat.color,
          position: i,
        })),
      });
    }

    const useSecureCookies = BASE_URL.startsWith("https://");
    const cookieName = `${useSecureCookies ? "__Secure-" : ""}authjs.session-token`;

    const sessionToken = await encode({
      token: { id: user.id, email: user.email, name: user.name, sub: user.id },
      secret: AUTH_SECRET,
      salt: cookieName,
    });

    const url = new URL(BASE_URL);
    const expires = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;

    const storageState = {
      cookies: [
        {
          name: cookieName,
          value: sessionToken,
          domain: url.hostname,
          path: "/",
          expires,
          httpOnly: true,
          secure: useSecureCookies,
          sameSite: "Lax" as const,
        },
      ],
      origins: [],
    };

    fs.mkdirSync(path.dirname(authFile), { recursive: true });
    fs.writeFileSync(authFile, JSON.stringify(storageState, null, 2));

    console.log(`Session seeded for ${TEST_USER_EMAIL} -> ${authFile}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
