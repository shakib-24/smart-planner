"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/../auth";
import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { WBS_TEMPLATES } from "@/lib/wbs-templates";

async function getUserId() {
  const session = await auth();
  if (!session?.user?.id) {
    const locale = await getLocale();
    redirect({ href: "/login", locale });
    return undefined as never;
  }
  return session.user.id;
}

export type TaskView =
  | "today"
  | "tomorrow"
  | "thisWeek"
  | "thisMonth"
  | "upcoming"
  | "overdue"
  | "completed"
  | "archived";

export type TaskFilters = {
  search?: string;
  categoryId?: string;
  tagId?: string;
  priority?: "HIGH" | "MEDIUM" | "LOW" | "NONE";
  status?: "PENDING" | "COMPLETED";
  view?: TaskView;
};

// formData থেকে tags বের করা — hidden input এ JSON array অথবা comma-separated string, দুটোই handle করে
function parseTagsFromFormData(formData: FormData): string[] {
  const raw = formData.get("tags");
  if (!raw) return [];
  const str = raw as string;
  try {
    const parsed = JSON.parse(str);
    if (Array.isArray(parsed)) return parsed.map(String);
  } catch {
    // JSON না হলে comma দিয়ে split করো
  }
  return str
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

// সব active task দেখাও (trash এ যেগুলো নাই), filters সহ
export async function getTasks(filters: TaskFilters = {}) {
  const userId = await getUserId();

  const where: Record<string, unknown> = { userId, deletedAt: null, parentId: null };

  if (filters.search) {
    where.title = { contains: filters.search, mode: "insensitive" };
  }
  if (filters.categoryId) {
    where.categoryId = filters.categoryId;
  }
  if (filters.tagId) {
    where.tags = { some: { id: filters.tagId } };
  }
  if (filters.priority) {
    where.priority = filters.priority;
  }

  const now = new Date();

  // view, যখন দেওয়া থাকে, নিজের status logic চাপিয়ে দেয় — filters.status
  // তখন ignore হয় (শুধু view না থাকলে plain status filter কাজ করে)।
  switch (filters.view) {
    case "today": {
      where.dueDate = { gte: startOfDay(now), lte: endOfDay(now) };
      where.status = { notIn: ["COMPLETED", "ARCHIVED"] };
      break;
    }
    case "tomorrow": {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      where.dueDate = { gte: startOfDay(tomorrow), lte: endOfDay(tomorrow) };
      where.status = { notIn: ["COMPLETED", "ARCHIVED"] };
      break;
    }
    case "thisWeek": {
      const day = now.getDay(); // 0 = রবি ... 6 = শনি
      const diffToMonday = day === 0 ? -6 : 1 - day;
      const monday = new Date(now);
      monday.setDate(now.getDate() + diffToMonday);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      where.dueDate = { gte: startOfDay(monday), lte: endOfDay(sunday) };
      where.status = { notIn: ["COMPLETED", "ARCHIVED"] };
      break;
    }
    case "thisMonth": {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      where.dueDate = { gte: startOfDay(start), lte: endOfDay(end) };
      where.status = { notIn: ["COMPLETED", "ARCHIVED"] };
      break;
    }
    case "upcoming": {
      where.dueDate = { gt: endOfDay(now) };
      where.status = { notIn: ["COMPLETED", "ARCHIVED"] };
      break;
    }
    case "overdue": {
      where.dueDate = { lt: startOfDay(now) };
      where.status = { notIn: ["COMPLETED", "ARCHIVED"] };
      break;
    }
    case "completed": {
      where.status = "COMPLETED";
      break;
    }
    case "archived": {
      where.status = "ARCHIVED";
      break;
    }
    default: {
      if (filters.status) {
        where.status = filters.status;
      } else {
        where.status = { not: "ARCHIVED" };
      }
      break;
    }
  }

  return prisma.task.findMany({
    where,
    orderBy: [{ position: "asc" }, { createdAt: "desc" }],
    include: {
      category: true,
      tags: true,
      children: {
        where: { deletedAt: null },
        orderBy: [{ position: "asc" }, { createdAt: "asc" }],
      },
    },
  });
}

// বর্তমান user এর সব tag, dropdown/autocomplete এর জন্য নাম অনুযায়ী sorted
export async function getUserTags() {
  const userId = await getUserId();
  return prisma.tag.findMany({
    where: { userId },
    orderBy: { name: "asc" },
  });
}

// একটা task এর tags সম্পূর্ণ replace করা (নতুন list অনুযায়ী set)
export async function syncTaskTags(taskId: string, tagNames: string[]) {
  const userId = await getUserId();

  const task = await prisma.task.findFirst({ where: { id: taskId, userId } });
  if (!task) throw new Error("Task পাওয়া যায়নি");

  const cleanNames = Array.from(
    new Set(tagNames.map((n) => n.trim().toLowerCase()).filter((n) => n.length > 0))
  );

  const tagIds = await Promise.all(
    cleanNames.map(async (name) => {
      const tag = await prisma.tag.upsert({
        where: { userId_name: { userId, name } },
        create: { userId, name },
        update: { name },
      });
      return tag.id;
    })
  );

  await prisma.task.update({
    where: { id: taskId, userId },
    data: { tags: { set: tagIds.map((id) => ({ id })) } },
  });

  revalidatePath("/[locale]/tasks", "page");
}

// Calendar এ দেখানোর জন্য সব active task (top-level + sub-task) FullCalendar event format এ
export async function getCalendarEvents() {
  const userId = await getUserId();

  const tasks = await prisma.task.findMany({
    where: {
      userId,
      deletedAt: null,
      OR: [{ startAt: { not: null } }, { dueDate: { not: null } }],
    },
    include: { category: true },
  });

  return tasks.map((task) => {
    const start = (task.startAt ?? task.dueDate)!;
    return {
      id: task.id,
      title: task.title,
      start,
      end: task.endAt ?? undefined,
      allDay: !task.startAt,
      extendedProps: {
        priority: task.priority,
        status: task.status,
        categoryColor: task.category?.color,
        taskId: task.id,
        description: task.description,
        notes: task.notes,
        categoryId: task.categoryId,
        referenceUrl: task.referenceUrl,
        dueDate: task.dueDate,
        startAt: task.startAt,
        endAt: task.endAt,
        estimatedMinutes: task.estimatedMinutes,
      },
    };
  });
}

// Dashboard এর জন্য metrics — সব active task (top-level + sub-task) ধরে হিসাব
export async function getDashboardStats() {
  const userId = await getUserId();
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const baseWhere = { userId, deletedAt: null };

  const [todayCount, pendingCount, completedCount, upcomingCount, overdueCount] =
    await Promise.all([
      prisma.task.count({
        where: { ...baseWhere, dueDate: { gte: todayStart, lte: todayEnd }, status: { not: "COMPLETED" } },
      }),
      prisma.task.count({ where: { ...baseWhere, status: "PENDING" } }),
      prisma.task.count({ where: { ...baseWhere, status: "COMPLETED" } }),
      prisma.task.count({
        where: { ...baseWhere, dueDate: { gt: todayEnd }, status: { not: "COMPLETED" } },
      }),
      prisma.task.count({
        where: { ...baseWhere, dueDate: { lt: todayStart }, status: { not: "COMPLETED" } },
      }),
    ]);

  // গত ৭ দিন (আজসহ), পুরনো দিন আগে — chart এ বাম থেকে ডানে chronological
  const last7Days: Date[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    last7Days.push(d);
  }

  const weeklyData = await Promise.all(
    last7Days.map(async (day) => {
      const dayStart = startOfDay(day);
      const dayEnd = endOfDay(day);
      const [total, completed] = await Promise.all([
        prisma.task.count({ where: { ...baseWhere, dueDate: { gte: dayStart, lte: dayEnd } } }),
        prisma.task.count({
          where: { ...baseWhere, dueDate: { gte: dayStart, lte: dayEnd }, status: "COMPLETED" },
        }),
      ]);
      return { date: dayStart.toISOString().slice(0, 10), completed, total };
    })
  );

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  const [monthTotal, monthCompleted] = await Promise.all([
    prisma.task.count({ where: { ...baseWhere, dueDate: { gte: monthStart, lte: monthEnd } } }),
    prisma.task.count({
      where: { ...baseWhere, dueDate: { gte: monthStart, lte: monthEnd }, status: "COMPLETED" },
    }),
  ]);
  const monthlyCompletionRate =
    monthTotal > 0 ? Math.round((monthCompleted / monthTotal) * 100) : 0;

  return {
    todayCount,
    pendingCount,
    completedCount,
    upcomingCount,
    overdueCount,
    weeklyData,
    monthlyCompletionRate,
  };
}

// নতুন task তৈরি
export async function createTask(formData: FormData) {
  const userId = await getUserId();
  const title = formData.get("title") as string;

  if (!title?.trim()) throw new Error("Title দরকার");

  const task = await prisma.task.create({
    data: {
      userId,
      title: title.trim(),
      description: (formData.get("description") as string) || null,
      notes: (formData.get("notes") as string) || null,
      priority: (formData.get("priority") as any) || "NONE",
      categoryId: (formData.get("categoryId") as string) || null,
      dueDate: formData.get("dueDate")
        ? new Date(formData.get("dueDate") as string)
        : null,
      referenceUrl: (formData.get("referenceUrl") as string) || null,
      startAt: formData.get("startAt")
        ? new Date(formData.get("startAt") as string)
        : null,
      endAt: formData.get("endAt")
        ? new Date(formData.get("endAt") as string)
        : null,
      estimatedMinutes: formData.get("estimatedMinutes")
        ? parseInt(formData.get("estimatedMinutes") as string, 10)
        : null,
    },
  });

  await syncTaskTags(task.id, parseTagsFromFormData(formData));

  revalidatePath("/[locale]/tasks", "page");
  revalidatePath("/[locale]/calendar", "page");
}

// নতুন sub-task তৈরি (শুধু 1-level nesting, parent নিজেই sub-task হলে reject)
export async function createSubTask(parentId: string, formData: FormData) {
  const userId = await getUserId();
  const title = formData.get("title") as string;

  if (!title?.trim()) throw new Error("Title দরকার");

  const parent = await prisma.task.findFirst({ where: { id: parentId, userId } });
  if (!parent) throw new Error("Parent task পাওয়া যায়নি");
  if (parent.parentId) {
    throw new Error("1-level nesting only; sub-tasks cannot have sub-tasks");
  }

  const weightRaw = parseInt((formData.get("weight") as string) || "1", 10);
  const weight = Number.isFinite(weightRaw) && weightRaw > 0 ? weightRaw : 1;

  await prisma.task.create({
    data: {
      userId,
      parentId,
      title: title.trim(),
      description: (formData.get("description") as string) || null,
      notes: (formData.get("notes") as string) || null,
      priority: (formData.get("priority") as any) || "NONE",
      categoryId: (formData.get("categoryId") as string) || null,
      dueDate: formData.get("dueDate")
        ? new Date(formData.get("dueDate") as string)
        : null,
      referenceUrl: (formData.get("referenceUrl") as string) || null,
      weight,
    },
  });

  revalidatePath("/[locale]/tasks", "page");
}

// Template থেকে একসাথে অনেকগুলো sub-task তৈরি (bulk insert)
export async function applyWbsTemplate(
  parentId: string,
  templateId: string,
  locale: "en" | "ja" | "bn"
) {
  const userId = await getUserId();

  const parent = await prisma.task.findFirst({ where: { id: parentId, userId } });
  if (!parent) throw new Error("Parent task পাওয়া যায়নি");
  if (parent.parentId) {
    throw new Error("1-level nesting only; sub-tasks cannot have sub-tasks");
  }

  const template = WBS_TEMPLATES.find((t) => t.id === templateId);
  if (!template) throw new Error("Template পাওয়া যায়নি");

  const existingChildrenCount = await prisma.task.count({
    where: { parentId, userId, deletedAt: null },
  });

  await prisma.task.createMany({
    data: template.subtasks[locale].map((subtask, index) => ({
      userId,
      parentId,
      title: subtask.title,
      weight: subtask.weight,
      status: "PENDING" as const,
      position: existingChildrenCount + index,
    })),
  });

  revalidatePath("/[locale]/tasks", "page");
}

// Task edit
export async function updateTask(taskId: string, formData: FormData) {
  const userId = await getUserId();
  const title = formData.get("title") as string;

  if (!title?.trim()) throw new Error("Title দরকার");

  await prisma.task.update({
    where: { id: taskId, userId },
    data: {
      title: title.trim(),
      description: (formData.get("description") as string) || null,
      notes: (formData.get("notes") as string) || null,
      priority: (formData.get("priority") as any) || "NONE",
      categoryId: (formData.get("categoryId") as string) || null,
      dueDate: formData.get("dueDate")
        ? new Date(formData.get("dueDate") as string)
        : null,
      referenceUrl: (formData.get("referenceUrl") as string) || null,
      startAt: formData.get("startAt")
        ? new Date(formData.get("startAt") as string)
        : null,
      endAt: formData.get("endAt")
        ? new Date(formData.get("endAt") as string)
        : null,
      estimatedMinutes: formData.get("estimatedMinutes")
        ? parseInt(formData.get("estimatedMinutes") as string, 10)
        : null,
    },
  });

  await syncTaskTags(taskId, parseTagsFromFormData(formData));

  revalidatePath("/[locale]/tasks", "page");
  revalidatePath("/[locale]/calendar", "page");
}

// Drag/resize করে schedule পরিবর্তন করা (শুধু startAt/endAt আপডেট, হালকা action)
export async function updateTaskSchedule(
  taskId: string,
  data: { startAt: Date | null; endAt: Date | null }
) {
  const userId = await getUserId();
  await prisma.task.update({
    where: { id: taskId, userId },
    data: { startAt: data.startAt, endAt: data.endAt },
  });
  revalidatePath("/[locale]/tasks", "page");
  revalidatePath("/[locale]/calendar", "page");
}

// Complete/Pending toggle
export async function toggleTaskStatus(taskId: string, currentStatus: string) {
  const userId = await getUserId();
  await prisma.task.update({
    where: { id: taskId, userId },
    data: { status: currentStatus === "COMPLETED" ? "PENDING" : "COMPLETED" },
  });
  revalidatePath("/[locale]/tasks", "page");
}

// Completed task কে archive করা (শুধু COMPLETED task archive করা যায়)
export async function archiveTask(taskId: string) {
  const userId = await getUserId();

  const task = await prisma.task.findFirst({ where: { id: taskId, userId } });
  if (!task) throw new Error("Task পাওয়া যায়নি");
  if (task.status !== "COMPLETED") {
    throw new Error("শুধু completed task archive করা যায়");
  }

  await prisma.task.update({
    where: { id: taskId, userId },
    data: { status: "ARCHIVED" },
  });
  revalidatePath("/[locale]/tasks", "page");
  revalidatePath("/[locale]/archive", "page");
}

// Archive থেকে ফিরিয়ে আনা (আবার COMPLETED)
export async function unarchiveTask(taskId: string) {
  const userId = await getUserId();
  await prisma.task.update({
    where: { id: taskId, userId },
    data: { status: "COMPLETED" },
  });
  revalidatePath("/[locale]/tasks", "page");
  revalidatePath("/[locale]/archive", "page");
}

// Drag & drop reorder — শুধু top-level task, array index অনুযায়ী position set
export async function reorderTasks(orderedTaskIds: string[]) {
  const userId = await getUserId();

  await prisma.$transaction(
    orderedTaskIds.map((id, index) =>
      prisma.task.updateMany({
        where: { id, userId, parentId: null },
        data: { position: index },
      })
    )
  );

  revalidatePath("/[locale]/tasks", "page");
}

// Soft delete (Trash এ পাঠানো)
export async function deleteTask(taskId: string) {
  const userId = await getUserId();
  await prisma.task.update({
    where: { id: taskId, userId },
    data: { deletedAt: new Date() },
  });
  revalidatePath("/[locale]/tasks", "page");
}

// Trash এ থাকা সব task, সবচেয়ে সাম্প্রতিক delete আগে
export async function getTrashedTasks() {
  const userId = await getUserId();
  return prisma.task.findMany({
    where: { userId, deletedAt: { not: null } },
    orderBy: { deletedAt: "desc" },
    include: { category: true },
  });
}

// Trash থেকে ফিরিয়ে আনা
export async function restoreTask(taskId: string) {
  const userId = await getUserId();
  await prisma.task.update({
    where: { id: taskId, userId },
    data: { deletedAt: null },
  });
  revalidatePath("/[locale]/tasks", "page");
  revalidatePath("/[locale]/trash", "page");
}

// আসল delete — শুধু trash এ থাকা task এর উপর কাজ করে (safety)
export async function permanentlyDeleteTask(taskId: string) {
  const userId = await getUserId();
  await prisma.task.deleteMany({
    where: { id: taskId, userId, deletedAt: { not: null } },
  });
  revalidatePath("/[locale]/trash", "page");
}