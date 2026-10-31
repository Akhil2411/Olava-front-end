"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Alert, Button, SelectField } from "@/components/ui";
import { SHOWCASE_DEFAULT } from "@/features/catalog/showcase";
import { cn } from "@/lib/utils/cn";
import { saveHomeAction } from "../actions";
import type { AdminTemplate, HomeSettings } from "../types";
import { Panel } from "./ui";
import { Thumb } from "./TemplateManager";

const MAX = 6;

export function HomeEditor({ home, templates, isAdmin }: { home: HomeSettings; templates: AdminTemplate[]; isAdmin: boolean }) {
  const router = useRouter();
  const [featured, setFeatured] = useState<string[]>(home.featuredTemplates.filter((k) => templates.some((t) => t.key === k)));
  const [showcase, setShowcase] = useState<string | null>(home.showcaseTemplate);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const byKey = (k: string | null) => templates.find((t) => t.key === k);

  const toggle = (key: string) => setFeatured((f) => f.includes(key) ? f.filter((k) => k !== key) : f.length >= MAX ? f : [...f, key]);
  const move = (i: number, d: -1 | 1) => setFeatured((f) => { const n = [...f]; [n[i], n[i + d]] = [n[i + d], n[i]]; return n; });
  const save = () => start(async () => {
    const r = await saveHomeAction({ featuredTemplates: featured, showcaseTemplate: showcase });
    setMsg(r.ok ? { ok: true, text: "Saved. The home page shows your choices within a minute." } : { ok: false, text: r.error.message });
    if (r.ok) router.refresh();
  });

  return (
    <div className="space-y-6">
      <Panel title="Device showcase" description="The laptop, tablet and phone at the top of the home page all show this template, live, so visitors see one website on every screen.">
        <div className="grid items-start gap-5 sm:grid-cols-[minmax(0,1fr)_auto]">
          <div className="space-y-2">
            <SelectField label="Showcase template" value={showcase ?? ""} disabled={!isAdmin} onChange={(e) => setShowcase(e.target.value || null)}
              hint="Templates with a photo opening and a menu bar look best on the laptop.">
              <option value="">Automatic ({byKey(SHOWCASE_DEFAULT)?.name ?? "first available"})</option>
              {templates.map((t) => <option key={t.key} value={t.key}>{t.name}</option>)}
            </SelectField>
            {showcase ? <a href={`/template-sample/${encodeURIComponent(showcase)}`} target="_blank" rel="noreferrer" className="text-sm text-pink-dark underline">Open this template ↗</a> : null}
          </div>
          {byKey(showcase) ?? byKey(SHOWCASE_DEFAULT) ?? templates[0] ? <Thumb t={(byKey(showcase) ?? byKey(SHOWCASE_DEFAULT) ?? templates[0])!} className="w-28 border border-line" /> : null}
        </div>
      </Panel>

      <Panel title={`Featured templates (${featured.length}/${MAX})`} description="Shown in the home page's template section, in this order. Choose none to show the first three from the gallery order.">
        {featured.length ? (
          <ol className="mb-4 space-y-2">
            {featured.map((k, i) => (
              <li key={k} className="flex items-center gap-3 rounded-xl border border-line bg-white p-2">
                <span className="w-5 text-center text-sm font-semibold text-mute">{i + 1}</span>
                {byKey(k) ? <Thumb t={byKey(k)!} className="w-10" /> : null}
                <span className="min-w-0 flex-1 truncate font-medium">{byKey(k)?.name ?? k}</span>
                {isAdmin ? (
                  <span className="flex gap-1">
                    <Button size="sm" variant="ghost" disabled={i === 0} aria-label={`Move ${byKey(k)?.name} up`} onClick={() => move(i, -1)}>↑</Button>
                    <Button size="sm" variant="ghost" disabled={i === featured.length - 1} aria-label={`Move ${byKey(k)?.name} down`} onClick={() => move(i, 1)}>↓</Button>
                    <Button size="sm" variant="ghost" onClick={() => toggle(k)}>Remove</Button>
                  </span>
                ) : null}
              </li>
            ))}
          </ol>
        ) : <p className="mb-4 text-sm text-mute">None chosen: the first three templates in the gallery order are shown.</p>}
        {isAdmin ? (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {templates.map((t) => {
              const on = featured.includes(t.key);
              return (
                <button key={t.key} type="button" aria-pressed={on} disabled={!on && featured.length >= MAX} onClick={() => toggle(t.key)}
                  className={cn("rounded-2xl border-2 p-1.5 text-left text-xs transition disabled:opacity-40", on ? "border-pink-dark bg-blush" : "border-transparent hover:border-line")}>
                  <Thumb t={t} className="w-full" />
                  <span className="mt-1 block truncate font-medium">{on ? "✓ " : ""}{t.name}</span>
                </button>
              );
            })}
          </div>
        ) : null}
      </Panel>

      {isAdmin ? (
        <div className="flex flex-wrap items-center gap-3">
          <Button loading={pending} onClick={save}>Save home page</Button>
          {msg ? <span role="status" className={msg.ok ? "text-sm text-success" : "text-sm text-danger"}>{msg.text}</span> : null}
        </div>
      ) : <Alert tone="info">Only admins can change the home page.</Alert>}
    </div>
  );
}
