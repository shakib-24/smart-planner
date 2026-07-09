"use client";

import { useState, useTransition } from "react";
import { signIn } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { registerUser } from "@/app/actions/auth";

export default function RegisterPage() {
  const t = useTranslations("login");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await registerUser(formData);

      if ("error" in result) {
        setError(result.error);
        return;
      }

      const email = formData.get("email") as string;
      const password = formData.get("password") as string;

      await signIn("credentials", {
        email,
        password,
        redirectTo: "/dashboard",
      });
    });
  }

  return (
    <div className="flex min-h-screen flex-1 items-center justify-center">
      <div className="w-full max-w-sm space-y-6">
        <form action={handleSubmit} className="space-y-3">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1">
              {t("nameLabel")}
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              className="w-full border rounded-md px-3 py-2"
            />
          </div>
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
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1">
              {t("confirmPasswordLabel")}
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              className="w-full border rounded-md px-3 py-2"
            />
          </div>
          {error && <p className="text-sm text-red-500">{t(error)}</p>}
          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent disabled:opacity-50"
          >
            {t("registerButton")}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          {t("alreadyHaveAccount")}{" "}
          <Link href="/login" className="underline hover:text-foreground">
            {t("loginButton")}
          </Link>
        </p>
      </div>
    </div>
  );
}
