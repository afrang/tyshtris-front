"use client";

import { useEffect, useId, useState, useSyncExternalStore } from "react";
import { Link, usePathname } from "@/i18n/navigation";
import { isAuthenticated } from "@/lib/auth/auth";
import type { Language, SocialLink } from "@/lib/cms/types";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { SocialIcons } from "./SocialIcons";

type Props = {
  officialText: string;
  howYouKnowLabel: string;
  howYouKnowBody: string;
  languages: Language[];
  languageLabel: string;
  socialLinks: SocialLink[];
  loginLabel: string;
  accountLabel: string;
};

function subscribeAuth(onChange: () => void) {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

export function OfficialBanner({
  officialText,
  howYouKnowLabel,
  howYouKnowBody,
  languages,
  languageLabel,
  socialLinks,
  loginLabel,
  accountLabel,
}: Props) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const pathname = usePathname();
  // Pathname keeps this in sync after same-tab login/logout navigations.
  const signedIn = useSyncExternalStore(
    subscribeAuth,
    () => (pathname, isAuthenticated()),
    () => false,
  );

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <div className="relative border-t-[3px] border-transparent bg-[linear-gradient(90deg,#16864b_0_33.333%,#f5f2e9_33.333%_66.666%,#c72c37_66.666%_100%)] text-white">
      <div className="relative">
        <div
          className="pointer-events-none absolute inset-0 bg-[#21112f]"
          aria-hidden
        />
        <div className="relative mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-1.5 sm:px-6">
          <div className="flex min-w-0 items-center gap-2 text-[11px] leading-5 sm:text-[12px]">
            <span
              className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-[var(--color-gold)] ring-1 ring-white/10"
              aria-hidden
            >
              <ShieldIcon />
            </span>
            <p className="min-w-0 truncate text-white/95">{officialText}</p>
            <button
              type="button"
              onClick={() => setOpen((value) => !value)}
              className="inline-flex min-h-7 shrink-0 items-center gap-1 rounded-full px-2 font-semibold text-[var(--color-gold)] transition hover:bg-white/10 hover:text-[#f3cf64] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-white"
              aria-expanded={open}
              aria-controls={panelId}
            >
              <span className="hidden sm:inline">{howYouKnowLabel}</span>
              <span className="sm:hidden" aria-hidden>
                <InfoIcon />
              </span>
              <span className="sr-only sm:hidden">{howYouKnowLabel}</span>
              <svg
                viewBox="0 0 12 12"
                className={`h-3 w-3 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
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
          </div>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <Link
              href={signedIn ? "/account" : "/login"}
              className="inline-flex h-7 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] px-2.5 text-[11px] font-semibold text-white/90 transition hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-white sm:h-8 sm:px-3.5 sm:text-[12px]"
            >
              {signedIn ? accountLabel : loginLabel}
            </Link>
            <LanguageSwitcher languages={languages} label={languageLabel} />
            <span
              className="hidden h-4 w-px bg-white/15 lg:block"
              aria-hidden
            />
            <div className="hidden lg:block">
              <SocialIcons links={socialLinks} />
            </div>
          </div>
        </div>
      </div>

      <div
        id={panelId}
        className={`grid transition-[grid-template-rows] duration-200 ease-out ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
        aria-hidden={!open}
      >
        <div className="overflow-hidden">
          <div className="border-t border-white/10 bg-[#170b22] shadow-inner">
            <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3.5 sm:px-6">
              <div className="flex items-start gap-3">
                <span
                  className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-white"
                  aria-hidden
                >
                  <ShieldIcon />
                </span>
                <p className="text-[12px] leading-5 text-white/90">
                  {howYouKnowBody}
                </p>
              </div>
              {socialLinks.length > 0 ? (
                <div className="ms-10 lg:hidden">
                  <SocialIcons links={socialLinks} />
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" aria-hidden>
      <circle cx="8" cy="8" r="6.25" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M8 7.25v4"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <circle cx="8" cy="5" r="0.75" fill="currentColor" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" aria-hidden>
      <path
        d="M8 2.2 3.5 4.1v3.4c0 2.7 1.9 4.9 4.5 5.7 2.6-.8 4.5-3 4.5-5.7V4.1L8 2.2Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <path
        d="m6.1 8.1 1.3 1.3 2.5-2.6"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
