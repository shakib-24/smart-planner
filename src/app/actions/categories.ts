"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/../auth";
import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";

const DEFAULT_CATEGORIES = [
  { name: "Development", color: "#3b82f6" },
  { name: "Bug Fix", color: "#ef4444" },
  { name: "Learning", color: "#8b5cf6" },
  { name: "Meeting", color: "#f59e0b" },
  { name: "Documentation", color: "#10b981" },
  { name: "Testing", color: "#ec4899" },
  { name: "Deployment", color: "#6366f1" },
  { name: "Personal", color: "#64748b" },
];

async function getUserId() {
  const session = await auth();
  if (!session?.user?.id) {
    const locale = await getLocale();
    redirect({ href: "/login", locale });
    return undefined as never;
  }
  return session.user.id;
}

// সব category position অনুযায়ী sorted
export async function getCategories() {
  const userId = await getUserId();
  return prisma.category.findMany({
    where: { userId },
    orderBy: { position: "asc" },
  });
}

// নতুন category তৈরি
export async function createCategory(formData: FormData) {
  const userId = await getUserId();
  const name = (formData.get("name") as string)?.trim();
  const color = (formData.get("color") as string) || "#6366f1";

  if (!name) throw new Error("Category এর নাম দরকার");

  const position = await prisma.category.count({ where: { userId } });

  await prisma.category.create({
    data: { userId, name, color, position },
  });

  revalidatePath("/[locale]/tasks", "page");
}

// নিজের category delete করা (userId scope করা, অন্যের category ছোঁয়া যাবে না)
export async function deleteCategory(categoryId: string) {
  const userId = await getUserId();
  await prisma.category.deleteMany({
    where: { id: categoryId, userId },
  });
  revalidatePath("/[locale]/tasks", "page");
}

// Existing user দের জন্য default category seed (যাদের createUser event এর আগে signup হয়েছিল)
export async function seedDefaultCategories() {
  const userId = await getUserId();
  const existingCount = await prisma.category.count({ where: { userId } });
  if (existingCount > 0) return;

  await prisma.category.createMany({
    data: DEFAULT_CATEGORIES.map((cat, i) => ({
      userId,
      name: cat.name,
      color: cat.color,
      position: i,
    })),
  });
  // Called directly from the page's render (not a form action), so no
  // revalidatePath here — the caller already re-fetches categories itself.
}
