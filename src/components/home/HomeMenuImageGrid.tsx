import { Link } from "@/i18n/navigation";
import type { MenuItemTree } from "@/lib/cms/types";

type Props = {
  items: MenuItemTree[];
  emptyImageLabel: string;
};

function ItemLink({
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

export function HomeMenuImageGrid({ items, emptyImageLabel }: Props) {
  const visible = items.filter((item) => item.isActive && item.title.trim().length > 0);
  if (visible.length === 0) return null;

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 lg:gap-5">
        {visible.map((item) => (
          <ItemLink
            key={item.id}
            href={item.url}
            className="group relative aspect-[4/5] overflow-hidden border border-zinc-200 bg-zinc-900 outline-none transition hover:border-[var(--color-royal-purple)]/40 focus-visible:border-[var(--color-royal-purple)]/50"
          >
            {item.imageUrl ? (
              // CMS uploads may come from a different API host in local dev.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.imageUrl}
                alt=""
                className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]"
              />
            ) : (
              <div
                className="absolute inset-0 flex items-center justify-center bg-zinc-200 text-[0.65rem] font-medium tracking-[0.08em] text-zinc-500 uppercase"
                role="img"
                aria-label={emptyImageLabel}
              >
                {emptyImageLabel}
              </div>
            )}
            <div
              className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent"
              aria-hidden="true"
            />
            <div className="relative flex h-full items-end p-3 sm:p-4">
              <h3 className="text-sm font-semibold leading-snug text-white sm:text-base">
                {item.title}
              </h3>
            </div>
          </ItemLink>
        ))}
      </div>
    </section>
  );
}
