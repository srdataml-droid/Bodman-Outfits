# api.md — Atelier Haute Backend Contract (NestJS)

Base URL (dev): `http://localhost:4000/api`
All request/response bodies are JSON unless noted. All timestamps are
ISO 8601 strings. All money values are integers in kobo/naira minor
units unless stated otherwise — confirm currency handling with the
project owner before building payment logic.

## Standard error shape

```json
{
  "statusCode": 400,
  "message": "Human-readable message, or an array of field errors",
  "error": "Bad Request"
}
```

---

## 1. Admin Authentication

Session-based via an **httpOnly, secure cookie** — not a token stored
in frontend JavaScript. Frontend fetch calls must include
`credentials: 'include'`.

### `POST /api/auth/login`
Request:
```json
{ "email": "admin@atelierhaute.com", "password": "string" }
```
Response `200`: sets `Set-Cookie: session=<opaque>; HttpOnly; Secure; SameSite=Lax`
```json
{ "id": "usr-1", "email": "admin@atelierhaute.com", "role": "admin" }
```
Response `401` on bad credentials.

### `GET /api/auth/me`
Returns the current session's user, or `401` if not logged in.
```json
{ "id": "usr-1", "email": "admin@atelierhaute.com", "role": "admin" }
```

### `POST /api/auth/logout`
Clears the session cookie. Response `204`.

### Protected endpoints
Any endpoint marked **(admin)** below requires a valid session cookie.
No PIN parameter, no `Authorization: Bearer` header, no hardcoded
bypass value of any kind.

---

## 2. Catalog — Services & Fabrics

### `GET /api/catalog` (public)
```json
{ "services": [ServiceItem], "fabrics": [FabricOption] }
```

### `POST /api/services` (admin)
Request body: `ServiceItem` minus `id`. Response `201`: created `ServiceItem`.

### `PUT /api/services/:id` (admin)
Partial `ServiceItem`. Response `200`: updated `ServiceItem`. `404` if not found.

### `DELETE /api/services/:id` (admin)
Response `204`. `404` if not found.

### `POST /api/fabrics` (admin)
Request body: `FabricOption` minus `id`. Response `201`.

### `PUT /api/fabrics/:id` (admin)
Response `200`. `404` if not found.

### `DELETE /api/fabrics/:id` (admin)
Response `204`.

```ts
interface ServiceItem {
  id: string;
  title: string;
  category: 'bespoke_suit' | 'tuxedo' | 'traditional' | 'alteration' | 'restyling';
  startingPrice: number;
  turnaroundDays: number;
  description: string;
  features: string[];
  imageUrl: string;
}

interface FabricOption {
  id: string;
  name: string;
  origin: string;
  composition: string;
  colorHex: string;
  pattern: 'solid' | 'pinstripe' | 'check' | 'herringbone' | 'jacquard';
  priceTier: 'Standard' | 'Premium' | 'Luxury';
  inStock: boolean;
  imageUrl: string;
}
```

---

## 3. Orders & Tracking

### `GET /api/orders` (admin)
Returns all `Order[]`, most recent first.

### `GET /api/orders/lookup?q={query}` (public)
`query` matches against Order ID (exact, case-insensitive), phone
(digits-only match), or customer name (substring match).
Response `200`: `Order[]` (empty array if no match — not a 404).

### `POST /api/orders` (admin)
Request: subset of `Order` (customerName, phone, email, serviceTitle,
fabricName, totalPrice, depositAmount, estimatedCompletionDate,
measurementsId?, notes?).
Response `201`: full `Order` with generated `id` (format
`ORD-{year}-{4 digits}`), `status: "placed"`, and initial `history` entry.

### `POST /api/orders/guest` (public — customer self-service order)
Request: `{ customerName, phone, email, serviceTitle, fabricName, measurementsId?, fulfillmentMethod: 'pickup' | 'delivery', deliveryAddress? }`.
`deliveryAddress` required if `fulfillmentMethod` is `'delivery'`.
`totalPrice`/`depositAmount` are computed server-side from the
service's `startingPrice` and the shop's `depositPercentage` — never
trust client-supplied amounts.
Response `201`:
```json
{ "order": { "...Order fields..." }, "paymentUrl": "https://checkout.paystack.com/..." }
```
Frontend immediately redirects the customer to `paymentUrl`. Order is
created with `paymentStatus: "unpaid"` until payment is confirmed
per section 8.

### `PUT /api/orders/:id/status` (admin)
Request:
```json
{ "status": "in_production", "note": "optional", "paymentStatus": "paid_in_full", "fittingDate": "optional" }
```
Response `200`: updated `Order`, with a new `history` entry appended
if `status` changed. `404` if not found.

