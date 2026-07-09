import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Google from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";

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

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [Google],
  pages: {
    signIn: "/login",
  },
  events: {
    async createUser({ user }) {
      if (!user.id) return;
      await prisma.category.createMany({
        data: DEFAULT_CATEGORIES.map((cat, i) => ({
          userId: user.id!,
          name: cat.name,
          color: cat.color,
          position: i,
        })),
      });
    },
  },
});