import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/blog/Breadcrumb";
import {
  EditorContent,
  PostThumbnailCard,
} from "@/components/blog/EditorContent";
import { PostComments } from "@/components/blog/PostComments";
import { Link } from "@/i18n/navigation";
import { getBlogGroupBySlug, getBlogPostBySlug } from "@/lib/cms/client";
import type { PublicBlogGroupPost, PublicBlogPostPage } from "@/lib/cms/types";

const RELATED_POSTS_LIMIT = 8;

async function getRelatedGroupPosts(
  post: PublicBlogPostPage,
  locale: string,
): Promise<PublicBlogGroupPost[]> {
  const seen = new Set<string>([post.id]);
  const related: PublicBlogGroupPost[] = [];

  const groupPages = await Promise.all(
    post.groups.map((group) => getBlogGroupBySlug(group.slug, locale)),
  );

  for (const groupPage of groupPages) {
    if (!groupPage) continue;
    for (const item of groupPage.posts) {
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      related.push(item);
      if (related.length >= RELATED_POSTS_LIMIT) {
        return related;
      }
    }
  }

  return related;
}

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = await getBlogPostBySlug(decodeURIComponent(slug), locale);

  if (!post) {
    return {};
  }

  return {
    title: post.metaTitle || post.title,
    description: post.metaDescription ?? post.description ?? undefined,
    keywords: post.keyword ?? undefined,
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const decodedSlug = decodeURIComponent(slug);
  const post = await getBlogPostBySlug(decodedSlug, locale);

  if (!post) {
    notFound();
  }

  const t = await getTranslations("PostPage");
  const tA11y = await getTranslations("A11y");
  const dateFormatter = new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const primaryGroup = post.groups[0] ?? null;
  const relatedPosts = await getRelatedGroupPosts(post, locale);
  const dateLabel =
    post.showTimestamp && post.createdAt
      ? dateFormatter.format(new Date(post.createdAt))
      : null;

  return (
    <main className="flex w-full flex-1 flex-col">
      <header className="blog-group-hero relative w-full overflow-hidden">
        <div className="blog-group-hero-pattern" aria-hidden="true" />
        <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 pb-16 pt-4 sm:px-6 sm:pb-20 sm:pt-5 lg:px-8 lg:pb-24 lg:pt-6">
          <Breadcrumb
            homeLabel={t("home")}
            items={post.breadcrumb}
            variant="onHero"
            ariaLabel={tA11y("breadcrumb")}
          />
       
          <h1 className="max-w-4xl text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
            {post.title}
          </h1>
          {dateLabel ? (
            <time className="text-sm font-medium tracking-wide text-white/70">
              {dateLabel}
            </time>
          ) : null}
          {post.description ? (
            <p className="max-w-3xl text-base leading-7 text-white/80 sm:text-lg sm:leading-8">
              {post.description}
            </p>
          ) : null}
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
      

        {post.content ? (
          <section className="mb-14">
            <EditorContent tree={post.content} mediaMap={post.mediaMap} />
          </section>
        ) : (
          <p className="mb-14 text-zinc-600">{t("emptyContent")}</p>
        )}

        {post.tags.length > 0 ? (
          <section className="mb-10">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">
              {t("tagsHeading")}
            </h2>
            <ul className="flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <li
                  key={tag.id}
                  className="border border-zinc-200 bg-white px-3 py-1 text-sm text-zinc-700"
                >
                  {tag.title}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {relatedPosts.length > 0 ? (
          <section className="mb-14">
            <div className="mb-6 flex items-end justify-between gap-4 border-b border-zinc-200 pb-3">
              <h2 className="text-2xl font-semibold text-zinc-900">
                {primaryGroup
                  ? t("relatedHeading", { group: primaryGroup.title })
                  : t("relatedHeadingFallback")}
              </h2>
              {primaryGroup ? (
                <Link
                  href={`/${primaryGroup.slug}`}
                  className="shrink-0 text-sm font-medium text-[var(--color-royal-purple)] transition hover:text-[var(--color-royal-purple-deep)]"
                >
                  {t("viewAllGroup")}
                </Link>
              ) : null}
            </div>
            <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {relatedPosts.map((related) => (
                <PostThumbnailCard
                  key={related.id}
                  href={`/post/${related.slug}`}
                  title={related.title}
                  description={related.description}
                  thumbnailUrl={related.thumbnailUrl}
                  emptyImageLabel={t("noPicture")}
                  readLabel={t("readPost")}
                  dateLabel={
                    post.showTimestamp && related.createdAt
                      ? dateFormatter.format(new Date(related.createdAt))
                      : null
                  }
                />
              ))}
            </div>
          </section>
        ) : null}

        <PostComments
          postId={post.id}
          commentsEnabled={post.commentsEnabled}
        />

        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-zinc-200 pt-8">
          {primaryGroup ? (
            <Link
              href={`/${primaryGroup.slug}`}
              className="text-sm font-medium text-[var(--color-royal-purple)] transition hover:text-[var(--color-royal-purple-deep)]"
            >
              ← {t("backToGroup", { group: primaryGroup.title })}
            </Link>
          ) : (
            <Link
              href="/"
              className="text-sm font-medium text-[var(--color-royal-purple)] transition hover:text-[var(--color-royal-purple-deep)]"
            >
              ← {t("backHome")}
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}
