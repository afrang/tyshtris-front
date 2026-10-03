import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Breadcrumb } from "@/components/blog/Breadcrumb";
import { DonateForm } from "@/components/donate/DonateForm";
import { getHeaderData } from "@/lib/cms/client";
import { routing } from "@/i18n/routing";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ thanks?: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Donate" });
  const { settings } = await getHeaderData(locale);
  const name = settings.name || settings.title;

  return {
    title: t("title"),
    description: t("description", { name }),
  };
}

export default async function DonatePage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { thanks } = await searchParams;
  setRequestLocale(locale);

  const t = await getTranslations("Donate");
  const tBlog = await getTranslations("BlogGroupPage");
  const tA11y = await getTranslations("A11y");
  const { settings } = await getHeaderData(locale);
  const siteName = settings.name || settings.title;
  const business = process.env.NEXT_PUBLIC_PAYPAL_BUSINESS?.trim() ?? "";

  return (
    <main className="flex w-full flex-1 flex-col">
      <header className="blog-group-hero relative w-full overflow-hidden">
        <div className="blog-group-hero-pattern" aria-hidden="true" />
        <div className="relative z-10 mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 pb-16 pt-6 sm:px-6 sm:pb-20">
          <Breadcrumb
            homeLabel={tBlog("home")}
            items={[{ id: "donate", title: t("title"), slug: "donate" }]}
            variant="onHero"
            ariaLabel={tA11y("breadcrumb")}
          />
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
            {t("title")}
          </h1>
          <p className="max-w-2xl text-base leading-7 text-white/85 sm:text-lg">
            {t("lead", { name: siteName })}
          </p>
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
              className="blog-group-hero-wave-mid"
              d="M0,64 C200,20 400,100 600,68 C800,36 1000,88 1200,56 C1320,36 1380,72 1440,60 L1440,120 L0,120 Z"
            />
            <path
              className="blog-group-hero-wave-front"
              d="M0,78 C220,46 420,104 640,78 C860,52 1080,96 1280,74 L1440,86 L1440,120 L0,120 Z"
            />
          </svg>
        </div>
      </header>

      <section className="mx-auto w-full max-w-xl px-4 py-8 sm:px-6 sm:py-12">
        <DonateForm
          business={business}
          siteName={siteName}
          thanked={thanks === "1"}
        />
      </section>
    </main>
  );
}
