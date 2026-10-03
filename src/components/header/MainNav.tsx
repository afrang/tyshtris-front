"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { Link, usePathname } from "@/i18n/navigation";
import type { MenuItemWithMega, MegaMenuPost } from "@/lib/cms/types";

type Props = {
  locale: string;
  siteName: string;
  siteTitle: string;
  logoUrl: string | null;
  menu: MenuItemWithMega[];
  menuLabel: string;
  closeMenuLabel: string;
  moreLabel: string;
  registerLabel: string;
  donateLabel: string;
};

function menuHref(url: string): string {
  if (!url || url === "#") return "/";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return url.startsWith("/") ? url : `/${url}`;
}

function isActivePath(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function itemIsActive(item: MenuItemWithMega, pathname: string): boolean {
  if (isActivePath(pathname, menuHref(item.url))) return true;
  return item.children.some((child) => itemIsActive(child, pathname));
}

export function MainNav({
  locale,
  siteName,
  siteTitle,
  logoUrl,
  menu,
  menuLabel,
  closeMenuLabel,
  moreLabel,
  registerLabel,
  donateLabel,
}: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const titleParts = splitBrandTitle(siteTitle || siteName);
  const navId = useId();

  useEffect(() => {
    if (!mobileOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false);
    };

    const onResize = () => {
      if (window.innerWidth >= 1024) setMobileOpen(false);
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onResize);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", onResize);
    };
  }, [mobileOpen]);

  return (
    <div className="relative border-b border-white/10 bg-[#2a153b]/[0.97] text-white backdrop-blur-xl">
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-[linear-gradient(90deg,transparent,rgba(201,162,39,0.65),transparent)]" aria-hidden />
      <div className="mx-auto relative flex min-h-[3.75rem] max-w-7xl items-center justify-between gap-3 px-4 py-2 sm:px-6">
        <Link
          href="/"
          className="group flex min-w-0 items-center gap-2.5 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-gold)] sm:gap-3"
        >
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt={siteName}
              width={44}
              height={44}
              className="h-10 w-10 rounded-full object-cover ring-2 ring-[var(--color-gold)]/70 shadow-[0_0_0_4px_rgba(255,255,255,0.06)] transition group-hover:ring-[var(--color-gold)] sm:h-11 sm:w-11"
              unoptimized
              priority
            />
          ) : (
            <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-gold)]/60 bg-white/10 text-sm font-bold tracking-wide text-[var(--color-gold)] shadow-[0_0_0_4px_rgba(255,255,255,0.05)] sm:h-11 sm:w-11">
              {siteName.slice(0, 1).toUpperCase()}
            </span>
          )}
          <span className="min-w-0">
            <span className="block truncate font-[family-name:var(--font-brand)] text-[1.05rem] font-semibold leading-tight tracking-wide text-white sm:text-xl">
              {titleParts.before}
              {titleParts.middle ? (
                <>
                  {" "}
                  <em className="italic font-normal">{titleParts.middle}</em>{" "}
                </>
              ) : null}
              {titleParts.after}
            </span>
            <span className="mt-1 block h-0.5 w-9 rounded-full bg-[var(--color-gold)]/80 transition-all duration-300 group-hover:w-14" aria-hidden />
          </span>
        </Link>

        <div className="flex shrink-0 items-center gap-2 sm:gap-2.5">
          <Link
            href="/donate"
            className="hidden sm:inline-flex h-9 items-center justify-center rounded-full bg-[var(--color-gold)] px-3.5 text-[12px] font-bold text-[var(--color-gold-text)] shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_7px_18px_-10px_rgba(201,162,39,0.92)] transition hover:-translate-y-0.5 hover:bg-[#d8b33d] hover:shadow-[0_9px_22px_-11px_rgba(201,162,39,0.98)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-gold)]"
          >
            {donateLabel}
          </Link>
          <Link
            href="/register"
            className="inline-flex h-9 items-center justify-center rounded-full bg-[linear-gradient(135deg,#e6c98d_0%,#c9a45c_100%)] px-3.5 text-[12px] font-bold text-[#1a1208] shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_6px_16px_-10px_rgba(201,162,39,0.95)] transition hover:-translate-y-0.5 hover:shadow-[0_8px_20px_-10px_rgba(201,162,39,1)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-gold)]"
          >
            {registerLabel}
          </Link>
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] text-white transition hover:border-white/20 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-gold)] lg:hidden"
            aria-label={mobileOpen ? closeMenuLabel : menuLabel}
            aria-expanded={mobileOpen}
            aria-controls={navId}
            onClick={() => setMobileOpen((value) => !value)}
          >
            {mobileOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>

      <div className="relative hidden border-t border-white/10 bg-[#22112f]/[0.72] lg:block">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <DesktopNavBar
            menu={menu}
            pathname={pathname}
            locale={locale}
            menuLabel={menuLabel}
            moreLabel={moreLabel}
          />
        </div>
      </div>

      <div
        className={`absolute inset-x-0 top-full z-30 grid shadow-[0_22px_45px_-24px_rgba(16,6,25,0.8)] lg:hidden ${
          mobileOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        } transition-[grid-template-rows] duration-200 ease-out`}
      >
        <div className="overflow-hidden">
          <nav
            id={navId}
            className="max-h-[calc(100svh-7rem)] overflow-y-auto border-t border-white/10 bg-[#241332]/[0.98] px-4 py-4 backdrop-blur-xl sm:px-6"
            aria-label={menuLabel}
            aria-hidden={!mobileOpen}
            inert={!mobileOpen}
          >
            <ul className="flex flex-col gap-1">
              {menu.map((item) => (
                <MobileNavItem
                  key={item.id}
                  item={item}
                  pathname={pathname}
                  onNavigate={() => setMobileOpen(false)}
                />
              ))}
            </ul>
            <Link
              href="/donate"
              onClick={() => setMobileOpen(false)}
              className="mt-3 inline-flex h-11 w-full items-center justify-center rounded-full bg-[var(--color-gold)] px-4 text-sm font-bold text-[var(--color-gold-text)] sm:hidden"
            >
              {donateLabel}
            </Link>
          </nav>
        </div>
      </div>
    </div>
  );
}

