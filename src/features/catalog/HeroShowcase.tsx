"use client";

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import type { Template } from "@/lib/api/types";
import { cn } from "@/lib/utils/cn";
import { TemplateThumb } from "./TemplateThumb";

type Kind = "laptop" | "tablet" | "phone";

/** Real screen sizes the template renders at, so each device shows its true layout. */
const SCREEN: Record<Kind, [number, number]> = { laptop: [1440, 900], tablet: [820, 1180], phone: [390, 844] };

/** Bezel around each screen, in screen pixels before scaling. */
const BEZEL: Record<Kind, { x: number; top: number; bottom: number; radius: number; screenRadius: number }> = {
  laptop: { x: 26, top: 30, bottom: 26, radius: 30, screenRadius: 6 },
  tablet: { x: 26, top: 26, bottom: 26, radius: 56, screenRadius: 26 },
  phone: { x: 15, top: 15, bottom: 15, radius: 66, screenRadius: 52 },
};

type Place = { left: number; top: number; width: number };
/**
 * Where each device sits, as fractions of the stage width: the laptop at the back in the middle, the phone in
 * front of its left corner, the tablet in front of its right. On narrow stages the same scene, with the phone
 * and tablet a little larger so they stay recognisable.
 */
const WIDE: Record<Kind, Place> = {
  laptop: { left: 0.12, top: 0.03, width: 0.7 },
  phone: { left: 0.01, top: 0.33, width: 0.175 },
  tablet: { left: 0.675, top: 0.19, width: 0.31 },
};
const NARROW: Record<Kind, Place> = {
  laptop: { left: 0.09, top: 0.03, width: 0.82 },
  phone: { left: 0, top: 0.37, width: 0.235 },
  tablet: { left: 0.64, top: 0.3, width: 0.36 },
};
/** The laptop's base (keyboard deck) is wider than its lid and this tall, as fractions of the lid width. */
const BASE_OVERHANG = 0.07, BASE_HEIGHT = 0.04;

function useStageWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setW(el.clientWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return { ref, w };
}

/** Load the live pages only once the page has settled and the showcase is on screen. */
function useWhenVisible(target: React.RefObject<HTMLElement | null>) {
  const [go, setGo] = useState(false);
  useEffect(() => {
    const el = target.current;
    if (!el) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      timer = setTimeout(() => setGo(true), 700);
    }, { rootMargin: "200px" });
    io.observe(el);
    return () => { io.disconnect(); clearTimeout(timer); };
  }, [target]);
  return go;
}

const scaleOf = (k: Kind, width: number) => width / (SCREEN[k][0] + BEZEL[k].x * 2);
const bodyHeight = (k: Kind, width: number) => (SCREEN[k][1] + BEZEL[k].top + BEZEL[k].bottom) * scaleOf(k, width);

/**
 * The home page's device showcase: one wedding website, live, on a laptop, a tablet and a phone (sample
 * content, already opened, silent). Each screen shows the template's picture first and fades to the live page
 * once it has loaded. Decorative: one description for screen readers; the screens can't be focused or clicked.
 */
export function HeroShowcase({ template }: { template: Template }) {
  const { ref, w } = useStageWidth();
  const live = useWhenVisible(ref);
  const narrow = w > 0 && w < 480;
  const place = narrow ? NARROW : WIDE;
  const lidH = bodyHeight("laptop", place.laptop.width * w);
  const laptopH = lidH + BASE_HEIGHT * place.laptop.width * w;
  const stageH = w ? Math.max(
    place.laptop.top * w + laptopH,
    place.phone.top * w + bodyHeight("phone", place.phone.width * w),
    place.tablet.top * w + bodyHeight("tablet", place.tablet.width * w),
  ) + w * 0.03 : 0;

  return (
    <div ref={ref} role="img" aria-label={`A wedding website made with Olava (${template.name}), shown on a laptop, a tablet and a phone`}
      data-showcase={narrow ? "narrow" : "wide"}
      className={cn("relative mx-auto w-full max-w-[720px]", !w && "aspect-[1/0.66]")} style={w ? { height: stageH } : undefined}>
      {/* Soft pink disc behind the laptop, and a few hand-drawn accents. */}
      <div aria-hidden="true" className="pointer-events-none absolute rounded-full bg-[radial-gradient(circle_at_40%_40%,#fbe1ec,#f7d3e3_60%,rgba(247,211,227,0))]"
        style={{ left: w * 0.3, top: -w * 0.06, width: w * 0.7, height: w * 0.7 }} />
      {w ? <Accents w={w} /> : null}
      {w ? (
        <>
          <Device kind="laptop" template={template} live={live} order={0} box={{ ...px(place.laptop, w), z: 1 }} />
          <Device kind="tablet" template={template} live={live} order={1} box={{ ...px(place.tablet, w), z: 2 }} />
          <Device kind="phone" template={template} live={live} order={2} box={{ ...px(place.phone, w), z: 3 }} />
        </>
      ) : null}
    </div>
  );
}

const px = (p: Place, w: number) => ({ left: p.left * w, top: p.top * w, width: p.width * w });

