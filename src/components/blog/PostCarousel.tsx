"use client";

import { useRef } from "react";
import { PostThumbnailCard } from "./EditorContent";

export type PostCarouselItem = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  createdAt: string;
  thumbnailUrl: string | null;
};

type Props = {
  posts: PostCarouselItem[];
  locale: string;
  dir?: "ltr" | "rtl";
  readLabel: string;
  emptyImageLabel: string;
};

export function PostCarousel({
  posts,
  locale,
  dir = "ltr",
  readLabel,
  emptyImageLabel,
}: Props) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const dateFormatter = new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  function scrollByDir(delta: 1 | -1) {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const amount = Math.max(260, viewport.clientWidth * 0.75);
    // In RTL, scrolling toward the end means negative scrollLeft.
    const rtlFactor = dir === "rtl" ? -1 : 1;
    viewport.scrollBy({ left: amount * delta * rtlFactor, behavior: "smooth" });
  }

  if (posts.length === 0) return null;

  return (
    <div className="post-carousel" dir={dir}>
      <div className="post-carousel-viewport" ref={viewportRef}>
        {posts.map((post) => (
          <article className="post-carousel-slide" key={post.id}>
            <PostThumbnailCard
              href={`/post/${post.slug}`}
              title={post.title}
              description={post.description}
              thumbnailUrl={post.thumbnailUrl}
              emptyImageLabel={emptyImageLabel}
              readLabel={readLabel}
              dateLabel={
                post.createdAt ? dateFormatter.format(new Date(post.createdAt)) : null
              }
            />
          </article>
        ))}
      </div>

      {posts.length > 1 ? (
        <>
          <button
            type="button"
            className="post-carousel-nav post-carousel-nav--prev"
            aria-label="Previous posts"
            onClick={() => scrollByDir(-1)}
          >
            <svg viewBox="0 0 16 16" className="h-4 w-4" aria-hidden="true">
              <path
                d="M10 3.5 5.5 8 10 12.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button
            type="button"
            className="post-carousel-nav post-carousel-nav--next"
            aria-label="Next posts"
            onClick={() => scrollByDir(1)}
          >
            <svg viewBox="0 0 16 16" className="h-4 w-4" aria-hidden="true">
              <path
                d="M6 3.5 10.5 8 6 12.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </>
      ) : null}
    </div>
  );
}
