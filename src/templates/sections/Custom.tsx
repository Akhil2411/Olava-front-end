import type React from "react";
import type { SiteSection } from "@/lib/api/types";
import { images, imageEl, list, mapsHref, safeHref, str, videoEmbedUrl } from "../content";
import { Editable, SiteLink } from "../Editable";
import type { RenderContext } from "../types";
import { SectionShell } from "./SectionShell";
import { VideoBlockView, blockVideoOf } from "../designs/shared/VideoBlockView";

type Block = Record<string, unknown> & { id?: string; type?: string; hidden?: boolean };

/** A host-built section: an optional title plus ordered blocks. Only the known block types render. */
export function Custom({ ctx, section, anchor }: { ctx: RenderContext; section: SiteSection; anchor: string }) {
  const blocks = list<Block>(section.content, "blocks").filter((b) => ctx.mode !== "public" || !b.hidden);
  if (blocks.length === 0 && ctx.mode === "public") return null;
  return (
    <SectionShell ctx={ctx} section={section} anchor={anchor} name="Custom section" intro={false}>
      <CustomBlocks ctx={ctx} section={section} />
    </SectionShell>
  );
}

/** The blocks of a custom section, for use inside any design's own section frame. */
export function CustomBlocks({ ctx, section, className = "mx-auto max-w-2xl space-y-6" }: { ctx: RenderContext; section: SiteSection; className?: string }) {
  const blocks = list<Block>(section.content, "blocks").filter((b) => ctx.mode !== "public" || !b.hidden);
  return (
    <div className={className}>
      {blocks.length === 0 ? (
        <Editable ctx={ctx} section={section} field="blocks" label="Content blocks" show={false} />
      ) : blocks.map((block, i) => {
        const id = typeof block.id === "string" ? block.id : String(i);
        const hidden = block.hidden === true;
        const rendered = renderBlock(ctx, block);
        return (
          <Editable key={id} ctx={ctx} section={section} field={`blocks.${id}`} label={`${block.type ?? "Block"} block`}
            show={!hidden && rendered !== null} hidden={hidden}>
            {rendered}
          </Editable>
        );
      })}
    </div>
  );
}

/** True when a custom section has nothing to show on the live site. */
export function customIsEmpty(ctx: RenderContext, section: SiteSection) {
  return list<Block>(section.content, "blocks").filter((b) => ctx.mode !== "public" || !b.hidden).length === 0;
}

function renderBlock(ctx: RenderContext, block: Block): React.ReactNode {
  switch (block.type) {
    case "heading": {
      const text = str(block, "text");
      return text ? <h3 className="text-center font-[family-name:var(--s-heading)] text-3xl">{text}</h3> : null;
    }
    case "text": {
      const text = str(block, "text");
      return text ? <p className="whitespace-pre-line text-center leading-relaxed">{text}</p> : null;
    }
    case "image": {
      const img = imageEl({ image: block });
      const url = img.ref ? ctx.imageUrl({ ref: img.ref }, "large") : null;
      if (!url) return ctx.mode === "public" ? null : <p className="text-center text-sm text-[var(--s-muted)]">Choose a photo for this block.</p>;
      return (
        <figure>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt={str(block, "alt") ?? ""} loading="lazy" width={img.width ?? undefined} height={img.height ?? undefined}
            className="w-full rounded-2xl object-cover" />
          {str(block, "caption") ? <figcaption className="mt-2 text-center text-sm text-[var(--s-muted)]">{str(block, "caption")}</figcaption> : null}
        </figure>
      );
    }
    case "gallery": {
      const photos = images(block.images);
      if (photos.length === 0) return ctx.mode === "public" ? null : <p className="text-center text-sm text-[var(--s-muted)]">Choose photos for this gallery.</p>;
      return (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {photos.map((p, i) => (
            <li key={p.ref ?? i}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={ctx.imageUrl({ ref: p.ref! }, "thumb") ?? undefined} alt={p.caption ?? `Photo ${i + 1}`} loading="lazy"
                className="aspect-square w-full rounded-xl object-cover" />
            </li>
          ))}
        </ul>
      );
    }
    case "video": {
      const uploaded = blockVideoOf(block);
      if (uploaded.src) return <VideoBlockView ctx={ctx} video={uploaded} title={str(block, "title") ?? "Video"} />;
      const src = videoEmbedUrl(block.provider, block.videoId);
      if (!src) return ctx.mode === "public" ? null : <p className="text-center text-sm text-[var(--s-muted)]">Upload a video, or paste a YouTube or Vimeo link.</p>;
      const title = str(block, "title") ?? "Video";
      return (
        <div className="relative aspect-video overflow-hidden rounded-2xl bg-black/10">
          <iframe src={src} title={title} loading="lazy" allowFullScreen referrerPolicy="strict-origin-when-cross-origin"
            allow="accelerometer; encrypted-media; fullscreen; gyroscope; picture-in-picture"
            className={`absolute inset-0 h-full w-full ${ctx.mode === "edit" ? "pointer-events-none" : ""}`} />
        </div>
      );
    }
    case "button": {
      const labelText = str(block, "label");
      const href = safeHref(block.url, true);
      if (!labelText || !href) return null;
      return (
        <div className="text-center">
          <SiteLink ctx={ctx} href={href} newTab={href.startsWith("https:")}
            className="inline-block rounded-full bg-[var(--s-accent)] px-6 py-3 text-sm font-semibold text-[var(--s-bg)]">
            {labelText}
          </SiteLink>
        </div>
      );
    }
    case "divider":
      return <div role="separator" className="flex items-center justify-center gap-3 py-2 text-[var(--s-accent)]"><span className="h-px w-16 bg-current opacity-50" />✦<span className="h-px w-16 bg-current opacity-50" /></div>;
    case "map": {
      const name = str(block, "name");
      if (!name) return null;
      const address = str(block, "address");
      return (
        <div className="rounded-2xl border border-[var(--s-accent)]/30 bg-[var(--s-surface)] p-6 text-center">
          <p className="font-[family-name:var(--s-heading)] text-2xl">{name}</p>
          {address ? <p className="mt-1 whitespace-pre-line text-sm text-[var(--s-muted)]">{address}</p> : null}
          <SiteLink ctx={ctx} href={mapsHref(name, address, block.url)}
            className="mt-4 inline-flex items-center gap-1 rounded-full border-[1.5px] border-[var(--s-accent)] px-5 py-2 text-sm font-semibold text-[var(--s-accent)]">
            <span aria-hidden="true">📍</span> Open in Maps<span className="sr-only">: {name}</span>
          </SiteLink>
        </div>
      );
    }
    default:
      return null;
  }
}
