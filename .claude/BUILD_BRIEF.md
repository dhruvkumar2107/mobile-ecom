# VOLTAGE — Build Brief (read this first, in full)

You are one of ~30 agents completing the **VOLTAGE** app: an ultra-premium mobile &
electronics commerce platform. The `lib`, `prisma/schema.prisma`, design system and UI
kit are **already built and must not be rewritten**. Your job is to add the files you
own, matching the existing conventions exactly.

**Non-negotiable: `npx tsc --noEmit` must stay clean.** The repo typechecks green right
now. If your files break it, the build is broken for everyone.

---

## 1. Stack

- **Next.js 15.5** App Router, React 19, TypeScript 5.7 (strict).
- **Tailwind CSS v4** — tokens declared via `@theme` in `src/app/globals.css`. There is
  **no `tailwind.config.js`**; you cannot add config. Only use token classes that the
  `@theme` block actually defines (list in §4).
- **Prisma 6.1** over SQLite (`prisma/dev.db`).
- `framer-motion`, `lucide-react`, `recharts`, `zod`, `clsx`, `tailwind-merge` available.
- **No new dependencies.** Do not add to `package.json`.

### Next 15 rules that WILL bite you
```ts
// params and searchParams are Promises in Next 15.
export default async function Page(props: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await props.params;
  const sp = await props.searchParams;
}
// Route handlers:
export const GET = route(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const { id } = await ctx.params;
});
```
- `cookies()` and `headers()` from `next/headers` are **async** — always `await`.
- Never call `cookies()` in a component that renders during static generation; these
  pages are dynamic by nature (auth + cart), which is fine.

---

## 2. Absolute architectural rules

1. **Every module in `src/lib/services/*` and `src/lib/auth.ts` starts with
   `import 'server-only'`.** They can be imported **only** from server components,
   server actions and route handlers. Importing one into a `'use client'` file is a
   hard build error. Client components receive plain serialisable props instead.
2. **Do not modify** anything under `src/lib/`, `src/components/ui/`,
   `src/components/product/`, `prisma/schema.prisma`, `src/app/globals.css`,
   `src/app/layout.tsx`, `package.json`, `next.config.ts`, `.env`.
   If you are convinced one has a bug, **report it in your final message** — do not edit it.
3. **Own only your files.** Other agents are writing siblings concurrently. Never create
   or edit a file outside your assigned list. If you need a shared component that another
   agent owns, code against the contract in §7 and assume it exists.
4. **Server-first.** Default to server components that call services directly. Add
   `'use client'` only for genuine interactivity (forms, dialogs, filters, charts).
   Recharts and framer-motion require `'use client'`.
5. **No binary assets.** No images, no SVG files, no fonts. All product/device imagery is
   rendered from gradients and type via `DeviceArt`/`DeviceStage`
   (`src/components/product/device-art.tsx`). Brand marks are typographic.

---

## 3. Reference material — read what you need

- **`.claude/SCHEMA_REF.md`** — condensed reference for all 74 Prisma models. Read this
  for field names. If it is missing, read `prisma/schema.prisma` directly.
- **`src/lib/enums.ts`** — every status union + its display metadata (`label`, `tone`).
  **Always** render statuses through the `*_STATUS_META` maps; never hand-write a label
  or pick a colour yourself.
- **`src/components/ui/*.tsx`** — the UI kit. **Read the files you use** before using
  them; prop names below are indicative, the files are authoritative.
- The service module you are calling — read its exported types and the doc comment at
  the top. They are thorough and explain the domain rules.

### Money — read this twice
Every monetary value in the system is an **integer number of paise** (`*Paise` fields).
Never use floats for money. Format for display with `src/lib/money.ts`:
- `formatINR(paise)` → `₹1,29,900` — storefront default.
- `formatINRExact(paise)` → `₹1,29,900.00` — invoices, ledgers, payout statements.
- `formatINRCompact(paise)` → `₹1.2Cr` / `₹45.3L` / `₹12.5K` — dashboard tiles only.
- `formatNumber`, `discountPercent(mrp, price)` also live there.
Add `className="tabular"` to any element containing digits that sit in a column.

---

## 4. Design system

