"use client";

import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Calendar as CalendarIcon,
  Trash2,
  Archive as ArchiveIcon,
  ListTodo,
  Plus,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { getTasks } from "@/app/actions/tasks";
import { getCategories } from "@/app/actions/categories";
import EditTaskDialog from "@/components/EditTaskDialog";
import type { Task, Category } from "@/components/TaskItem";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

export default function CommandPalette() {
  const t = useTranslations("tasks");
  const router = useRouter();
  const pathname = usePathname();

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [pendingFocus, setPendingFocus] = useState(false);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    function handleOpenEvent() {
      setOpen(true);
    }
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("open-command-palette", handleOpenEvent);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("open-command-palette", handleOpenEvent);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    getTasks().then(setTasks).catch(() => setTasks([]));
    getCategories().then(setCategories).catch(() => setCategories([]));
  }, [open]);

  // /tasks এ পৌঁছানোর পরই title input focus করো — fixed delay এর বদলে pathname
  // পরিবর্তন হওয়ার উপর নির্ভর করা, যাতে ধীর route compile এ focus miss না হয়
  useEffect(() => {
    if (!pendingFocus || pathname !== "/tasks") return;
    const raf = requestAnimationFrame(() => {
      document.querySelector<HTMLInputElement>('input[name="title"]')?.focus();
      setPendingFocus(false);
    });
    return () => cancelAnimationFrame(raf);
  }, [pendingFocus, pathname]);

  function navigate(href: string) {
    setOpen(false);
    router.push(href);
  }

  function handleQuickAdd() {
    setOpen(false);
    if (pathname !== "/tasks") {
      setPendingFocus(true);
      router.push("/tasks");
    } else {
      document.querySelector<HTMLInputElement>('input[name="title"]')?.focus();
    }
  }

  const matchingTasks = query
    ? tasks.filter((task) => task.title.toLowerCase().includes(query.toLowerCase()))
    : tasks;

  return (
    <>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={t("searchPlaceholder")}
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            <CommandEmpty>{t("empty")}</CommandEmpty>
            <CommandGroup heading={t("navigate")}>
              <CommandItem onSelect={() => navigate("/dashboard")}>
                <LayoutDashboard />
                {t("dashboard")}
              </CommandItem>
              <CommandItem onSelect={() => navigate("/tasks")}>
                <ListTodo />
                {t("title")}
              </CommandItem>
              <CommandItem onSelect={() => navigate("/calendar")}>
                <CalendarIcon />
                {t("calendar")}
              </CommandItem>
              <CommandItem onSelect={() => navigate("/trash")}>
                <Trash2 />
                {t("trash")}
              </CommandItem>
              <CommandItem onSelect={() => navigate("/archive")}>
                <ArchiveIcon />
                {t("archive")}
              </CommandItem>
            </CommandGroup>
            <CommandGroup heading={t("quickAdd")}>
              <CommandItem onSelect={handleQuickAdd}>
                <Plus />
                {t("addNewTask")}
              </CommandItem>
            </CommandGroup>
            {matchingTasks.length > 0 && (
              <CommandGroup heading={t("title")}>
                {matchingTasks.slice(0, 20).map((task) => (
                  <CommandItem
                    key={task.id}
                    value={task.title}
                    onSelect={() => {
                      setOpen(false);
                      setEditingTask(task);
                    }}
                  >
                    <ListTodo />
                    {task.title}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </CommandDialog>

      {editingTask && (
        <EditTaskDialog
          task={editingTask}
          categories={categories}
          open={true}
          onOpenChange={(o) => !o && setEditingTask(null)}
          hideTrigger
        />
      )}
    </>
  );
}
