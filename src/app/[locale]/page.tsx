import { auth } from "@/../auth";
import { getTranslations } from "next-intl/server";
import { Link, redirect } from "@/i18n/navigation";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import ThemeToggle from "@/components/theme-toggle";

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();

  if (session?.user) {
    redirect({ href: "/dashboard", locale });
  }

  const t = await getTranslations("home");

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center gap-6 px-4 py-8">
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <ThemeToggle />
        <LanguageSwitcher />
      </div>
      <p className="text-lg">{t("notLoggedIn")}</p>
      <Link
        href="/login"
        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
      >
        {t("goToLogin")}
      </Link>
    </main>
  );
}
