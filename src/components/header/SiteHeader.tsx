import { getTranslations } from "next-intl/server";
import {
  blogGroupSlugFromMenuItemUrl,
  getBlogGroupBySlug,
  getHeaderData,
  getMenuBySlug,
} from "@/lib/cms/client";
import type { MenuItemWithMega } from "@/lib/cms/types";
import { MainNav } from "./MainNav";
import { OfficialBanner } from "./OfficialBanner";

type Props = {
  locale: string;
};

type MegaEnrichment = {
  isMegaGroup: true;
  megaPosts: MenuItemWithMega["megaPosts"];
  megaGroupSlug: string | null;
  megaGroupTitle: string | null;
};

function enrichMenuRecursive(
  items: MenuItemWithMega[],
  megaMap: Map<string, MegaEnrichment>,
): MenuItemWithMega[] {
  return items.map((item) => {
    const enriched = megaMap.get(item.id);
    const children = item.children ? enrichMenuRecursive(item.children, megaMap) : [];
    return {
      ...item,
      children,
      ...(enriched ?? {}),
    };
  });
}

export async function SiteHeader({ locale }: Props) {
  const t = await getTranslations({ locale, namespace: "Header" });
  const { settings, languages } = await getHeaderData(locale);
  const menu = await getMenuBySlug("topmenu", locale);

  const megaCandidates: Array<{ id: string; slug: string; item: MenuItemWithMega }> = [];

  function collectCandidates(items: MenuItemWithMega[]) {
    for (const item of items) {
      if (item.isMegaMenu && item.function === "GroupBlog") {
        const slug = blogGroupSlugFromMenuItemUrl(item.url);
        if (slug) {
          megaCandidates.push({ id: item.id, slug, item });
        }
      }
      if (item.children && item.children.length > 0) {
        collectCandidates(item.children);
      }
    }
  }

  collectCandidates(menu as MenuItemWithMega[]);

  const megaMap = new Map<string, MegaEnrichment>();

  if (megaCandidates.length > 0) {
    const results = await Promise.all(
      megaCandidates.map(({ slug }) => getBlogGroupBySlug(slug, locale)),
    );

    for (let i = 0; i < megaCandidates.length; i++) {
      const { id, slug, item } = megaCandidates[i];
      const group = results[i];
      megaMap.set(id, {
        isMegaGroup: true,
        megaPosts: group?.posts.slice(0, 6) ?? [],
        megaGroupSlug: slug,
        megaGroupTitle: group?.title ?? item.title,
      });
    }
  }

  const enrichedMenu: MenuItemWithMega[] = enrichMenuRecursive(
    menu as MenuItemWithMega[],
    megaMap,
  );

  const officialText =
    settings.description?.trim() ||
    t("officialText", { name: settings.name || settings.title });

  return (
    <header className="sticky top-0 z-50 shadow-[0_12px_30px_-22px_rgba(18,8,30,0.8)]">
      <OfficialBanner
        officialText={officialText}
        howYouKnowLabel={t("howYouKnow")}
        howYouKnowBody={t("howYouKnowBody", {
          name: settings.name || settings.title,
        })}
        languages={languages}
        languageLabel={t("translate")}
        socialLinks={settings.socialLinks}
        loginLabel={t("login")}
        accountLabel={t("account")}
      />
      <MainNav
        locale={locale}
        siteName={settings.name}
        siteTitle={settings.title || settings.name}
        logoUrl={settings.logoUrl}
        menu={enrichedMenu}
        menuLabel={t("menu")}
        closeMenuLabel={t("closeMenu")}
        moreLabel={t("more")}
        registerLabel={t("register")}
        donateLabel={t("donate")}
      />
    </header>
  );
}
