"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import type { Language } from "@/lib/cms/types";
import { routing, type Locale } from "@/i18n/routing";

type Props = {
  languages: Language[];
  label: string;
};

export function LanguageSwitcher({ languages, label }: Props) {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  const options = languages.length > 0 ? languages : fallbackLanguages();
  const current =
    options.find((lang) => lang.prefix === locale) ?? options[0] ?? null;

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (!current || options.length === 0) return null;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex h-8 items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.07] px-2.5 text-[11px] font-semibold tracking-wide text-white transition hover:border-white/25 hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-white"
      >
        <GlobeIcon />
        <span className="max-w-[7.5rem] truncate">{current.name}</span>
        <svg
          viewBox="0 0 12 12"
          className={`h-3 w-3 opacity-80 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
          aria-hidden
        >
          <path
            d="M2.5 4.5 6 8l3.5-3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          />
        </svg>
      </button>

      {open ? (
        <ul
          id={listId}
          role="listbox"
          aria-label={label}
          className="absolute end-0 z-50 mt-2 min-w-[11rem] overflow-hidden rounded-xl border border-zinc-200/80 bg-white p-1.5 text-zinc-900 shadow-[0_18px_45px_-14px_rgba(24,10,38,0.38)]"
        >
          {options.map((lang) => {
            const enabled = routing.locales.includes(lang.prefix as Locale);
            const selected = lang.prefix === locale;

            return (
              <li key={lang.id || lang.prefix} role="none">
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  disabled={!enabled}
                  onClick={() => {
                    if (!enabled) return;
                    router.replace(pathname, { locale: lang.prefix as Locale });
                    setOpen(false);
                  }}
                  className={`flex min-h-10 w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-start text-sm transition disabled:cursor-not-allowed disabled:opacity-40 ${
                    selected
                      ? "bg-[color-mix(in_srgb,var(--color-royal-purple)_10%,transparent)] font-medium text-[var(--color-royal-purple)]"
                      : "text-zinc-700 hover:bg-zinc-50"
                  }`}
                >
                  <span>{lang.name}</span>
                  {selected ? <CheckIcon /> : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

function GlobeIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 shrink-0" fill="none" aria-hidden>
      <circle cx="8" cy="8" r="6.25" stroke="currentColor" strokeWidth="1.3" />
      <path
        d="M2 8h12M8 2c1.8 1.8 2.7 3.8 2.7 6s-.9 4.2-2.7 6c-1.8-1.8-2.7-3.8-2.7-6S6.2 3.8 8 2Z"
        stroke="currentColor"
        strokeWidth="1.3"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 12 12" className="h-3.5 w-3.5 shrink-0" fill="none" aria-hidden>
      <path
        d="m2.2 6.2 2.4 2.4 5.2-5.3"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function fallbackLanguages(): Language[] {
  return [
    {
      id: "en",
      name: "English",
      prefix: "en",
      isDefault: true,
      direction: "ltr",
    },
    {
      id: "fa",
      name: "فارسی",
      prefix: "fa",
      isDefault: false,
      direction: "rtl",
    },
    {
      id: "ar",
      name: "العربية",
      prefix: "ar",
      isDefault: false,
      direction: "rtl",
    },
  ];
}
