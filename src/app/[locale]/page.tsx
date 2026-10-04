import { getTranslations, setRequestLocale } from "next-intl/server";
import { PostCarousel } from "@/components/blog/PostCarousel";
import {
  HomeNewsSpotlight,
  type NewsSpotlightPost,
} from "@/components/home/HomeNewsSpotlight";
import { HomeMenuImageGrid } from "@/components/home/HomeMenuImageGrid";
import { HomeSlider, type HomeSlide } from "@/components/home/HomeSlider";
import { Link } from "@/i18n/navigation";
import {
  getBlogGroupBySlug,
  getBlogPostBySlug,
  getMenuBySlug,
} from "@/lib/cms/client";
import type { EditorTree, PublicBlogPostPage } from "@/lib/cms/types";

/** Public key of the Side Menu edited at /menus/2e1a433e-f36b-1410-8f1d-00cad4184220 */
const HOME_SLIDER_MENU_KEY = "sidemenu";
/** Public key of the bottom topics menu edited at /menus/34cd423e-f36b-1410-8f32-00cad4184220 */
const HOME_BOTTOM_MENU_KEY = "buttommenu";
const HOME_FEATURED_POST_SLUG = "together-we-build-the-future";
const HOME_NEWS_GROUP_SLUG = "news";
const HOME_POLITICS_GROUP_SLUG = "siasat-o-cheshmandaz";

type Props = {
  params: Promise<{ locale: string }>;
};

