/**
 * Error contract shared by the server API client and UI. The .NET API returns RFC 9457 problem details
 * with a stable `code`; the UI branches on `code`, never on message text.
 */
export interface ApiProblem {
  status: number;
  code: string;
  message: string;
  /** Field → messages, from ASP.NET model validation (400). */
  fieldErrors?: Record<string, string[]>;
  /** Extra machine-readable data (e.g. CSV row errors, publish blockers). */
  details?: Record<string, unknown>;
}

export type ApiResult<T> = { ok: true; data: T } | { ok: false; problem: ApiProblem };

/** What Server Actions return to Client Components. Serializable, no secrets. */
export type ActionResult<T = null> = { ok: true; data: T } | { ok: false; error: ApiProblem };

const FRIENDLY: Record<string, string> = {
  "network.unreachable": "We couldn't reach the Olava server. Please check your connection and try again.",
  "auth.unauthorized": "Your session has ended. Please sign in again.",
  "auth.forbidden": "You don't have permission to do that.",
  "rate_limited": "Too many attempts. Please wait a minute and try again.",
  "server.error": "Something went wrong on our side. Your changes were not lost; please try again.",
};

/** Turns any HTTP failure into an ApiProblem with a user-safe message. */
export function toProblem(status: number, body: unknown): ApiProblem {
  const b = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  const fieldErrors = normalizeFieldErrors(b.errors);
  let code = typeof b.code === "string" ? b.code : "";
  if (!code) {
    code = status === 401 ? "auth.unauthorized"
      : status === 403 ? "auth.forbidden"
      : status === 429 ? "rate_limited"
      : status === 400 && fieldErrors ? "validation"
      : status >= 500 ? "server.error"
      : `http.${status}`;
  }
  const detail = typeof b.detail === "string" ? b.detail : undefined;
  const message = FRIENDLY[code] ?? detail
    ?? (fieldErrors ? "Please check the highlighted fields." : status >= 500 ? FRIENDLY["server.error"] : "Something went wrong.");

  const { type: _t, title: _ti, status: _s, detail: _d, code: _c, errors: _e, traceId: _tr, ...rest } = b;
  void _t; void _ti; void _s; void _d; void _c; void _e; void _tr;
  return { status, code, message, fieldErrors, details: Object.keys(rest).length ? rest : undefined };
}

function normalizeFieldErrors(errors: unknown): Record<string, string[]> | undefined {
  if (!errors || typeof errors !== "object" || Array.isArray(errors)) return undefined;
  const out: Record<string, string[]> = {};
  for (const [key, value] of Object.entries(errors as Record<string, unknown>)) {
    if (!Array.isArray(value)) continue;
    // ASP.NET keys look like "PartnerOneName" or "$.partnerOneName": normalise to camelCase field names.
    const name = key.replace(/^\$\./, "").replace(/^./, (c) => c.toLowerCase());
    out[name] = value.map(String);
  }
  return Object.keys(out).length ? out : undefined;
}

export function networkProblem(): ApiProblem {
  return { status: 0, code: "network.unreachable", message: FRIENDLY["network.unreachable"] };
}
