import { Link } from "@/i18n/navigation";
import type { BlogGroupBreadcrumbItem } from "@/lib/cms/types";

type Props = {
  homeLabel: string;
  items: BlogGroupBreadcrumbItem[];
  variant?: "default" | "onHero";
  ariaLabel?: string;
};

export function Breadcrumb({
  homeLabel,
  items,
  variant = "default",
  ariaLabel = "Breadcrumb",
}: Props) {
  const onHero = variant === "onHero";

  return (
    <nav
      aria-label={ariaLabel}
      className={`text-sm ${onHero ? "text-white/80" : "text-zinc-600"}`}
    >
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <li>
          <Link
            href="/"
            className={
              onHero
                ? "transition hover:text-white"
                : "transition hover:text-[var(--color-royal-purple)]"
            }
          >
            {homeLabel}
          </Link>
        </li>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={item.id} className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className={onHero ? "text-white/45" : "text-zinc-400"}
              >
                /
              </span>
              {isLast ? (
                <span
                  className={
                    onHero
                      ? "font-medium text-white"
                      : "font-medium text-zinc-900"
                  }
                  aria-current="page"
                >
                  {item.title}
                </span>
              ) : (
                <Link
                  href={`/${item.slug}`}
                  className={
                    onHero
                      ? "transition hover:text-white"
                      : "transition hover:text-[var(--color-royal-purple)]"
                  }
                >
                  {item.title}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
