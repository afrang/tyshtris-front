import type { CSSProperties } from "react";
import { Link } from "@/i18n/navigation";
import { EditorGallery } from "@/components/blog/EditorGallery";
import type { EditorComponent, EditorContainer, EditorTree } from "@/lib/cms/types";

type Props = {
  tree: EditorTree;
  mediaMap: Record<string, string>;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function styleFromOptions(options: Record<string, unknown> | null | undefined): CSSProperties {
  const o = options ?? {};
  const style: CSSProperties = {};
  if (typeof o.color === "string") style.color = o.color;
  if (typeof o.fontSize === "string") style.fontSize = o.fontSize;
  if (typeof o.fontWeight === "number") style.fontWeight = o.fontWeight;
  if (typeof o.textAlign === "string") {
    style.textAlign = o.textAlign as CSSProperties["textAlign"];
  }
  if (typeof o.lineHeight === "number" || typeof o.lineHeight === "string") {
    style.lineHeight = o.lineHeight as CSSProperties["lineHeight"];
  }
  return style;
}

function TitleBlock({ component }: { component: EditorComponent }) {
  const data = asRecord(component.data);
  const options = asRecord(component.options);
  const text = String(data.text ?? "");
  const heading = String(options.headingType ?? "h2").toLowerCase();
  const Tag = (["h1", "h2", "h3", "h4", "h5", "h6"].includes(heading)
    ? heading
    : "h2") as "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

  return <Tag style={styleFromOptions(options)}>{text}</Tag>;
}

function TextBlock({ component }: { component: EditorComponent }) {
  const data = asRecord(component.data);
  const options = asRecord(component.options);
  return (
    <div
      className="et-text leading-7 text-zinc-700 [&_a]:text-[var(--color-royal-purple)] [&_p]:mb-3"
      translate="no"
      style={styleFromOptions(options)}
      dangerouslySetInnerHTML={{ __html: String(data.html ?? "") }}
    />
  );
}

function ImageBlock({
  component,
  mediaMap,
}: {
  component: EditorComponent;
  mediaMap: Record<string, string>;
}) {
  const data = asRecord(component.data);
  const fileId = typeof data.fileId === "string" ? data.fileId : null;
  const src = fileId ? mediaMap[fileId] : null;
  if (!src) return null;

  return (
    <div className="overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={String(data.alt ?? "")}
        title={String(data.title ?? "")}
        className="h-auto w-full"
      />
    </div>
  );
}

function ButtonBlock({ component }: { component: EditorComponent }) {
  const data = asRecord(component.data);
  return (
    <div>
      <a
        href={String(data.url ?? "#")}
        target={String(data.target ?? "_self")}
        className="inline-flex items-center justify-center bg-[var(--color-royal-purple)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--color-royal-purple-deep)]"
      >
        {String(data.text ?? "Button")}
      </a>
    </div>
  );
}

function QuoteBlock({ component }: { component: EditorComponent }) {
  const data = asRecord(component.data);
  return (
    <blockquote className="border-s-4 border-[var(--color-gold)] ps-4 text-zinc-700">
      <p className="text-lg leading-8">{String(data.text ?? "")}</p>
      {data.cite ? (
        <cite className="mt-2 block text-sm not-italic text-zinc-500">
          {String(data.cite)}
        </cite>
      ) : null}
    </blockquote>
  );
}

function styleFromContainerOptions(
  options: Record<string, unknown> | null | undefined,
): CSSProperties {
  const o = options ?? {};
  const style: CSSProperties = {};
  if (typeof o.background === "string" && o.background) {
    style.background = o.background;
  }
  if (typeof o.borderRadius === "string") style.borderRadius = o.borderRadius;
  if (typeof o.paddingTop === "string") style.paddingTop = o.paddingTop;
  if (typeof o.paddingRight === "string") style.paddingRight = o.paddingRight;
  if (typeof o.paddingBottom === "string") style.paddingBottom = o.paddingBottom;
  if (typeof o.paddingLeft === "string") style.paddingLeft = o.paddingLeft;
  if (typeof o.gap === "string") style.gap = o.gap;
  if (typeof o.minHeight === "string" && o.minHeight) {
    style.minHeight = o.minHeight;
  }
  return style;
}

function GalleryBlock({
  component,
  mediaMap,
}: {
  component: EditorComponent;
  mediaMap: Record<string, string>;
}) {
  const data = asRecord(component.data);
  const revision = String(data.mediaRevision ?? "");
  const urls = revision
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean)
    .map((id) => mediaMap[id])
    .filter((url): url is string => Boolean(url));

  if (urls.length === 0) return null;

  return (
    <EditorGallery
      urls={urls}
      data={data}
      options={asRecord(component.options)}
    />
  );
}

function SpacerBlock({ component }: { component: EditorComponent }) {
  const options = asRecord(component.options);
  const height = asRecord(options.height);
  const value = String(height.desktop ?? options.height ?? "40px");
  return <div style={{ height: value }} />;
}

