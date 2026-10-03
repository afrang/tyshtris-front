import type { ReactNode } from "react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Breadcrumb } from "@/components/blog/Breadcrumb";
import { ContactForm } from "@/components/contact/ContactForm";
import { getHeaderData } from "@/lib/cms/client";
import type { SocialLink } from "@/lib/cms/types";
import { routing } from "@/i18n/routing";

type Props = {
  params: Promise<{ locale: string }>;
};

function filled(values: string[]): string[] {
  return values.map((value) => value.trim()).filter((value) => value.length > 0);
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Contact" });
  const { settings } = await getHeaderData(locale);
  const name = settings.name || settings.title;

  return {
    title: t("title"),
    description: t("description", { name }),
  };
}

export default async function ContactPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("Contact");
  const tBlog = await getTranslations("BlogGroupPage");
  const tA11y = await getTranslations("A11y");
  const { settings } = await getHeaderData(locale);
  const siteName = settings.name || settings.title;
  const emails = filled(settings.contactEmails);
  const phones = filled(settings.contactPhones);
  const addresses = filled(settings.contactAddresses);
  const social = settings.socialLinks.filter(
    (link) => link.platform.trim().length > 0 && link.url.trim().length > 0,
  );
  const hasChannels =
    emails.length > 0 || phones.length > 0 || addresses.length > 0 || social.length > 0;

  return (
    <main className="flex w-full flex-1 flex-col">
      <header className="blog-group-hero relative w-full overflow-hidden">
        <div className="blog-group-hero-pattern" aria-hidden="true" />
        <div className="relative z-10 mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 pb-16 pt-6 sm:px-6 sm:pb-20">
          <Breadcrumb
            homeLabel={tBlog("home")}
            items={[{ id: "contactus", title: t("title"), slug: "contactus" }]}
            variant="onHero"
            ariaLabel={tA11y("breadcrumb")}
          />
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
            {t("title")}
          </h1>
          <p className="max-w-2xl text-base leading-7 text-white/85 sm:text-lg">
            {t("lead", { name: siteName })}
          </p>
        </div>
        <div className="blog-group-hero-wave" aria-hidden="true">
          <svg
            className="blog-group-hero-wave-svg"
            viewBox="0 0 1440 120"
            preserveAspectRatio="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              className="blog-group-hero-wave-back"
              d="M0,48 C180,96 360,12 540,52 C720,92 900,20 1080,56 C1260,92 1350,40 1440,64 L1440,120 L0,120 Z"
            />
            <path
              className="blog-group-hero-wave-mid"
              d="M0,64 C200,20 400,100 600,68 C800,36 1000,88 1200,56 C1320,36 1380,72 1440,60 L1440,120 L0,120 Z"
            />
            <path
              className="blog-group-hero-wave-front"
              d="M0,78 C220,46 420,104 640,78 C860,52 1080,96 1280,74 L1440,86 L1440,120 L0,120 Z"
            />
          </svg>
        </div>
      </header>

      <section
        className={`mx-auto grid w-full gap-6 px-4 py-8 sm:px-6 sm:py-12 ${
          hasChannels
            ? "max-w-5xl lg:grid-cols-[minmax(16rem,0.85fr)_minmax(0,1.15fr)]"
            : "max-w-xl"
        }`}
      >
        {hasChannels ? (
          <ContactChannels
            heading={t("details")}
            emailLabel={t("email")}
            phoneLabel={t("phone")}
            addressLabel={t("address")}
            socialLabel={t("social")}
            emails={emails}
            phones={phones}
            addresses={addresses}
            social={social}
          />
        ) : null}
        <ContactForm locale={locale} />
      </section>
    </main>
  );
}

function ContactChannels({
  heading,
  emailLabel,
  phoneLabel,
  addressLabel,
  socialLabel,
  emails,
  phones,
  addresses,
  social,
}: {
  heading: string;
  emailLabel: string;
  phoneLabel: string;
  addressLabel: string;
  socialLabel: string;
  emails: string[];
  phones: string[];
  addresses: string[];
  social: SocialLink[];
}) {
  return (
    <aside className="h-fit rounded-2xl border border-zinc-200 bg-white p-5 shadow-[0_18px_50px_-28px_rgba(26,10,46,0.45)] sm:p-7">
      <h2 className="text-lg font-semibold text-zinc-900">{heading}</h2>
      <div className="mt-5 flex flex-col gap-5">
        {emails.length > 0 ? (
          <ChannelList label={emailLabel}>
            {emails.map((email) => (
              <li key={email}>
                <a
                  href={`mailto:${email}`}
                  dir="ltr"
                  className="font-semibold text-[var(--color-royal-purple)] underline-offset-4 hover:underline"
                >
                  {email}
                </a>
              </li>
            ))}
          </ChannelList>
        ) : null}
        {phones.length > 0 ? (
          <ChannelList label={phoneLabel}>
            {phones.map((phone) => (
              <li key={phone}>
                <a
                  href={`tel:${phone.replace(/[^\d+]/g, "")}`}
                  dir="ltr"
                  className="font-semibold text-[var(--color-royal-purple)] underline-offset-4 hover:underline"
                >
                  {phone}
                </a>
              </li>
            ))}
          </ChannelList>
        ) : null}
        {addresses.length > 0 ? (
          <ChannelList label={addressLabel}>
            {addresses.map((address) => (
              <li key={address} className="text-zinc-800">
                {address}
              </li>
            ))}
          </ChannelList>
        ) : null}
        {social.length > 0 ? (
          <ChannelList label={socialLabel}>
            {social.map((link) => (
              <li key={`${link.platform}-${link.url}`}>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center font-semibold text-[var(--color-royal-purple)] underline-offset-4 hover:underline"
                >
                  {link.platform}
                </a>
              </li>
            ))}
          </ChannelList>
        ) : null}
      </div>
    </aside>
  );
}

function ChannelList({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <h3 className="text-xs font-semibold tracking-wide text-[var(--color-gold-dark)]">
        {label}
      </h3>
      <ul className="mt-2 flex flex-col gap-1.5 text-base leading-6">{children}</ul>
    </div>
  );
}
