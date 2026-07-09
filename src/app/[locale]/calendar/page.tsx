import { getCalendarEvents } from "@/app/actions/tasks";
import { getCategories, seedDefaultCategories } from "@/app/actions/categories";
import { getTranslations } from "next-intl/server";
import { auth } from "@/../auth";
import { redirect } from "@/i18n/navigation";
import AppHeader from "@/components/AppHeader";
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
      <AppHeader locale={locale} title={t("calendar")} />

      <CalendarView events={events} categories={categories} />
    </main>
  );
}
