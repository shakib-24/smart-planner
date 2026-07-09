import { test as setup, chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";

const authFile = path.join(__dirname, ".auth/user.json");
const userDataDir = path.join(__dirname, ".chrome-profile");

function waitForEnter(message: string): Promise<void> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(message, () => {
      rl.close();
      resolve();
    });
  });
}

setup("authenticate with Google (persistent Chrome profile)", async () => {
  // Manual Google OAuth (email + password + possibly 2FA) can easily take
  // longer than Playwright's 30s default test timeout. Give it 3 minutes.
  setup.setTimeout(180_000);

  // Google actively blocks Playwright's bundled, automation-flagged
  // Chromium during OAuth ("This browser or app may not be secure").
  // Launching the real installed Chrome (channel: "chrome") through a
  // dedicated persistent profile avoids that flag entirely, and the
  // Google session persists in userDataDir for all future headless runs
  // — this is a one-time manual step.
  const context = await chromium.launchPersistentContext(userDataDir, {
    channel: "chrome",
    headless: false,
  });

  try {
    const page = context.pages()[0] ?? (await context.newPage());
    await page.goto("http://localhost:3000/login");

    console.log("\n============================================================");
    console.log("এই নতুন Chrome profile দিয়ে localhost:3000/login এ ম্যানুয়ালি Google sign-in সম্পূর্ণ করো।");
    console.log("সফল হয়ে homepage এ পৌঁছালে এখানে ফিরে এসে Enter চাপো। তোমার কাছে ৩ মিনিট সময় আছে।");
    console.log("============================================================\n");

    // readline itself has no built-in timeout — it blocks indefinitely on
    // stdin, so the only ceiling here is the 180s test timeout set above.
    await waitForEnter("Press Enter once you're logged in and back on the home page... ");

    const currentUrl = context.pages()[0].url();
    if (currentUrl.includes("/login")) {
      throw new Error(
        "❌ এখনো logged in মনে হচ্ছে না, আবার চেষ্টা করো। " +
          "(এখনো লগইন পেজেই আছে — সম্ভবত sign-in সম্পূর্ণ হওয়ার আগেই Enter চাপা হয়েছে। " +
          "কোনো session এই রানে save হয়নি — `npm run test:e2e:setup` আবার চালাও।)"
      );
    }

    fs.mkdirSync(path.dirname(authFile), { recursive: true });
    await context.storageState({ path: authFile });

    console.log(`\n✅ Session saved to ${authFile}\n`);
  } finally {
    // Close the browser window, but the userDataDir profile on disk is left
    // alone — that's where Chrome keeps the actual Google login, so future
    // runs of this setup (or a real reused-profile approach) won't need a
    // fresh manual sign-in.
    await context.close();
  }
});
