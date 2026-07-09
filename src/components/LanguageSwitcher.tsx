"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { cn } from "@/lib/utils";

const LABELS: Record<(typeof routing.locales)[number], string> = {
  bn: "বাংলা",
  en: "English",
  ja: "日本語",
};

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="flex gap-2">
      {routing.locales.map((cur) => (
        <button
          key={cur}
          type="button"
          onClick={() => router.replace(pathname, { locale: cur })}
          aria-current={cur === locale}
          className={cn(
            "rounded-md border px-3 py-1 text-sm font-medium",
            cur === locale
              ? "bg-foreground text-background"
              : "hover:bg-accent"
          )}
        >
          {LABELS[cur]}
        </button>
      ))}
    </div>
  );
}
