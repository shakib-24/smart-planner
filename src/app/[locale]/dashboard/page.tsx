import { getDashboardStats } from "@/app/actions/tasks";
import { getTranslations } from "next-intl/server";
import { auth } from "@/../auth";
import { redirect, Link } from "@/i18n/navigation";
import { ArrowLeft } from "lucide-react";
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
      <div className="flex items-center gap-2 mb-6">
        <Link
          href="/tasks"
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border hover:bg-accent"
          aria-label={t("title")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-2xl font-bold">{t("dashboard")}</h1>
      </div>

      <DashboardView stats={stats} />
    </main>
  );
}
