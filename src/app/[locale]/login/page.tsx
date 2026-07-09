import { signIn, signOut } from "@/../auth";
import { AuthError } from "next-auth";
import { getTranslations } from "next-intl/server";
import { redirect, Link } from "@/i18n/navigation";

export default async function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { locale } = await params;
  const { error } = await searchParams;
  const t = await getTranslations("login");

  async function loginWithCredentials(formData: FormData) {
    "use server";
    const email = formData.get("email");
    const password = formData.get("password");

    try {
      await signIn("credentials", {
        email,
        password,
        redirectTo: `/${locale}/dashboard`,
      });
    } catch (err) {
      if (err instanceof AuthError) {
        redirect({
          href: { pathname: "/login", query: { error: err.type } },
          locale,
        });
      }
      throw err;
    }
  }

  return (
    <div className="flex min-h-screen flex-1 items-center justify-center">
      <div className="w-full max-w-sm space-y-6">
        <form action={loginWithCredentials} className="space-y-3">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              {t("emailLabel")}
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full border rounded-md px-3 py-2"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1">
              {t("passwordLabel")}
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="w-full border rounded-md px-3 py-2"
            />
          </div>
          {error && <p className="text-sm text-red-500">{t("loginError")}</p>}
          <button
            type="submit"
            className="w-full rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent"
          >
            {t("loginButton")}
          </button>
        </form>

        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs uppercase text-muted-foreground">{t("or")}</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <form
          action={async () => {
            "use server";
            // Clear any stale session first: Auth.js's OAuth callback treats an
            // existing session cookie as "link this provider to my current user"
            // rather than a fresh sign-in, which can hijack the login onto the
            // wrong (stale) account or throw OAuthAccountNotLinked.
            await signOut({ redirect: false });
            await signIn("google", { redirectTo: `/${locale}/dashboard` });
          }}
        >
          <button
            type="submit"
            className="w-full rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent"
          >
            {t("signInWithGoogle")}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          {t("dontHaveAccount")}{" "}
          <Link href="/register" className="underline hover:text-foreground">
            {t("registerLink")}
          </Link>
        </p>
      </div>
    </div>
  );
}
