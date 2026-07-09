import {
  getTasks,
  createTask,
  getUserTags,
  type TaskFilters as TaskFiltersType,
} from "@/app/actions/tasks";
import { getCategories, createCategory, seedDefaultCategories } from "@/app/actions/categories";
import { getTranslations } from "next-intl/server";
import { auth, signOut } from "@/../auth";
import { redirect } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import {
  Trash2,
  Calendar as CalendarIcon,
  LayoutDashboard,
  LogOut,
  Archive as ArchiveIcon,
} from "lucide-react";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import TaskFilters from "@/components/TaskFilters";
import ThemeToggle from "@/components/theme-toggle";
import TaskList from "@/components/TaskList";
import CommandPaletteButton from "@/components/CommandPaletteButton";
import TagInput from "@/components/TagInput";

export default async function TasksPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    q?: string;
    categoryId?: string;
    tagId?: string;
    priority?: string;
    status?: string;
    view?: string;
  }>;
}) {
  const { locale } = await params;
  const session = await auth();
  if (!session?.user) {
    redirect({ href: "/login", locale });
  }

  const sp = await searchParams;
  const filters: TaskFiltersType = {
    search: sp.q || undefined,
    categoryId: sp.categoryId || undefined,
    tagId: sp.tagId || undefined,
    priority: (sp.priority as TaskFiltersType["priority"]) || undefined,
    status: (sp.status as TaskFiltersType["status"]) || undefined,
    view: (sp.view as TaskFiltersType["view"]) || undefined,
  };
  const hasActiveFilters = Boolean(
    filters.search ||
      filters.categoryId ||
      filters.tagId ||
      filters.priority ||
      filters.status ||
      filters.view
  );

  const [tasks, t, tHome, userTags] = await Promise.all([
    getTasks(filters),
    getTranslations("tasks"),
    getTranslations("home"),
    getUserTags(),
  ]);

  let categories = await getCategories();
  if (categories.length === 0) {
    await seedDefaultCategories();
    categories = await getCategories();
  }

  return (
    <main className="max-w-2xl mx-auto py-10 px-4">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <div className="flex flex-wrap items-center gap-2">
          <CommandPaletteButton label={t("openCommandPalette")} />
          <Link
            href="/dashboard"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border hover:bg-accent"
            aria-label={t("dashboard")}
          >
            <LayoutDashboard className="h-4 w-4" />
          </Link>
          <Link
            href="/calendar"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border hover:bg-accent"
            aria-label={t("calendar")}
          >
            <CalendarIcon className="h-4 w-4" />
          </Link>
          <Link
            href="/archive"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border hover:bg-accent"
            aria-label={t("archive")}
          >
            <ArchiveIcon className="h-4 w-4" />
          </Link>
          <Link
            href="/trash"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border hover:bg-accent"
            aria-label={t("trash")}
          >
            <Trash2 className="h-4 w-4" />
          </Link>
          <ThemeToggle />
          <LanguageSwitcher />
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: `/${locale}/login` });
            }}
          >
            <button
              type="submit"
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border hover:bg-accent"
              aria-label={tHome("signOut")}
            >
              <LogOut className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Add Task Form */}
      <form action={createTask} className="mb-8 space-y-3 border p-4 rounded-lg">
        <input
          name="title"
          placeholder={t("titlePlaceholder")}
          required
          className="w-full border rounded-md px-3 py-2"
        />
        <textarea
          name="description"
          placeholder={t("descriptionPlaceholder")}
          className="w-full border rounded-md px-3 py-2"
        />
        <textarea
          name="notes"
          placeholder={t("notesPlaceholder")}
          className="w-full border rounded-md px-3 py-2"
        />
        <input
          type="url"
          name="referenceUrl"
          placeholder={t("referenceUrlPlaceholder")}
          className="w-full border rounded-md px-3 py-2"
        />
        <div className="flex flex-wrap items-center gap-3">
          <select name="priority" className="border rounded-md px-3 py-2">
            <option value="NONE">{t("priorityNone")}</option>
            <option value="LOW">{t("priorityLow")}</option>
            <option value="MEDIUM">{t("priorityMedium")}</option>
            <option value="HIGH">{t("priorityHigh")}</option>
          </select>
          <select
            name="categoryId"
            aria-label={t("categoryLabel")}
            className="border rounded-md px-3 py-2"
          >
            <option value="">{t("noCategory")}</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <input type="date" name="dueDate" className="border rounded-md px-3 py-2" />
        </div>
        <TagInput key={tasks.length} suggestions={userTags.map((tag) => tag.name)} />
        <button
          type="submit"
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          {t("addButton")}
        </button>
      </form>

      {/* Add Custom Category */}
      <form
        action={createCategory}
        className="mb-8 flex flex-wrap items-center gap-3 border p-4 rounded-lg"
      >
        <input
          name="name"
          placeholder={t("categoryNamePlaceholder")}
          required
          className="min-w-0 flex-1 border rounded-md px-3 py-2"
        />
        <input
          type="color"
          name="color"
          defaultValue="#6366f1"
          aria-label={t("categoryLabel")}
          className="h-10 w-14 border rounded-md p-1"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-900 text-sm whitespace-nowrap"
        >
          {t("addCategory")}
        </button>
      </form>

      {/* Search / Filter / Smart Views */}
      <TaskFilters categories={categories} tags={userTags} />

      {/* Task List */}
      {tasks.length === 0 ? (
        <p className="text-gray-500">
          {hasActiveFilters ? t("emptyFiltered") : t("empty")}
        </p>
      ) : (
        <TaskList
          tasks={tasks}
          categories={categories}
          tagSuggestions={userTags.map((tag) => tag.name)}
          draggable={!hasActiveFilters}
        />
      )}
    </main>
  );
}