function plainTextFromHtml(value: string): string {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function excerptFromEditorTree(tree: EditorTree | null): string | null {
  if (!tree) return null;

  const parts: string[] = [];
  for (const container of tree.containers) {
    for (const component of container.components) {
      if (!["text", "html", "quote"].includes(component.type)) continue;
      const data = component.data ?? {};
      const raw = String(data.html ?? data.text ?? "").trim();
      if (!raw) continue;
      const text = plainTextFromHtml(raw);
      if (text) parts.push(text);
    }
  }

  const joined = parts.join(" ").trim();
  return joined.length > 0 ? joined : null;
}

function featuredDescription(post: PublicBlogPostPage): string | null {
  const description = post.description?.trim();
  if (description) return description;
  return excerptFromEditorTree(post.content);
}

function imageFromPost(post: PublicBlogPostPage): string | null {
  if (post.thumbnailUrl) return post.thumbnailUrl;

  for (const container of post.content?.containers ?? []) {
    for (const component of container.components) {
      if (component.type === "image") {
        const fileId = String(component.data?.fileId ?? "");
        const url = fileId ? post.mediaMap[fileId] : null;
        if (url) return url;
      }
      if (component.type === "gallery") {
        const revision = String(component.data?.mediaRevision ?? "");
        const url = revision ? post.mediaMap[revision] : null;
        if (url) return url;
      }
    }
  }

  return Object.values(post.mediaMap)[0] ?? null;
}

async function withPostImages(
  posts: NewsSpotlightPost[],
  locale: string,
): Promise<NewsSpotlightPost[]> {
  return Promise.all(
    posts.map(async (post) => {
      if (post.thumbnailUrl) {
        return { ...post, imageUrl: post.thumbnailUrl };
      }
      const detail = await getBlogPostBySlug(post.slug, locale);
      return {
        ...post,
        imageUrl: detail ? imageFromPost(detail) : null,
      };
    }),
  );
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("BlogGroupPage");
  const tPost = await getTranslations("PostPage");
  const tHome = await getTranslations("HomePage");
  const tA11y = await getTranslations("A11y");
  const dir = locale === "fa" || locale === "ar" ? "rtl" : "ltr";

  const [featuredPost, newsGroup, politicsGroup, sliderMenu, bottomMenu] =
    await Promise.all([
      getBlogPostBySlug(HOME_FEATURED_POST_SLUG, locale),
      getBlogGroupBySlug(HOME_NEWS_GROUP_SLUG, locale),
      getBlogGroupBySlug(HOME_POLITICS_GROUP_SLUG, locale),
      getMenuBySlug(HOME_SLIDER_MENU_KEY, locale),
      getMenuBySlug(HOME_BOTTOM_MENU_KEY, locale),
    ]);

  const slides: HomeSlide[] = sliderMenu
    .filter((item) => item.isActive && item.title.trim().length > 0)
    .map((item) => ({
      id: item.id,
      title: item.title,
      href: item.url,
      imageUrl: item.imageUrl,
    }));

  const featuredSummary = featuredPost ? featuredDescription(featuredPost) : null;
  const featuredImage = featuredPost ? imageFromPost(featuredPost) : null;
  const hasFeaturedPost = Boolean(featuredPost && (featuredSummary || featuredImage));
  const hasPolitics = Boolean(politicsGroup && politicsGroup.posts.length > 0);

  const newsPosts = newsGroup
    ? await withPostImages(newsGroup.posts.slice(0, 4), locale)
    : [];
  const hasNews = newsPosts.length > 0;

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

      {hasNews || hasFeaturedPost ? (
        <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid items-stretch gap-x-8 gap-y-6 lg:grid-cols-4">
            {hasNews && newsGroup ? (
              <div className="mb-0 flex items-end justify-between gap-4 border-b border-zinc-200 pb-3 lg:col-span-3">
                <h2 className="text-2xl font-semibold text-zinc-900">
                  {newsGroup.title}
                </h2>
                <Link
                  href={`/${newsGroup.slug}`}
                  className="shrink-0 text-sm font-medium text-[var(--color-royal-purple)] transition hover:text-[var(--color-royal-purple-deep)]"
                >
                  {tPost("viewAllGroup")}
                </Link>
              </div>
            ) : null}

            {hasNews && newsGroup ? (
              <div
                className={`min-w-0 ${hasFeaturedPost ? "lg:col-span-3 lg:col-start-1 lg:row-start-2" : "lg:col-span-4"}`}
              >
                <HomeNewsSpotlight
                  title={newsGroup.title}
                  groupSlug={newsGroup.slug}
                  posts={newsPosts}
                  viewAllLabel={tPost("viewAllGroup")}
                  emptyImageLabel={t("noPicture")}
                  showHeader={false}
                />
              </div>
            ) : null}

            {hasFeaturedPost && featuredPost ? (
              <div
                className={`min-w-0 lg:col-span-1 ${hasNews ? "lg:col-start-4 lg:row-start-2" : ""}`}
              >
                <article className="flex h-full flex-col overflow-hidden border border-zinc-200 bg-white">
                  {featuredImage ? (
                    <Link
                      href={`/post/${featuredPost.slug}`}
                      className="relative block aspect-[16/10] overflow-hidden bg-zinc-100"
                    >
                      {/* CMS uploads may come from a different API host in local dev. */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={featuredImage}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    </Link>
                  ) : null}
                  <div className="flex flex-1 flex-col gap-4 p-5 sm:p-6">
                    <h2 className="text-xl font-semibold tracking-tight text-zinc-900 sm:text-2xl">
                      {featuredPost.title}
                    </h2>
                    {featuredSummary ? (
                      <p className="text-sm leading-6 text-zinc-600 line-clamp-10 sm:text-base sm:leading-7">
                        {featuredSummary}
                      </p>
                    ) : null}
                    <Link
                      href={`/post/${featuredPost.slug}`}
                      className="mt-auto inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-royal-purple)] transition hover:text-[var(--color-royal-purple-deep)]"
                    >
                      {tHome("showMore")}
                      <svg
                        className="h-3.5 w-3.5 rtl:rotate-180"
                        viewBox="0 0 16 16"
                        fill="none"
                        aria-hidden="true"
                      >
                        <path
                          d="M3 8h9M8.5 4.5 12 8l-3.5 3.5"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </Link>
                  </div>
                </article>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {hasPolitics && politicsGroup ? (
        <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-end justify-between gap-4 border-b border-zinc-200 pb-3">
            <h2 className="text-2xl font-semibold text-zinc-900">
              {politicsGroup.title}
            </h2>
            <Link
              href={`/${politicsGroup.slug}`}
              className="shrink-0 text-sm font-medium text-[var(--color-royal-purple)] transition hover:text-[var(--color-royal-purple-deep)]"
            >
              {tPost("viewAllGroup")}
            </Link>
          </div>

          <PostCarousel
            posts={politicsGroup.posts}
            locale={locale}
            dir={dir}
            readLabel={t("readPost")}
            emptyImageLabel={t("noPicture")}
            showTimestamp={politicsGroup.showTimestamp}
          />
        </section>
      ) : null}

      <HomeMenuImageGrid items={bottomMenu} emptyImageLabel={t("noPicture")} />
    </main>
  );
}
