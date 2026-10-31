"use client";

import { useLayoutEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";
import { cn } from "@/lib/utils/cn";

export type Device = "mobile" | "tablet" | "desktop";

/** Real device sizes: the website renders at exactly this size (so each design picks its true layout), then the device is scaled to fit. */
export const DEVICES: Record<Device, { label: string; icon: string; screen: [number, number]; name: string }> = {
  mobile: { label: "Mobile", icon: "📱", screen: [390, 844], name: "phone size" },
  tablet: { label: "Tablet", icon: "▭", screen: [820, 1180], name: "tablet size" },
  desktop: { label: "Desktop", icon: "🖥", screen: [1440, 900], name: "laptop size" },
};

const PHONE = "(max-width: 639px)";
const TABLET = "(max-width: 1023px), (hover: none) and (pointer: coarse) and (max-width: 1366px)";

function subscribe(cb: () => void) {
  const a = window.matchMedia(PHONE), b = window.matchMedia(TABLET);
  a.addEventListener("change", cb); b.addEventListener("change", cb);
  return () => { a.removeEventListener("change", cb); b.removeEventListener("change", cb); };
}
const screenKind = (): Device => window.matchMedia(PHONE).matches ? "mobile" : window.matchMedia(TABLET).matches ? "tablet" : "desktop";

/**
 * Which device sizes make sense on this screen: a computer offers all three, a tablet drops Desktop, and a
 * phone offers none (the preview simply fills the phone, which already is the mobile view).
 */
export function useScreenDevices(): { screen: Device; devices: Device[] } {
  const screen = useSyncExternalStore(subscribe, screenKind, () => "desktop" as Device);
  const devices: Device[] = screen === "desktop" ? ["mobile", "tablet", "desktop"] : screen === "tablet" ? ["mobile", "tablet"] : [];
  return { screen, devices };
}

/** The device actually shown: the chosen one if this screen offers it, else the largest it does. */
export function shownDevice(chosen: Device, devices: Device[]): Device {
  return devices.includes(chosen) ? chosen : devices[devices.length - 1] ?? "mobile";
}

export function DeviceSwitch({ devices, value, onChange, className }: { devices: Device[]; value: Device; onChange: (d: Device) => void; className?: string }) {
  if (devices.length < 2) return null;
  return (
    <div role="group" aria-label="Device size" className={cn("inline-flex shrink-0 gap-0.5 rounded-full bg-tint p-1", className)}>
      {devices.map((d) => (
        <button key={d} type="button" aria-pressed={value === d} onClick={() => onChange(d)}
          className={cn("flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition sm:px-3.5",
            value === d ? "bg-white font-semibold text-ink shadow-sm" : "text-mute hover:text-ink")}>
          <span aria-hidden="true" className="text-xs">{DEVICES[d].icon}</span>{DEVICES[d].label}
        </button>
      ))}
    </div>
  );
}

/** "390 × 844 · phone size · shown at 81%" */
export function sizeNote(device: Device, scale: number) {
  const [w, h] = DEVICES[device].screen;
  return `${w} × ${h} · ${DEVICES[device].name} · shown at ${Math.round(scale * 100)}%`;
}

/** Frame (bezel) around the screen, in CSS px at real size. */
const FRAME: Record<Device, { pad: [number, number, number, number]; outer: CSSProperties; screen: CSSProperties }> = {
  mobile: {
    pad: [12, 12, 12, 12],
    outer: { borderRadius: 58, background: "#121014", boxShadow: "0 30px 60px rgba(40,10,25,.35), inset 0 0 0 2px #2e2a30" },
    screen: { borderRadius: 46 },
  },
  tablet: {
    pad: [20, 20, 20, 20],
    outer: { borderRadius: 44, background: "#1a171c", boxShadow: "0 30px 60px rgba(40,10,25,.3), inset 0 0 0 2px #333" },
    screen: { borderRadius: 24 },
  },
  desktop: {
    pad: [44, 0, 0, 0],
    outer: { borderRadius: 14, background: "#fff", border: "1px solid #e6d3dc", boxShadow: "0 30px 60px rgba(40,10,25,.28)" },
    screen: { borderRadius: "0 0 13px 13px" },
  },
};

/**
 * The website in a device frame at its real size, scaled down to fit the space (never up). On a phone screen
 * (`full`) there is no frame: the website fills the area. The same iframe is kept when the device changes, so
 * switching doesn't reload the page.
 */
export function DeviceStage({ src, title, device, full, address, onScale, className }: {
  src: string; title: string; device: Device; full?: boolean;
  /** Shown in the desktop frame's address bar. */
  address?: string;
  onScale?: (scale: number) => void;
  className?: string;
}) {
  const stage = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<[number, number]>([0, 0]);
  useLayoutEffect(() => {
    const el = stage.current;
    if (!el) return;
    const measure = () => setBox([el.clientWidth, el.clientHeight]);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const f = FRAME[device];
  const [sw, sh] = DEVICES[device].screen;
  const W = sw + f.pad[1] + f.pad[3], H = sh + f.pad[0] + f.pad[2];
  const gap = full ? 0 : 28;
  const scale = box[0] ? Math.min((box[0] - gap) / W, (box[1] - gap) / H, 1) : 0;
  const reported = useRef(-1);
  useLayoutEffect(() => {
    if (!full && scale && Math.abs(reported.current - scale) > 0.001) { reported.current = scale; onScale?.(scale); }
  }, [scale, full, onScale]);

  const frameStyle: CSSProperties = full
    ? { position: "absolute", inset: 0 }
    : {
        position: "absolute", width: W, height: H, padding: `${f.pad[0]}px ${f.pad[1]}px ${f.pad[2]}px ${f.pad[3]}px`,
        left: (box[0] - W) / 2, top: (box[1] - H) / 2, transform: `scale(${scale})`, transformOrigin: "center center",
        visibility: scale ? "visible" : "hidden", ...f.outer,
      };

  return (
    <div ref={stage} data-device={full ? "full" : device}
      className={cn("relative overflow-hidden", !full && "rounded-[18px] bg-[radial-gradient(circle_at_50%_30%,#fbeef4,#f3dbe6)]", className)}>
      <div style={frameStyle}>
        {!full && device === "mobile" ? (
          <span aria-hidden="true" style={{ position: "absolute", top: 23, left: "50%", transform: "translateX(-50%)", width: 120, height: 34, borderRadius: 20, background: "#000", zIndex: 2 }} />
        ) : null}
        {!full && device === "desktop" ? (
          <span aria-hidden="true" style={{ position: "absolute", top: 0, left: 0, right: 0, height: 44, display: "flex", alignItems: "center", gap: 8, padding: "0 16px", background: "#f4eef1", borderBottom: "1px solid #e9dde3", borderRadius: "13px 13px 0 0" }}>
            <i style={{ width: 12, height: 12, borderRadius: 6, background: "#ff6058" }} />
            <i style={{ width: 12, height: 12, borderRadius: 6, background: "#ffbd2e" }} />
            <i style={{ width: 12, height: 12, borderRadius: 6, background: "#28c940" }} />
            <span style={{ marginLeft: 18, flex: "0 1 520px", height: 26, borderRadius: 13, background: "#fff", fontSize: 13, color: "#8a7a82", display: "flex", alignItems: "center", padding: "0 12px", overflow: "hidden", whiteSpace: "nowrap" }}>{address ?? "Your wedding website"}</span>
          </span>
        ) : null}
        <div style={full ? { position: "absolute", inset: 0 } : { width: sw, height: sh, overflow: "hidden", background: "#fff", position: "relative", ...f.screen }}
          className={full ? "overflow-hidden rounded-[14px] bg-white" : undefined}>
          {!full && device === "mobile" ? (
            // The phone's status bar: like a real phone, the website starts below it (under the camera cut-out).
            <span aria-hidden="true" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 50, padding: "6px 30px 0 36px", background: "#fff", color: "#111", font: "600 15px/1 system-ui, -apple-system, sans-serif" }}>
              <span>9:41</span>
              <span style={{ display: "flex", gap: 5, alignItems: "center" }}>
                <i style={{ width: 17, height: 11, borderRadius: 2, background: "linear-gradient(90deg,#111 0 3px,transparent 3px 5px,#111 5px 8px,transparent 8px 10px,#111 10px 13px,transparent 13px 15px,#111 15px)" }} />
                <i style={{ width: 24, height: 11, borderRadius: 3, border: "1.5px solid #111", boxSizing: "border-box", padding: 1 }}><b style={{ display: "block", width: "80%", height: "100%", background: "#111", borderRadius: 1 }} /></i>
              </span>
            </span>
          ) : null}
          <iframe title={title} src={src} allow="autoplay" className="block w-full border-0 bg-white"
            style={{ height: !full && device === "mobile" ? "calc(100% - 50px)" : "100%" }} />
        </div>
      </div>
    </div>
  );
}
