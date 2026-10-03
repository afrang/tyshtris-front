import { getTranslations, setRequestLocale } from "next-intl/server";
import { PostCarousel } from "@/components/blog/PostCarousel";
import { HomeSlider, type HomeSlide } from "@/components/home/HomeSlider";
import { Link } from "@/i18n/navigation";
import { getBlogGroupBySlug, getMenuBySlug } from "@/lib/cms/client";

/** Public key of the Side Menu edited at /menus/2e1a433e-f36b-1410-8f1d-00cad4184220 */
const HOME_SLIDER_MENU_KEY = "sidemenu";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("BlogGroupPage");
  const tPost = await getTranslations("PostPage");
  const tHome = await getTranslations("HomePage");
  const tA11y = await getTranslations("A11y");
  const dir = locale === "fa" || locale === "ar" ? "rtl" : "ltr";

  const [featuredGroup, sliderMenu] = await Promise.all([
    getBlogGroupBySlug("siasat-o-cheshmandaz", locale),
    getMenuBySlug(HOME_SLIDER_MENU_KEY, locale),
  ]);

  const slides: HomeSlide[] = sliderMenu
    .filter((item) => item.isActive && item.title.trim().length > 0)
    .map((item) => ({
      id: item.id,
      title: item.title,
      href: item.url,
      imageUrl: item.imageUrl,
    }));

  return (
    <main className="flex w-full flex-1 flex-col">
      {slides.length > 0 ? (
        <HomeSlider
          slides={slides}
          label={tHome("sliderLabel")}
          previousLabel={tA11y("previousSlide")}
          nextLabel={tA11y("nextSlide")}
          goToSlideLabel={tA11y.raw("goToSlide")}
        />
      ) : null}

      {featuredGroup && featuredGroup.posts.length > 0 ? (
        <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-end justify-between gap-4 border-b border-zinc-200 pb-3">
            <h2 className="text-2xl font-semibold text-zinc-900">
              {featuredGroup.title}
            </h2>
            <Link
              href={`/${featuredGroup.slug}`}
              className="shrink-0 text-sm font-medium text-[var(--color-royal-purple)] transition hover:text-[var(--color-royal-purple-deep)]"
            >
              {tPost("viewAllGroup")}
            </Link>
          </div>

          <PostCarousel
            posts={featuredGroup.posts}
            locale={locale}
            dir={dir}
            readLabel={t("readPost")}
            emptyImageLabel={t("noPicture")}
          />
        </section>
      ) : null}
    </main>
  );
}
