"use client";

import { type FormEvent, useState } from "react";
import { useTranslations } from "next-intl";

const PRESETS = [25, 50, 100, 250] as const;

type Props = {
  business: string;
  siteName: string;
  thanked: boolean;
};

function formatAmount(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

export function DonateForm({ business, siteName, thanked }: Props) {
  const t = useTranslations("Donate");
  const [preset, setPreset] = useState<number>(25);
  const [custom, setCustom] = useState("");
  const [attempted, setAttempted] = useState(false);

  const customValue = custom.trim();
  const usingCustom = customValue.length > 0;
  const parsedCustom = Number(customValue);
  const amount = usingCustom ? parsedCustom : preset;
  const valid =
    Number.isFinite(amount) && amount >= 1 && amount <= 10000;
  const ready = business.length > 0 && valid;

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    if (!ready) {
      event.preventDefault();
      setAttempted(true);
      return;
    }

    const form = event.currentTarget;
    const base = `${window.location.origin}${window.location.pathname}`;
    const amountInput = form.elements.namedItem("amount");
    const returnInput = form.elements.namedItem("return");
    const cancelInput = form.elements.namedItem("cancel_return");
    if (amountInput instanceof HTMLInputElement) {
      amountInput.value = amount.toFixed(2);
    }
    if (returnInput instanceof HTMLInputElement) {
      returnInput.value = `${base}?thanks=1`;
    }
    if (cancelInput instanceof HTMLInputElement) {
      cancelInput.value = base;
    }
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-[0_18px_50px_-28px_rgba(26,10,46,0.45)] sm:p-7">
      {thanked ? (
        <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-950" role="status">
          <p className="font-semibold">{t("thanksTitle")}</p>
          <p className="mt-1 text-sm leading-6">{t("thanksBody")}</p>
        </div>
      ) : null}

      <fieldset>
        <legend className="text-sm font-semibold text-zinc-800">{t("amount")}</legend>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {PRESETS.map((value) => {
            const selected = !usingCustom && preset === value;
            return (
              <button
                key={value}
                type="button"
                aria-pressed={selected}
                onClick={() => {
                  setPreset(value);
                  setCustom("");
                }}
                className={`min-h-12 rounded-xl border px-3 text-base font-bold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-gold)] ${
                  selected
                    ? "border-[var(--color-gold)] bg-[#fbf6e8] text-[var(--color-gold-text)] shadow-[inset_0_0_0_1px_var(--color-gold)]"
                    : "border-zinc-200 bg-white text-zinc-800 hover:border-[var(--color-gold)]/60"
                }`}
              >
                {value} USD
              </button>
            );
          })}
        </div>

        <label className="mt-4 block text-sm font-semibold text-zinc-800">
          {t("custom")}
          <input
            inputMode="decimal"
            autoComplete="off"
            value={custom}
            placeholder="10"
            onChange={(event) => setCustom(event.target.value.replace(/[^\d.]/g, ""))}
            className="mt-2 h-12 w-full rounded-xl border border-zinc-200 px-3 text-base font-semibold text-zinc-900 outline-none transition focus:border-[var(--color-gold)] focus:shadow-[0_0_0_3px_rgba(201,162,39,0.2)]"
          />
        </label>
      </fieldset>

      <p className="mt-4 text-sm font-semibold text-zinc-700">
        {valid ? t("summary", { amount: formatAmount(amount) }) : t("invalid")}
      </p>

      <form
        className="mt-5"
        action="https://www.paypal.com/cgi-bin/webscr"
        method="post"
        onSubmit={onSubmit}
      >
        <input type="hidden" name="cmd" value="_donations" />
        <input type="hidden" name="business" value={business} />
        <input type="hidden" name="currency_code" value="USD" />
        <input type="hidden" name="amount" value={valid ? amount.toFixed(2) : ""} />
        <input type="hidden" name="item_name" value={t("itemName", { name: siteName })} />
        <input type="hidden" name="no_shipping" value="1" />
        <input type="hidden" name="charset" value="utf-8" />
        <input type="hidden" name="rm" value="1" />
        <input type="hidden" name="return" value="" />
        <input type="hidden" name="cancel_return" value="" />

        <button
          type="submit"
          disabled={!ready}
          className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[var(--color-gold)] px-5 text-base font-bold text-[var(--color-gold-text)] shadow-[inset_0_1px_0_rgba(255,255,255,0.28)] transition hover:bg-[#d8b33d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-gold)] disabled:cursor-not-allowed disabled:opacity-55"
        >
          {t("paypal")}
        </button>
      </form>

      {attempted && !business ? (
        <p className="mt-3 text-sm text-red-700" role="alert">
          {t("missing")}
        </p>
      ) : null}
      {!business && !attempted ? (
        <p className="mt-3 text-sm text-zinc-500">{t("missing")}</p>
      ) : null}
      <p className="mt-3 text-center text-xs leading-5 text-zinc-500">{t("secure")}</p>
    </div>
  );
}