function ComponentBlock({
  component,
  mediaMap,
}: {
  component: EditorComponent;
  mediaMap: Record<string, string>;
}) {
  if (!component.publish) return null;

  switch (component.type) {
    case "title":
      return <TitleBlock component={component} />;
    case "text":
    case "html":
      return <TextBlock component={component} />;
    case "image":
      return <ImageBlock component={component} mediaMap={mediaMap} />;
    case "button":
      return <ButtonBlock component={component} />;
    case "quote":
      return <QuoteBlock component={component} />;
    case "gallery":
      return <GalleryBlock component={component} mediaMap={mediaMap} />;
    case "spacer":
      return <SpacerBlock component={component} />;
    case "divider":
      return <hr className="border-zinc-200" />;
    default:
      return null;
  }
}

function ContainerBlock({
  container,
  mediaMap,
}: {
  container: EditorContainer;
  mediaMap: Record<string, string>;
}) {
  if (!container.publish) return null;
  const cols =
    container.cols === 4 || container.cols === 6 || container.cols === 12
      ? container.cols
      : 12;

  return (
    <section
      className="flex min-w-0 flex-col gap-3"
      style={{
        gridColumn: `span ${cols}`,
        ...styleFromContainerOptions(container.options),
      }}
    >
      {container.components
        .slice()
        .sort((a, b) => a.ordered - b.ordered)
        .map((component) => (
          <div key={component.id}>
            <ComponentBlock component={component} mediaMap={mediaMap} />
          </div>
        ))}
    </section>
  );
}

export function EditorContent({ tree, mediaMap }: Props) {
  if (!tree.publish) return null;

  return (
    <div className="grid grid-cols-12 gap-5" translate="no">
      {tree.containers
        .slice()
        .sort((a, b) => a.ordered - b.ordered)
        .map((container) => (
          <ContainerBlock
            key={container.id}
            container={container}
            mediaMap={mediaMap}
          />
        ))}
    </div>
  );
}

export function PostThumbnailCard({
  href,
  title,
  description,
  thumbnailUrl,
  dateLabel,
  emptyImageLabel = "No picture",
  readLabel = "Read post",
}: {
  href: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  dateLabel?: string | null;
  emptyImageLabel?: string;
  readLabel?: string;
}) {
  return (
    <Link
      href={href}
      className="post-thumb group flex h-full flex-col border border-zinc-200 bg-white outline-none transition duration-300 hover:border-[var(--color-royal-purple)]/30 focus-visible:border-[var(--color-royal-purple)]/40"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-zinc-100">
        {thumbnailUrl ? (
          // CMS uploads may come from different API hosts/ports in local dev.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumbnailUrl}
            alt=""
            className="h-full w-full object-cover transition duration-500 ease-out group-hover:scale-[1.04] group-focus-visible:scale-[1.04]"
          />
        ) : (
          <div
            className="post-thumb-empty flex h-full w-full flex-col items-center justify-center gap-2"
            role="img"
            aria-label={emptyImageLabel}
          >
            <svg
              className="relative z-[1] h-10 w-10 text-[var(--color-royal-purple)]/35 transition duration-300 group-hover:text-[var(--color-royal-purple)]/55"
              viewBox="0 0 48 48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <rect
                x="6"
                y="10"
                width="36"
                height="28"
                rx="3"
                stroke="currentColor"
                strokeWidth="1.75"
              />
              <circle cx="17" cy="20" r="3" fill="currentColor" opacity="0.7" />
              <path
                d="M8 32 L18 24 L24 29 L31 21 L40 32"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinejoin="round"
                fill="none"
              />
            </svg>
            <span className="relative z-[1] text-[0.65rem] font-medium tracking-[0.08em] text-zinc-400 uppercase">
              {emptyImageLabel}
            </span>
          </div>
        )}
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[rgba(26,10,46,0.45)] via-transparent to-transparent opacity-0 transition duration-300 group-hover:opacity-100 group-focus-visible:opacity-100"
          aria-hidden="true"
        />
        <span
          className="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 origin-start scale-x-0 bg-[var(--color-gold)] transition duration-300 ease-out group-hover:scale-x-100 group-focus-visible:scale-x-100"
          aria-hidden="true"
        />
      </div>

      <div className="flex flex-1 flex-col gap-2.5 px-4 pb-4 pt-3.5">
      

        <h3 className="text-lg font-semibold leading-snug text-balance text-zinc-900 transition duration-300 group-hover:text-[var(--color-royal-purple)] group-focus-visible:text-[var(--color-royal-purple)]">
          {title}
        </h3>

        {description ? (
          <p className="line-clamp-2 text-sm leading-6 text-zinc-600">
            {description}
          </p>
        ) : null}

        <span className="mt-auto inline-flex items-center gap-1.5 pt-2 text-sm font-medium text-[var(--color-royal-purple)]">
          {readLabel}
          <svg
            className="h-3.5 w-3.5 transition duration-300 group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M3 8h9M8.5 4.5 12 8l-3.5 3.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </div>
    </Link>
  );
}
