"use client";

import { useState } from "react";
import { Archive, ChevronDown, ChevronRight, ExternalLink, LayoutTemplate, Plus } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import {
  toggleTaskStatus,
  deleteTask,
  createSubTask,
  applyWbsTemplate,
  archiveTask,
} from "@/app/actions/tasks";
import EditTaskDialog from "@/components/EditTaskDialog";
import { calculateProgress } from "@/lib/wbs";
import { WBS_TEMPLATES } from "@/lib/wbs-templates";

export type Category = { id: string; name: string; color: string };

type SubTask = {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: Date | null;
  weight: number;
};

type Tag = { id: string; name: string };

export type Task = {
  id: string;
  title: string;
  description: string | null;
  notes: string | null;
  status: string;
  priority: string;
  categoryId: string | null;
  dueDate: Date | null;
  referenceUrl: string | null;
  startAt: Date | null;
  endAt: Date | null;
  estimatedMinutes: number | null;
  category: Category | null;
  tags: Tag[];
  children: SubTask[];
};

const PRIORITY_KEY: Record<string, string> = {
  NONE: "priorityNone",
  LOW: "priorityLow",
  MEDIUM: "priorityMedium",
  HIGH: "priorityHigh",
};

function Checkbox({
  checked,
  onToggle,
  size = "default",
}: {
  checked: boolean;
  onToggle: () => void;
  size?: "default" | "small";
}) {
  return (
    <form action={onToggle}>
      <button
        type="submit"
        className={
          (size === "small" ? "flex h-4 w-4 " : "flex h-5 w-5 ") +
          "shrink-0 items-center justify-center rounded border-2 " +
          (checked
            ? "border-green-500 bg-green-500 text-white"
            : "border-gray-300 hover:border-gray-400")
        }
      >
        {checked && (
          <svg
            viewBox="0 0 24 24"
            className={size === "small" ? "h-2.5 w-2.5" : "h-3.5 w-3.5"}
            fill="none"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>
    </form>
  );
}

export default function TaskItem({
  task,
  categories,
  tagSuggestions = [],
}: {
  task: Task;
  categories: Category[];
  tagSuggestions?: string[];
}) {
  const t = useTranslations("tasks");
  const locale = useLocale() as "en" | "ja" | "bn";
  const [expanded, setExpanded] = useState(false);
  const [addingSubtask, setAddingSubtask] = useState(false);
  const [templateMenuOpen, setTemplateMenuOpen] = useState(false);

  const progress = calculateProgress(task.children);

  async function handleCreateSubtask(formData: FormData) {
    await createSubTask(task.id, formData);
    setAddingSubtask(false);
    setExpanded(true);
  }

  async function handleApplyTemplate(templateId: string) {
    setTemplateMenuOpen(false);
    await applyWbsTemplate(task.id, templateId, locale);
    setExpanded(true);
  }

  return (
    <div className="border rounded-lg p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {task.children.length > 0 ? (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="text-gray-500 hover:text-foreground"
            >
              {expanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          ) : (
            <span className="w-4" />
          )}
          <Checkbox
            checked={task.status === "COMPLETED"}
            onToggle={toggleTaskStatus.bind(null, task.id, task.status)}
          />
          <div>
            <div className="flex items-center gap-2">
              <p
                className={
                  task.status === "COMPLETED" ? "line-through text-gray-400" : "font-medium"
                }
              >
                {task.title}
              </p>
              {task.category && (
                <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                  <span
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ backgroundColor: task.category.color }}
                  />
                  {task.category.name}
                </span>
              )}
              {task.referenceUrl && (
                <a
                  href={task.referenceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={t("viewReference")}
                  className="inline-flex items-center text-gray-400 hover:text-foreground"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
              {task.tags.map((tag) => (
                <span
                  key={tag.id}
                  className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                >
                  {tag.name}
                </span>
              ))}
            </div>
            {task.dueDate && (
              <p className="text-xs text-gray-500">
                {t("due")}: {new Date(task.dueDate).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <EditTaskDialog task={task} categories={categories} tagSuggestions={tagSuggestions} />
          {task.status === "COMPLETED" && (
            <form action={archiveTask.bind(null, task.id)}>
              <button
                type="submit"
                className="text-gray-500 hover:text-foreground"
                aria-label={t("archive")}
                title={t("archive")}
              >
                <Archive className="h-4 w-4" />
              </button>
            </form>
          )}
          <form action={deleteTask.bind(null, task.id)}>
            <button type="submit" className="text-red-500 text-sm hover:underline">
              {t("delete")}
            </button>
          </form>
        </div>
      </div>

      {progress && (
        <div className="mt-3 ml-7">
          <div className="mb-1 flex items-center justify-between text-xs text-gray-500">
            <span>{t("progressLabel")}</span>
            <span>{progress.percentage}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-green-500"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
        </div>
      )}

      <div className="mt-2 ml-7">
        {!addingSubtask ? (
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setAddingSubtask(true)}
              className="inline-flex items-center gap-1 text-xs text-blue-500 hover:underline"
            >
              <Plus className="h-3 w-3" />
              {t("addSubtask")}
            </button>
            <div className="relative">
              <button
                type="button"
                onClick={() => setTemplateMenuOpen((v) => !v)}
                className="inline-flex items-center gap-1 text-xs text-blue-500 hover:underline"
              >
                <LayoutTemplate className="h-3 w-3" />
                {t("applyTemplate")}
              </button>
              {templateMenuOpen && (
                <div className="absolute z-10 mt-1 w-56 rounded-md border bg-popover shadow-md">
                  {WBS_TEMPLATES.map((template) => (
                    <button
                      key={template.id}
                      type="button"
                      onClick={() => handleApplyTemplate(template.id)}
                      className="block w-full px-3 py-2 text-left text-xs hover:bg-muted"
                    >
                      {t(template.nameKey)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <form action={handleCreateSubtask} className="mt-1 flex flex-wrap items-center gap-2">
            <input
              name="title"
              placeholder={t("subtaskTitlePlaceholder")}
              required
              className="rounded-md border px-2 py-1 text-sm"
            />
            <select
              name="priority"
              defaultValue="NONE"
              className="rounded-md border px-2 py-1 text-sm"
            >
              <option value="NONE">{t("priorityNone")}</option>
              <option value="LOW">{t("priorityLow")}</option>
              <option value="MEDIUM">{t("priorityMedium")}</option>
              <option value="HIGH">{t("priorityHigh")}</option>
            </select>
            <input type="date" name="dueDate" className="rounded-md border px-2 py-1 text-sm" />
            <input
              type="number"
              name="weight"
              min={1}
              defaultValue={1}
              aria-label={t("weightLabel")}
              title={t("weightLabel")}
              className="w-16 rounded-md border px-2 py-1 text-sm"
            />
            <button
              type="submit"
              className="rounded-md bg-blue-500 px-2 py-1 text-sm text-white hover:bg-blue-600"
            >
              {t("save")}
            </button>
            <button
              type="button"
              onClick={() => setAddingSubtask(false)}
              className="rounded-md border px-2 py-1 text-sm"
            >
              {t("cancel")}
            </button>
          </form>
        )}
      </div>

      {expanded && task.children.length > 0 && (
        <div className="mt-3 ml-7 space-y-2 border-l pl-3">
          {task.children.map((child) => (
            <div key={child.id} className="flex items-center gap-2">
              <Checkbox
                checked={child.status === "COMPLETED"}
                onToggle={toggleTaskStatus.bind(null, child.id, child.status)}
                size="small"
              />
              <div>
                <p
                  className={
                    child.status === "COMPLETED"
                      ? "text-sm line-through text-gray-400"
                      : "text-sm"
                  }
                >
                  {child.title}
                </p>
                {(child.priority !== "NONE" || child.dueDate) && (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    {child.priority !== "NONE" && <span>{t(PRIORITY_KEY[child.priority])}</span>}
                    {child.dueDate && (
                      <span>
                        {t("due")}: {new Date(child.dueDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
