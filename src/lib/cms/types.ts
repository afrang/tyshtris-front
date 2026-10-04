export type SocialLink = {
  platform: string;
  url: string;
};

export type SiteSettings = {
  name: string;
  title: string;
  keyword: string | null;
  description: string | null;
  logoUrl: string | null;
  socialLinks: SocialLink[];
  contactAddresses: string[];
  contactPhones: string[];
  contactEmails: string[];
  updatedAtUtc: string;
  languagePrefix?: string | null;
};

export type Language = {
  id: string;
  name: string;
  prefix: string;
  isDefault: boolean;
  direction: "ltr" | "rtl";
};

export type MenuItemTree = {
  id: string;
  groupId: string;
  title: string;
  url: string;
  parentId: string | null;
  data: string | null;
  function: string;
  targetId: string | null;
  isMegaMenu: boolean;
  sortOrder: number;
  isActive: boolean;
  languagePrefix?: string | null;
  imageUrl: string | null;
  children: MenuItemTree[];
};

export type HeaderData = {
  settings: SiteSettings;
  languages: Language[];
  menu: MenuItemTree[];
};

export type BlogGroupBreadcrumbItem = {
  id: string;
  title: string;
  slug: string;
};

export type PublicBlogGroupPost = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  createdAt: string;
  thumbnailUrl: string | null;
};

export type EditorComponent = {
  id: string;
  type: string;
  ordered: number;
  publish: boolean;
  data: Record<string, unknown> | null;
  options: Record<string, unknown> | null;
};

export type EditorContainer = {
  id: string;
  parentId: string | null;
  component: string | null;
  cols: number | null;
  ordered: number;
  publish: boolean;
  options: Record<string, unknown> | null;
  components: EditorComponent[];
};

export type EditorTree = {
  id: string;
  component: string;
  parentId: string;
  publish: boolean;
  languagePrefix?: string | null;
  containers: EditorContainer[];
};

export type PublicBlogGroupPage = {
  id: string;
  title: string;
  slug: string;
  keyword: string | null;
  description: string | null;
  parentId: string | null;
  showTimestamp: boolean;
  languagePrefix: string | null;
  thumbnailUrl: string | null;
  breadcrumb: BlogGroupBreadcrumbItem[];
  content: EditorTree | null;
  mediaMap: Record<string, string>;
  posts: PublicBlogGroupPost[];
};

export type PublicRelatedGroup = {
  id: string;
  title: string;
  slug: string;
};

export type PublicRelatedTag = {
  id: string;
  title: string;
};

export type PublicBlogPostPage = {
  id: string;
  title: string;
  slug: string;
  keyword: string | null;
  description: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  commentsEnabled: boolean;
  showTimestamp: boolean;
  createdAt: string;
  updatedAt: string;
  languagePrefix: string | null;
  thumbnailUrl: string | null;
  breadcrumb: BlogGroupBreadcrumbItem[];
  groups: PublicRelatedGroup[];
  tags: PublicRelatedTag[];
  content: EditorTree | null;
  mediaMap: Record<string, string>;
};

export type MegaMenuPost = PublicBlogGroupPost;

export type MenuItemWithMega = MenuItemTree & {
  isMegaGroup?: true;
  megaPosts?: MegaMenuPost[];
  megaGroupSlug?: string | null;
  megaGroupTitle?: string | null;
  children: MenuItemWithMega[];
};
