import type {
  EditorComponent,
  EditorContainer,
  EditorTree,
  HeaderData,
  Language,
  MenuItemTree,
  PublicBlogGroupPage,
  PublicBlogGroupPost,
  PublicBlogPostPage,
  PublicRelatedGroup,
  PublicRelatedTag,
  SiteSettings,
} from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5068";

export function assetUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${API_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}

export function blogGroupSlugFromMenuItemUrl(url: string): string | null {
  if (!url || !url.startsWith('/')) return null;
  const path = url.slice(1);
  const firstSegment = path.split('/')[0] ?? null;
  return firstSegment && firstSegment.length > 0 ? firstSegment : null;
}

async function fetchJson<T>(path: string): Promise<T | null> {
  try {
    // CMS content must stay fresh after publish/edit — never serve a Data Cache hit.
    const response = await fetch(`${API_URL}${path}`, {
      cache: "no-store",
    });
    if (!response.ok) {
      console.error(`[cms] ${path} failed: ${response.status}`);
      return null;
    }
    return (await response.json()) as T;
  } catch (error) {
    console.error(`[cms] ${path} error:`, error);
    return null;
  }
}

function mapSettings(raw: Record<string, unknown> | null | undefined): SiteSettings {
  if (!raw) {
    return {
      name: "Empire",
      title: "Empire",
      keyword: null,
      description: null,
      logoUrl: null,
      socialLinks: [],
      contactAddresses: [],
      contactPhones: [],
      contactEmails: [],
      updatedAtUtc: new Date().toISOString(),
    };
  }

  const socialLinks = (raw.socialLinks ?? raw.SocialLinks ?? []) as Array<
    Record<string, unknown>
  >;

  return {
    name: String(raw.name ?? raw.Name ?? "Empire"),
    title: String(raw.title ?? raw.Title ?? "Empire"),
    keyword: (raw.keyword ?? raw.Keyword ?? null) as string | null,
    description: (raw.description ?? raw.Description ?? null) as string | null,
    logoUrl: assetUrl((raw.logoUrl ?? raw.LogoUrl ?? null) as string | null),
    socialLinks: socialLinks.map((item) => ({
      platform: String(item.platform ?? item.Platform ?? ""),
      url: String(item.url ?? item.Url ?? ""),
    })),
    contactAddresses: (raw.contactAddresses ??
      raw.ContactAddresses ??
      []) as string[],
    contactPhones: (raw.contactPhones ?? raw.ContactPhones ?? []) as string[],
    contactEmails: (raw.contactEmails ?? raw.ContactEmails ?? []) as string[],
    updatedAtUtc: String(raw.updatedAtUtc ?? raw.UpdatedAtUtc ?? ""),
    languagePrefix: (raw.languagePrefix ??
      raw.LanguagePrefix ??
      null) as string | null,
  };
}

function mapLanguage(raw: Record<string, unknown>): Language {
  const directionRaw = String(
    raw.direction ?? raw.Direction ?? "ltr",
  ).toLowerCase();

  return {
    id: String(raw.id ?? raw.Id ?? ""),
    name: String(raw.name ?? raw.Name ?? ""),
    prefix: String(raw.prefix ?? raw.Prefix ?? "").toLowerCase(),
    isDefault: Boolean(raw.isDefault ?? raw.IsDefault ?? false),
    direction: directionRaw === "rtl" ? "rtl" : "ltr",
  };
}