```ts
type OrderStatus = 'placed' | 'confirmed' | 'fabric_cut' | 'in_production'
  | 'fitting_required' | 'ready' | 'delivered';
type PaymentStatus = 'unpaid' | 'deposit_paid' | 'paid_in_full';

interface Order {
  id: string;
  customerName: string;
  phone: string;
  email: string;
  serviceTitle: string;
  fabricName: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  totalPrice: number;
  depositAmount: number;
  estimatedCompletionDate: string;
  fittingDate?: string;
  measurementsId?: string;
  notes?: string;
  fulfillmentMethod: 'pickup' | 'delivery';
  deliveryAddress?: string;
  createdAt: string;
  history: { status: OrderStatus; timestamp: string; note?: string }[];
}
```

---

## 4. Guest Inquiries & Mailing List

### `POST /api/inquiries` (public)
Request: `customerName, phone, email, serviceRequested, fabricPreference?, preferredFittingDate?, message?`.
Response `201`: created `GuestInquiry` with `status: "new"`.

### `GET /api/inquiries` (admin)
Returns `GuestInquiry[]`, most recent first.

### `PUT /api/inquiries/:id/status` (admin)
Request: `{ "status": "reviewed" | "converted" }`. Response `200`.

### `POST /api/subscribers` (public)
Request: `{ "name"?: string, "email": string, "preference"?: string }`.
Response `201` on new signup; `200` with a friendly "already
subscribed" message if the email already exists — do not error on
duplicates.

### `GET /api/subscribers` (admin)
Returns `Subscriber[]`.

```ts
interface GuestInquiry {
  id: string;
  customerName: string;
  phone: string;
  email: string;
  serviceRequested: string;
  fabricPreference?: string;
  preferredFittingDate?: string;
  message: string;
  status: 'new' | 'reviewed' | 'converted';
  createdAt: string;
}

interface Subscriber {
  id: string;
  name: string;
  email: string;
  preference: 'all' | 'bespoke_drops' | 'fabric_arrivals' | 'style_guides';
  subscribedAt: string;
}
```

---

## 5. Measurements

### `POST /api/measurements` (public)
Request: `MeasurementProfile` minus `id`/`updatedAt`.
Response `201`: created profile.

### `GET /api/measurements` (admin)
Returns `MeasurementProfile[]`.

### `PUT /api/measurements/:id` (admin or the owning customer via lookup — confirm with project owner which)
Response `200`. `404` if not found.

```ts
interface MeasurementProfile {
  id: string;
  customerName: string;
  phone: string;
  email?: string;
  chest: number;
  waist: number;
  shoulder: number;
  sleeve: number;
  neck: number;
  hip: number;
  inseam: number;
  heightCm?: number;
  preferredFit: 'slim' | 'classic' | 'relaxed';
  postureNotes?: string;
  updatedAt: string;
}
```

---

## 6. AI Endpoints (server-side Ollama Cloud calls only)

