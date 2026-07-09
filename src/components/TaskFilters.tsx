"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

type Category = { id: string; name: string };
type Tag = { id: string; name: string };

const VIEWS = [
  "all",
  "today",
  "tomorrow",
  "thisWeek",
  "thisMonth",
  "upcoming",
  "overdue",
  "completed",
] as const;

export default function TaskFilters({
  categories,
  tags,
}: {
  categories: Category[];
  tags: Tag[];
}) {
  const t = useTranslations("tasks");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRender = useRef(true);

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push({ pathname, query: Object.fromEntries(params.entries()) });
  }

  useEffect(() => {
    // প্রথম render এ debounce skip করো, নাহলে page load এই একটা navigation ছোঁড়ে
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      updateParam("q", search);
    }, 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const currentView = searchParams.get("view") || "all";
  const viewLabels: Record<(typeof VIEWS)[number], string> = {
    all: t("viewAll"),
    today: t("viewToday"),
    tomorrow: t("viewTomorrow"),
    thisWeek: t("viewThisWeek"),
    thisMonth: t("viewThisMonth"),
    upcoming: t("viewUpcoming"),
    overdue: t("viewOverdue"),
    completed: t("viewCompleted"),
  };

  return (
    <div className="mb-6 space-y-3">
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={t("searchPlaceholder")}
        className="w-full border rounded-md px-3 py-2"
      />

      <div className="flex flex-wrap gap-3">
        <select
          value={searchParams.get("categoryId") ?? ""}
          onChange={(e) => updateParam("categoryId", e.target.value)}
          aria-label={t("categoryLabel")}
          className="border rounded-md px-3 py-2"
        >
          <option value="">{t("categoryLabel")}</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>

        <select
          value={searchParams.get("tagId") ?? ""}
          onChange={(e) => updateParam("tagId", e.target.value)}
          aria-label={t("filterByTag")}
          className="border rounded-md px-3 py-2"
        >
          <option value="">{t("allTags")}</option>
          {tags.map((tag) => (
            <option key={tag.id} value={tag.id}>
              {tag.name}
            </option>
          ))}
        </select>

        <select
          value={searchParams.get("priority") ?? ""}
          onChange={(e) => updateParam("priority", e.target.value)}
          aria-label={t("filterByPriority")}
          className="border rounded-md px-3 py-2"
        >
          <option value="">{t("filterByPriority")}</option>
          <option value="NONE">{t("priorityNone")}</option>
          <option value="LOW">{t("priorityLow")}</option>
          <option value="MEDIUM">{t("priorityMedium")}</option>
          <option value="HIGH">{t("priorityHigh")}</option>
        </select>

        <select
          value={searchParams.get("status") ?? ""}
          onChange={(e) => updateParam("status", e.target.value)}
          aria-label={t("filterByStatus")}
          className="border rounded-md px-3 py-2"
        >
          <option value="">{t("statusAll")}</option>
          <option value="PENDING">{t("statusPending")}</option>
          <option value="COMPLETED">{t("statusCompleted")}</option>
        </select>
      </div>

      <div className="flex flex-wrap gap-2">
        {VIEWS.map((view) => (
          <button
            key={view}
            type="button"
            onClick={() => updateParam("view", view === "all" ? "" : view)}
            className={cn(
              "rounded-full border px-3 py-1 text-sm",
              currentView === view
                ? "bg-foreground text-background"
                : "hover:bg-accent"
            )}
          >
            {viewLabels[view]}
          </button>
        ))}
      </div>
    </div>
  );
}
