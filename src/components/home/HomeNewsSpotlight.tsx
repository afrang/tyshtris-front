import { Link } from "@/i18n/navigation";
import type { PublicBlogGroupPost } from "@/lib/cms/types";

export type NewsSpotlightPost = PublicBlogGroupPost & {
  imageUrl?: string | null;
};

type Props = {
  title: string;
  groupSlug: string;
  posts: NewsSpotlightPost[];
  viewAllLabel: string;
  emptyImageLabel: string;
  /** When false, caller renders the section title (keeps sidebar tops aligned). */
  showHeader?: boolean;
};

function Thumb({
  url,
  emptyLabel,
  className = "",
}: {
  url: string | null | undefined;
  emptyLabel: string;
  className?: string;
}) {
  if (url) {
    return (
      // CMS uploads may come from a different API host in local dev.
      // eslint-disable-next-line @next/next/no-img-element
      <img src={url} alt="" className={`h-full w-full object-cover ${className}`} />
    );
  }

  return (
    <div
      className={`flex h-full w-full items-center justify-center bg-zinc-200 text-[0.65rem] font-medium tracking-[0.08em] text-zinc-500 uppercase ${className}`}
      role="img"
      aria-label={emptyLabel}
    >
      {emptyLabel}
    </div>
  );
}

export function HomeNewsSpotlight({
  title,
  groupSlug,
  posts,
  viewAllLabel,
  emptyImageLabel,
  showHeader = true,
}: Props) {
  if (posts.length === 0) return null;

  // Prefer a post with an image for the large panel so the block never looks empty.
  const ranked = [...posts].sort((a, b) => {
    const score = (post: NewsSpotlightPost) =>
      post.imageUrl || post.thumbnailUrl ? 1 : 0;
    return score(b) - score(a);
  });
  const [featured, ...rest] = ranked;
  const sidePosts = rest.slice(0, 3);
  const featuredImage = featured.imageUrl ?? featured.thumbnailUrl;

  return (
    <div className="flex h-full min-w-0 flex-col">
      {showHeader ? (
        <div className="mb-6 flex items-end justify-between gap-4 border-b border-zinc-200 pb-3">
          <h2 className="text-2xl font-semibold text-zinc-900">{title}</h2>
          <Link
            href={`/${groupSlug}`}
            className="shrink-0 text-sm font-medium text-[var(--color-royal-purple)] transition hover:text-[var(--color-royal-purple-deep)]"
          >
            {viewAllLabel}
          </Link>
        </div>
      ) : null}

      <div className="grid min-h-0 flex-1 items-stretch gap-5 lg:grid-cols-3 lg:gap-6">
        <div className="flex min-w-0 flex-col gap-3 lg:col-span-1">
          {sidePosts.map((post) => {
            const image = post.imageUrl ?? post.thumbnailUrl;
            return (
              <Link
                key={post.id}
                href={`/post/${post.slug}`}
                className="group flex items-center gap-3 border border-zinc-200 bg-white p-2.5 outline-none transition hover:border-[var(--color-royal-purple)]/30 focus-visible:border-[var(--color-royal-purple)]/40"
              >
                <div className="h-16 w-20 shrink-0 overflow-hidden bg-zinc-100 sm:h-[4.5rem] sm:w-24">
                  <Thumb
                    url={image}
                    emptyLabel={emptyImageLabel}
                    className="transition duration-500 group-hover:scale-[1.03]"
                  />
                </div>
                <h3 className="min-w-0 flex-1 text-sm font-semibold leading-snug text-zinc-900 transition group-hover:text-[var(--color-royal-purple)] sm:text-base">
                  {post.title}
                </h3>
              </Link>
            );
          })}
        </div>

        <Link
          href={`/post/${featured.slug}`}
          className="group relative flex min-h-[20rem] overflow-hidden border border-zinc-200 bg-zinc-900 outline-none lg:col-span-2 lg:min-h-0 lg:h-full"
        >
          {featuredImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={featuredImage}
              alt=""
              className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="absolute inset-0 bg-zinc-800" aria-hidden="true" />
          )}
          <div
            className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent"
            aria-hidden="true"
          />
          <div className="relative mt-auto w-full p-5 sm:p-7">
            <h3 className="max-w-xl text-2xl font-semibold tracking-tight text-white sm:text-3xl lg:text-4xl">
              {featured.title}
            </h3>
          </div>
        </Link>
      </div>
    </div>
  );
}
