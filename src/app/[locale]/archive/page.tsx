import { getTasks, unarchiveTask } from "@/app/actions/tasks";
import { getTranslations } from "next-intl/server";
import { auth } from "@/../auth";
import { redirect } from "@/i18n/navigation";
import AppHeader from "@/components/AppHeader";

export default async function ArchivePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();
  if (!session?.user) {
    redirect({ href: "/login", locale });
  }

  const [tasks, t] = await Promise.all([
    getTasks({ view: "archived" }),
    getTranslations("tasks"),
  ]);

  return (
    <main className="max-w-2xl mx-auto py-10 px-4">
      <AppHeader locale={locale} title={t("archive")} />

      <div className="space-y-3">
        {tasks.length === 0 && <p className="text-gray-500">{t("archiveEmpty")}</p>}
        {tasks.map((task) => (
          <div
            key={task.id}
            className="flex items-center justify-between border rounded-lg p-3"
          >
            <div>
              <p className="font-medium">{task.title}</p>
              {task.dueDate && (
                <p className="text-xs text-gray-500">
                  {t("due")}: {new Date(task.dueDate).toLocaleDateString()}
                </p>
              )}
            </div>
            <form action={unarchiveTask.bind(null, task.id)}>
              <button type="submit" className="text-sm hover:underline">
                {t("unarchive")}
              </button>
            </form>
          </div>
        ))}
      </div>
    </main>
  );
}
