"use client";

import {
  Trash2,
  Calendar as CalendarIcon,
  LayoutDashboard,
  LogOut,
  Archive as ArchiveIcon,
  ListTodo,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { signOutAction } from "@/app/actions/auth";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import ThemeToggle from "@/components/theme-toggle";
import CommandPaletteButton from "@/components/CommandPaletteButton";

const navLinkClass = (active: boolean) =>
  cn(
    "inline-flex h-9 w-9 items-center justify-center rounded-md border hover:bg-accent",
    active && "bg-accent border-foreground/30"
  );

export default function AppHeader({
  locale,
  title,
}: {
  locale: string;
  title: string;
}) {
  const t = useTranslations("tasks");
  const tHome = useTranslations("home");
  const pathname = usePathname();

  const navLinks = [
    { href: "/tasks" as const, label: t("title"), icon: ListTodo },
    { href: "/dashboard" as const, label: t("dashboard"), icon: LayoutDashboard },
    { href: "/calendar" as const, label: t("calendar"), icon: CalendarIcon },
    { href: "/archive" as const, label: t("archive"), icon: ArchiveIcon },
    { href: "/trash" as const, label: t("trash"), icon: Trash2 },
  ];

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
      <h1 className="text-2xl font-bold">{title}</h1>
      <div className="flex flex-wrap items-center gap-2">
        <CommandPaletteButton label={t("openCommandPalette")} />
        {navLinks.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={navLinkClass(active)}
              aria-label={label}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="h-4 w-4" />
            </Link>
          );
        })}
        <ThemeToggle />
        <LanguageSwitcher />
        <form action={signOutAction.bind(null, locale)}>
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
  );
}
