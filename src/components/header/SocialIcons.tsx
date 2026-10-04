import type { SocialLink } from "@/lib/cms/types";

const iconPaths: Record<string, string> = {
  x: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z",
  twitter:
    "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z",
  facebook:
    "M14 2h-2a5 5 0 0 0-5 5v2H5v4h2v9h4v-9h3l1-4h-4V7a1 1 0 0 1 1-1h3V2z",
  instagram:
    "M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm10 2H7a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3zm-5 3.5A4.5 4.5 0 1 1 7.5 12 4.5 4.5 0 0 1 12 7.5zm0 2A2.5 2.5 0 1 0 14.5 12 2.5 2.5 0 0 0 12 9.5zM17.5 7a1 1 0 1 1-1 1 1 1 0 0 1 1-1z",
  linkedin:
    "M6.5 8.5H3V21h3.5V8.5zM4.75 3A2.25 2.25 0 1 0 4.75 7.5 2.25 2.25 0 0 0 4.75 3zM21 21h-3.5v-6.25c0-1.49-.03-3.41-2.08-3.41-2.08 0-2.4 1.62-2.4 3.3V21H9.5V8.5h3.36v1.71h.05c.47-.89 1.61-1.83 3.31-1.83 3.54 0 4.19 2.33 4.19 5.36V21z",
  youtube:
    "M23 7.5a3.5 3.5 0 0 0-2.46-2.48C18.7 4.5 12 4.5 12 4.5s-6.7 0-8.54.52A3.5 3.5 0 0 0 1 7.5v9a3.5 3.5 0 0 0 2.46 2.48C5.3 19.5 12 19.5 12 19.5s6.7 0 8.54-.52A3.5 3.5 0 0 0 23 16.5v-9zM10 15.5v-7l6 3.5-6 3.5z",
  whatsapp:
    "M12.04 2C6.58 2 2.15 6.4 2.15 11.82c0 1.96.52 3.87 1.52 5.55L2 22l4.8-1.56a9.9 9.9 0 0 0 5.24 1.48h.01c5.46 0 9.89-4.4 9.89-9.82C21.94 6.4 17.5 2 12.04 2zm5.77 13.96c-.24.67-1.4 1.23-1.93 1.31-.49.07-1.12.1-1.81-.11-.42-.13-.95-.31-1.64-.61-2.88-1.24-4.76-4.15-4.9-4.34-.14-.2-1.15-1.53-1.15-2.92 0-1.39.73-2.07 1-2.35.24-.26.54-.33.72-.33h.52c.16 0 .39-.06.61.46.24.56.8 1.94.87 2.08.07.14.12.3.02.48-.1.2-.14.31-.28.48-.14.16-.3.36-.43.49-.14.14-.29.29-.12.56.16.26.72 1.18 1.54 1.91 1.06.95 1.95 1.24 2.23 1.38.28.14.44.12.6-.07.17-.2.72-.83.91-1.12.2-.28.39-.24.65-.14.26.1 1.66.78 1.95.92.28.14.47.21.54.33.07.12.07.7-.17 1.37z",
};

function normalizePlatform(platform: string): string {
  const value = platform.trim().toLowerCase();
  if (value.includes("twitter") || value === "x" || value.startsWith("x /")) {
    return "twitter";
  }
  if (value.includes("whatsapp") || value === "wa" || value === "wp") {
    return "whatsapp";
  }
  if (value.includes("facebook")) return "facebook";
  if (value.includes("instagram")) return "instagram";
  if (value.includes("linkedin")) return "linkedin";
  if (value.includes("youtube")) return "youtube";
  return value.replace(/[\s/_-]+/g, "");
}

function SocialIcon({ platform }: { platform: string }) {
  const key = normalizePlatform(platform);
  const path = iconPaths[key];

  if (!path) {
    return (
      <span className="flex h-4 w-4 items-center justify-center text-[10px] font-semibold uppercase">
        {platform.slice(0, 1)}
      </span>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
      <path d={path} />
    </svg>
  );
}

export function SocialIcons({
  links,
  className,
}: {
  links: SocialLink[];
  className?: string;
}) {
  if (links.length === 0) return null;

  return (
    <ul className={["flex items-center gap-0.5", className].filter(Boolean).join(" ")}>
      {links.map((link) => (
        <li key={`${link.platform}-${link.url}`}>
          <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-7 w-7 items-center justify-center rounded-full text-white/85 transition hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            aria-label={link.platform}
          >
            <SocialIcon platform={link.platform} />
          </a>
        </li>
      ))}
    </ul>
  );
}
