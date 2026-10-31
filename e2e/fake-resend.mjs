// LOCAL TEST DOUBLE for Resend's "send email" API (POST /emails), used only by the E2E run.
// It proves the API calls Resend correctly (Bearer key, from/to/subject/html/text); it is NOT Resend.
// Test-only: GET /__test/emails?to=<address> lists what was "sent" to that address.
import http from "node:http";

const PORT = Number(process.env.FAKE_RESEND_PORT ?? 5098);
const emails = [];
const send = (res, status, body) => { res.writeHead(status, { "Content-Type": "application/json" }); res.end(JSON.stringify(body)); };

http.createServer((req, res) => {
  let raw = "";
  req.on("data", (c) => (raw += c));
  req.on("end", () => {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    if (req.method === "GET" && url.pathname === "/__test/emails") {
      const to = url.searchParams.get("to");
      return send(res, 200, emails.filter((e) => !to || e.to.includes(to)));
    }
    if (req.method === "POST" && url.pathname === "/emails") {
      if (!req.headers.authorization?.startsWith("Bearer re_")) return send(res, 401, { statusCode: 401, name: "missing_api_key", message: "Missing API key" });
      const body = JSON.parse(raw || "{}");
      if (!body.from || !body.to?.length || !body.subject || !body.html) return send(res, 422, { statusCode: 422, name: "validation_error", message: "Missing fields" });
      const id = crypto.randomUUID();
      emails.push({ id, ...body, at: Date.now() });
      return send(res, 200, { id });
    }
    send(res, 404, { error: "not found" });
  });
}).listen(PORT, () => console.log(`fake Resend on http://localhost:${PORT}`));
