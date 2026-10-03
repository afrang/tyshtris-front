import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AccountPanel } from "@/components/account/AccountPanel";
import { routing } from "@/i18n/routing";

type Props = {
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Account" });
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function AccountPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Account");

  return (
    <main className="flex w-full flex-1 flex-col">
      <header className="blog-group-hero relative w-full overflow-hidden">
        <div className="blog-group-hero-pattern" aria-hidden="true" />
        <div className="relative z-10 mx-auto flex w-full max-w-3xl flex-col gap-3 px-4 pb-14 pt-8 sm:px-6 sm:pb-16">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">{t("title")}</h1>
          <p className="max-w-2xl text-base leading-7 text-white/85 sm:text-lg">{t("lead")}</p>
        </div>
        <div className="blog-group-hero-wave" aria-hidden="true">
          <svg
            className="blog-group-hero-wave-svg"
            viewBox="0 0 1440 120"
            preserveAspectRatio="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              className="blog-group-hero-wave-back"
              d="M0,48 C180,96 360,12 540,52 C720,92 900,20 1080,56 C1260,92 1350,40 1440,64 L1440,120 L0,120 Z"
            />
            <path
              className="blog-group-hero-wave-front"
              d="M0,78 C220,46 420,104 640,78 C860,52 1080,96 1280,74 L1440,86 L1440,120 L0,120 Z"
            />
          </svg>
        </div>
      </header>
      <AccountPanel locale={locale} />
    </main>
  );
}
