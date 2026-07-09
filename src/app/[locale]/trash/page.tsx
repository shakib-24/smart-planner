import { getTrashedTasks, restoreTask } from "@/app/actions/tasks";
import { getTranslations } from "next-intl/server";
import { auth } from "@/../auth";
import { redirect } from "@/i18n/navigation";
import AppHeader from "@/components/AppHeader";
import PermanentDeleteButton from "@/components/PermanentDeleteButton";

export default async function TrashPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();
  if (!session?.user) {
    redirect({ href: "/login", locale });
  }

  const [tasks, t] = await Promise.all([getTrashedTasks(), getTranslations("tasks")]);

  return (
    <main className="max-w-2xl mx-auto py-10 px-4">
      <AppHeader locale={locale} title={t("trash")} />

      <div className="space-y-3">
        {tasks.length === 0 && <p className="text-gray-500">{t("trashEmpty")}</p>}
        {tasks.map((task) => (
          <div
            key={task.id}
            className="flex items-center justify-between border rounded-lg p-3"
          >
            <div>
              <p className="font-medium">{task.title}</p>
              {task.deletedAt && (
                <p className="text-xs text-gray-500">
                  {t("deletedOn")}: {new Date(task.deletedAt).toLocaleDateString()}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <form action={restoreTask.bind(null, task.id)}>
                <button type="submit" className="text-sm hover:underline">
                  {t("restore")}
                </button>
              </form>
              <PermanentDeleteButton taskId={task.id} />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