Dark-first "instrument panel": near-black blue-shifted glass, **electric cyan** (`volt`)
as the single load-bearing accent, **violet** (`plasma`) reserved for wallet / loyalty /
referral surfaces. Restraint is the aesthetic — cyan marks the one thing that matters on
a screen, not every heading.

**Only these token classes exist** (from the `@theme` block):
- Surfaces: `void`, `abyss`, `panel`, `panel-2`, `line`, `line-2`
  → `bg-void`, `bg-panel-2`, `border-line`, `ring-line-2`, …
- Text: `ink`, `ink-2`, `ink-3`, `ink-4` → `text-ink`, `text-ink-3`, …
- Accent: `volt-50…volt-700` → `text-volt-300`, `bg-volt-400`, `ring-volt-400/40`
- Violet: `plasma-300…plasma-600`
- Semantic: `good-400/500`, `warn-400/500`, `bad-400/500`
- Radii: `rounded-panel`, `rounded-tile`. Shadows: `shadow-glow`, `shadow-panel`, `shadow-lift`.

There is **no** `volt-800`, no `ink-5`, no `gray-*`/`slate-*`/`zinc-*` token in the theme —
plain Tailwind palette classes are not defined here. Stick to the list.

**Utility classes** from globals.css: `.panel` (frosted workhorse surface), `.panel-flat`,
`.bevel` (hairline top highlight), `.text-gradient`, `.shimmer`, `.no-scrollbar`,
`.snap-rail`, `.fade-x`, `.grid-overlay`, `.animate-rise`, `.tabular`, `.prose-volt`
(long-form CMS copy).

**Craft bar.** This is a flagship storefront, not a CRUD admin sample:
- Generous vertical rhythm; content max-width ~`max-w-7xl` with `px-4 sm:px-6 lg:px-8`.
- Mobile-first and genuinely responsive — this is a *mobile* commerce platform. Test every
  layout mentally at 375px. Horizontal rails use `.snap-rail .no-scrollbar .fade-x`.
- Every list/table state handled: loading (`Skeleton`), empty (`EmptyState`), error.
- Respect `prefers-reduced-motion` (globals.css already neutralises the named animations).
- Real accessibility: label every input, `aria-label` every icon-only control, keyboard
  paths for dialogs (`Modal`/`Sheet` already handle focus + Escape).

### UI kit inventory (`@/components/ui/...`)
- `button` — `Button` (variants `primary|secondary|outline|ghost|danger|wallet|link`,
  sizes `xs|sm|md|lg|icon|icon-sm`, `loading`, `fullWidth`), `ButtonLink`, `IconButton{label}`.
- `panel` — `Panel{flat,bevel,as}`, `PanelHeader{title,description,action,icon}`,
  `PanelBody{pad}`, `PanelFooter`, `PageHeader{title,description,action,breadcrumb}`,
  `Row{label,value,hint,strong,tone}`, `Divider{label}`, `EmptyState`, `Skeleton`,
  `StatTile{label,value,sub,delta,icon,tone}`, `Meter{value,max,tone,showLabel}`.
- `input` — `Field{label,hint,error,required}`, `Input`, `PasswordInput`, `Textarea`,
  `Select`, `SearchInput`, `Checkbox`, `Radio`, `Switch`, `RupeeInput`.
  Wrap controls in `Field` for the label/error treatment.
- `table` — `Table`, `THead`, `TH`, `TBody`, `TR`, `TD`, `CellLink`, `TableEmpty`,
  `Pagination{page,pages,total,perPage,hrefFor}` (pure links, works without JS).
- `badge` — `Badge{tone,size}`, `Chip`. Tones are the `Tone` union from `enums.ts`.
- `overlay` — `Modal`, `Sheet`, `ConfirmDialog` (all client, handle focus/Escape).
- `misc` — `Tabs`, `LinkTabs`, `Accordion`, `Rating`, `Tooltip`, `CopyButton`, `Avatar`.
- `toast` — `useToast()` → `{push, success, error, info}`. Provider is already mounted in
  the root layout. Safe to call outside a provider (no-ops).
- `@/components/product/device-art` — `DeviceArt{kind,colorHex,colorHex2,finish,seed,frame,brandMark}`,
  `DeviceStage`. `kind` ∈ `phone|tablet|wearable|audio|accessory`.

---

## 5. API conventions (`src/lib/api.ts`)

