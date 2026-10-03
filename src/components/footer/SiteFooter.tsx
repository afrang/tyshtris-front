import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { SocialIcons } from "@/components/header/SocialIcons";
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

  return (
    <footer className="site-footer">
      <div className="site-footer-tricolor" aria-hidden />
      <div className="site-footer-layout">
      <div className="site-footer-panel">
        <div className="site-footer-brand">
          {settings.logoUrl ? (
            <Image
              src={settings.logoUrl}
              alt=""
              width={52}
              height={52}
              className="site-footer-logo"
              unoptimized
            />
          ) : null}
          <div className="site-footer-identity">
            <p className="site-footer-name">{settings.title || siteName}</p>
            {settings.description ? (
              <p className="site-footer-desc">{settings.description}</p>
            ) : null}
          </div>
        </div>

        <FooterNav items={items} label={t("explore")} />

        {email || phone || address ? (
          <div className="site-footer-contact-block">
            <h2 className="site-footer-kicker">{t("contact")}</h2>
            <ul className="site-footer-contact">
              {email ? (
                <li>
                  <a href={`mailto:${email}`}>{email}</a>
                </li>
              ) : null}
              {phone ? (
                <li>
                  <a href={`tel:${phone.replace(/\s+/g, "")}`}>{phone}</a>
                </li>
              ) : null}
              {address ? <li>{address}</li> : null}
            </ul>
          </div>
        ) : null}
      </div>

      <div className="site-footer-scene">
        <Image
          src="/footer-persepolis.png"
          alt=""
          fill
          sizes="(max-width: 800px) 100vw, 46vw"
          quality={90}
          className="site-footer-image"
        />
        <div className="site-footer-scene-fade" aria-hidden />
      </div>
    </div>

    <div className="site-footer-legal">
      <p>{t("rights", { year: new Date().getFullYear(), name: siteName })}</p>
      <SocialIcons links={settings.socialLinks} />
    </div>
    </footer>
  );
}
