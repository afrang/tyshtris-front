"use client";

import { useEffect, useId, useRef, useState } from "react";

/** Cloudflare always-pass test sitekey (local only). */
const TEST_SITE_KEY = "1x00000000000000000000AA";
/** Token accepted by Cloudflare when using the always-pass test secret. */
const TEST_TOKEN = "XXXX.DUMMY.TOKEN.XXXX";

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";
const SCRIPT_ID = "cf-turnstile-script";
const SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

type TurnstileTheme = "light" | "dark" | "auto";

type Props = {
  onToken: (token: string | null) => void;
  theme?: TurnstileTheme;
  className?: string;
};

declare global {
  interface Window {
    turnstile?: {
      render: (
        element: HTMLElement,
        options: Record<string, unknown>,
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
  }
}

function loadTurnstileScript(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.resolve();
  }
  if (window.turnstile) {
    return Promise.resolve();
  }

  const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
  if (existing) {
    return new Promise((resolve, reject) => {
      let tries = 0;
      const tick = () => {
        if (window.turnstile) {
          resolve();
          return;
        }
        tries += 1;
        if (tries > 80) {
          reject(new Error("Turnstile script timed out."));
          return;
        }
        window.setTimeout(tick, 50);
      };
      tick();
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.turnstile) {
        resolve();
        return;
      }
      window.setTimeout(() => {
        if (window.turnstile) resolve();
        else reject(new Error("Turnstile API missing after load."));
      }, 50);
    };
    script.onerror = () => reject(new Error("Failed to load Turnstile."));
    document.head.appendChild(script);
  });
}

function useTestFallback(): boolean {
  return SITE_KEY === TEST_SITE_KEY;
}

export function Turnstile({ onToken, theme = "auto", className }: Props) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const onTokenRef = useRef(onToken);
  const reactId = useId();
  const [failed, setFailed] = useState(false);
  const [retryTick, setRetryTick] = useState(0);
  const testFallback = useTestFallback();

  useEffect(() => {
    onTokenRef.current = onToken;
  }, [onToken]);

  useEffect(() => {
    if (!SITE_KEY || !hostRef.current) {
      onTokenRef.current(null);
      return;
    }

    let cancelled = false;
    setFailed(false);
    onTokenRef.current(null);

    const applyTestToken = () => {
      if (!cancelled && testFallback) {
        onTokenRef.current(TEST_TOKEN);
        setFailed(false);
      } else if (!cancelled) {
        setFailed(true);
        onTokenRef.current(null);
      }
    };

    void loadTurnstileScript()
      .then(() => {
        if (cancelled || !hostRef.current || !window.turnstile) {
          applyTestToken();
          return;
        }

        if (widgetIdRef.current) {
          try {
            window.turnstile.remove(widgetIdRef.current);
          } catch {
            // ignore
          }
          widgetIdRef.current = null;
        }

        hostRef.current.innerHTML = "";
        widgetIdRef.current = window.turnstile.render(hostRef.current, {
          sitekey: SITE_KEY,
          theme,
          appearance: "always",
          size: "normal",
          callback: (token: string) => onTokenRef.current(token),
          "expired-callback": () => onTokenRef.current(null),
          "error-callback": () => {
            if (testFallback) {
              applyTestToken();
              return;
            }
            onTokenRef.current(null);
            if (!cancelled) setFailed(true);
          },
        });

        // Test key should resolve quickly; if the challenge iframe is blocked
        // (some embedded browsers), fall back to Cloudflare's dummy token.
        if (testFallback) {
          window.setTimeout(() => {
            if (cancelled) return;
            const input = hostRef.current?.querySelector(
              "input[name='cf-turnstile-response']",
            ) as HTMLInputElement | null;
            if (input?.value) {
              onTokenRef.current(input.value);
              return;
            }
            applyTestToken();
          }, 1200);
        }
      })
      .catch(() => {
        applyTestToken();
      });

    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // ignore
        }
        widgetIdRef.current = null;
      }
    };
  }, [theme, reactId, retryTick, testFallback]);

  if (!SITE_KEY) {
    return null;
  }

  return (
    <div className={className}>
      <div ref={hostRef} data-turnstile-host={reactId} />
      {failed ? (
        <div className="mt-2 space-y-2 text-center">
          <p className="text-xs text-red-500">
            Captcha failed to load. Add this domain in the Cloudflare Turnstile
            widget hostnames, then retry.
          </p>
          <button
            type="button"
            className="text-xs font-semibold text-[var(--color-royal-purple,#6b21a8)] underline-offset-2 hover:underline"
            onClick={() => {
              setFailed(false);
              setRetryTick((value) => value + 1);
            }}
          >
            Retry captcha
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function isTurnstileConfigured(): boolean {
  return SITE_KEY.length > 0;
}
