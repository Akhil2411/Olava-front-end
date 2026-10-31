import type { AdminActivityItem } from "./types";

const LABELS: Record<string, string> = {
  "admin.user_suspended": "Suspended the account", "admin.user_reactivated": "Reactivated the account",
  "admin.user_roles_changed": "Changed roles", "admin.user_deleted": "Deleted an account", "admin.user_sites_blocked": "Took the user's sites offline",
  "admin.tier_created": "Created a package", "admin.tier_updated": "Changed a package", "admin.tier_deleted": "Deleted a package",
  "admin.package_granted": "Granted a package", "admin.package_extended": "Extended a live period", "admin.package_cancelled": "Cancelled a package",
  "admin.template_created": "Added a template", "admin.template_updated": "Changed a template", "admin.template_deleted": "Deleted a template",
  "admin.templates_reordered": "Reordered templates", "admin.template_weddings_moved": "Moved weddings to another template",
  "admin.template_thumbnail_set": "Uploaded a template thumbnail", "admin.template_thumbnail_cleared": "Removed a template thumbnail",
  "admin.home_updated": "Changed the home page", "admin.faq_created": "Added an FAQ", "admin.faq_updated": "Changed an FAQ",
  "admin.faq_deleted": "Deleted an FAQ", "admin.faqs_reordered": "Reordered FAQs", "admin.site_updated": "Changed site details",
  "admin.switches_updated": "Changed feature switches", "admin.site_blocked": "Took a site offline", "admin.site_unblocked": "Restored a site",
  "admin.media_deleted": "Deleted a file",
  "entitlement.granted": "Bought a package", "entitlement.upgraded_without_charge": "Package upgraded (already paid for)",
  "wedding.deleted": "Deleted a wedding", "rsvp.submitted": "Guest RSVP received",
};

/** A readable line for an activity entry ("Granted a package · standard · Friends & family"). */
export function describe(a: AdminActivityItem): string {
  const base = LABELS[a.action] ?? a.action.replace(/^admin\./, "").replaceAll("_", " ").replaceAll(".", " · ");
  let extra: string[] = [];
  try {
    const m = JSON.parse(a.metadataJson || "{}") as Record<string, unknown>;
    extra = ["email", "tier", "key", "code", "Code", "slug", "Slug", "question", "Question", "reason", "note", "to", "OrderNumber"]
      .map((k) => m[k]).filter((v): v is string => typeof v === "string" && v.length > 0).slice(0, 3);
  } catch { /* not JSON */ }
  return [base, ...extra].join(" · ");
}
