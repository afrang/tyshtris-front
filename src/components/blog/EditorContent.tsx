import type { CSSProperties } from "react";
import { Link } from "@/i18n/navigation";
import { EditorGallery } from "@/components/blog/EditorGallery";
import { playbackKindFromUrl, youtubeEmbedUrl } from "@/lib/cms/mediaKind";
import type { EditorComponent, EditorContainer, EditorTree } from "@/lib/cms/types";

type Props = {
  tree: EditorTree;
  mediaMap: Record<string, string>;
  /** Force every container to full width (useful in narrow home columns). */
  stacked?: boolean;
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

function resolveMediaUrl(
  mediaMap: Record<string, string>,
  fileId: unknown,
  componentId: string,
): string | null {
  if (typeof fileId === "string" && fileId && mediaMap[fileId]) {
    return mediaMap[fileId];
  }
  return mediaMap[componentId] ?? null;
}

function imageStyles(options: Record<string, unknown>): {
  wrap: CSSProperties;
  image: CSSProperties;
} {
  const alignment =
    options.alignment === "left" || options.alignment === "right"
      ? options.alignment
      : "center";
  const fit = options.objectFit;
  const objectFit =
    fit === "contain" || fit === "fill" || fit === "none" || fit === "scale-down"
      ? fit
      : "cover";

  return {
    wrap: {
      display: "flex",
      justifyContent:
        alignment === "center"
          ? "center"
          : alignment === "right"
            ? "flex-end"
            : "flex-start",
      width: "100%",
    },
    image: {
      width: typeof options.width === "string" && options.width ? options.width : "100%",
      maxWidth:
        typeof options.maxWidth === "string" && options.maxWidth
          ? options.maxWidth
          : "100%",
      height: typeof options.height === "string" && options.height ? options.height : "auto",
      objectFit,
      borderRadius:
        typeof options.borderRadius === "string" ? options.borderRadius : undefined,
    },
  };
}

function ImageBlock({
  component,
  mediaMap,
}: {
  component: EditorComponent;
  mediaMap: Record<string, string>;
}) {
  const data = asRecord(component.data);
  const src = resolveMediaUrl(mediaMap, data.fileId, component.id);
  if (!src) return null;

  const styles = imageStyles(asRecord(component.options));
  const image = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={String(data.alt ?? "")}
      title={String(data.title ?? "")}
      className="h-auto max-w-full"
      style={styles.image}
    />
  );
  const link = typeof data.link === "string" ? data.link.trim() : "";

  return (
    <div className="overflow-hidden" style={styles.wrap}>
      {link ? (
        <a href={link} className="block max-w-full">
          {image}
        </a>
      ) : (
        image
      )}
    </div>
  );
}

