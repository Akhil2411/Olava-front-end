export interface Paged<T> { items: T[]; page: number; pageSize: number; totalCount: number }

export interface StaffInfo { roles: string[]; isAdmin: boolean; assignableRoles: string[] }

export interface AdminUserListItem {
  id: string; email: string; name: string; createdAt: string; lastLoginAt: string | null;
  status: "active" | "suspended"; emailConfirmed: boolean; roles: string[];
  weddings: number; liveSites: number; package: string | null; paidMinor: number;
}
export interface AdminWeddingSummary {
  id: string; title: string; slug: string; status: string; weddingDate: string | null; templateName: string | null;
  package: string | null; packageStatus: "none" | "active" | "expired"; liveUntil: string | null; blocked: boolean; createdAt: string;
}
export interface AdminOrderSummary {
  id: string; orderNumber: string; status: string; amountMinor: number; currency: string; package: string | null;
  createdAt: string; paidAt: string | null; wedding: string | null;
}
export interface AdminActivityItem {
  id: string; at: string; action: string; entityType: string | null; entityId: string | null;
  actorEmail: string | null; actorId: string | null; metadataJson: string; ipAddress: string | null;
}
export interface AdminUserDetail {
  user: AdminUserListItem; hasPassword: boolean; hasGoogle: boolean; suspendedReason: string | null;
  weddings: AdminWeddingSummary[]; orders: AdminOrderSummary[]; activity: AdminActivityItem[]; storageBytes: number;
}
export interface AdminPurchaseItem {
  weddingId: string; wedding: string; slug: string; ownerId: string | null; ownerEmail: string | null; package: string | null;
  packageStatus: "none" | "active" | "expired"; source: "none" | "paid" | "granted"; grantedAt: string | null;
  liveUntil: string | null; manualUntil: boolean; weddingStatus: string; blocked: boolean;
}
export interface AdminOverview {
  totalUsers: number; newUsers7Days: number; newUsers30Days: number; suspendedUsers: number;
  totalWeddings: number; liveSites: number; activePackages: number; grantedPackages: number;
  revenueMinor30Days: number; revenueMinorTotal: number; currency: string;
  recentSignups: AdminUserListItem[]; recentPurchases: AdminPurchaseItem[]; signupsByDay: { day: string; count: number }[];
}
export interface AdminTier {
  id: string; code: string; name: string; description: string | null; rank: number; priceMinor: number; currency: string;
  features: string[]; liveMonthsAfterWedding: number; maxLiveMonthsFromPurchase: number; minLiveDaysFromPurchase: number;
  isActive: boolean; templates: number; purchases: number;
}
export type TierInput = Omit<AdminTier, "id" | "currency" | "templates" | "purchases">;
export interface AdminTemplate {
  id: string; key: string; name: string; description: string | null; category: string | null; status: "active" | "hidden" | "draft";
  tierCode: string | null; tierName: string | null; layout: string; theme: string; sortOrder: number; previewImageUrl: string | null;
  weddings: number; liveSites: number;
}
export interface AdminDesign { layout: string; sourceTemplateKey: string; themes: { key: string; name: string; background: string; accent: string; text: string }[] }
export interface Faq { id: string; question: string; answer: string; sortOrder: number; isPublished: boolean }
/** showcaseTemplate: what the home page's laptop, tablet and phone all show (null: the default). */
export interface HomeSettings { featuredTemplates: string[]; showcaseTemplate: string | null }
export interface SiteInfo {
  siteName: string; tagline: string | null; contactEmail: string | null; contactPhone: string | null; whatsApp: string | null;
  social: { instagram: string | null; facebook: string | null; youTube: string | null; pinterest: string | null; x: string | null };
}
export interface FeatureSwitches { emailSending: boolean; emailVerification: boolean; googleSignIn: boolean; signups: boolean }
export interface SwitchesView { current: FeatureSwitches; configured: FeatureSwitches; emailConfigured: boolean; googleConfigured: boolean }
export interface AdminSite {
  id: string; title: string; slug: string; publicUrl: string | null; ownerId: string | null; ownerEmail: string | null; status: string;
  templateName: string | null; package: string | null; packageStatus: "none" | "active" | "expired"; liveUntil: string | null;
  publishedAt: string | null; blocked: boolean; blockedReason: string | null; guests: number; mediaFiles: number; storageBytes: number; createdAt: string;
}
export interface AdminMedia {
  id: string; weddingId: string | null; wedding: string | null; ownerEmail: string | null; purpose: string; contentType: string;
  sizeBytes: number; width: number | null; height: number | null; caption: string | null; createdAt: string;
}
export interface StorageSummary {
  totalBytes: number; totalFiles: number; byPurpose: { purpose: string; files: number; bytes: number }[];
  topWeddings: { weddingId: string; wedding: string; ownerEmail: string | null; files: number; bytes: number }[];
}
export interface AdminOrder {
  id: string; orderNumber: string; status: string; amountMinor: number; creditMinor: number; currency: string; package: string | null;
  productCode: string; wedding: string | null; weddingId: string | null; ownerEmail: string | null; provider: string | null;
  providerReference: string | null; failureReason: string | null; createdAt: string; paidAt: string | null;
  payments: { providerPaymentId: string; status: string; amountMinor: number; method: string | null; error: string | null; capturedAt: string | null }[];
}
/** Public site content (FAQs, home page choices, site details). */
export interface PublicSiteContent { faqs: Faq[]; home: HomeSettings; site: SiteInfo; signupsOpen: boolean; googleSignIn: boolean }
