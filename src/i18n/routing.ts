import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "fa", "ar"],
  defaultLocale: "en",
  // Default locale (en) has no prefix: `/` instead of `/en`.
  // Other locales keep their prefix: `/fa`, `/ar`.
  localePrefix: "as-needed",
});

export type Locale = (typeof routing.locales)[number];

export const localeNames: Record<Locale, string> = {
  en: "English",
  fa: "فارسی",
  ar: "العربية",
};

export const rtlLocales: Locale[] = ["fa", "ar"];

export function isRtlLocale(locale: string): boolean {
  return rtlLocales.includes(locale as Locale);
}
