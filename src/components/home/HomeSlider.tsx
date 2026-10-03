"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";

export type HomeSlide = {
  id: string;
  title: string;
  href: string;
  imageUrl: string | null;
};

type Props = {
  slides: HomeSlide[];
  label: string;
  previousLabel: string;
  nextLabel: string;
  goToSlideLabel: string;
};

const AUTOPLAY_MS = 7000;

function formatLabel(template: string, n: number) {
  return template.replaceAll("{n}", String(n));
}

function SlideLink({
  href,
  className,
  children,
}: {
  href: string;
  className: string;
  children: React.ReactNode;
}) {
  const external = href.startsWith("http://") || href.startsWith("https://");
  if (external) {
    return (
      <a href={href} className={className} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    );
  }

  const normalized = !href || href === "#" ? "/" : href.startsWith("/") ? href : `/${href}`;
  return (
    <Link href={normalized} className={className}>
      {children}
    </Link>
  );
}

export function HomeSlider({
  slides,
  label,
  previousLabel,
  nextLabel,
  goToSlideLabel,
}: Props) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [motionOk, setMotionOk] = useState(false);
  const count = slides.length;
  const safeIndex = count === 0 ? 0 : index % count;
  const current = slides[safeIndex];

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setMotionOk(!media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!motionOk || paused || count < 2) return;
    const timer = window.setInterval(() => {
      setIndex((value) => (value + 1) % count);
    }, AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [motionOk, paused, count, safeIndex]);

  if (!current) return null;

  function go(next: number) {
    if (count === 0) return;
    setIndex((next + count) % count);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLElement>) {
    if (count < 2) return;
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    const rtl = document.documentElement.dir === "rtl" ? -1 : 1;
    const step = event.key === "ArrowRight" ? rtl : -rtl;
    go(safeIndex + step);
  }

  return (
    <section
      className={`home-slider${paused ? " is-paused" : ""}`}
      aria-roledescription="carousel"
      aria-label={label}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setPaused(false);
        }
      }}
      onKeyDown={onKeyDown}
    >
      <div className="home-slider-stage">
        {slides.map((slide, slideIndex) => {
          const active = slideIndex === safeIndex;
          return (
            <div
              key={slide.id}
              className={`home-slider-slide${active ? " is-active" : ""}`}
              aria-hidden={!active}
            >
              {slide.imageUrl ? (
                // CMS uploads may come from different API hosts in local dev.
                // eslint-disable-next-line @next/next/no-img-element
                <img src={slide.imageUrl} alt="" draggable={false} />
              ) : (
                <div className="home-slider-fallback" />
              )}
            </div>
          );
        })}
        <div className="home-slider-shade" aria-hidden="true" />
      </div>

      <SlideLink href={current.href} className="home-slider-link">
        <span className="home-slider-panel">
          <span className="home-slider-title">{current.title}</span>
        </span>
      </SlideLink>

      {count > 1 ? (
        <>
          <button
            type="button"
            className="home-slider-nav home-slider-nav--prev"
            aria-label={previousLabel}
            onClick={() => go(safeIndex - 1)}
          >
            <svg viewBox="0 0 16 16" aria-hidden="true">
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
            className="home-slider-nav home-slider-nav--next"
            aria-label={nextLabel}
            onClick={() => go(safeIndex + 1)}
          >
            <svg viewBox="0 0 16 16" aria-hidden="true">
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
          <div className="home-slider-dots" role="group" aria-label={label}>
            {slides.map((slide, slideIndex) => {
              const active = slideIndex === safeIndex;
              return (
                <button
                  key={slide.id}
                  type="button"
                  className={`home-slider-dot${active ? " is-active" : ""}`}
                  aria-label={formatLabel(goToSlideLabel, slideIndex + 1)}
                  aria-current={active ? "true" : undefined}
                  onClick={() => go(slideIndex)}
                />
              );
            })}
          </div>
          {motionOk ? (
            <div className="home-slider-progress" aria-hidden="true">
              <span key={safeIndex} />
            </div>
          ) : null}
        </>
      ) : null}

      <div className="home-slider-tricolor" aria-hidden="true" />
    </section>
  );
}
