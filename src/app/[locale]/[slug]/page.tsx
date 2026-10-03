import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/blog/Breadcrumb";
import {
  EditorContent,
  PostThumbnailCard,
} from "@/components/blog/EditorContent";
import { Link } from "@/i18n/navigation";
import { getBlogGroupBySlug } from "@/lib/cms/client";

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const group = await getBlogGroupBySlug(decodeURIComponent(slug), locale);

  if (!group) {
    return {};
  }

  return {
    title: group.title,
    description: group.description ?? undefined,
    keywords: group.keyword ?? undefined,
  };
}

export default async function BlogGroupPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const decodedSlug = decodeURIComponent(slug);
  const group = await getBlogGroupBySlug(decodedSlug, locale);

  if (!group) {
    notFound();
  }

  const t = await getTranslations("BlogGroupPage");
  const tA11y = await getTranslations("A11y");
  const dateFormatter = new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <main className="flex w-full flex-1 flex-col">
      <header className="blog-group-hero relative w-full overflow-hidden">
        <div className="blog-group-hero-pattern" aria-hidden="true" />
        <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 pb-16 pt-4 sm:px-6 sm:pb-20 sm:pt-5 lg:px-8 lg:pb-24 lg:pt-6">
          <Breadcrumb
            homeLabel={t("home")}
            items={group.breadcrumb}
            variant="onHero"
            ariaLabel={tA11y("breadcrumb")}
          />
          <h1 className="max-w-4xl text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
            {group.title}
          </h1>
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
              d="M0,78 C160,110 320,58 480,82 C640,106 800,54 960,78 C1120,102 1280,62 1440,86 L1440,120 L0,120 Z"
            />
          </svg>
        </div>
      </header>

      <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        {group.description ? (
          <p className="mb-10 max-w-3xl text-lg leading-8 text-zinc-600">
            {group.description}
          </p>
        ) : null}

        {group.content ? (
          <section className="mb-14">
            <EditorContent tree={group.content} mediaMap={group.mediaMap} />
          </section>
        ) : null}

        <section>
          <div className="mb-6 flex items-end justify-between gap-4 border-b border-zinc-200 pb-3">
            <h2 className="text-2xl font-semibold text-zinc-900">
              {t("postsHeading")}
            </h2>
            <span className="text-sm text-zinc-500">
              {t("postsCount", { count: group.posts.length })}
            </span>
          </div>

          {group.posts.length === 0 ? (
            <p className="text-zinc-600">{t("emptyPosts")}</p>
          ) : (
            <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
              {group.posts.map((post) => (
                <PostThumbnailCard
                  key={post.id}
                  href={`/post/${post.slug}`}
                  title={post.title}
                  description={post.description}
                  thumbnailUrl={post.thumbnailUrl}
                  emptyImageLabel={t("noPicture")}
                  readLabel={t("readPost")}
                  dateLabel={
                    post.createdAt
                      ? dateFormatter.format(new Date(post.createdAt))
                      : null
                  }
                />
              ))}
            </div>
          )}
        </section>

        <div className="mt-12">
          <Link
            href="/"
            className="text-sm font-medium text-[var(--color-royal-purple)] transition hover:text-[var(--color-royal-purple-deep)]"
          >
            ← {t("backHome")}
          </Link>
        </div>
      </div>
    </main>
  );
}
