import "server-only";
import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import { api } from "@/lib/api/server";
import type {
  AdminDesign, AdminMedia, AdminOrder, AdminOverview, AdminPurchaseItem, AdminSite, AdminTemplate, AdminTier, AdminActivityItem,
  AdminUserDetail, AdminUserListItem, Faq, HomeSettings, Paged, PublicSiteContent, SiteInfo, StaffInfo, StorageSummary, SwitchesView,
} from "./types";

/**
 * The admin panel's guard. The API decides (staff role, checked against the database on every request); here a
 * signed-out visitor goes to sign-in and anyone else simply gets "page not found" (the panel isn't advertised).
 */
export const requireStaff = cache(async (next = "/admin"): Promise<StaffInfo> => {
  const me = await api<StaffInfo>("/api/v1/admin/me");
  if (me.ok) return me.data;
  if (me.problem.status === 401) redirect(`/login?next=${encodeURIComponent(next)}`);
  notFound();
});

/** For pages that show data: any failure (including a role removed mid-session) ends in "not found". */
async function must<T>(path: string): Promise<T> {
  const r = await api<T>(path);
  if (r.ok) return r.data;
  if (r.problem.status === 401) redirect("/login?next=/admin");
  if (r.problem.status === 403 || r.problem.status === 404) notFound();
  throw new Error(r.problem.message);
}

const qs = (params: Record<string, string | number | boolean | undefined | null>) => {
  const s = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null && v !== "") s.set(k, String(v));
  const t = s.toString();
  return t ? `?${t}` : "";
};

export const getOverview = () => must<AdminOverview>("/api/v1/admin/overview");
export const getUsers = (p: { q?: string; status?: string; role?: string; page?: number }) => must<Paged<AdminUserListItem>>(`/api/v1/admin/users${qs(p)}`);
export const getUser = (id: string) => must<AdminUserDetail>(`/api/v1/admin/users/${id}`);
export const getTiers = () => must<AdminTier[]>("/api/v1/admin/tiers");
export const getPurchases = (p: { q?: string; status?: string; page?: number }) => must<Paged<AdminPurchaseItem>>(`/api/v1/admin/purchases${qs(p)}`);
export const getAdminTemplates = () => must<AdminTemplate[]>("/api/v1/admin/templates");
export const getDesigns = () => must<AdminDesign[]>("/api/v1/admin/designs");
export const getHome = () => must<HomeSettings>("/api/v1/admin/home");
export const getFaqs = () => must<Faq[]>("/api/v1/admin/faqs");
export const getSiteInfo = () => must<SiteInfo>("/api/v1/admin/site");
export const getSwitches = () => must<SwitchesView>("/api/v1/admin/switches");
export const getSites = (p: { q?: string; status?: string; page?: number }) => must<Paged<AdminSite>>(`/api/v1/admin/sites${qs(p)}`);
export const getStorage = () => must<StorageSummary>("/api/v1/admin/storage");
export const getMedia = (p: { weddingId?: string; purpose?: string; page?: number }) => must<Paged<AdminMedia>>(`/api/v1/admin/media${qs(p)}`);
export const getOrders = (p: { q?: string; status?: string; page?: number }) => must<Paged<AdminOrder>>(`/api/v1/admin/orders${qs(p)}`);
export const getActivity = (p: { q?: string; all?: string; page?: number }) =>
  must<Paged<AdminActivityItem>>(`/api/v1/admin/activity${qs({ q: p.q, adminOnly: p.all === "1" ? "false" : "true", page: p.page })}`);

/** Public: FAQs, home page choices, site details (cached a minute; admin changes refresh it). */
export async function getSiteContent(): Promise<PublicSiteContent | null> {
  const r = await api<PublicSiteContent>("/api/v1/site-content", { auth: false, revalidate: 60 });
  return r.ok ? r.data : null;
}