Backend calls Ollama Cloud's native API at `https://ollama.com/api`
(chat/generate endpoints — not the OpenAI-compatible `/v1` layer,
per Ollama's own guidance) with `Authorization: Bearer <OLLAMA_API_KEY>`.
`OLLAMA_API_KEY` is an environment variable, created at
ollama.com/settings/keys, never hardcoded, never sent to the frontend.
No OpenAI/Gemini/Anthropic key or SDK anywhere in this codebase.

### `POST /api/ai/visualize`
Request: `{ garmentType, fabricName, fabricColor, cutStyle, lapelType, additionalDetails? }`.
Response `200`:
```json
{ "imageUrl": "data:image/png;base64,...", "promptUsed": "string", "description": "string", "isFallback": false }
```
**Open dependency**: Ollama's image-generation models were introduced
as local/macOS-only experimental features — availability via Ollama
Cloud is unconfirmed. Until confirmed (see AGENTS.md), this endpoint
should return `"isFallback": true` with a curated placeholder image
rather than attempting a live generation call. Do not swap in a
different cloud image API here without project-owner sign-off.

### `POST /api/ai/chat`
Rate-limited: max 10 requests/minute per IP (NestJS `@Throttle`).
Request:
```json
{ "userMessage": "string", "conversationHistory": [{ "sender": "user" | "assistant", "text": "string" }] }
```
Response `200`: `{ "reply": "string", "source": "rules" | "cache" | "ollama" }`.

Internal handling order:
1. Try matching `userMessage` against the real FAQ data (`GET
   /api/faqs`) plus common patterns (price, hours, turnaround, order
   tracking) — reply instantly if matched, no AI call, `source: "rules"`.
2. Check the response cache (keyed on normalized question text,
   ~1hr TTL, invalidated on shop-settings/catalog changes) —
   `source: "cache"` on hit.
3. Otherwise, call Ollama Cloud with a light-tier model, the
   shop-context system prompt, and only the last few turns of
   `conversationHistory` — `source: "ollama"`.
Must never fail visibly to the customer — on any internal error
(including Ollama Cloud being unreachable, rate-limited, or over
quota), return a graceful fallback reply pointing to phone/contact
info instead of a raw error response.

---

## 7. Shop Settings

### `GET /api/shop-settings` (public)
Returns display fields only (name, tagline, contact, hours, pricing
note, deposit %) — never returns `adminPin`/password hashes/secrets.
Seed `whatsappNumber` with `+234 706 131 3517` as the initial default
— admin can edit it later from `/admin/settings`.

### `PUT /api/shop-settings` (admin)
Request: partial settings object (no `pin` field — auth is via
session cookie now, not a request-body PIN).
Response `200`: updated settings.

```ts
interface ShopSettings {
  shopName: string;
  tagline: string;
  phone: string;
  whatsappNumber: string; // stored as entered (e.g. "+234 706 131 3517");
                          // normalize to digits-only with country code,
                          // no leading 0, when building the wa.me link
  email: string;
  address: string;
  cityCountry: string;
  hoursWeekday: string;
  hoursSaturday: string;
  hoursSunday: string;
  pricingNote: string;
  depositPercentage: number;
}
```

---

## 8. Payments (Paystack — server-authoritative, never client-trusted)

`PAYSTACK_SECRET_KEY` is an environment variable, used only server-side.
Amounts sent to Paystack are in kobo (multiply naira by 100).

### Internal flow triggered by `POST /api/orders/guest`
Server calls Paystack's Initialize Transaction endpoint
(`POST https://api.paystack.co/transaction/initialize`) with the
customer's email and the computed deposit amount, using
`Authorization: Bearer <PAYSTACK_SECRET_KEY>`. Paystack returns an
`authorization_url` (returned to the frontend as `paymentUrl`) and a
`reference` — store this `reference` on the `Order` record.

### `GET /api/payments/verify/:reference` (public)
Called by the frontend the moment the customer is redirected back
from Paystack's checkout page. Server makes a
`GET https://api.paystack.co/transaction/verify/:reference` call
(server-side, using the secret key) and:
- Confirms `status === 'success'`
- Confirms the paid amount matches the order's expected deposit —
  reject/flag if it doesn't
- If valid and not already processed, updates the matching order's
  `paymentStatus` and appends a `history` entry
- Response: `{ "verified": true, "order": { ... } }` or
  `{ "verified": false, "reason": "string" }`
This call must be **idempotent** — verifying the same reference twice
must not double-update the order or double-send confirmation emails.

### `POST /api/payments/webhook` (public, signature-verified — source of truth)
Receives Paystack's `charge.success` event. Before processing:
1. Verify the `x-paystack-signature` header is a valid HMAC SHA512 of
   the raw request body, signed with `PAYSTACK_SECRET_KEY` — reject
   (401) anything that doesn't match, no exceptions.
2. Confirm the paid amount matches the order's expected deposit.
3. Update the matching order's `paymentStatus` (idempotently — same
   safeguard as the verify endpoint; a webhook can be delivered more
   than once).
Must respond `200` quickly (Paystack retries on failure/timeout).

---

## 9. Appointments / Fitting Sessions

### `POST /api/appointments` (public)
Request: `{ customerName, phone, email, preferredDate, preferredTimeWindow, purpose: 'measurement' | 'fitting' | 'consultation', orderId? }`.
Response `201`: created appointment, `status: "requested"`.

### `GET /api/appointments` (admin)
Returns `Appointment[]`, soonest first.

### `PUT /api/appointments/:id/status` (admin)
Request: `{ "status": "confirmed" | "rescheduled" | "completed" | "cancelled", "confirmedDate"?: "string", "note"?: "string" }`.

```ts
interface Appointment {
  id: string;
  customerName: string;
  phone: string;
  email: string;
  preferredDate: string;
  preferredTimeWindow: string;
  purpose: 'measurement' | 'fitting' | 'consultation';
  orderId?: string;
  status: 'requested' | 'confirmed' | 'rescheduled' | 'completed' | 'cancelled';
  confirmedDate?: string;
  note?: string;
  createdAt: string;
}
```

---

## 10. FAQs

### `GET /api/faqs` (public)
Returns `Faq[]`, ordered by `sortOrder`. This is also the primary
content the AI concierge draws from for common questions — keep
answers written the way you'd want a customer to actually read them,
not internal notes.

### `POST /api/faqs` (admin) / `PUT /api/faqs/:id` (admin) / `DELETE /api/faqs/:id` (admin)
Standard CRUD, same pattern as services/fabrics.

```ts
interface Faq {
  id: string;
  question: string;
  answer: string;
  category?: string;
  sortOrder: number;
}
```
