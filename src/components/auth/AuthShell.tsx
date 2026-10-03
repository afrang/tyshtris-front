"use client";

import React from "react";

type AuthShellProps = {
  children: React.ReactNode;
  title: string;
  tagline?: string;
  dir?: "ltr" | "rtl";
  showLoginActive?: boolean;
  onNavigateLogin?: () => void;
  onNavigateRegister?: () => void;
  loginActiveLabel: string;
  registerActiveLabel: string;
};

export function AuthShell({
  children,
  title,
  tagline,
  dir,
  showLoginActive,
  onNavigateLogin,
  onNavigateRegister,
  loginActiveLabel,
  registerActiveLabel,
}: AuthShellProps) {
  return (
    <div
      dir={dir}
      className="relative min-h-screen w-full overflow-hidden bg-[#0b0815] text-white"
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(1200px 600px at 50% -10%, rgba(91,44,142,0.55), transparent 60%), linear-gradient(180deg, #2a153b 0%, #241332 55%, #1a0d29 100%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Cg fill='none' stroke='%23ffffff' stroke-width='1'%3E%3Cpath d='M40 4 L76 40 L40 76 L4 40 Z'/%3E%3Cpath d='M40 16 L64 40 L40 64 L16 40 Z' opacity='0.7'/%3E%3Cpath d='M40 0 V80 M0 40 H80' stroke='%23ffffff' stroke-width='0.55' opacity='0.35'/%3E%3C/g%3E%3Cg fill='%23ffffff'%3E%3Ccircle cx='40' cy='4' r='2'/%3E%3Ccircle cx='76' cy='40' r='2'/%3E%3Ccircle cx='40' cy='76' r='2'/%3E%3Ccircle cx='4' cy='40' r='2'/%3E%3Ccircle cx='40' cy='40' r='2.5'/%3E%3C/g%3E%3C/svg%3E\")",
          backgroundSize: "80px 80px",
          backgroundRepeat: "repeat",
          mixBlendMode: "soft-light",
        }}
        aria-hidden
      />
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-12 sm:px-6">
        <div className="w-full max-w-md">
          <div className="mb-6 flex justify-center">
            <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 p-1 backdrop-blur-xl">
              <button
                type="button"
                onClick={onNavigateRegister}
                className={`relative inline-flex h-9 items-center justify-center rounded-full px-4 text-sm font-semibold transition ${
                  showLoginActive === false
                    ? "bg-gradient-to-r from-[#e6c98d] to-[#c9a45c] text-[#1a1208] shadow-md"
                    : "text-white/78 hover:text-white"
                }`}
              >
                {registerActiveLabel}
              </button>
              <button
                type="button"
                onClick={onNavigateLogin}
                className={`relative inline-flex h-9 items-center justify-center rounded-full px-4 text-sm font-semibold transition ${
                  showLoginActive
                    ? "bg-gradient-to-r from-[#e6c98d] to-[#c9a45c] text-[#1a1208] shadow-md"
                    : "text-white/78 hover:text-white"
                }`}
              >
                {loginActiveLabel}
              </button>
            </div>
          </div>

          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8 shadow-[0_22px_60px_-24px_rgba(0,0,0,0.7)]">
            <div className="mb-6 text-center">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                {title}
              </h1>
              {tagline ? (
                <p className="mt-2 text-sm text-white/70">{tagline}</p>
              ) : null}
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