Every route handler is wrapped so errors become a predictable envelope:

```ts
import { route, ok, fail, body, query, AppError, enforceRateLimit, clientIp, deviceHint } from '@/lib/api';
import { z } from 'zod';

const Schema = z.object({ variantId: z.string().min(1), quantity: z.number().int().min(1).max(5).optional() });

export const POST = route(async (req: Request) => {
  const user = await getCurrentUser();              // or requireUser() / requireStaff('orders.write')
  const input = await body(req, Schema);            // ZodError → 422 with per-field messages
  const data = await addToCart(cartId, input);
  return ok(data);
});
```

- Response shape is always `{ ok: true, data }` or `{ ok: false, error, fields? }`.
- Throw `new AppError(message, status, fields?)` for domain failures — the message is
  shown verbatim to the user, so write it as **customer-facing copy** ("That option is
  unavailable."), never as a developer string.
- `AuthError` (from `requireUser`/`requireStaff`) and `ZodError` are handled by `route()`.
  Never catch them yourself.
- Rate-limit anything that sends a message or costs money:
  `enforceRateLimit(\`otp:${ip}\`, 5, 60_000)`.
- `query(req, schema)` parses the querystring (repeat keys become arrays).
- Use `export const dynamic = 'force-dynamic'` on routes that read cookies, if Next
  complains during build.

### Auth helpers (`src/lib/auth.ts`)
- `getCurrentUser(): Promise<CurrentUser | null>` — `cache()`d per render, call freely.
- `requireUser(): Promise<CurrentUser>` — throws `AuthError` 401.
- `requireStaff(permission?: Permission)` — throws 401/403. **Every admin page and every
  admin route handler must call this with the narrowest permission that fits**, e.g.
  `requireStaff('payouts.approve')`. Read `src/lib/rbac.ts` for the permission list.
- `CurrentUser` = `{ id, email, phone, name, photoUrl, role, status, referralCode,
  loyaltyTier, loyaltyPoints, permissions, staffRoleName, walletBalancePaise, walletPendingPaise }`.
- In pages, redirect instead of throwing:
  `import { redirect } from 'next/navigation'; if (!user) redirect('/login?next=/account');`

---

## 6. Page conventions

```tsx
import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Cart' };   // template appends " · VOLTAGE"

export default async function CartPage() { /* server component */ }
```
- Use `generateMetadata` when the title depends on data; `notFound()` from
  `next/navigation` for missing records.
- Prefer **URL state** for filters/sort/pagination (`?sort=price_asc&page=2`) so pages
  stay server-rendered and shareable. `Pagination` and `LinkTabs` are built for this.
- Mutations from client components go through `fetch` to a route handler, then
  `router.refresh()` to re-render server data. Server actions are acceptable where they
  are simpler, but be consistent within a feature.
- Client fetch helper (owned by the foundation agent, see §7): `api()` from `@/lib/client`.

---

## 7. Shared contracts (code against these; another agent owns the file)

```ts
// @/lib/client   — client-side fetch wrapper over the ApiOk/ApiErr envelope
export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string; fields?: Record<string, string> };
export function api<T = unknown>(
  path: string,
  init?: { method?: 'GET'|'POST'|'PATCH'|'PUT'|'DELETE'; json?: unknown; signal?: AbortSignal },
): Promise<ApiResult<T>>;

// @/components/site/header
export function SiteHeader(props: {
  user: { name: string | null; email: string | null; role: string; loyaltyTier: string } | null;
  cartCount: number;
  announcement: { text: string; enabled: boolean };
}): React.JSX.Element;

// @/components/site/footer
export function SiteFooter(props: { supportEmail: string; supportPhone: string }): React.JSX.Element;

// @/components/admin/shell
export function AdminShell(props: {
  user: { name: string | null; email: string | null; role: string; staffRoleName: string | null; permissions: string[] };
  children: React.ReactNode;
}): React.JSX.Element;

// @/components/account/nav
export function AccountNav(props: { walletBalancePaise: number; loyaltyTier: string; loyaltyPoints: number }): React.JSX.Element;
```

---

## 8. Voice

Product copy is confident and specific, never breathless. Error messages tell the
customer what to do next. Indian retail conventions throughout: ₹ with lakh/crore
grouping, GST-inclusive prices, pincode serviceability, IMEI, IFSC/UPI, COD, EMI.
No lorem ipsum — write real copy. No emoji in UI text.

## 9. Code style

Match the existing code: named exports, `function` declarations for components, `type`
over `interface`, no default exports except Next's required `page`/`layout`/`route`
exports. Comments explain **why**, not what — the existing files are the model. Do not
add file-header banners to page files. Keep to the existing quote/semicolon style
(single quotes, semicolons, trailing commas).

## 10. When you finish

1. Run `npx tsc --noEmit` and fix every error **in the files you own**. Errors caused by
   another agent's not-yet-written file are expected — note them, don't fix them by
   creating that file.
2. Report back: files created, anything you deliberately left out, any bug you found in
   the pre-existing `lib` layer, and any contract mismatch you had to work around.

---

## 11. Schema gotchas (verified — trust these over your assumptions)

`.claude/SCHEMA_REF.md` (1358 lines) is a machine-verified reference for all **75** models.
Read it for field names instead of the raw schema. These traps were found while building it:

1. **~18 FK columns have NO Prisma relation field** — they are plain `String` ids you must
   set directly, and Prisma will *not* let you `connect` them:
   `PasswordResetToken.userId`, `Review.orderId`, `Review.moderatedById`,
   **`Order.emiPlanId`** (no link to `EmiPlan` at all), `LoyaltyTransaction.orderId`,
   `Referral.firstOrderId`, `ReferralCommission.refereeId`, `ReferralCommission.adjustedById`,
   `ServiceRequest.assignedToId`, `AbandonedCart.userId`, `AbandonedCart.recoveredOrderId`,
   `WalletTransaction.createdById`, `WalletTransaction.referenceId`,
   `StockMovement.actorId`, `StockMovement.referenceId`, `OrderStatusEvent.actorId`,
   `PaymentAttempt.isRetryOf`, `PurchaseOrder.createdById`, `TrafficEvent.userId`,
   `TrafficEvent.productId`, `ChatSession.userId`.
   Referential integrity on these is **your** responsibility — write real ids, never a
   fabricated one, or the joins that read them return nothing.

2. **`CartItem`'s `@@unique([cartId, variantId, protectionPlanId])` does not hold** when
   `protectionPlanId` is null — SQLite treats NULLs as distinct, so duplicate
   no-protection lines are insertable. `addToCart` in `cart.ts` compensates; anything else
   touching cart items must too.

3. **Only ~20 of ~80 enum-like String columns have a TS union in `enums.ts`.** The rest —
   including **`User.role`**, **`Shipment.status`** and **`HomepageSection.type`** — are
   governed by a comment in the schema. Read that comment and match it exactly; there is
   no compiler to catch you. `Order.paymentMethod` additionally permits `wallet_full`,
   which `PaymentAttempt.method`'s documented set omits.

4. **Timestamps are not universal.** 15 models carry none at all (`Category`,
   `SpecDefinition`, `ProductSpecValue`, `AccessoryLink`, `FlashSaleItem`, `EmiPlan`,
   `ExchangeDevice`, `ProtectionPlan`, `OrderItem`, `EmiInstalment`, `ServiceCenter`,
   `ServiceCenterBrand`, `DailyMetric`, `ShippingZone`, `TaxRule`) — do not order by
   `createdAt` on those. `CartItem` uses **`addedAt`**, `AbandonedCart` uses
   **`detectedAt`**. `Order` indexes `placedAt`, not `createdAt` (both columns exist) —
   sort and filter on `placedAt`.

5. **Uniqueness is asymmetric.** `PaymentAttempt.gatewayPaymentId` is `@unique`, but
   `Refund.gatewayRefundId`, `Payout.providerPayoutId` and `Shipment.awb` are **not** —
   generate distinct values yourself. `OrderUnit.imei1`/`serialNumber` are `@unique` but
   `imei2` is not. `CouponRedemption` has no `@@unique([couponId, userId])`, so
   `perUserLimit` is enforced in code only.

6. **Authorization is dual-sourced**: `User.role` (string) *and*
   `User.staffRoleId` → `StaffRole.permissions` (JSON). `getCurrentUser()` already merges
   them into `CurrentUser.permissions` — always gate on that, never on `role` alone.
