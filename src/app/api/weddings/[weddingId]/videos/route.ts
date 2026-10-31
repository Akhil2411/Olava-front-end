import { cookies } from "next/headers";
import { env } from "@/lib/env";
import { UUID } from "@/lib/api/relay";
import { ACCESS_COOKIE } from "@/lib/session/tokens";

/** The API's request limit for a video upload (MediaController: 30 MB + 1 MB for the multipart wrapping). */
const MAX_REQUEST_BYTES = 31 * 1024 * 1024;
const tooLarge = () => Response.json({ code: "media.video_too_large", detail: "This video is larger than 30 MB. Please choose a smaller file." }, { status: 413 });

/**
 * Video upload (multipart, up to 30 MB). A Route Handler rather than a Server Action so the browser can show real
 * upload progress (XMLHttpRequest). The body is streamed straight to the API, which checks the size, the file's
 * real format and that the wedding belongs to this account.
 */
export async function POST(request: Request, ctx: { params: Promise<{ weddingId: string }> }) {
  const { weddingId } = await ctx.params;
  if (!UUID.test(weddingId)) return new Response(null, { status: 404 });
  // Same-origin only (the session cookie is SameSite=Lax, this is a second line of defence).
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return new Response(null, { status: 403 });
  const token = (await cookies()).get(ACCESS_COOKIE)?.value;
  if (!token) return Response.json({ code: "auth.unauthorized", detail: "Your session has ended. Please sign in again." }, { status: 401 });
  const type = request.headers.get("content-type") ?? "";
  if (!type.startsWith("multipart/form-data") || !request.body) return Response.json({ code: "media.file_required", detail: "Choose a video to upload." }, { status: 400 });

  // Clearly too big (30 MB video + room for the form's own bytes): say so now. Sent on, the API would cut the
  // connection mid-upload and the person would see "couldn't reach the server" instead of the size message.
  const length = Number(request.headers.get("content-length") ?? "0");
  if (length > MAX_REQUEST_BYTES) return tooLarge();

  let upstream: Response;
  try {
    upstream = await fetch(`${env.apiUrl}/api/v1/weddings/${weddingId}/media/videos`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`, "Content-Type": type, Accept: "application/json",
        ...(request.headers.get("content-length") ? { "Content-Length": request.headers.get("content-length")! } : {}),
        ...(request.headers.get("x-forwarded-for") ? { "X-Forwarded-For": request.headers.get("x-forwarded-for")! } : {}),
      },
      body: request.body,
      // @ts-expect-error -- Node's fetch needs this to stream a request body (not in the DOM RequestInit type).
      duplex: "half",
      cache: "no-store",
    });
  } catch {
    return Response.json({ code: "network.unreachable", detail: "We couldn't reach the Olava server. Please try again." }, { status: 503 });
  }
  if (upstream.status === 413) return tooLarge();
  const text = await upstream.text();
  return new Response(text || null, { status: upstream.status, headers: { "Content-Type": upstream.headers.get("content-type") ?? "application/json" } });
}
