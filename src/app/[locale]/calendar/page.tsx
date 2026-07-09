import { getCalendarEvents } from "@/app/actions/tasks";
import { getCategories, seedDefaultCategories } from "@/app/actions/categories";
import { getTranslations } from "next-intl/server";
import { auth } from "@/../auth";
import { redirect, Link } from "@/i18n/navigation";
import { ArrowLeft } from "lucide-react";
import CalendarView from "@/components/CalendarView";

export default async function CalendarPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();
  if (!session?.user) {
    redirect({ href: "/login", locale });
  }

  const [events, t] = await Promise.all([getCalendarEvents(), getTranslations("tasks")]);

  let categories = await getCategories();
  if (categories.length === 0) {
    await seedDefaultCategories();
    categories = await getCategories();
  }

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
        <h1 className="text-2xl font-bold">{t("calendar")}</h1>
      </div>

      <CalendarView events={events} categories={categories} />
    </main>
  );
}
