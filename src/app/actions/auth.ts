"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signOut } from "@/../auth";

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

export async function seedDefaultCategoriesForUser(userId: string) {
  await prisma.category.createMany({
    data: DEFAULT_CATEGORIES.map((cat, i) => ({
      userId,
      name: cat.name,
      color: cat.color,
      position: i,
    })),
  });
}

type RegisterResult = { error: string } | { success: true };

export async function registerUser(formData: FormData): Promise<RegisterResult> {
  const name = formData.get("name");
  const email = formData.get("email");
  const password = formData.get("password");
  const confirmPassword = formData.get("confirmPassword");

  if (
    typeof name !== "string" ||
    typeof email !== "string" ||
    typeof password !== "string" ||
    typeof confirmPassword !== "string" ||
    !name ||
    !email ||
    !password ||
    !confirmPassword
  ) {
    return { error: "allFieldsRequired" };
  }

  if (password.length < 8) {
    return { error: "passwordTooShort" };
  }

  if (password !== confirmPassword) {
    return { error: "passwordMismatch" };
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return { error: "emailAlreadyExists" };
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
    },
  });

  await seedDefaultCategoriesForUser(newUser.id);

  return { success: true };
}

export async function signOutAction(locale: string) {
  await signOut({ redirectTo: `/${locale}/login` });
}