function ButtonBlock({ component }: { component: EditorComponent }) {
  const data = asRecord(component.data);
  const options = asRecord(component.options);
  const alignment =
    options.alignment === "center" || options.alignment === "right"
      ? options.alignment
      : "left";
  const size = options.size === "small" || options.size === "large" ? options.size : "medium";
  const padding =
    size === "small" ? "0.45rem 0.85rem" : size === "large" ? "0.85rem 1.45rem" : "0.65rem 1.1rem";
  const fontSize = size === "small" ? "0.82rem" : size === "large" ? "1.05rem" : "0.92rem";

  return (
    <div
      style={{
        display: "flex",
        justifyContent:
          alignment === "center" ? "center" : alignment === "right" ? "flex-end" : "flex-start",
      }}
    >
      <a
        href={String(data.url ?? "#")}
        target={String(data.target ?? "_self")}
        className="inline-flex items-center justify-center font-semibold transition hover:brightness-95"
        style={{
          background:
            typeof options.backgroundColor === "string"
              ? options.backgroundColor
              : "var(--color-royal-purple)",
          color: typeof options.color === "string" ? options.color : "#ffffff",
          borderRadius:
            typeof options.borderRadius === "string" ? options.borderRadius : "6px",
          boxShadow: typeof options.boxShadow === "string" ? options.boxShadow : undefined,
          padding,
          fontSize,
        }}
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

function galleryUrls(
  component: EditorComponent,
  mediaMap: Record<string, string>,
): string[] {
  const data = asRecord(component.data);
  return String(data.mediaRevision ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean)
    .map((id) => mediaMap[id])
    .filter((url): url is string => Boolean(url));
}

function GalleryBlock({
  component,
  mediaMap,
}: {
  component: EditorComponent;
  mediaMap: Record<string, string>;
}) {
  const urls = galleryUrls(component, mediaMap);
  if (urls.length === 0) return null;

  return (
    <EditorGallery
      urls={urls}
      data={asRecord(component.data)}
      options={asRecord(component.options)}
    />
  );
}

function VideoBlock({
  component,
  mediaMap,
}: {
  component: EditorComponent;
  mediaMap: Record<string, string>;
}) {
  const data = asRecord(component.data);
  const options = asRecord(component.options);
  const aspectRatio =
    typeof options.aspectRatio === "string" && options.aspectRatio
      ? options.aspectRatio
      : "16/9";
  const title =
    (typeof data.title === "string" && data.title) ||
    (typeof data.fileName === "string" && data.fileName) ||
    "Video";

  if (data.sourceType !== "file") {
    const embed = youtubeEmbedUrl(String(data.url ?? ""));
    if (!embed) return null;
    return (
      <div className="editor-media-frame" style={{ aspectRatio }}>
        <iframe
          src={embed}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  const src = resolveMediaUrl(mediaMap, data.fileId, component.id);
  if (!src) return null;

  const kind =
    data.mediaKind === "audio" || data.mediaKind === "video"
      ? data.mediaKind
      : playbackKindFromUrl(src);

  if (kind === "audio") {
    return <audio className="editor-media-audio" controls src={src} title={title} />;
  }

  return (
    <div className="editor-media-frame" style={{ aspectRatio }}>
      <video controls src={src} title={title} />
    </div>
  );
}

function DividerBlock({ component }: { component: EditorComponent }) {
  const options = asRecord(component.options);
  const data = asRecord(component.data);
  const lineStyle =
    options.style === "dashed" || options.style === "dotted" ? options.style : "solid";
  const color = typeof options.color === "string" ? options.color : "#d5d7e2";
  const thickness = typeof options.thickness === "string" ? options.thickness : "1px";
  const width = typeof options.width === "string" ? options.width : "100%";
  const label = String(options.text || data.text || "").trim();
  const line = {
    borderTopStyle: lineStyle,
    borderTopWidth: thickness,
    borderTopColor: color,
  } as const;

  if (options.contentMode === "text" && label) {
    return (
      <div
        className="editor-divider"
        style={{
          gap: typeof options.gap === "string" ? options.gap : "12px",
          width,
        }}
      >
        <span className="editor-divider-line" style={line} />
        <span
          className="editor-divider-label"
          style={{
            color: typeof options.contentColor === "string" ? options.contentColor : "#6f7280",
          }}
        >
          {label}
        </span>
        <span className="editor-divider-line" style={line} />
      </div>
    );
  }

  return <hr style={{ border: 0, width, margin: 0, ...line }} />;
}

function htmlHasText(html: string): boolean {
  return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/gi, " ").trim().length > 0;
}

function componentIsVisible(
  component: EditorComponent,
  mediaMap: Record<string, string>,
): boolean {
  if (!component.publish) return false;
  const data = asRecord(component.data);

  switch (component.type) {
    case "title":
    case "quote":
      return String(data.text ?? "").trim().length > 0;
    case "text":
    case "html":
      return htmlHasText(String(data.html ?? ""));
    case "image":
      return Boolean(resolveMediaUrl(mediaMap, data.fileId, component.id));
    case "gallery":
      return galleryUrls(component, mediaMap).length > 0;
    case "video":
      if (data.sourceType === "file") {
        return Boolean(resolveMediaUrl(mediaMap, data.fileId, component.id));
      }
      return Boolean(youtubeEmbedUrl(String(data.url ?? "")));
    case "button":
      return String(data.text ?? "").trim().length > 0;
    case "spacer":
    case "divider":
      return true;
    default:
      return false;
  }
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
    case "video":
      return <VideoBlock component={component} mediaMap={mediaMap} />;
    case "spacer":
      return <SpacerBlock component={component} />;
    case "divider":
      return <DividerBlock component={component} />;
    default:
      return null;
  }
}

function normalizeCols(cols: number | null | undefined): number {
  const value = Number(cols);
  if (value === 4 || value === 6 || value === 12) return value;
  return 12;
}

function placeContainers(
  containers: EditorContainer[],
  mediaMap: Record<string, string>,
  stacked: boolean,
): Array<{ container: EditorContainer; span: number }> {
  const visible = containers
    .filter((container) => container.publish)
    .filter((container) =>
      container.components.some((component) => componentIsVisible(component, mediaMap)),
    )
    .map((container) => ({
      container,
      span: stacked ? 12 : normalizeCols(container.cols),
    }));

  if (stacked) return visible;

  const placed: Array<{ container: EditorContainer; span: number }> = [];
  let rowSum = 0;

  for (const item of visible) {
    const span = Math.min(12, item.span);
    if (rowSum > 0 && rowSum + span > 12) {
      placed[placed.length - 1].span += 12 - rowSum;
      rowSum = 0;
    }
    placed.push({ container: item.container, span });
    rowSum += span;
    if (rowSum >= 12) rowSum = 0;
  }

  if (rowSum > 0 && rowSum < 12 && placed.length > 0) {
    placed[placed.length - 1].span += 12 - rowSum;
  }

  return placed;
}

function ContainerBlock({
  container,
  mediaMap,
  span,
}: {
  container: EditorContainer;
  mediaMap: Record<string, string>;
  span: number;
}) {
  const components = container.components
    .slice()
    .sort((a, b) => a.ordered - b.ordered)
    .filter((component) => componentIsVisible(component, mediaMap));

  if (components.length === 0) return null;

  return (
    <section
      className="editor-content-container flex min-w-0 flex-col gap-3"
      style={{
        gridColumn: `span ${span}`,
        ...styleFromContainerOptions(container.options),
      }}
    >
      {components.map((component) => (
        <div key={component.id}>
          <ComponentBlock component={component} mediaMap={mediaMap} />
        </div>
      ))}
    </section>
  );
}

export function EditorContent({ tree, mediaMap, stacked = false }: Props) {
  if (!tree.publish) return null;

  const placed = placeContainers(
    tree.containers.slice().sort((a, b) => a.ordered - b.ordered),
    mediaMap,
    stacked,
  );

  return (
    <div
      className={
        stacked
          ? "editor-content editor-content--stacked"
          : "editor-content"
      }
      translate="no"
    >
      {placed.map(({ container, span }) => (
        <ContainerBlock
          key={container.id}
          container={container}
          mediaMap={mediaMap}
          span={span}
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
        {dateLabel ? (
          <time className="text-xs font-medium tracking-wide text-zinc-500 uppercase">
            {dateLabel}
          </time>
        ) : null}

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