function navLinkClass(active: boolean): string {
  return `relative inline-flex min-h-10 shrink-0 items-center gap-1 whitespace-nowrap rounded-md px-2.5 py-2 text-[13px] font-semibold leading-none transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-gold)] after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:origin-center after:rounded-full after:bg-[var(--color-gold)] after:transition-transform ${
    active
      ? "bg-white/[0.08] text-white after:scale-x-100"
      : "text-white/80 after:scale-x-0 hover:bg-white/[0.06] hover:text-white hover:after:scale-x-100"
  }`;
}

function DesktopNavBar({
  menu,
  pathname,
  locale,
  menuLabel,
  moreLabel,
}: {
  menu: MenuItemWithMega[];
  pathname: string;
  locale: string;
  menuLabel: string;
  moreLabel: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const moreMeasureRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(menu.length);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const measure = measureRef.current;
    if (!container || !measure) return;

    const update = () => {
      const items = Array.from(measure.querySelectorAll<HTMLElement>("[data-nav-measure]"));
      const available = container.clientWidth;
      const moreWidth = moreMeasureRef.current?.offsetWidth ?? 88;
      const gap = 12;
      const safety = 8;
      const widths = items.map((el) => el.offsetWidth);
      const packed =
        widths.reduce((sum, width) => sum + width, 0) +
        gap * Math.max(0, widths.length - 1);

      if (packed + safety <= available) {
        setVisibleCount(menu.length);
        return;
      }

      let used = 0;
      let count = 0;
      for (let i = 0; i < widths.length; i++) {
        const extra = count > 0 ? gap : 0;
        if (used + extra + widths[i] + gap + moreWidth + safety > available) break;
        used += extra + widths[i];
        count += 1;
      }
      setVisibleCount(Math.max(1, count));
    };

    const observer = new ResizeObserver(update);
    observer.observe(container);
    update();
    return () => observer.disconnect();
  }, [menu]);

  const visible = menu.slice(0, visibleCount);
  const overflow = menu.slice(visibleCount);

  return (
    <nav aria-label={menuLabel}>
      <div
        ref={measureRef}
        className="pointer-events-none invisible absolute flex h-0 overflow-hidden whitespace-nowrap"
        aria-hidden
      >
        {menu.map((item) => (
          <div key={item.id} data-nav-measure className="shrink-0">
            <span className={navLinkClass(false)}>
              {item.title}
              {item.children.length > 0 || item.isMegaGroup || (item.megaPosts && item.megaPosts.length > 0) ? (
                <ChevronIcon />
              ) : null}
            </span>
          </div>
        ))}
        <div ref={moreMeasureRef} className="shrink-0">
          <span className={navLinkClass(false)}>
            {moreLabel}
            <ChevronIcon />
          </span>
        </div>
      </div>

      <div
        ref={containerRef}
        className="flex min-h-11 w-full items-stretch justify-between gap-1"
      >
        {visible.map((item, index) => (
          <DesktopNavItem
            key={item.id}
            item={item}
            pathname={pathname}
            locale={locale}
            isLast={overflow.length === 0 && index === visible.length - 1}
          />
        ))}
        {overflow.length > 0 ? (
          <MoreNavMenu
            items={overflow}
            pathname={pathname}
            moreLabel={moreLabel}
          />
        ) : null}
      </div>
    </nav>
  );
}

