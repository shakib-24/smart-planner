"use client";

import { useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import jaLocale from "@fullcalendar/core/locales/ja";
import bnLocale from "@fullcalendar/core/locales/bn";
import { useLocale, useTranslations } from "next-intl";
import { createTask, updateTaskSchedule } from "@/app/actions/tasks";
import EditTaskDialog from "@/components/EditTaskDialog";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type Category = { id: string; name: string };

type CalendarEvent = {
  id: string;
  title: string;
  start: Date | string;
  end?: Date | string;
  allDay: boolean;
  extendedProps: {
    priority: string;
    status: string;
    categoryColor?: string;
    taskId: string;
    description: string | null;
    notes: string | null;
    categoryId: string | null;
    referenceUrl: string | null;
    dueDate: Date | string | null;
    startAt: Date | string | null;
    endAt: Date | string | null;
    estimatedMinutes: number | null;
  };
};

type EditingTask = {
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
};

export default function CalendarView({
  events,
  categories,
}: {
  events: CalendarEvent[];
  categories: Category[];
}) {
  const t = useTranslations("tasks");
  const locale = useLocale();
  const fcLocale = locale === "ja" ? jaLocale : locale === "bn" ? bnLocale : "en";

  const [editingTask, setEditingTask] = useState<EditingTask | null>(null);
  const [quickCreateDate, setQuickCreateDate] = useState<Date | null>(null);

  function handleEventClick(info: any) {
    const ep = info.event.extendedProps;
    setEditingTask({
      id: info.event.id,
      title: info.event.title,
      description: ep.description ?? null,
      notes: ep.notes ?? null,
      priority: ep.priority ?? "NONE",
      categoryId: ep.categoryId ?? null,
      dueDate: ep.dueDate ? new Date(ep.dueDate) : null,
      referenceUrl: ep.referenceUrl ?? null,
      startAt: ep.startAt ? new Date(ep.startAt) : null,
      endAt: ep.endAt ? new Date(ep.endAt) : null,
      estimatedMinutes: ep.estimatedMinutes ?? null,
    });
  }

  async function handleEventChange(info: any) {
    try {
      await updateTaskSchedule(info.event.id, {
        startAt: info.event.start,
        endAt: info.event.end,
      });
    } catch {
      info.revert();
    }
  }

  function handleDateClick(info: any) {
    setQuickCreateDate(info.date);
  }

  async function handleQuickCreate(formData: FormData) {
    await createTask(formData);
    setQuickCreateDate(null);
  }

  return (
    <div className="rounded-lg border p-3">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,timeGridDay",
        }}
        locale={fcLocale}
        events={events}
        height="auto"
        editable
        eventClick={handleEventClick}
        eventDrop={handleEventChange}
        eventResize={handleEventChange}
        dateClick={handleDateClick}
      />

      {editingTask && (
        <EditTaskDialog
          task={editingTask}
          categories={categories}
          open={true}
          onOpenChange={(open) => !open && setEditingTask(null)}
          hideTrigger
        />
      )}

      <Dialog
        open={quickCreateDate !== null}
        onOpenChange={(open) => !open && setQuickCreateDate(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("addButton")}</DialogTitle>
          </DialogHeader>
          <form action={handleQuickCreate} className="space-y-3">
            <input
              type="hidden"
              name="startAt"
              defaultValue={quickCreateDate ? quickCreateDate.toISOString() : ""}
            />
            <input
              name="title"
              placeholder={t("titlePlaceholder")}
              required
              autoFocus
              className="w-full border rounded-md px-3 py-2"
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
    </div>
  );
}
