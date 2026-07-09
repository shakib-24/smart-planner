import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "ja", "bn"],
  defaultLocale: "bn",
});