function MoreNavMenu({
  items,
  pathname,
  moreLabel,
}: {
  items: MenuItemWithMega[];
  pathname: string;
  moreLabel: string;
}) {
  const overflowActive = items.some((item) => itemIsActive(item, pathname));

  return (
    <div className="group relative shrink-0">
      <button type="button" className={navLinkClass(overflowActive)} aria-haspopup="true">
        {moreLabel}
        <ChevronIcon />
      </button>
      <ul className="invisible absolute top-full end-0 z-30 -mt-1 min-w-[16.5rem] translate-y-1 rounded-xl border border-zinc-200/80 bg-white p-1.5 opacity-0 shadow-[0_20px_45px_-15px_rgba(20,8,34,0.42)] transition duration-150 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
        <span className="absolute -top-3 inset-x-0 block h-3" aria-hidden />
        {items.map((item) => {
          const href = menuHref(item.url);
          const external = href.startsWith("http");
          const active = itemIsActive(item, pathname);
          const className = `block min-h-10 rounded-lg px-3 py-2.5 text-sm transition ${
            active
              ? "bg-[color-mix(in_srgb,var(--color-royal-purple)_10%,transparent)] font-medium text-[var(--color-royal-purple)]"
              : "text-zinc-700 hover:bg-zinc-100/80 hover:text-[var(--color-royal-purple)]"
          }`;

          return (
            <li key={item.id}>
              {external ? (
                <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
                  {item.title}
                </a>
              ) : (
                <Link href={href} className={className} aria-current={active ? "page" : undefined}>
                  {item.title}
                </Link>
              )}
              {item.children.length > 0 ? (
                <ul className="mb-1 ms-2 border-s border-zinc-200 ps-2">
                  {item.children.map((child) => {
                    const childHref = menuHref(child.url);
                    const childExternal = childHref.startsWith("http");
                    const childActive = itemIsActive(child, pathname);
                    const childClassName = `block min-h-9 rounded-lg px-2.5 py-2 text-[13px] transition ${
                      childActive
                        ? "bg-[color-mix(in_srgb,var(--color-royal-purple)_10%,transparent)] font-medium text-[var(--color-royal-purple)]"
                        : "text-zinc-600 hover:bg-zinc-100/80 hover:text-[var(--color-royal-purple)]"
                    }`;

                    return (
                      <li key={child.id}>
                        {childExternal ? (
                          <a
                            href={childHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={childClassName}
                          >
                            {child.title}
                          </a>
                        ) : (
                          <Link
                            href={childHref}
                            className={childClassName}
                            aria-current={childActive ? "page" : undefined}
                          >
                            {child.title}
                          </Link>
                        )}
                      </li>
                    );
                  })}
                </ul>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function DesktopNavItem({
  item,
  pathname,
  locale,
  isLast = false,
}: {
  item: MenuItemWithMega;
  pathname: string;
  locale: string;
  isLast?: boolean;
}) {
  const t = useTranslations("Header");
  const href = menuHref(item.url);
  const external = href.startsWith("http");
  const hasChildren = item.children.length > 0;
  const hasMegaPosts = item.megaPosts && item.megaPosts.length > 0;
  const showMegaPanel = Boolean(item.isMegaGroup) || hasMegaPosts;
  const active = itemIsActive(item, pathname);
  const linkClassName = navLinkClass(active);

  if (!hasChildren && !showMegaPanel) {
    if (external) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={linkClassName}
        >
          {item.title}
        </a>
      );
    }

    return (
      <Link href={href} className={linkClassName} aria-current={active ? "page" : undefined}>
        {item.title}
      </Link>
    );
  }

  if (showMegaPanel) {
    const anchorClasses =
      "left-1/2 -translate-x-1/2 max-w-[min(960px,calc(100vw-2rem))] sm:max-w-[min(960px,calc(100%-2rem))]";

    return (
      <div className="group shrink-0">
        {external ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={linkClassName}
          >
            {item.title}
            <ChevronIcon />
          </a>
        ) : (
          <Link href={href} className={linkClassName} aria-current={active ? "page" : undefined}>
            {item.title}
            <ChevronIcon />
          </Link>
        )}

        <div className={`invisible absolute top-full z-20 -mt-1 w-full translate-y-1 rounded-xl border border-zinc-200/80 bg-white p-4 sm:p-5 opacity-0 shadow-2xl backdrop-blur-2xl transition duration-150 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 ${anchorClasses}`}>
          <div className="absolute -top-3 inset-x-0 h-3" aria-hidden />
          <div className="mb-3 sm:mb-4 flex items-center justify-between gap-3">
            <p className="text-sm font-bold text-zinc-900">
              {t("megaLatestPosts", { group: item.megaGroupTitle ?? item.title })}
            </p>
            <Link
              href={href}
              className="inline-flex h-8 items-center rounded-full border border-zinc-200 bg-zinc-50 px-3 text-[12px] font-semibold text-zinc-700 transition hover:border-[var(--color-royal-purple)]/40 hover:bg-[color-mix(in_srgb,var(--color-royal-purple)_8%,transparent)] hover:text-[var(--color-royal-purple)]"
            >
              {t("megaViewAll")}
            </Link>
          </div>

          {hasChildren ? (
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_220px] gap-4 sm:gap-5">
              <div>
                {hasMegaPosts ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                    {item.megaPosts!.map((post) => (
                      <MegaPostCard key={post.id} post={post} />
                    ))}
                  </div>
                ) : (
                  <MegaEmptyState groupTitle={item.megaGroupTitle ?? item.title} />
                )}
              </div>
              <div className="border-t border-zinc-200 pt-4 sm:border-t-0 sm:border-s sm:pt-0 sm:ps-5">
                <p className="mb-2 text-[12px] font-bold uppercase tracking-wider text-zinc-500">
                  {t("megaExplore")}
                </p>
                <ul className="flex flex-col gap-0.5">
                  {item.children.map((child) => {
                    const childHref = menuHref(child.url);
                    const childExternal = childHref.startsWith("http");
                    const childActive = itemIsActive(child, pathname);
                    const childClassName = `block min-h-9 rounded-lg px-2.5 py-2 text-[13px] transition ${
                      childActive
                        ? "bg-[color-mix(in_srgb,var(--color-royal-purple)_10%,transparent)] font-medium text-[var(--color-royal-purple)]"
                        : "text-zinc-700 hover:bg-zinc-100/80 hover:text-[var(--color-royal-purple)]"
                    }`;
                    return (
                      <li key={child.id}>
                        {childExternal ? (
                          <a
                            href={childHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={childClassName}
                          >
                            {child.title}
                          </a>
                        ) : (
                          <Link
                            href={childHref}
                            className={childClassName}
                            aria-current={childActive ? "page" : undefined}
                          >
                            {child.title}
                          </Link>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          ) : hasMegaPosts ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
              {item.megaPosts!.map((post) => (
                <MegaPostCard key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <MegaEmptyState groupTitle={item.megaGroupTitle ?? item.title} />
          )}

          <div className="mt-4 flex justify-end">
            <Link
              href={href}
              className="inline-flex h-9 items-center rounded-full bg-[color-mix(in_srgb,var(--color-royal-purple)_8%,transparent)] px-4 text-[13px] font-semibold text-[var(--color-royal-purple)] transition hover:bg-[color-mix(in_srgb,var(--color-royal-purple)_14%,transparent)]"
            >
              {t("megaViewAllGroup", { group: item.megaGroupTitle ?? item.title })}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="group relative shrink-0">
      {external ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={linkClassName}
        >
          {item.title}
          <ChevronIcon />
        </a>
      ) : (
        <Link href={href} className={linkClassName} aria-current={active ? "page" : undefined}>
          {item.title}
          <ChevronIcon />
        </Link>
      )}
      <ul className={`invisible absolute top-full z-20 -mt-1 min-w-[14rem] translate-y-1 rounded-xl border border-zinc-200/80 bg-white p-1.5 opacity-0 shadow-[0_20px_45px_-15px_rgba(20,8,34,0.42)] transition duration-150 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 ${isLast ? "end-0 start-auto" : "start-0 end-auto"}`}>
        <span className="absolute -top-3 inset-x-0 block h-3" aria-hidden />
        {item.children.map((child) => {
          const childHref = menuHref(child.url);
          const childExternal = childHref.startsWith("http");
          const childActive = itemIsActive(child, pathname);
          const childClassName = `block min-h-10 rounded-lg px-3 py-2.5 text-sm transition ${
            childActive
              ? "bg-[color-mix(in_srgb,var(--color-royal-purple)_10%,transparent)] font-medium text-[var(--color-royal-purple)]"
              : "text-zinc-700 hover:bg-zinc-100/80 hover:text-[var(--color-royal-purple)]"
          }`;

          return (
            <li key={child.id}>
              {childExternal ? (
                <a
                  href={childHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={childClassName}
                >
                  {child.title}
                </a>
              ) : (
                <Link
                  href={childHref}
                  className={childClassName}
                  aria-current={childActive ? "page" : undefined}
                >
                  {child.title}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function MegaPostCard({
  post,
}: {
  post: MegaMenuPost;
}) {
  return (
    <Link
      href={`/post/${post.slug}`}
      className="group block rounded-xl border border-transparent p-2 transition duration-180 hover:-translate-y-0.5 hover:border-zinc-200 hover:shadow-[0_12px_28px_-14px_rgba(20,8,34,0.35)]"
    >
      <div className="relative overflow-hidden rounded-xl aspect-video w-full bg-[linear-gradient(135deg,#3b1f55_0%,#1f0f2e_100%)]">
        {post.thumbnailUrl ? (
          <Image
            src={post.thumbnailUrl}
            alt={post.title}
            width={400}
            height={225}
            className="aspect-video w-full object-cover rounded-xl transition duration-200 group-hover:scale-[1.02]"
            unoptimized
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-[linear-gradient(135deg,#3b1f55_0%,#1f0f2e_100%)]">
            <svg viewBox="0 0 24 24" className="h-9 w-9 text-white/30" fill="none" aria-hidden>
              <path
                d="M4 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5Z"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <path
                d="M4 8h16M9 4v4M15 4v4M8 14l3-2 3 2 4-3v5H8v-2Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        )}
      </div>
      <p className="mt-2 line-clamp-2 font-semibold text-zinc-900">
        {post.title}
      </p>
      {post.description ? (
        <p className="mt-1 line-clamp-2 text-[13px] text-zinc-600">
          {post.description}
        </p>
      ) : null}
    </Link>
  );
}

function MegaEmptyState({ groupTitle }: { groupTitle: string }) {
  const t = useTranslations("Header");

  return (
    <div className="col-span-full flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-gradient-to-br from-zinc-50 to-white px-4 py-14 text-center sm:py-16">
      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#3b1f55_0%,#1f0f2e_100%)] text-white shadow-[0_10px_24px_-14px_rgba(59,31,85,0.75)]">
        <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" aria-hidden>
          <path
            d="M5 4.5h11l3 3v12a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 19.5v-15Z"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path
            d="M7.5 10.5h9M7.5 13.5h6M7.5 16.5h5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <p className="text-sm font-bold text-zinc-900">
        {t("megaEmptyTitle", { group: groupTitle })}
      </p>
      <p className="mt-1 max-w-sm text-[13px] text-zinc-500">
        {t("megaEmptyBody")}
      </p>
    </div>
  );
}

function MobileNavItem({
  item,
  pathname,
  onNavigate,
  nested = false,
}: {
  item: MenuItemWithMega;
  pathname: string;
  onNavigate: () => void;
  nested?: boolean;
}) {
  const href = menuHref(item.url);
  const external = href.startsWith("http");
  const active = isActivePath(pathname, href);
  const className = `block min-h-11 rounded-xl border px-3 py-3 text-sm font-semibold transition ${
    nested ? "ms-4 min-h-10 border-transparent py-2.5 text-[13px] font-medium" : ""
  } ${
    active
      ? "border-[var(--color-gold)]/30 bg-white/10 text-[var(--color-gold)] shadow-sm"
      : "border-transparent text-white/85 hover:bg-white/[0.07] hover:text-white"
  }`;

  return (
    <li>
      {external ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={className}
          onClick={onNavigate}
        >
          {item.title}
        </a>
      ) : (
        <Link
          href={href}
          className={className}
          onClick={onNavigate}
          aria-current={active ? "page" : undefined}
        >
          {item.title}
        </Link>
      )}
      {item.children.length > 0 ? (
        <ul className="mt-0.5 flex flex-col gap-0.5">
          {item.children.map((child) => (
            <MobileNavItem
              key={child.id}
              item={child}
              pathname={pathname}
              onNavigate={onNavigate}
              nested
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
      <path
        d="M4 7h16M4 12h16M4 17h16"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
      <path
        d="M6 6 18 18M18 6 6 18"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg viewBox="0 0 12 12" className="h-3 w-3 opacity-70" fill="none" aria-hidden>
      <path
        d="M2.5 4.5 6 8l3.5-3.5"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function splitBrandTitle(title: string): {
  before: string;
  middle: string | null;
  after: string;
} {
  const match = title.match(/^(.*?)\s+(of|از|من)\s+(.*)$/i);
  if (!match) {
    return { before: title, middle: null, after: "" };
  }

  return {
    before: match[1],
    middle: match[2],
    after: match[3],
  };
}