function mapMenuItem(raw: Record<string, unknown>): MenuItemTree {
  const children = (raw.children ?? raw.Children ?? []) as Array<
    Record<string, unknown>
  >;

  return {
    id: String(raw.id ?? raw.Id ?? ""),
    groupId: String(raw.groupId ?? raw.GroupId ?? ""),
    title: String(raw.title ?? raw.Title ?? ""),
    url: String(raw.url ?? raw.Url ?? "#"),
    parentId: (raw.parentId ?? raw.ParentId ?? null) as string | null,
    data: (raw.data ?? raw.Data ?? null) as string | null,
    function: String(raw.function ?? raw.Function ?? "Custom"),
    targetId: (raw.targetId ?? raw.TargetId ?? null) as string | null,
    isMegaMenu: Boolean(raw.isMegaMenu ?? raw.IsMegaMenu ?? false),
    sortOrder: Number(raw.sortOrder ?? raw.SortOrder ?? 0),
    isActive: Boolean(raw.isActive ?? raw.IsActive ?? true),
    languagePrefix: (raw.languagePrefix ??
      raw.LanguagePrefix ??
      null) as string | null,
    imageUrl: assetUrl((raw.imageUrl ?? raw.ImageUrl ?? null) as string | null),
    children: children.map(mapMenuItem),
  };
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function mapEditorComponent(raw: Record<string, unknown>): EditorComponent {
  return {
    id: String(raw.id ?? raw.Id ?? ""),
    type: String(raw.type ?? raw.Type ?? ""),
    ordered: Number(raw.ordered ?? raw.Ordered ?? 0),
    publish: Boolean(raw.publish ?? raw.Publish ?? true),
    data: asRecord(raw.data ?? raw.Data),
    options: asRecord(raw.options ?? raw.Options),
  };
}

function mapEditorContainer(raw: Record<string, unknown>): EditorContainer {
  const components = (raw.components ?? raw.Components ?? []) as Array<
    Record<string, unknown>
  >;

  return {
    id: String(raw.id ?? raw.Id ?? ""),
    parentId: (raw.parentId ?? raw.ParentId ?? null) as string | null,
    component: (raw.component ?? raw.Component ?? null) as string | null,
    cols: (raw.cols ?? raw.Cols ?? null) as number | null,
    ordered: Number(raw.ordered ?? raw.Ordered ?? 0),
    publish: Boolean(raw.publish ?? raw.Publish ?? true),
    options: asRecord(raw.options ?? raw.Options),
    components: components.map(mapEditorComponent),
  };
}

function mapEditorTree(raw: Record<string, unknown> | null): EditorTree | null {
  if (!raw) return null;
  const containers = (raw.containers ?? raw.Containers ?? []) as Array<
    Record<string, unknown>
  >;

  return {
    id: String(raw.id ?? raw.Id ?? ""),
    component: String(raw.component ?? raw.Component ?? ""),
    parentId: String(raw.parentId ?? raw.ParentId ?? ""),
    publish: Boolean(raw.publish ?? raw.Publish ?? true),
    languagePrefix: (raw.languagePrefix ??
      raw.LanguagePrefix ??
      null) as string | null,
    containers: containers.map(mapEditorContainer),
  };
}

function mapPost(raw: Record<string, unknown>): PublicBlogGroupPost {
  return {
    id: String(raw.id ?? raw.Id ?? ""),
    title: String(raw.title ?? raw.Title ?? ""),
    slug: String(raw.slug ?? raw.Slug ?? ""),
    description: (raw.description ?? raw.Description ?? null) as string | null,
    createdAt: String(raw.createdAt ?? raw.CreatedAt ?? ""),
    thumbnailUrl: assetUrl(
      (raw.thumbnailUrl ?? raw.ThumbnailUrl ?? null) as string | null,
    ),
  };
}

function mapMediaMap(raw: unknown): Record<string, string> {
  if (!raw || typeof raw !== "object") return {};
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    const url = assetUrl(typeof value === "string" ? value : null);
    if (url) result[key] = url;
  }
  return result;
}

type HeaderApiResponse = {
  settings?: Record<string, unknown>;
  Settings?: Record<string, unknown>;
  languages?: Array<Record<string, unknown>>;
  Languages?: Array<Record<string, unknown>>;
  menu?: Array<Record<string, unknown>>;
  Menu?: Array<Record<string, unknown>>;
};

export async function getHeaderData(lang: string): Promise<HeaderData> {
  const raw = await fetchJson<HeaderApiResponse>(
    `/api/header?lang=${encodeURIComponent(lang)}`,
  );

  const settingsRaw = raw?.settings ?? raw?.Settings;
  const languagesRaw = raw?.languages ?? raw?.Languages ?? [];
  const menuRaw = raw?.menu ?? raw?.Menu ?? [];

  return {
    settings: mapSettings(settingsRaw),
    languages: languagesRaw.map(mapLanguage),
    menu: menuRaw.map(mapMenuItem),
  };
}

export async function getMenuBySlug(
  slug: string,
  lang: string,
): Promise<MenuItemTree[]> {
  const raw = await fetchJson<Array<Record<string, unknown>>>(
    `/api/public/menus/${encodeURIComponent(slug)}?lang=${encodeURIComponent(lang)}`,
  );

  if (!raw) return [];
  return raw.map(mapMenuItem);
}

