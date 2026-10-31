"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Alert, Button, ConfirmDialog, Switch, TextField } from "@/components/ui";
import { saveSiteInfoAction, saveSwitchesAction } from "../actions";
import type { FeatureSwitches, SiteInfo, SwitchesView } from "../types";
import { Panel } from "./ui";

const SWITCHES: { key: keyof FeatureSwitches; label: string; on: string; off: string; warnOff: string }[] = [
  { key: "signups", label: "New sign-ups", on: "Anyone can create an account.", off: "No new accounts (email or Google). Existing users can still sign in.", warnOff: "Nobody new will be able to create an account until you turn this back on." },
  { key: "emailSending", label: "Send emails", on: "Verification, password reset and other emails are sent.", off: "No emails are sent. Password resets and verification emails won't arrive.", warnOff: "Password reset and verification emails will stop arriving. If email verification is on, new users won't be able to confirm their address." },
  { key: "emailVerification", label: "Require email verification", on: "New accounts must confirm their email address before using the app.", off: "New accounts can use the app straight away.", warnOff: "New accounts won't need to prove they own their email address." },
  { key: "googleSignIn", label: "Google sign-in", on: "The Continue with Google button is shown.", off: "Google sign-in is hidden and refused. Users who only use Google will need to reset a password to sign in.", warnOff: "Users who signed up with Google and have no password won't be able to sign in until they set one (Forgot password)." },
];

export function SettingsEditor({ site: initial, switches, isAdmin }: { site: SiteInfo; switches: SwitchesView; isAdmin: boolean }) {
  const router = useRouter();
  const [site, setSite] = useState(initial);
  const [sw, setSw] = useState(switches.current);
  const [confirm, setConfirm] = useState<FeatureSwitches | null>(null);
  const [siteMsg, setSiteMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [swMsg, setSwMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const social = (k: keyof SiteInfo["social"], v: string) => setSite({ ...site, social: { ...site.social, [k]: v || null } });
  const text = (k: keyof Omit<SiteInfo, "social">, v: string) => setSite({ ...site, [k]: k === "siteName" ? v : v || null });

  const saveSite = () => start(async () => {
    const r = await saveSiteInfoAction(site);
    setSiteMsg(r.ok ? { ok: true, text: "Saved." } : { ok: false, text: r.error.message });
    if (r.ok) router.refresh();
  });
  const saveSwitches = (next: FeatureSwitches) => start(async () => {
    const r = await saveSwitchesAction(next);
    setConfirm(null);
    setSwMsg(r.ok ? { ok: true, text: "Saved. Takes effect within a few seconds." } : { ok: false, text: r.error.message });
    if (r.ok) router.refresh(); else setSw(switches.current);
  });
  const turnedOff = confirm ? SWITCHES.filter((s) => switches.current[s.key] && !confirm[s.key]) : [];
  const changed = SWITCHES.some((s) => sw[s.key] !== switches.current[s.key]);
  const unavailable = (k: keyof FeatureSwitches) => (k === "googleSignIn" && !switches.googleConfigured) || (k === "emailSending" && !switches.emailConfigured);

  return (
    <div className="space-y-6">
      <Panel title="Site details" description="Shown in the website footer.">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Site name" value={site.siteName} maxLength={60} disabled={!isAdmin} onChange={(e) => text("siteName", e.target.value)} />
          <TextField label="Tagline" value={site.tagline ?? ""} maxLength={160} disabled={!isAdmin} onChange={(e) => text("tagline", e.target.value)} />
          <TextField label="Contact email" type="email" value={site.contactEmail ?? ""} disabled={!isAdmin} onChange={(e) => text("contactEmail", e.target.value)} />
          <TextField label="Phone" type="tel" value={site.contactPhone ?? ""} disabled={!isAdmin} onChange={(e) => text("contactPhone", e.target.value)} />
          <TextField label="WhatsApp number" type="tel" value={site.whatsApp ?? ""} disabled={!isAdmin} hint="With country code, e.g. +91 98765 43210" onChange={(e) => text("whatsApp", e.target.value)} />
        </div>
        <h3 className="mb-2 mt-6 text-sm font-semibold">Social links</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          {([["instagram", "Instagram"], ["facebook", "Facebook"], ["youTube", "YouTube"], ["pinterest", "Pinterest"], ["x", "X (Twitter)"]] as const).map(([k, l]) => (
            <TextField key={k} label={l} type="url" placeholder="https://" value={site.social[k] ?? ""} disabled={!isAdmin} onChange={(e) => social(k, e.target.value)} />
          ))}
        </div>
        {isAdmin ? (
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Button loading={pending} onClick={saveSite}>Save site details</Button>
            {siteMsg ? <span role="status" className={siteMsg.ok ? "text-sm text-success" : "text-sm text-danger"}>{siteMsg.text}</span> : null}
          </div>
        ) : null}
      </Panel>

      <Panel title="Switches" description="Changes apply to everyone within a few seconds and are recorded in the activity log.">
        <ul className="divide-y divide-line">
          {SWITCHES.map((s) => (
            <li key={s.key} className="flex flex-wrap items-start justify-between gap-3 py-4 first:pt-0">
              <div className="min-w-0 max-w-xl">
                <p className="font-semibold">{s.label}</p>
                <p className="text-sm text-mute">{sw[s.key] ? s.on : s.off}</p>
                {unavailable(s.key) ? <p className="mt-1 text-xs text-warning">Not set up on the server ({s.key === "googleSignIn" ? "Google client ID" : "email provider key"} missing), so it can&apos;t be turned on here.</p> : null}
                {sw[s.key] !== switches.configured[s.key] ? <p className="mt-1 text-xs text-mute">Server default: {switches.configured[s.key] ? "on" : "off"}.</p> : null}
              </div>
              <Switch label={s.label} hideLabel checked={sw[s.key]} disabled={!isAdmin || pending || (!sw[s.key] && unavailable(s.key))}
                onChange={(v) => setSw({ ...sw, [s.key]: v })} />
            </li>
          ))}
        </ul>
        {isAdmin ? (
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <Button loading={pending} disabled={!changed} onClick={() => setConfirm(sw)}>Save switches</Button>
            {changed ? <Button variant="ghost" onClick={() => setSw(switches.current)}>Undo changes</Button> : null}
            {swMsg ? <span role="status" className={swMsg.ok ? "text-sm text-success" : "text-sm text-danger"}>{swMsg.text}</span> : null}
          </div>
        ) : <Alert tone="info" className="mt-2">Only admins can change settings.</Alert>}
      </Panel>

      <ConfirmDialog open={confirm !== null} onClose={() => setConfirm(null)} busy={pending} title="Change these switches?" confirmLabel="Save switches"
        onConfirm={() => confirm && saveSwitches(confirm)}>
        <ul className="list-disc space-y-1 pl-5">
          {SWITCHES.filter((s) => confirm && confirm[s.key] !== switches.current[s.key]).map((s) => <li key={s.key}><b>{s.label}</b>: turn {confirm![s.key] ? "on" : "off"}</li>)}
        </ul>
        {turnedOff.map((s) => <Alert key={s.key} tone="warning">{s.warnOff}</Alert>)}
      </ConfirmDialog>
    </div>
  );
}
