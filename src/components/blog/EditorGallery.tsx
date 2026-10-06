"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type PointerEvent as ReactPointerEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import {
  parseGallerySettings,
  type ParsedGallerySettings,
} from "@/lib/cms/gallerySettings";
import { playbackKindFromUrl } from "@/lib/cms/mediaKind";

type Props = {
  urls: string[];
  data?: Record<string, unknown> | null;
  options?: Record<string, unknown> | null;
};

function subscribeNoop() {
  return () => {};
}

function GalleryImage({ url }: { url: string }) {
  const kind = playbackKindFromUrl(url);

  if (kind === "video") {
    return (
      <div className="editor-gallery-frame">
        <video src={url} controls className="editor-gallery-image" />
      </div>
    );
  }

  if (kind === "audio") {
    return (
      <div className="editor-gallery-frame editor-gallery-frame--audio">
        <audio src={url} controls className="editor-media-audio" />
      </div>
    );
  }

  return (
    <div className="editor-gallery-frame">
      {/* CMS uploads may come from different API hosts/ports in local dev. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt="" className="editor-gallery-image" draggable={false} />
    </div>
  );
}

function GalleryLightbox({
  urls,
  index,
  onClose,
  onChange,
}: {
  urls: string[];
  index: number;
  onClose: () => void;
  onChange: (index: number) => void;
}) {
  const t = useTranslations("A11y");
  const dialogRef = useRef<HTMLDivElement>(null);
  const mounted = useSyncExternalStore(subscribeNoop, () => true, () => false);
  const count = urls.length;
  const safeIndex = ((index % count) + count) % count;

  const go = useCallback(
    (delta: number) => {
      onChange((((safeIndex + delta) % count) + count) % count);
    },
    [count, onChange, safeIndex],
  );

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        go(-1);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        go(1);
      } else if (event.key === "Home") {
        event.preventDefault();
        onChange(0);
      } else if (event.key === "End") {
        event.preventDefault();
        onChange(count - 1);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [count, go, onChange, onClose]);

  const dragStartX = useRef(0);
  const pointerId = useRef<number | null>(null);

  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (count <= 1 || event.button !== 0) return;
    pointerId.current = event.pointerId;
    dragStartX.current = event.clientX;
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function endDrag(event: ReactPointerEvent<HTMLDivElement>) {
    if (pointerId.current !== event.pointerId) return;
    const delta = event.clientX - dragStartX.current;
    if (delta > 60) go(-1);
    else if (delta < -60) go(1);
    pointerId.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  if (!mounted) return null;

  return createPortal(
    <div
      ref={dialogRef}
      className="editor-gallery-lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={t("fullscreenGallery")}
      tabIndex={-1}
      onClick={onClose}
    >
      <button
        type="button"
        className="editor-gallery-lightbox-close"
        aria-label={t("close")}
        onClick={onClose}
      >
        <svg viewBox="0 0 16 16" className="h-4 w-4" aria-hidden="true">
          <path
            d="M4 4l8 8M12 4l-8 8"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
          />
        </svg>
      </button>

      {count > 1 ? (
        <>
          <button
            type="button"
            className="editor-gallery-lightbox-nav editor-gallery-lightbox-nav--prev"
            aria-label={t("previousImage")}
            onClick={(event) => {
              event.stopPropagation();
              go(-1);
            }}
          >
            <svg viewBox="0 0 16 16" className="h-5 w-5" aria-hidden="true">
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
            className="editor-gallery-lightbox-nav editor-gallery-lightbox-nav--next"
            aria-label={t("nextImage")}
            onClick={(event) => {
              event.stopPropagation();
              go(1);
            }}
          >
            <svg viewBox="0 0 16 16" className="h-5 w-5" aria-hidden="true">
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

      <div
        className="editor-gallery-lightbox-stage"
        onClick={(event) => event.stopPropagation()}
        onPointerDown={onPointerDown}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={urls[safeIndex]}
          src={urls[safeIndex]}
          alt=""
          className="editor-gallery-lightbox-image"
          draggable={false}
        />
      </div>

      {count > 1 ? (
        <p className="editor-gallery-lightbox-status" aria-live="polite">
          {safeIndex + 1} / {count}
        </p>
      ) : null}
    </div>,
    document.body,
  );
}

function GridGallery({
  urls,
  settings,
}: {
  urls: string[];
  settings: ParsedGallerySettings;
}) {
  const t = useTranslations("A11y");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  return (
    <>
      <div
        className="editor-gallery editor-gallery--grid"
        style={{
          gap: settings.gap,
          gridTemplateColumns: `repeat(${settings.columns}, minmax(0, 1fr))`,
        }}
      >
        {urls.map((url, index) =>
          playbackKindFromUrl(url) === "image" ? (
            <button
              key={url}
              type="button"
              className="editor-gallery-item"
              aria-label={t("openImageFullscreen", { n: index + 1 })}
              onClick={() => setLightboxIndex(index)}
            >
              <GalleryImage url={url} />
            </button>
          ) : (
            <div key={url} className="min-w-0">
              <GalleryImage url={url} />
            </div>
          ),
        )}
      </div>

      {lightboxIndex !== null ? (
        <GalleryLightbox
          urls={urls}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onChange={setLightboxIndex}
        />
      ) : null}
    </>
  );
}

function CarouselGallery({
  urls,
  settings,
}: {
  urls: string[];
  settings: ParsedGallerySettings;
}) {
  const t = useTranslations("A11y");
  const perSlide = settings.slidesPerView;
  const pages = (() => {
    const chunks: string[][] = [];
    for (let i = 0; i < urls.length; i += perSlide) {
      chunks.push(urls.slice(i, i + perSlide));
    }
    return chunks;
  })();
  const pageCount = Math.max(1, pages.length);

  const [page, setPage] = useState(0);
  const [dragPercent, setDragPercent] = useState(0);
  const [dragging, setDragging] = useState(false);
  const dragStartX = useRef(0);
  const dragStartPage = useRef(0);
  const pointerId = useRef<number | null>(null);
  const labelId = useId();
  const safePage = Math.min(page, pageCount - 1);

  const goTo = useCallback(
    (next: number) => {
      const wrapped = ((next % pageCount) + pageCount) % pageCount;
      setPage(wrapped);
    },
    [pageCount],
  );

  const go = useCallback(
    (delta: number) => {
      goTo(safePage + delta);
    },
    [goTo, safePage],
  );

  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (pageCount <= 1 || event.button !== 0) return;
    pointerId.current = event.pointerId;
    dragStartX.current = event.clientX;
    dragStartPage.current = safePage;
    setDragging(true);
    setDragPercent(0);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!dragging || pointerId.current !== event.pointerId) return;
    const width = event.currentTarget.clientWidth;
    if (width <= 0) return;
    setDragPercent(((event.clientX - dragStartX.current) / width) * 100);
  }

  function endDrag(event: ReactPointerEvent<HTMLDivElement>) {
    if (!dragging || pointerId.current !== event.pointerId) return;
    const width = event.currentTarget.clientWidth || 1;
    const threshold = Math.min(80, width * 0.18);
    const delta = event.clientX - dragStartX.current;

    if (delta > threshold) go(-1);
    else if (delta < -threshold) go(1);
    else setPage(dragStartPage.current);

    setDragging(false);
    setDragPercent(0);
    pointerId.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function onKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (pageCount <= 1) return;
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      go(-1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      go(1);
    } else if (event.key === "Home") {
      event.preventDefault();
      goTo(0);
    } else if (event.key === "End") {
      event.preventDefault();
      goTo(pageCount - 1);
    }
  }

  const trackStyle = {
    transform: `translate3d(calc(${-safePage * 100}% + ${dragging ? dragPercent : 0}%), 0, 0)`,
    transition: dragging ? "none" : undefined,
  } as const;

  return (
    <div
      className="editor-gallery editor-gallery--carousel"
      role="region"
      aria-roledescription="carousel"
      aria-labelledby={labelId}
    >
      <span id={labelId} className="sr-only">
        Image gallery
      </span>

      <div className="editor-gallery-viewport-wrap">
        <div
          className={`editor-gallery-viewport${dragging ? " is-dragging" : ""}`}
          tabIndex={0}
          aria-live="polite"
          onKeyDown={onKeyDown}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          <div className="editor-gallery-track" style={trackStyle}>
            {pages.map((chunk, pageIndex) => (
              <div
                key={pageIndex}
                className="editor-gallery-page"
                style={{
                  gap: settings.gap,
                  gridTemplateColumns: `repeat(${perSlide}, minmax(0, 1fr))`,
                }}
                aria-hidden={pageIndex !== safePage}
              >
                {chunk.map((url) => (
                  <div key={url} className="min-w-0">
                    <GalleryImage url={url} />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {settings.showArrows && pageCount > 1 ? (
          <>
            <button
              type="button"
              className="editor-gallery-nav editor-gallery-nav--prev"
              aria-label={t("previousSlide")}
              onClick={() => go(-1)}
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
              className="editor-gallery-nav editor-gallery-nav--next"
              aria-label={t("nextSlide")}
              onClick={() => go(1)}
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

      {settings.showDots && pageCount > 1 ? (
        <div
          className="editor-gallery-dots"
          role="tablist"
          aria-label={t("gallerySlides")}
        >
          {pages.map((_, index) => (
            <button
              key={index}
              type="button"
              role="tab"
              className={`editor-gallery-dot${index === safePage ? " is-active" : ""}`}
              aria-label={t("goToSlide", { n: index + 1 })}
              aria-selected={index === safePage}
              onClick={() => goTo(index)}
            />
          ))}
        </div>
      ) : null}

      {pageCount > 1 ? (
        <p className="editor-gallery-status" aria-live="polite">
          {safePage + 1} / {pageCount}
        </p>
      ) : null}
    </div>
  );
}

export function EditorGallery({ urls, data, options }: Props) {
  const settings = parseGallerySettings(data, options);

  if (urls.length === 0) return null;

  if (settings.layout === "carousel") {
    return <CarouselGallery urls={urls} settings={settings} />;
  }

  return <GridGallery urls={urls} settings={settings} />;
}
