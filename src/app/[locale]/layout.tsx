import type { Metadata } from "next";
import { Geist, Geist_Mono, Libre_Baskerville, Vazirmatn } from "next/font/google";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { SiteFooter } from "@/components/footer/SiteFooter";
import { SiteHeader } from "@/components/header/SiteHeader";
import { getHeaderData } from "@/lib/cms/client";
import { isRtlLocale, routing } from "@/i18n/routing";
import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const libreBaskerville = Libre_Baskerville({
  variable: "--font-brand-serif",
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
});

/** Vazir (Vazirmatn) — used for Persian UI */
const vazir = Vazirmatn({
  variable: "--font-vazir",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
});

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

/** Always render from live CMS data — avoid Full Route Cache / ISR stale pages. */
export const dynamic = "force-dynamic";
export const revalidate = 0;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const { settings } = await getHeaderData(locale);
  const t = await getTranslations({ locale, namespace: "Metadata" });

  return {
    title: settings.title || t("title"),
    description: settings.description || t("description"),
  };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const isPersian = locale === "fa";
  const dir = isRtlLocale(locale) ? "rtl" : "ltr";
  const fontVariables = [
    geistSans.variable,
    geistMono.variable,
    libreBaskerville.variable,
    vazir.variable,
  ].join(" ");

  return (
    <html lang={locale} dir={dir} className={`${fontVariables} h-full antialiased`}>
      <body
        className={`min-h-full flex flex-col ${
          isPersian
            ? "font-[family-name:var(--font-vazir)]"
            : isRtlLocale(locale)
              ? "font-[family-name:var(--font-vazir)]"
              : "font-sans"
        }`}
      >
        <NextIntlClientProvider>
          <SiteHeader locale={locale} />
          <div className="flex flex-1 flex-col">{children}</div>
          <SiteFooter locale={locale} />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