export async function getBlogGroupBySlug(
  slug: string,
  lang: string,
): Promise<PublicBlogGroupPage | null> {
  const raw = await fetchJson<Record<string, unknown>>(
    `/api/public/blog-groups/${encodeURIComponent(slug)}?lang=${encodeURIComponent(lang)}`,
  );

  if (!raw) return null;

  const breadcrumbRaw = (raw.breadcrumb ?? raw.Breadcrumb ?? []) as Array<
    Record<string, unknown>
  >;
  const postsRaw = (raw.posts ?? raw.Posts ?? []) as Array<
    Record<string, unknown>
  >;
  const contentRaw = asRecord(raw.content ?? raw.Content);

  return {
    id: String(raw.id ?? raw.Id ?? ""),
    title: String(raw.title ?? raw.Title ?? ""),
    slug: String(raw.slug ?? raw.Slug ?? ""),
    keyword: (raw.keyword ?? raw.Keyword ?? null) as string | null,
    description: (raw.description ?? raw.Description ?? null) as string | null,
    parentId: (raw.parentId ?? raw.ParentId ?? null) as string | null,
    showTimestamp: Boolean(raw.showTimestamp ?? raw.ShowTimestamp ?? true),
    languagePrefix: (raw.languagePrefix ??
      raw.LanguagePrefix ??
      null) as string | null,
    thumbnailUrl: assetUrl(
      (raw.thumbnailUrl ?? raw.ThumbnailUrl ?? null) as string | null,
    ),
    breadcrumb: breadcrumbRaw.map((item) => ({
      id: String(item.id ?? item.Id ?? ""),
      title: String(item.title ?? item.Title ?? ""),
      slug: String(item.slug ?? item.Slug ?? ""),
    })),
    content: mapEditorTree(contentRaw),
    mediaMap: mapMediaMap(raw.mediaMap ?? raw.MediaMap),
    posts: postsRaw.map(mapPost),
  };
}

export async function getBlogPostBySlug(
  slug: string,
  lang: string,
): Promise<PublicBlogPostPage | null> {
  const raw = await fetchJson<Record<string, unknown>>(
    `/api/public/posts/${encodeURIComponent(slug)}?lang=${encodeURIComponent(lang)}`,
  );

  if (!raw) return null;

  const breadcrumbRaw = (raw.breadcrumb ?? raw.Breadcrumb ?? []) as Array<
    Record<string, unknown>
  >;
  const groupsRaw = (raw.groups ?? raw.Groups ?? []) as Array<
    Record<string, unknown>
  >;
  const tagsRaw = (raw.tags ?? raw.Tags ?? []) as Array<Record<string, unknown>>;
  const contentRaw = asRecord(raw.content ?? raw.Content);

  return {
    id: String(raw.id ?? raw.Id ?? ""),
    title: String(raw.title ?? raw.Title ?? ""),
    slug: String(raw.slug ?? raw.Slug ?? ""),
    keyword: (raw.keyword ?? raw.Keyword ?? null) as string | null,
    description: (raw.description ?? raw.Description ?? null) as string | null,
    metaTitle: (raw.metaTitle ?? raw.MetaTitle ?? null) as string | null,
    metaDescription: (raw.metaDescription ??
      raw.MetaDescription ??
      null) as string | null,
    commentsEnabled: Boolean(raw.commentsEnabled ?? raw.CommentsEnabled ?? false),
    showTimestamp: Boolean(raw.showTimestamp ?? raw.ShowTimestamp ?? true),
    createdAt: String(raw.createdAt ?? raw.CreatedAt ?? ""),
    updatedAt: String(raw.updatedAt ?? raw.UpdatedAt ?? ""),
    languagePrefix: (raw.languagePrefix ??
      raw.LanguagePrefix ??
      null) as string | null,
    thumbnailUrl: assetUrl(
      (raw.thumbnailUrl ?? raw.ThumbnailUrl ?? null) as string | null,
    ),
    breadcrumb: breadcrumbRaw.map((item) => ({
      id: String(item.id ?? item.Id ?? ""),
      title: String(item.title ?? item.Title ?? ""),
      slug: String(item.slug ?? item.Slug ?? ""),
    })),
    groups: groupsRaw.map(
      (item): PublicRelatedGroup => ({
        id: String(item.id ?? item.Id ?? ""),
        title: String(item.title ?? item.Title ?? ""),
        slug: String(item.slug ?? item.Slug ?? ""),
      }),
    ),
    tags: tagsRaw.map(
      (item): PublicRelatedTag => ({
        id: String(item.id ?? item.Id ?? ""),
        title: String(item.title ?? item.Title ?? ""),
      }),
    ),
    content: mapEditorTree(contentRaw),
    mediaMap: mapMediaMap(raw.mediaMap ?? raw.MediaMap),
  };
}
