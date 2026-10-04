import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { SocialIcons } from "@/components/header/SocialIcons";
import { Link } from "@/i18n/navigation";
import { getHeaderData } from "@/lib/cms/client";
import { FooterNav, type FooterLinkItem } from "./FooterNav";

type Props = {
  locale: string;
};

export async function SiteFooter({ locale }: Props) {
  const t = await getTranslations({ locale, namespace: "Footer" });
  const { settings, menu } = await getHeaderData(locale);
  const siteName = settings.name || settings.title;
  const items: FooterLinkItem[] = menu
    .filter((item) => item.isActive && item.title.trim().length > 0)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((item) => ({
      id: item.id,
      title: item.title,
      url: item.url,
    }));

  const email = settings.contactEmails.find((value) => value.trim().length > 0);
  const phone = settings.contactPhones.find((value) => value.trim().length > 0);
  const address = settings.contactAddresses.find((value) => value.trim().length > 0);
  const hasContact = Boolean(email || phone || address);
  const hasSocial = settings.socialLinks.length > 0;

  return (
    <footer className="site-footer">
      <div className="site-footer-tricolor" aria-hidden />
      <div className="site-footer-layout">
        <div className="site-footer-panel">
          <div className="site-footer-brand">
            <Link href="/" className="site-footer-brand-link">
              {settings.logoUrl ? (
                <Image
                  src={settings.logoUrl}
                  alt=""
                  width={56}
                  height={56}
                  className="site-footer-logo"
                  unoptimized
                />
              ) : null}
              <span className="site-footer-identity">
                <span className="site-footer-name">{settings.title || siteName}</span>
                {settings.description ? (
                  <span className="site-footer-desc">{settings.description}</span>
                ) : null}
              </span>
            </Link>
          </div>

          <div className="site-footer-columns">
            <FooterNav items={items} label={t("explore")} />

            {hasContact || hasSocial ? (
              <div className="site-footer-aside">
                {hasContact ? (
                  <div className="site-footer-contact-block">
                    <h2 className="site-footer-kicker">{t("contact")}</h2>
                    <ul className="site-footer-contact">
                      {email ? (
                        <li>
                          <a
                            href={`mailto:${email}`}
                            className="site-footer-contact-row"
                            dir="ltr"
                          >
                            <MailIcon />
                            <span>{email}</span>
                          </a>
                        </li>
                      ) : null}
                      {phone ? (
                        <li>
                          <a
                            href={`tel:${phone.replace(/[^\d+]/g, "")}`}
                            className="site-footer-contact-row"
                            dir="ltr"
                          >
                            <PhoneIcon />
                            <span>{phone}</span>
                          </a>
                        </li>
                      ) : null}
                      {address ? (
                        <li>
                          <span className="site-footer-contact-row is-static">
                            <PinIcon />
                            <span>{address}</span>
                          </span>
                        </li>
                      ) : null}
                    </ul>
                  </div>
                ) : null}

                {hasSocial ? (
                  <div className="site-footer-social-block">
                    <h2 className="site-footer-kicker">{t("follow")}</h2>
                    <SocialIcons links={settings.socialLinks} className="site-footer-social" />
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>

        <div className="site-footer-scene" aria-hidden>
          <Image
            src="/footer-persepolis.png"
            alt=""
            fill
            sizes="(max-width: 800px) 100vw, 42vw"
            quality={90}
            className="site-footer-image"
          />
          <div className="site-footer-scene-glow" />
          <div className="site-footer-scene-fade" />
        </div>
      </div>

      <div className="site-footer-legal">
        <p>{t("rights", { year: new Date().getFullYear(), name: siteName })}</p>
      </div>
    </footer>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" className="site-footer-contact-icon" aria-hidden>
      <path
        fill="currentColor"
        d="M3 6.75A2.75 2.75 0 0 1 5.75 4h12.5A2.75 2.75 0 0 1 21 6.75v10.5A2.75 2.75 0 0 1 18.25 20H5.75A2.75 2.75 0 0 1 3 17.25V6.75zm2.75-.25a.25.25 0 0 0-.25.25v.38l6.5 4.06 6.5-4.06V6.75a.25.25 0 0 0-.25-.25H5.75zm13 3.12-5.86 3.66a1.25 1.25 0 0 1-1.28 0L5.75 9.62v7.63c0 .138.112.25.25.25h12.5a.25.25 0 0 0 .25-.25V9.62z"
      />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" className="site-footer-contact-icon" aria-hidden>
      <path
        fill="currentColor"
        d="M8.16 3.75c.4-.4 1.05-.4 1.45 0l2.1 2.1c.4.4.4 1.05 0 1.45l-1.2 1.2a1.2 1.2 0 0 0-.2 1.4c.55 1.15 1.55 2.15 2.7 2.7.45.22 1 .1 1.4-.3l1.2-1.2c.4-.4 1.05-.4 1.45 0l2.1 2.1c.4.4.4 1.05 0 1.45l-.85.85c-.9.9-2.2 1.25-3.45.9-2.55-.7-4.85-2.35-6.7-4.2-1.85-1.85-3.5-4.15-4.2-6.7-.35-1.25 0-2.55.9-3.45l.85-.85z"
      />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" className="site-footer-contact-icon" aria-hidden>
      <path
        fill="currentColor"
        d="M12 2.5c-3.6 0-6.5 2.85-6.5 6.35 0 4.4 5.2 10.55 6.05 11.5a.6.6 0 0 0 .9 0c.85-.95 6.05-7.1 6.05-11.5C18.5 5.35 15.6 2.5 12 2.5zm0 8.75a2.4 2.4 0 1 1 0-4.8 2.4 2.4 0 0 1 0 4.8z"
      />
    </svg>
  );
}
