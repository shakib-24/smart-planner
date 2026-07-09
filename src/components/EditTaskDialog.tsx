"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { useTranslations } from "next-intl";
import { updateTask } from "@/app/actions/tasks";
import { Button } from "@/components/ui/button";
import TagInput from "@/components/TagInput";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type Category = { id: string; name: string };

type Task = {
  id: string;
  title: string;
  description: string | null;
  notes: string | null;
  priority: string;
  categoryId: string | null;
  dueDate: Date | null;
  referenceUrl: string | null;
  startAt: Date | null;
  endAt: Date | null;
  estimatedMinutes: number | null;
  tags?: { id: string; name: string }[];
};

export default function EditTaskDialog({
  task,
  categories,
  tagSuggestions = [],
  open: openProp,
  onOpenChange: onOpenChangeProp,
  hideTrigger = false,
}: {
  task: Task;
  categories: Category[];
  tagSuggestions?: string[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideTrigger?: boolean;
}) {
  const t = useTranslations("tasks");
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = openProp !== undefined;
  const open = isControlled ? openProp : internalOpen;
  const setOpen = isControlled ? onOpenChangeProp! : setInternalOpen;

  async function handleSubmit(formData: FormData) {
    await updateTask(task.id, formData);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!hideTrigger && (
        <DialogTrigger
          render={
            <button
              type="button"
              className="text-gray-500 hover:text-foreground"
              aria-label={t("edit")}
            />
          }
        >
          <Pencil className="h-4 w-4" />
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("edit")}</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-3">
          <input
            type="hidden"
            name="startAt"
            defaultValue={task.startAt ? new Date(task.startAt).toISOString() : ""}
          />
          <input
            type="hidden"
            name="endAt"
            defaultValue={task.endAt ? new Date(task.endAt).toISOString() : ""}
          />
          <input
            type="hidden"
            name="estimatedMinutes"
            defaultValue={task.estimatedMinutes ?? ""}
          />
          <input
            name="title"
            defaultValue={task.title}
            placeholder={t("titlePlaceholder")}
            required
            className="w-full border rounded-md px-3 py-2"
          />
          <textarea
            name="description"
            defaultValue={task.description ?? ""}
            placeholder={t("descriptionPlaceholder")}
            className="w-full border rounded-md px-3 py-2"
          />
          <textarea
            name="notes"
            defaultValue={task.notes ?? ""}
            placeholder={t("notesPlaceholder")}
            className="w-full border rounded-md px-3 py-2"
          />
          <input
            type="url"
            name="referenceUrl"
            defaultValue={task.referenceUrl ?? ""}
            placeholder={t("referenceUrlPlaceholder")}
            className="w-full border rounded-md px-3 py-2"
          />
          <div className="flex gap-3">
            <select
              name="priority"
              defaultValue={task.priority}
              className="border rounded-md px-3 py-2"
            >
              <option value="NONE">{t("priorityNone")}</option>
              <option value="LOW">{t("priorityLow")}</option>
              <option value="MEDIUM">{t("priorityMedium")}</option>
              <option value="HIGH">{t("priorityHigh")}</option>
            </select>
            <select
              name="categoryId"
              defaultValue={task.categoryId ?? ""}
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
            <input
              type="date"
              name="dueDate"
              defaultValue={
                task.dueDate
                  ? new Date(task.dueDate).toISOString().slice(0, 10)
                  : ""
              }
              className="border rounded-md px-3 py-2"
            />
          </div>
          <TagInput
            defaultTags={task.tags?.map((tag) => tag.name) ?? []}
            suggestions={tagSuggestions}
          />
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>
              {t("cancel")}
            </DialogClose>
            <Button type="submit">{t("save")}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