function Accents({ w }: { w: number }) {
  const s = Math.max(w / 640, 0.5);
  return (
    <>
      {/* Three little "sparkle" strokes off the laptop's top-left corner. */}
      <svg aria-hidden="true" viewBox="0 0 40 40" className="pointer-events-none absolute text-pink-dark/70"
        style={{ left: w * 0.045, top: -w * 0.005, width: 34 * s, height: 34 * s }} fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
        <path d="M26 4 L24 14" /><path d="M10 10 L18 18" /><path d="M4 28 L15 27" />
      </svg>
      {/* An outlined heart, top right. */}
      <svg aria-hidden="true" viewBox="0 0 32 30" className="pointer-events-none absolute text-pink-dark/60"
        style={{ left: w * 0.9, top: w * 0.04, width: 26 * s, height: 24 * s }} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round">
        <path d="M16 27 C6 20 2 14 3.5 9 C5 4 11 2.5 16 8 C21 2.5 27 4 28.5 9 C30 14 26 20 16 27 Z" transform="rotate(-12 16 15)" />
      </svg>
    </>
  );
}

function Device({ kind, template, live, order, box }: {
  kind: Kind; template: Template; live: boolean; order: number; box: { left: number; top: number; width: number; z: number };
}) {
  const [sw, sh] = SCREEN[kind];
  const b = BEZEL[kind];
  const s = scaleOf(kind, box.width);
  const lidH = bodyHeight(kind, box.width);
  const baseH = kind === "laptop" ? BASE_HEIGHT * box.width : 0;
  const [ready, setReady] = useState(false);
  const outer: CSSProperties = {
    left: box.left, top: box.top, width: box.width, height: lidH + baseH, zIndex: box.z, animationDelay: `${order * 160}ms`,
  };
  const shadow = kind === "laptop"
    ? "0 2px 0 1px #3a363c inset, 0 40px 70px -40px rgba(90,30,60,0.5)"
    : "0 0 0 1.5px #3a363c inset, 0 34px 60px -26px rgba(70,20,45,0.55), 0 10px 22px -10px rgba(70,20,45,0.35)";

  return (
    <div className="showcase-device absolute" style={outer} data-device={kind}>
      <Body kind={kind} radius={b.radius * s} height={lidH} shadow={shadow}>
        {/* Camera: a notch on the laptop, a dynamic island on the phone, a dot on the tablet. */}
        {kind === "laptop" ? <span className="absolute left-1/2 top-0 z-10 -translate-x-1/2 rounded-b-[30%] bg-[#141215]" style={{ width: 150 * s, height: (b.top + 20) * s }} /> : null}
        {kind === "phone" ? <span className="absolute left-1/2 z-10 -translate-x-1/2 rounded-full bg-black" style={{ top: (b.top + 12) * s, width: 112 * s, height: 32 * s }} /> : null}
        {kind === "tablet" ? <span className="absolute left-1/2 z-10 -translate-x-1/2 rounded-full bg-[#2b282d]" style={{ top: 9 * s, width: 9 * s, height: 9 * s }} /> : null}
        <div className="absolute overflow-hidden bg-white" style={{ left: b.x * s, top: b.top * s, width: sw * s, height: sh * s, borderRadius: b.screenRadius * s }}>
          <TemplateThumb template={template} className="absolute inset-0 aspect-auto size-full rounded-none object-cover object-top" />
          {live ? (
            <iframe title={`${template.name} on a ${kind}`} src={`/template-sample/${encodeURIComponent(template.key)}?showcase=1`}
              tabIndex={-1} aria-hidden="true" scrolling="no" loading="lazy"
              onLoad={() => setTimeout(() => setReady(true), 900)}
              className={cn("pointer-events-none absolute left-0 top-0 origin-top-left border-0 bg-white transition-opacity duration-700", ready ? "opacity-100" : "opacity-0")}
              style={{ width: sw, height: sh, transform: `scale(${s})` }} />
          ) : null}
          {/* A faint sheen across the glass. */}
          <span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,0.10),rgba(255,255,255,0)_38%)]" />
        </div>
      </Body>
      {kind === "laptop" ? <LaptopBase width={box.width} height={baseH} top={lidH} /> : null}
    </div>
  );
}

function Body({ kind, radius, height, shadow, children }: { kind: Kind; radius: number; height: number; shadow: string; children: ReactNode }) {
  return (
    <div className={cn("absolute inset-x-0 top-0 overflow-hidden", kind === "laptop" ? "bg-[#1b191d]" : "bg-[#141215]")}
      style={{ height, borderRadius: kind === "laptop" ? `${radius}px ${radius}px ${radius * 0.25}px ${radius * 0.25}px` : radius, boxShadow: shadow }}>
      {children}
    </div>
  );
}

/** The keyboard deck seen edge-on: a little wider than the lid, silver, with the opening notch in the middle. */
function LaptopBase({ width, height, top }: { width: number; height: number; top: number }) {
  const over = BASE_OVERHANG * width;
  return (
    <div aria-hidden="true" className="absolute" style={{ left: -over, top, width: width + over * 2, height }}>
      <div className="absolute inset-x-0 top-0 rounded-b-[45%_100%] bg-[linear-gradient(#eceaee,#cfcbd2_55%,#a9a4ad)] shadow-[0_18px_30px_-14px_rgba(70,20,45,0.45)]"
        style={{ height }} />
      <div className="absolute left-1/2 top-0 -translate-x-1/2 rounded-b-[40%] bg-[linear-gradient(#b9b4bd,#d9d5dc)]"
        style={{ width: width * 0.16, height: height * 0.42 }} />
    </div>
  );
}
