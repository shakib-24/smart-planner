import { getDashboardStats } from "@/app/actions/tasks";
import { getTranslations } from "next-intl/server";
import { auth } from "@/../auth";
import { redirect } from "@/i18n/navigation";
import AppHeader from "@/components/AppHeader";
import DashboardView from "@/components/DashboardView";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();
  if (!session?.user) {
    redirect({ href: "/login", locale });
  }

  const [stats, t] = await Promise.all([getDashboardStats(), getTranslations("tasks")]);

  return (
    <main className="max-w-5xl mx-auto py-10 px-4">
      <AppHeader locale={locale} title={t("dashboard")} />

      <DashboardView stats={stats} />
    </main>
  );
}
