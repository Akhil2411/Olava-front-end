// LOCAL TEST DOUBLE for Google's OpenID provider, used only by the E2E run. It implements the parts Olava uses:
// discovery, JWKS, the authorization endpoint (no account picker: it signs in as the identity the test chose)
// and the token endpoint (checks client id/secret, redirect URI and the PKCE verifier, returns an RS256 ID token).
// It proves Olava's side of "Sign in with Google"; it is NOT Google.
// Test-only: POST /__test/identity {sub, email, name, email_verified, deny} picks who "signs in" next.
import http from "node:http";
import crypto from "node:crypto";

const PORT = Number(process.env.FAKE_GOOGLE_PORT ?? 5097);
const ISSUER = `http://localhost:${PORT}`;
const CLIENT_ID = process.env.FAKE_GOOGLE_CLIENT_ID ?? "e2e-client.apps.googleusercontent.com";
const CLIENT_SECRET = process.env.FAKE_GOOGLE_CLIENT_SECRET ?? "e2e-google-secret";
const { privateKey, publicKey } = crypto.generateKeyPairSync("rsa", { modulusLength: 2048 });
const KID = `e2e-${crypto.randomBytes(4).toString("hex")}`; // new key, new id each start (as Google does when it rotates)
let identity = { sub: "e2e-sub", email: "e2e@example.com", name: "E2E Person", email_verified: true };
const codes = new Map();

const b64 = (v) => Buffer.from(typeof v === "string" ? v : JSON.stringify(v)).toString("base64url");
function idToken(claims, aud) {
  const now = Math.floor(Date.now() / 1000);
  const head = b64({ alg: "RS256", typ: "JWT", kid: KID });
  const body = b64({ iss: ISSUER, aud, iat: now, exp: now + 300, ...claims });
  const sig = crypto.sign("RSA-SHA256", Buffer.from(`${head}.${body}`), privateKey).toString("base64url");
  return `${head}.${body}.${sig}`;
}
const send = (res, status, body) => { res.writeHead(status, { "Content-Type": "application/json" }); res.end(JSON.stringify(body)); };

http.createServer((req, res) => {
  let raw = "";
  req.on("data", (c) => (raw += c));
  req.on("end", () => {
    const url = new URL(req.url, ISSUER);
    if (url.pathname === "/.well-known/openid-configuration")
      return send(res, 200, { issuer: ISSUER, authorization_endpoint: `${ISSUER}/o/oauth2/v2/auth`, token_endpoint: `${ISSUER}/token`, jwks_uri: `${ISSUER}/oauth2/v3/certs` });
    if (url.pathname === "/oauth2/v3/certs")
      return send(res, 200, { keys: [{ ...publicKey.export({ format: "jwk" }), kid: KID, use: "sig", alg: "RS256" }] });
    if (req.method === "POST" && url.pathname === "/__test/identity") { identity = JSON.parse(raw); return send(res, 200, identity); }

    if (url.pathname === "/o/oauth2/v2/auth") {
      const q = url.searchParams;
      const back = new URL(q.get("redirect_uri"));
      if (q.get("client_id") !== CLIENT_ID || q.get("code_challenge_method") !== "S256" || !q.get("code_challenge"))
        return send(res, 400, { error: "invalid_request" });
      if (identity.deny) back.searchParams.set("error", "access_denied");
      else {
        const code = crypto.randomBytes(16).toString("hex");
        const claims = { ...identity };
        delete claims.deny;
        codes.set(code, { claims, challenge: q.get("code_challenge"), redirectUri: q.get("redirect_uri") });
        back.searchParams.set("code", code);
      }
      back.searchParams.set("state", q.get("state") ?? "");
      res.writeHead(302, { Location: back.toString() });
      return res.end();
    }

    if (req.method === "POST" && url.pathname === "/token") {
      const f = new URLSearchParams(raw);
      if (f.get("client_id") !== CLIENT_ID || f.get("client_secret") !== CLIENT_SECRET) return send(res, 401, { error: "invalid_client" });
      const grant = codes.get(f.get("code"));
      codes.delete(f.get("code"));
      if (!grant || grant.redirectUri !== f.get("redirect_uri")) return send(res, 400, { error: "invalid_grant" });
      const challenge = crypto.createHash("sha256").update(f.get("code_verifier") ?? "").digest("base64url");
      if (challenge !== grant.challenge) return send(res, 400, { error: "invalid_grant", error_description: "PKCE verification failed" });
      return send(res, 200, { access_token: "fake", token_type: "Bearer", expires_in: 3599, id_token: idToken(grant.claims, CLIENT_ID) });
    }
    send(res, 404, { error: "not found" });
  });
}).listen(PORT, () => console.log(`fake Google on ${ISSUER}`));
