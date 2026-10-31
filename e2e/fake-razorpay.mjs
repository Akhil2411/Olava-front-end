// LOCAL TEST DOUBLE for the Razorpay REST API (orders, payments, capture), used only by the E2E run when the
// real sandbox isn't reachable. It is NOT a sandbox: it proves our verification flow, not Razorpay itself.
// Extra test-only endpoint: POST /__test/pay {order_id, status} creates a payment as if the customer paid.
import http from "node:http";
import crypto from "node:crypto";

const PORT = Number(process.env.FAKE_RAZORPAY_PORT ?? 5099);
const orders = new Map();
const payments = new Map();
const id = (p) => `${p}_${crypto.randomBytes(7).toString("hex")}`;
const send = (res, status, body) => { res.writeHead(status, { "Content-Type": "application/json" }); res.end(JSON.stringify(body)); };
const wire = (p) => ({ id: p.id, entity: "payment", amount: p.amount, currency: p.currency, status: p.status, order_id: p.order_id, method: "upi",
  error_code: p.status === "failed" ? "BAD_REQUEST_ERROR" : null, error_description: p.status === "failed" ? "Payment declined (test)." : null });

http.createServer((req, res) => {
  let raw = "";
  req.on("data", (c) => (raw += c));
  req.on("end", () => {
    const body = raw ? JSON.parse(raw) : {};
    const path = req.url.replace(/^\/(v1\/)?/, "").replace(/\/$/, "");
    const parts = path.split("/");
    if (req.method === "POST" && path === "__test/pay") {
      const order = orders.get(body.order_id);
      if (!order) return send(res, 404, { error: "unknown order" });
      const p = { id: id("pay"), order_id: order.id, amount: body.amount ?? order.amount, currency: order.currency, status: body.status ?? "captured" };
      payments.set(p.id, p);
      return send(res, 200, wire(p));
    }
    if (req.method === "GET" && path === "__test/orders") return send(res, 200, [...orders.values()]);
    if (!req.headers.authorization?.startsWith("Basic ")) return send(res, 401, { error: "auth" });
    if (req.method === "POST" && path === "orders") {
      const o = { id: id("order"), amount: body.amount, currency: body.currency, receipt: body.receipt, status: "created" };
      orders.set(o.id, o);
      return send(res, 200, o);
    }
    if (req.method === "GET" && parts[0] === "payments" && parts.length === 2) {
      const p = payments.get(parts[1]);
      return p ? send(res, 200, wire(p)) : send(res, 404, { error: "not found" });
    }
    if (req.method === "GET" && parts[0] === "orders" && parts[2] === "payments") {
      return send(res, 200, { entity: "collection", items: [...payments.values()].filter((p) => p.order_id === parts[1]).map(wire) });
    }
    if (req.method === "POST" && parts[0] === "payments" && parts[2] === "capture") {
      const p = payments.get(parts[1]);
      if (!p || p.status !== "authorized") return send(res, 400, { error: "bad" });
      p.status = "captured";
      return send(res, 200, wire(p));
    }
    send(res, 404, { error: "no route" });
  });
}).listen(PORT, () => console.log(`fake razorpay on ${PORT}`));
