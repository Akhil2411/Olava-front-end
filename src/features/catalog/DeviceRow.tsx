import { cn } from "@/lib/utils/cn";

const ICON = "size-6 fill-none stroke-current stroke-[1.6] [stroke-linecap:round] [stroke-linejoin:round]";
const ITEMS = [
  { label: "Desktop", note: "Full experience", icon: <svg viewBox="0 0 24 24" className={ICON}><rect x="3" y="4" width="18" height="12" rx="1.5" /><path d="M9 20h6M12 16v4" /></svg> },
  { label: "Tablet", note: "Perfectly scaled", icon: <svg viewBox="0 0 24 24" className={ICON}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M11 16h2" /></svg> },
  { label: "Mobile", note: "Beautiful & simple", icon: <svg viewBox="0 0 24 24" className={ICON}><rect x="7" y="2.5" width="10" height="19" rx="2" /><path d="M11 18.5h2" /></svg> },
  { label: "All devices", note: "One seamless experience", icon: <svg viewBox="0 0 24 24" className={ICON}><rect x="2" y="5" width="13" height="9" rx="1.2" /><path d="M5 17.5h7" /><rect x="15.5" y="8" width="6.5" height="12" rx="1.5" /></svg> },
];

/** "Beautiful on every screen": the four screen sizes every website is made for. */
export function DeviceRow({ className }: { className?: string }) {
  return (
    <div className={className}>
      <p className="eyebrow mb-4">Fully responsive · beautiful on every screen</p>
      <ul className="grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-4 sm:gap-0">
        {ITEMS.map((i, n) => (
          <li key={i.label} className={cn("flex flex-col items-center text-center sm:px-2", n > 0 && "sm:border-l sm:border-line")}>
            <span aria-hidden="true" className="mb-2 grid size-12 place-items-center rounded-full bg-tint text-pink-dark">{i.icon}</span>
            <span className="text-sm font-semibold">{i.label}</span>
            <span className="text-xs text-mute">{i.note}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** A faint drawn leaf sprig for the hero's corners. */
export function Sprig({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 120 160" className={cn("pointer-events-none absolute text-pink/35", className)} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M60 158 C58 120 56 80 64 6" />
      {[[140, -1], [118, 1], [96, -1], [74, 1], [52, -1], [32, 1]].map(([y, side]) => (
        <path key={y} d={side < 0
          ? `M${59 + (158 - y) * 0.03} ${y} C40 ${y - 6} 26 ${y - 22} 24 ${y - 40} C42 ${y - 36} 56 ${y - 22} ${59 + (158 - y) * 0.03} ${y}`
          : `M${59 + (158 - y) * 0.03} ${y} C78 ${y - 6} 92 ${y - 22} 96 ${y - 40} C78 ${y - 36} 64 ${y - 22} ${59 + (158 - y) * 0.03} ${y}`} />
      ))}
    </svg>
  );
}
