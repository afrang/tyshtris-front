"use client";

import { useId } from "react";
import { Link, usePathname } from "@/i18n/navigation";

export type FooterLinkItem = {
  id: string;
  title: string;
  url: string;
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

export function FooterNav({
  items,
  label,
}: {
  items: FooterLinkItem[];
  label: string;
}) {
  const pathname = usePathname();
  const headingId = useId();
  if (items.length === 0) return null;

  return (
    <nav className="site-footer-nav-wrap" aria-labelledby={headingId}>
      <h2 id={headingId} className="site-footer-kicker">
        {label}
      </h2>
      <ul className="site-footer-nav">
      {items.map((item) => {
        const href = menuHref(item.url);
        const external = href.startsWith("http");
        const active = !external && isActivePath(pathname, href);
        const className = `site-footer-link${active ? " is-active" : ""}`;

        if (external) {
          return (
            <li key={item.id}>
              <a
                href={href}
                className={className}
                target="_blank"
                rel="noopener noreferrer"
              >
                {item.title}
              </a>
            </li>
          );
        }

        return (
          <li key={item.id}>
            <Link
              href={href}
              className={className}
              aria-current={active ? "page" : undefined}
            >
              {item.title}
            </Link>
          </li>
        );
      })}
      </ul>
    </nav>
  );
}
