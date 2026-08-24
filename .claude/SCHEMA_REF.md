# SCHEMA_REF — VOLTAGE Prisma schema (condensed developer reference)

Derived from `prisma/schema.prisma` — **75 models, 1088 fields** (914 scalar + 174 relation).
This file is authoritative for field names and casing. Read it instead of the raw schema.

## Datasource & generator

```prisma
generator client { provider = "prisma-client-js" }   // NO custom `output` → import from "@prisma/client"
datasource db    { provider = "sqlite"; url = env("DATABASE_URL") }
```

SQLite consequences that shape the whole schema:
- **No native enums** → every enum-ish column is `String`, constrained only by TS unions in `src/lib/enums.ts` (or by a `//` comment in the schema). The DB accepts any string; validate in code.
- **No arrays, no `Json` type** → every list/map column is a JSON-encoded `String` with `@default("[]")` / `@default("{}")`, parsed with `parseJson`.
- No `@db.*` native types; no `Decimal` anywhere.
- All ids are `String @id @default(cuid())` unless noted.

## Money

**Every field whose name ends in `Paise` is an `Int` of integer paise (₹1 = 100 paise). Never a float, never rupees.** This holds for all `*Paise` columns without exception (`pricePaise`, `mrpPaise`, `totalPaise`, `commissionPaise`, `codLimitPaise`, …).

Money-adjacent fields that are **not** paise:
- `PricingRule.value`, `Coupon.value` — `Int`: whole percent when `discountType = "percent"`, else paise.
- `ProtectionPlan.priceValue` — `Int`: whole percent when `priceType = "percent"`, else paise.
- `ReferralRule.commissionValue` — `Int`: whole percent when `commissionType = "percent"`, else paise.
- `AccessoryLink.bundleDiscountPct` — whole percent.
- `Product.gstRate`, `OrderItem.gstRate`, `PurchaseOrderItem.gstRate`, `TaxRule.gstRate`, `TaxRule.cessRate` — whole percent `Int`.
- `EmiPlan.interestBps` — basis points (`1200` = 12.00%).
- `Product.ratingAvg`, `Supplier.rating`, `BankAccount.nameMatchScore`, `BankVerificationLog.nameMatchScore`, `SpecDefinition.scaleMax`, lat/long — `Float`.

## Enum-like String columns → TS unions in `src/lib/enums.ts`

| Model.field | Allowed values | TS union / const in enums.ts |
|---|---|---|
| `Order.status` | pending, confirmed, packed, shipped, out_for_delivery, delivered, cancelled, returned | `OrderStatus` / `ORDER_STATUSES` (+ `ORDER_FLOW` transition map, `ORDER_STATUS_META`) |
| `Order.paymentStatus` | pending, paid, partially_paid, failed, refunded, partially_refunded | `PaymentStatus` / `PAYMENT_STATUSES` (+ `PAYMENT_STATUS_META`) |
| `Order.paymentMethod` | cod, card, upi, netbanking, wallet, emi, wallet_full | `PaymentMethod` / `PAYMENT_METHODS` (+ `PAYMENT_METHOD_LABEL`, `ONLINE_PAYMENT_METHODS` = card/upi/netbanking/wallet/emi) |
| `PaymentAttempt.method` | card, upi, netbanking, wallet, emi, cod (schema comment omits `wallet_full` — a full-wallet order needs no gateway attempt) | `PaymentMethod` |
| `PaymentAttempt.status` | created, pending, authorized, captured, failed, refunded | `PaymentAttemptStatus` / `PAYMENT_ATTEMPT_STATUSES` |
| `WalletTransaction.type` | referral_commission, cashback, refund, order_payment, withdrawal, adjustment, reversal, signup_bonus | `WalletTxnType` / `WALLET_TXN_TYPES` (+ `WALLET_TXN_META`) |
| `WalletTransaction.status` | pending, available, processing, completed, failed, reversed | `WalletTxnStatus` / `WALLET_TXN_STATUSES` |
| `WithdrawalRequest.status` | requested, approved, rejected, processing, completed, failed, cancelled | `WithdrawalStatus` / `WITHDRAWAL_STATUSES` (+ `WITHDRAWAL_STATUS_META`) |
| `Payout.status` | created, queued, processing, processed, reversed, failed, cancelled | `PayoutStatus` / `PAYOUT_STATUSES` (+ `PAYOUT_TERMINAL_SUCCESS` = ["processed"], `PAYOUT_TERMINAL_FAILURE` = ["failed","reversed","cancelled"]) |
| `BankAccount.verificationStatus` | unverified, pending, verified, failed | `VerificationStatus` / `VERIFICATION_STATUSES` (+ `VERIFICATION_STATUS_META`) |
| `Referral.status` | invited, signed_up, converted | `ReferralStatus` / `REFERRAL_STATUSES` (+ `REFERRAL_STATUS_META`) |
| `Referral.fraudFlags` (JSON array) | self_referral, same_ip, same_device, disposable_email, referrer_velocity, below_min_order | `FraudFlag[]` / `FRAUD_FLAGS` (+ `FRAUD_FLAG_LABEL`) |
| `ReferralCommission.status` | pending, held, unlocked, paid, reversed, rejected | `CommissionStatus` / `COMMISSION_STATUSES` (+ `COMMISSION_STATUS_META`) |
| `ServiceRequest.status`, `ServiceEvent.status` | requested, approved, rejected, pickup_scheduled, received, diagnosing, awaiting_parts, repairing, repaired, replaced, shipped_back, closed, cancelled | `ServiceStatus` / `SERVICE_STATUSES` (+ `SERVICE_STATUS_META`) |
| `ServiceRequest.type` | repair, replacement, return, inspection | `ServiceType` / `SERVICE_TYPES` |
| `Review.status` | pending, approved, rejected | `ReviewStatus` / `REVIEW_STATUSES` |
| `User.loyaltyTier` | silver, gold, platinum, titanium | `LoyaltyTier` / `LOYALTY_TIERS` (+ `LOYALTY_TIER_META`: `minSpendPaise`, `rewardRateBps`, `accent`) |
| `PurchaseOrder.status` | draft, sent, partially_received, received, cancelled | `PoStatus` / `PO_STATUSES` |
| `StockMovement.type` | inbound, outbound, transfer, adjustment, return, damage | `StockMovementType` / `STOCK_MOVEMENT_TYPES` |
| (UI badge colour, not a DB column) | cyan, emerald, amber, rose, violet, slate | `Tone` — used by every `*_META` map |

**Enum-like String columns with NO union in `enums.ts`** (values come only from the schema comment/default — validate by hand):
`User.role` (customer\|staff\|admin) · `User.status` (active\|suspended\|deleted) · `OAuthAccount.provider` (google\|apple) · `OtpCode.channel` (sms\|email) · `OtpCode.purpose` (login\|signup\|reset\|verify_phone) · `Address.label` (home\|work\|other) · `SavedCard.network` (visa\|mastercard\|rupay\|amex) · `SavedCard.cardType` (credit\|debit) · `SavedCard.gateway` (razorpay) · `BankAccount.destinationType` & `WithdrawalRequest.destinationType` (bank\|vpa) · `BankVerificationLog.provider` (razorpay_fav\|cashfree\|decentro\|mock) · `BankVerificationLog.requestType` (penny_drop\|ifsc_validate\|vpa_validate) · `BankVerificationLog.status` (created\|pending\|completed\|failed) · `Product.kind` & `ProtectionPlan.appliesToKind` (phone\|accessory\|wearable\|audio\|tablet) · `Product.status` (draft\|active\|archived\|coming_soon) · `ProductVariant.finish` (matte\|glossy\|titanium\|ceramic) · `SpecDefinition.groupName` (General\|Display\|Performance\|Camera\|Battery) · `SpecDefinition.dataType` (text\|number\|boolean\|enum) · `PricingRule.scope` (global\|brand\|category\|product\|variant) · `PricingRule.discountType` (percent\|flat\|fixed_price) · `Coupon.discountType` (percent\|flat) · `ProtectionPlan.tier` (basic\|plus\|total) · `ProtectionPlan.priceType` (percent\|flat) · `Cart.status` (active\|converted\|abandoned) · `Order.fulfilmentType` (standard\|express\|preorder) · `Order.cancelledBy` (customer\|admin\|system) · `OrderItem` has none · `OrderUnit.status` (allocated\|dispatched\|delivered\|returned\|replaced) · `OrderStatusEvent.status` (an `OrderStatus`, untyped) · `OrderStatusEvent.actorType` (system\|admin\|customer\|courier) · `Shipment.status` (free-form, default "created") · `EmiInstalment.status` (upcoming\|paid\|overdue\|failed) · `PaymentAttempt.gateway` (mock\|razorpay) · `Refund.mode` (gateway\|wallet) · `Refund.status` (initiated\|processing\|completed\|failed) · `Refund.speed` (default "normal") · `PincodeServiceability.zone` (metro\|tier1\|tier2\|remote) · `LoyaltyTransaction.direction` (earn\|redeem\|expire\|adjustment) · `WalletTransaction.direction` (credit\|debit) · `WalletTransaction.referenceType` (order\|referral_commission\|withdrawal\|manual) · `Payout.provider` (mock\|razorpayx\|cashfree) · `Payout.mode` (IMPS\|NEFT\|UPI\|RTGS) · `ReferralRule.commissionType` (percent\|flat) · `ReferralRule.appliesTo` (first_order_only\|recurring) · `ServiceRequest.issueCategory` (screen\|battery\|camera\|software\|water_damage\|other) · `SupportTicket.category` (order\|payment\|wallet\|product\|general) · `SupportTicket.priority` (low\|normal\|high\|urgent) · `SupportTicket.status` (open\|pending\|resolved\|closed) · `Banner.placement` (hero\|strip\|category\|pdp) · `HomepageSection.type` (hero\|featured\|flash_sale\|brand_rail\|comparison\|launch_countdown\|testimonial\|category_grid) · `PushNotification.segment` (all\|loyalty_tier\|abandoned_cart\|segment_query) · `PushNotification.status` (draft\|scheduled\|sent\|failed) · `AbandonedCart.status` (open\|reminded\|recovered\|lost) · `TrafficEvent.eventType` (pageview\|add_to_cart\|begin_checkout\|purchase\|search) · `TrafficEvent.device` (desktop\|mobile\|tablet) · `TrafficEvent.source` (direct\|organic\|referral\|social\|paid) · `Setting.groupName` (general\|payment\|shipping\|tax\|seo\|theme\|referral\|wallet) · `ChatMessage.role` (user\|assistant).

## JSON-encoded `String` columns (parse with `parseJson`)

`StaffRole.permissions` `[]` · `Product.highlights` `[]` · `Product.badges` `[]` · `SpecDefinition.options` `[]` · `Review.aspects` `{}` · `Review.fraudSignals` `[]` · `PricingRule.conditions` `{}` · `EmiPlan.instruments` `["credit"]` · `Coupon.appliesTo` `{}` · `ProtectionPlan.coverage` `[]` · `Order.addressSnapshot` (required, no default) · `Invoice.hsnSummary` `[]` · `BankVerificationLog.rawResponse` (nullable) · `PaymentAttempt.rawPayload` (nullable) · `Payout.rawResponse` (nullable) · `WebhookEvent.payload` (required) · `WithdrawalRequest.destinationSnapshot` (required) · `Referral.fraudFlags` `[]` · `HomepageSection.config` `{}` · `PushNotification.segmentConfig` `{}` · `ShippingZone.states` `[]` · `ShippingZone.pincodePrefixes` `[]` · `Setting.value` (required) · `AuditLog.before` / `AuditLog.after` (nullable) · `ChatSession.context` `{}` · `ChatMessage.recommendations` `[]`.

---

# Models (schema order)

## AUTH & IDENTITY

### User
- `id` String @id @default(cuid())
- `email` String? @unique
- `phone` String? @unique
- `passwordHash` String?
- `name` String?
- `photoUrl` String?
- `gender` String?
- `dob` DateTime?
- `gstin` String? — for B2B invoices
- `role` String @default("customer") — enum-like: customer | staff | admin
- `staffRoleId` String?
- `emailVerifiedAt` DateTime?
- `phoneVerifiedAt` DateTime?
- `status` String @default("active") — enum-like: active | suspended | deleted
- `referralCode` String @unique — required, non-null
- `referredById` String?
- `signupIp` String?
- `signupDevice` String?
- `loyaltyPoints` Int @default(0)
- `loyaltyTier` String @default("silver") — `LoyaltyTier`
- `lifetimeSpendPaise` Int @default(0) — drives tier promotion; only delivered orders count
- `lastLoginAt` DateTime?
- `createdAt` DateTime @default(now())
- `updatedAt` DateTime @updatedAt
- Relations:
  - `staffRole` → StaffRole? (fk `staffRoleId`, back `StaffRole.users`)
  - `referredBy` → User? (self, fk `referredById`, relation "UserReferrals")
  - `referees` → User[] (relation "UserReferrals")
  - `sessions` → Session[] · `oauthAccounts` → OAuthAccount[] · `addresses` → Address[] · `savedCards` → SavedCard[] · `savedUpis` → SavedUpi[] · `bankAccounts` → BankAccount[]
  - `wallet` → Wallet? (one-to-one)
  - `carts` → Cart[] · `orders` → Order[] · `reviews` → Review[] · `stockAlerts` → StockAlert[]
  - `referralsMade` → Referral[] (relation "Referrer")
  - `referralAsReferee` → Referral? (relation "Referee", one-to-one)
  - `commissionsEarned` → ReferralCommission[] (relation "CommissionReferrer")
  - `withdrawals` → WithdrawalRequest[] · `approvedPayouts` → WithdrawalRequest[] (relation "PayoutApprover")
  - `serviceRequests` → ServiceRequest[]
  - `supportTickets` → SupportTicket[] (relation "TicketOwner") · `assignedTickets` → SupportTicket[] (relation "TicketAssignee")
  - `supportMessages` → SupportMessage[] · `couponRedemptions` → CouponRedemption[] · `loyaltyTxns` → LoyaltyTransaction[] · `auditLogs` → AuditLog[]
- Indexes: @@index([role]) @@index([referredById]) @@index([createdAt])

### StaffRole
- `id` String @id @default(cuid())
- `name` String @unique
- `slug` String @unique
- `description` String?
- `permissions` String @default("[]") // JSON: string[] permission keys, e.g. ["orders.read","orders.write"]
- `isSystem` Boolean @default(false)
- `createdAt` DateTime @default(now())
- `updatedAt` DateTime @updatedAt
- Relations: `users` → User[] (back `User.staffRole`)
- Indexes: none

### Session
- `id` String @id @default(cuid())
- `userId` String
- `jti` String @unique — JWT id
- `ip` String?
- `userAgent` String?
- `device` String?
- `expiresAt` DateTime
- `revokedAt` DateTime?
- `createdAt` DateTime @default(now())
- Relations: `user` → User (fk `userId`, onDelete Cascade, back `User.sessions`)
- Indexes: @@index([userId])

### OAuthAccount
- `id` String @id @default(cuid())
- `userId` String
- `provider` String — enum-like: google | apple
- `providerAccountId` String
- `email` String?
- `createdAt` DateTime @default(now())
- Relations: `user` → User (fk `userId`, onDelete Cascade, back `User.oauthAccounts`)
- Indexes: @@unique([provider, providerAccountId]) @@index([userId])

### OtpCode
- `id` String @id @default(cuid())
- `identifier` String — phone or email
- `channel` String — enum-like: sms | email
- `purpose` String — enum-like: login | signup | reset | verify_phone
- `codeHash` String
- `attempts` Int @default(0)
- `maxAttempts` Int @default(5)
- `expiresAt` DateTime
- `consumedAt` DateTime?
- `ip` String?
- `createdAt` DateTime @default(now())
- Relations: none
- Indexes: @@index([identifier, purpose])

### PasswordResetToken
- `id` String @id @default(cuid())
- `userId` String — plain FK; **no relation field to User**
- `tokenHash` String @unique
- `expiresAt` DateTime
- `usedAt` DateTime?
- `createdAt` DateTime @default(now())
- Relations: none (dangling `userId`)
- Indexes: @@index([userId])

## ADDRESSES & PAYMENT INSTRUMENTS

### Address
- `id` String @id @default(cuid())
- `userId` String
- `label` String @default("home") — enum-like: home | work | other
- `fullName` String
- `phone` String
- `altPhone` String?
- `line1` String
- `line2` String?
- `landmark` String?
- `city` String
- `state` String
- `pincode` String
- `country` String @default("India")
- `latitude` Float?
- `longitude` Float?
- `isDefault` Boolean @default(false)
- `deletedAt` DateTime? — soft delete
- `createdAt` DateTime @default(now())
- `updatedAt` DateTime @updatedAt
- Relations: `user` → User (fk `userId`, onDelete Cascade, back `User.addresses`) · `orders` → Order[] (back `Order.address`)
- Indexes: @@index([userId]) @@index([pincode])

### SavedCard
PCI-safe: only gateway token + display metadata persisted. Never PAN/CVV.
- `id` String @id @default(cuid())
- `userId` String
- `gatewayToken` String
- `gateway` String @default("razorpay")
- `last4` String
- `network` String — enum-like: visa | mastercard | rupay | amex
- `issuer` String?
- `cardType` String — enum-like: credit | debit
- `holderName` String?
- `expiryMonth` Int
- `expiryYear` Int
- `isDefault` Boolean @default(false)
- `createdAt` DateTime @default(now())
- Relations: `user` → User (fk `userId`, onDelete Cascade, back `User.savedCards`)
- Indexes: @@index([userId])

### SavedUpi
- `id` String @id @default(cuid())
- `userId` String
- `vpa` String
- `handleName` String?
- `isVerified` Boolean @default(false)
- `isDefault` Boolean @default(false)
- `createdAt` DateTime @default(now())
- Relations: `user` → User (fk `userId`, onDelete Cascade, back `User.savedUpis`)
- Indexes: @@unique([userId, vpa]) — no standalone @@index([userId])

### BankAccount
Payout destination. Requires a successful penny-drop before withdrawals unlock.
- `id` String @id @default(cuid())
- `userId` String
- `destinationType` String @default("bank") — enum-like: bank | vpa
- `accountHolder` String
- `accountNumber` String? — stored masked except last 4 (kept in `last4`)
- `last4` String?
- `ifsc` String?
- `bankName` String?
- `branch` String?
- `vpa` String?
- `verificationStatus` String @default("unverified") — `VerificationStatus`; unverified → pending → verified | failed
- `verifiedAt` DateTime?
- `nameMatchScore` Float?
- `registeredName` String?
- `failureReason` String?
- `attempts` Int @default(0)
- `providerContactId` String? — provider-side id from verification, reused at payout
- `providerFundAccountId` String? — provider-side id from verification, reused at payout
- `pendingVerificationRef` String? — ref of the in-flight verification being polled
- `isDefault` Boolean @default(false)
- `deletedAt` DateTime?
- `createdAt` DateTime @default(now())
- `updatedAt` DateTime @updatedAt
- Relations: `user` → User (fk `userId`, onDelete Cascade, back `User.bankAccounts`) · `verificationLogs` → BankVerificationLog[] · `withdrawals` → WithdrawalRequest[]
- Indexes: @@index([userId]) @@index([verificationStatus])

### BankVerificationLog
- `id` String @id @default(cuid())
- `bankAccountId` String
- `provider` String — enum-like: razorpay_fav | cashfree | decentro | mock
- `providerRefId` String?
- `requestType` String @default("penny_drop") — enum-like: penny_drop | ifsc_validate | vpa_validate
- `status` String — enum-like: created | pending | completed | failed (no default)
- `amountPaise` Int @default(100)
- `registeredName` String?
- `nameMatchScore` Float?
- `responseCode` String?
- `message` String?
- `rawResponse` String? // JSON: raw provider response object
- `attemptNo` Int @default(1)
- `createdAt` DateTime @default(now())
- `completedAt` DateTime?
- Relations: `bankAccount` → BankAccount (fk `bankAccountId`, onDelete Cascade, back `BankAccount.verificationLogs`)
- Indexes: @@index([bankAccountId]) @@index([status])

## CATALOG

### Brand
- `id` String @id @default(cuid())
- `name` String @unique
- `slug` String @unique
- `logoText` String? — wordmark fallback (no binary assets)
- `accent` String @default("#22d3ee") — hex colour
- `country` String?
- `sortOrder` Int @default(0)
- `isActive` Boolean @default(true)
- `createdAt` DateTime @default(now())
- Relations: `products` → Product[] · `emiPlans` → EmiPlan[] · `serviceCenters` → ServiceCenterBrand[]
- Indexes: none

### Category
- `id` String @id @default(cuid())
- `name` String — **not unique**
- `slug` String @unique
- `icon` String?
- `parentId` String?
- `sortOrder` Int @default(0)
- `isActive` Boolean @default(true)
- `seoTitle` String?
- `seoDescription` String?
- Relations: `parent` → Category? (self, fk `parentId`, relation "CategoryTree") · `children` → Category[] (relation "CategoryTree") · `products` → Product[]
- Indexes: none — **no @@index([parentId])** despite tree traversal
- Note: has no `createdAt` / `updatedAt`

### Product
- `id` String @id @default(cuid())
- `name` String
- `slug` String @unique
- `tagline` String?
- `description` String?
- `brandId` String
- `categoryId` String
- `kind` String @default("phone") — enum-like: phone | accessory | wearable | audio | tablet
- `status` String @default("active") — enum-like: draft | active | archived | coming_soon
- `mrpPaise` Int — pricing anchor; variants may override
- `pricePaise` Int — pricing anchor; variants may override
- `launchDate` DateTime?
- `isPreorder` Boolean @default(false)
- `preorderReleaseAt` DateTime?
- `preorderDepositPaise` Int?
- `hsnCode` String @default("85171300")
- `gstRate` Int @default(18) — whole percent
- `warrantyMonths` Int @default(12)
- `heroGradient` String @default("from-cyan-500/30 to-blue-600/10") — tailwind classes
- `unboxingVideoUrl` String?
- `reviewVideoUrl` String?
- `highlights` String @default("[]") // JSON: string[]
- `badges` String @default("[]") // JSON: string[] e.g. ["5G","AI"]
- `ratingAvg` Float @default(0)
- `reviewCount` Int @default(0)
- `soldCount` Int @default(0)
- `viewCount` Int @default(0)
- `isFeatured` Boolean @default(false)
- `sortOrder` Int @default(0)
- `seoTitle` String?
- `seoDescription` String?
- `seoKeywords` String?
- `createdAt` DateTime @default(now())
- `updatedAt` DateTime @updatedAt
- Relations:
  - `brand` → Brand (fk `brandId`, back `Brand.products`) · `category` → Category (fk `categoryId`, back `Category.products`)
  - `variants` → ProductVariant[] · `specValues` → ProductSpecValue[] · `reviews` → Review[] · `stockAlerts` → StockAlert[]
  - `accessories` → AccessoryLink[] (relation "MainProduct") · `accessoryFor` → AccessoryLink[] (relation "AccessoryProduct")
  - `exchangeModels` → ExchangeDevice[]
- Indexes: @@index([brandId]) @@index([categoryId]) @@index([status]) @@index([kind]) @@index([isFeatured])

### ProductVariant
- `id` String @id @default(cuid())
- `productId` String
- `sku` String @unique
- `ramGb` Int?
- `storageGb` Int?
- `colorName` String
- `colorHex` String
- `colorHex2` String? — secondary stop for gradient/duotone finishes
- `finish` String? — enum-like: matte | glossy | titanium | ceramic
- `mrpPaise` Int
- `pricePaise` Int
- `weightGrams` Int?
- `isActive` Boolean @default(true)
- `isDefault` Boolean @default(false)
- `sortOrder` Int @default(0)
- `createdAt` DateTime @default(now())
- `updatedAt` DateTime @updatedAt
- Relations: `product` → Product (fk `productId`, onDelete Cascade, back `Product.variants`) · `stocks` → InventoryStock[] · `cartItems` → CartItem[] · `orderItems` → OrderItem[] · `stockMovements` → StockMovement[] · `poItems` → PurchaseOrderItem[] · `flashSaleItems` → FlashSaleItem[] · `stockAlerts` → StockAlert[]
- Indexes: @@index([productId]) @@index([isActive])

### SpecDefinition
Spec-sheet builder: admin defines attributes once, products fill values.
- `id` String @id @default(cuid())
- `key` String @unique
- `label` String
- `groupName` String @default("General") — enum-like: General | Display | Performance | Camera | Battery
- `unit` String?
- `dataType` String @default("text") — enum-like: text | number | boolean | enum
- `options` String @default("[]") // JSON: string[] allowed values when dataType = "enum"
- `isFilterable` Boolean @default(false)
- `isComparable` Boolean @default(true)
- `isKeySpec` Boolean @default(false) — shown on product tiles
- `higherIsBetter` Boolean @default(true)
- `scaleMax` Float? — upper bound used to normalise animated comparison bars
- `sortOrder` Int @default(0)
- Relations: `values` → ProductSpecValue[]
- Indexes: none

### ProductSpecValue
- `id` String @id @default(cuid())
- `productId` String
- `definitionId` String
- `valueText` String?
- `valueNumber` Float?
- `valueBool` Boolean?
- Relations: `product` → Product (fk `productId`, onDelete Cascade, back `Product.specValues`) · `definition` → SpecDefinition (fk `definitionId`, onDelete Cascade, back `SpecDefinition.values`)
- Indexes: @@unique([productId, definitionId]) @@index([definitionId])

### AccessoryLink
- `id` String @id @default(cuid())
- `productId` String — the main product
- `accessoryId` String — the accessory product
- `bundleDiscountPct` Int @default(0) — whole percent
- `sortOrder` Int @default(0)
- Relations: `product` → Product (relation "MainProduct", fk `productId`, onDelete Cascade, back `Product.accessories`) · `accessory` → Product (relation "AccessoryProduct", fk `accessoryId`, onDelete Cascade, back `Product.accessoryFor`)
- Indexes: @@unique([productId, accessoryId])

### Review
- `id` String @id @default(cuid())
- `productId` String
- `userId` String? — nullable (expert reviews have no user)
- `orderId` String? — plain FK, **no relation field to Order**
- `rating` Int
- `title` String?
- `body` String
- `aspects` String @default("{}") // JSON: Record<string, number> sub-ratings e.g. {"camera":5,"battery":4}
- `isVerifiedPurchase` Boolean @default(false)
- `isExpert` Boolean @default(false)
- `expertName` String?
- `expertOutlet` String?
- `status` String @default("pending") — `ReviewStatus`: pending | approved | rejected
- `isFlaggedFake` Boolean @default(false)
- `fraudSignals` String @default("[]") // JSON: string[] automated fraud signals
- `moderatorNote` String?
- `moderatedById` String? — plain FK to User, **no relation field**
- `moderatedAt` DateTime?
- `helpfulCount` Int @default(0)
- `reportCount` Int @default(0)
- `createdAt` DateTime @default(now())
- `updatedAt` DateTime @updatedAt
- Relations: `product` → Product (fk `productId`, onDelete Cascade, back `Product.reviews`) · `user` → User? (fk `userId`, back `User.reviews`)
- Indexes: @@index([productId, status]) @@index([status]) @@index([userId])

### StockAlert
- `id` String @id @default(cuid())
- `productId` String
- `variantId` String?
- `userId` String?
- `email` String?
- `phone` String?
- `notifiedAt` DateTime?
- `createdAt` DateTime @default(now())
- Relations: `product` → Product (fk `productId`, onDelete Cascade, back `Product.stockAlerts`) · `variant` → ProductVariant? (fk `variantId`, back `ProductVariant.stockAlerts`) · `user` → User? (fk `userId`, back `User.stockAlerts`)
- Indexes: @@index([productId]) @@index([notifiedAt])

## PRICING ENGINE

### PricingRule
- `id` String @id @default(cuid())
- `name` String
- `scope` String — enum-like: global | brand | category | product | variant (no default)
- `targetId` String? — id of the brand/category/product/variant named by `scope`; untyped, no relation
- `discountType` String — enum-like: percent | flat | fixed_price (no default)
- `value` Int — whole percent, or paise (depends on `discountType`)
- `maxDiscountPaise` Int?
- `priority` Int @default(0)
- `startsAt` DateTime?
- `endsAt` DateTime?
- `isActive` Boolean @default(true)
- `conditions` String @default("{}") // JSON: e.g. {"minQty":2,"loyaltyTier":"gold"}
- `createdAt` DateTime @default(now())
- `updatedAt` DateTime @updatedAt
- Relations: none
- Indexes: @@index([scope, isActive])

### FlashSale
- `id` String @id @default(cuid())
- `name` String
- `slug` String @unique
- `startsAt` DateTime
- `endsAt` DateTime
- `isActive` Boolean @default(true)
- `bannerText` String?
- `createdAt` DateTime @default(now())
- Relations: `items` → FlashSaleItem[]
- Indexes: @@index([startsAt, endsAt])

### FlashSaleItem
- `id` String @id @default(cuid())
- `flashSaleId` String
- `variantId` String
- `salePricePaise` Int
- `quantityCap` Int @default(0) — 0 = unlimited
- `soldCount` Int @default(0)
- Relations: `flashSale` → FlashSale (fk `flashSaleId`, onDelete Cascade, back `FlashSale.items`) · `variant` → ProductVariant (fk `variantId`, onDelete Cascade, back `ProductVariant.flashSaleItems`)
- Indexes: @@unique([flashSaleId, variantId]) — no standalone @@index([variantId])

### EmiPlan
- `id` String @id @default(cuid())
- `bankName` String
- `bankCode` String
- `brandId` String? — null = applies to all brands
- `tenureMonths` Int
- `interestBps` Int @default(0) — annual rate in basis points (1200 = 12.00%)
- `isNoCost` Boolean @default(false)
- `minOrderPaise` Int @default(500000)
- `processingFeePaise` Int @default(0)
- `instruments` String @default("[\"credit\"]") // JSON: string[] e.g. ["credit","debit","cardless"]
- `isActive` Boolean @default(true)
- `sortOrder` Int @default(0)
- Relations: `brand` → Brand? (fk `brandId`, back `Brand.emiPlans`)
- Indexes: @@index([bankCode]) @@index([isActive])
- Note: `Order.emiPlanId` is a loose String — **not** a relation to this model

### ExchangeDevice
Trade-in valuation table for the exchange estimator.
- `id` String @id @default(cuid())
- `brandName` String
- `modelName` String
- `productId` String? — optional link to a catalog Product
- `baseValuePaise` Int
- `launchYear` Int?
- `isActive` Boolean @default(true)
- Relations: `product` → Product? (fk `productId`, back `Product.exchangeModels`)
- Indexes: @@unique([brandName, modelName])

### Coupon
- `id` String @id @default(cuid())
- `code` String @unique
- `description` String?
- `discountType` String — enum-like: percent | flat (no default)
- `value` Int — whole percent or paise
- `maxDiscountPaise` Int?
- `minOrderPaise` Int @default(0)
- `usageLimit` Int @default(0) — 0 = unlimited
- `perUserLimit` Int @default(1)
- `usedCount` Int @default(0)
- `startsAt` DateTime?
- `endsAt` DateTime?
- `isActive` Boolean @default(true)
- `appliesTo` String @default("{}") // JSON: {"brandIds":[],"categoryIds":[],"productIds":[]}
- `isSignupCoupon` Boolean @default(false)
- `isReferralReward` Boolean @default(false)
- `isStackable` Boolean @default(false)
- `createdAt` DateTime @default(now())
- `updatedAt` DateTime @updatedAt
- Relations: `redemptions` → CouponRedemption[]
- Indexes: none beyond @unique on `code`

### CouponRedemption
- `id` String @id @default(cuid())
- `couponId` String
- `userId` String
- `orderId` String?
- `discountPaise` Int
- `createdAt` DateTime @default(now())
- Relations: `coupon` → Coupon (fk `couponId`, onDelete Cascade, back `Coupon.redemptions`) · `user` → User (fk `userId`, onDelete Cascade, back `User.couponRedemptions`) · `order` → Order? (fk `orderId`, back `Order.redemptions`)
- Indexes: @@index([couponId]) @@index([userId]) — **no unique on [couponId, userId]**, so `perUserLimit` is enforced in code only

## CART & CHECKOUT

### ProtectionPlan
- `id` String @id @default(cuid())
- `name` String
- `tier` String — enum-like: basic | plus | total (no default)
- `description` String?
- `durationMonths` Int
- `priceType` String @default("percent") — enum-like: percent | flat
- `priceValue` Int — whole percent or paise, per `priceType`
- `coverage` String @default("[]") // JSON: string[] covered scenarios
- `appliesToKind` String @default("phone") — same value space as `Product.kind`
- `isActive` Boolean @default(true)
- `sortOrder` Int @default(0)
- Relations: `cartItems` → CartItem[] · `orderItems` → OrderItem[]
- Indexes: none

### Cart
- `id` String @id @default(cuid())
- `userId` String? — null for guest carts
- `sessionId` String? — guest cart key
- `couponCode` String? — loose code, not a relation
- `status` String @default("active") — enum-like: active | converted | abandoned
- `createdAt` DateTime @default(now())
- `updatedAt` DateTime @updatedAt
- Relations: `user` → User? (fk `userId`, onDelete Cascade, back `User.carts`) · `items` → CartItem[] · `abandonedCart` → AbandonedCart? (one-to-one)
- Indexes: @@index([userId]) @@index([sessionId]) @@index([status, updatedAt])

### CartItem
- `id` String @id @default(cuid())
- `cartId` String
- `variantId` String
- `quantity` Int @default(1)
- `protectionPlanId` String?
- `isAccessory` Boolean @default(false)
- `addedAt` DateTime @default(now()) — note: **`addedAt`, not `createdAt`**
- Relations: `cart` → Cart (fk `cartId`, onDelete Cascade, back `Cart.items`) · `variant` → ProductVariant (fk `variantId`, onDelete Cascade, back `ProductVariant.cartItems`) · `protectionPlan` → ProtectionPlan? (fk `protectionPlanId`, back `ProtectionPlan.cartItems`)
- Indexes: @@unique([cartId, variantId, protectionPlanId]) @@index([cartId])

## ORDERS

### Order
- `id` String @id @default(cuid())
- `orderNo` String @unique — human-facing order number
- `userId` String
- `status` String @default("pending") — `OrderStatus`
- `paymentStatus` String @default("pending") — `PaymentStatus`
- `fulfilmentType` String @default("standard") — enum-like: standard | express | preorder (British spelling: **fulfilment**)
- `addressId` String? — nullable
- `addressSnapshot` String — **required** // JSON: immutable snapshot of the delivery address at order time
- `subtotalPaise` Int (required)
- `discountPaise` Int @default(0)
- `couponCode` String?
- `couponDiscountPaise` Int @default(0)
- `exchangeCreditPaise` Int @default(0)
- `protectionPaise` Int @default(0)
- `shippingPaise` Int @default(0)
- `codFeePaise` Int @default(0)
- `taxablePaise` Int @default(0)
- `taxPaise` Int @default(0)
- `walletAppliedPaise` Int @default(0) — partial wallet payment (not a `paymentMethod`)
- `totalPaise` Int (required)
- `amountPaidPaise` Int @default(0)
- `amountDuePaise` Int @default(0)
- `refundedPaise` Int @default(0)
- `paymentMethod` String? — `PaymentMethod`
- `emiPlanId` String? — loose id, **no relation to EmiPlan**
- `emiTenure` Int?
- `emiMonthlyPaise` Int?
- `courier` String?
- `awb` String?
- `trackingUrl` String?
- `expectedDeliveryAt` DateTime?
- `deliveredAt` DateTime?
- `placedAt` DateTime @default(now())
- `confirmedAt` DateTime?
- `cancelledAt` DateTime?
- `cancelReason` String?
- `cancelledBy` String? — enum-like: customer | admin | system
- `referralProcessedAt` DateTime? — attribution guard so commission is credited exactly once
- `ipAddress` String?
- `deviceId` String?
- `notes` String?
- `createdAt` DateTime @default(now()) — distinct from `placedAt`
- `updatedAt` DateTime @updatedAt
- Relations:
  - `user` → User (fk `userId`, no onDelete, back `User.orders`) · `address` → Address? (fk `addressId`, back `Address.orders`)
  - `items` → OrderItem[] · `events` → OrderStatusEvent[] · `payments` → PaymentAttempt[] · `refunds` → Refund[]
  - `invoice` → Invoice? (one-to-one) · `shipments` → Shipment[]
  - `commissions` → ReferralCommission[] · `redemptions` → CouponRedemption[]
  - `serviceRequests` → ServiceRequest[] · `supportTickets` → SupportTicket[]
  - `emiSchedule` → EmiInstalment[] · `walletTxns` → WalletTransaction[]
- Indexes: @@index([userId]) @@index([status]) @@index([paymentStatus]) @@index([placedAt])
- Note: `orderNo` is unique but there is **no @@index([createdAt])** and no composite [userId, status]

### OrderItem
Snapshot columns — order lines must never mutate when the catalog changes.
- `id` String @id @default(cuid())
- `orderId` String
- `variantId` String
- `productName` String (snapshot)
- `brandName` String (snapshot)
- `variantLabel` String (snapshot)
- `sku` String (snapshot)
- `imageGradient` String? (snapshot of tailwind gradient)
- `quantity` Int
- `mrpPaise` Int
- `unitPricePaise` Int
- `discountPaise` Int @default(0)
- `hsnCode` String (required snapshot)
- `gstRate` Int (required, whole percent)
- `taxablePaise` Int
- `taxPaise` Int
- `lineTotalPaise` Int
- `protectionPlanId` String?
- `protectionName` String? (snapshot)
- `protectionPaise` Int @default(0)
- `warrantyMonths` Int @default(12)
- `isAccessory` Boolean @default(false)
- Relations: `order` → Order (fk `orderId`, onDelete Cascade, back `Order.items`) · `variant` → ProductVariant (fk `variantId`, no onDelete, back `ProductVariant.orderItems`) · `protectionPlan` → ProtectionPlan? (fk `protectionPlanId`, back `ProtectionPlan.orderItems`) · `units` → OrderUnit[]
- Indexes: @@index([orderId])
- Note: no timestamps at all

### OrderUnit
One row per physical unit sold — carries the IMEI/serial the customer receives.
- `id` String @id @default(cuid())
- `orderItemId` String
- `imei1` String? @unique
- `imei2` String? — **not unique**
- `serialNumber` String? @unique
- `warehouseId` String?
- `warrantyStart` DateTime?
- `warrantyEnd` DateTime?
- `status` String @default("allocated") — enum-like: allocated | dispatched | delivered | returned | replaced
- `createdAt` DateTime @default(now())
- Relations: `orderItem` → OrderItem (fk `orderItemId`, onDelete Cascade, back `OrderItem.units`) · `warehouse` → Warehouse? (fk `warehouseId`, back `Warehouse.units`) · `warrantyCard` → WarrantyCard? (one-to-one) · `serviceRequests` → ServiceRequest[]
- Indexes: @@index([orderItemId]) — **no index on `imei1`/`serialNumber` beyond the uniques**

### OrderStatusEvent
- `id` String @id @default(cuid())
- `orderId` String
- `status` String — an `OrderStatus` value, untyped in schema (no default)
- `note` String?
- `location` String?
- `actorId` String? — loose id, no relation
- `actorType` String @default("system") — enum-like: system | admin | customer | courier
- `createdAt` DateTime @default(now())
- Relations: `order` → Order (fk `orderId`, onDelete Cascade, back `Order.events`)
- Indexes: @@index([orderId])

### Shipment
- `id` String @id @default(cuid())
- `orderId` String
- `courier` String
- `awb` String — **not unique**
- `status` String @default("created") — free-form, no documented value set
- `labelUrl` String?
- `manifestId` String?
- `shippedAt` DateTime?
- `deliveredAt` DateTime?
- `createdAt` DateTime @default(now())
- Relations: `order` → Order (fk `orderId`, onDelete Cascade, back `Order.shipments`)
- Indexes: @@index([orderId])

### Invoice
GST-compliant tax invoice.
- `id` String @id @default(cuid())
- `orderId` String @unique — one-to-one with Order
- `invoiceNo` String @unique
- `irn` String? — e-invoice reference number
- `sellerGstin` String
- `sellerName` String
- `sellerState` String
- `buyerName` String
- `buyerGstin` String?
- `placeOfSupply` String
- `isInterState` Boolean @default(false)
- `taxablePaise` Int
- `cgstPaise` Int @default(0)
- `sgstPaise` Int @default(0)
- `igstPaise` Int @default(0)
- `cessPaise` Int @default(0)
- `roundOffPaise` Int @default(0) — may be negative
- `totalPaise` Int
- `hsnSummary` String @default("[]") // JSON: HSN-wise tax summary rows
- `issuedAt` DateTime @default(now())
- Relations: `order` → Order (fk `orderId`, onDelete Cascade, back `Order.invoice`)
- Indexes: @@index([invoiceNo]) — redundant with the @unique

### WarrantyCard
- `id` String @id @default(cuid())
- `orderUnitId` String @unique — one-to-one with OrderUnit
- `cardNo` String @unique
- `productName` String (snapshot)
- `imei` String? (snapshot)
- `months` Int
- `validFrom` DateTime
- `validTill` DateTime
- `isExtended` Boolean @default(false)
- `issuedAt` DateTime @default(now())
- Relations: `orderUnit` → OrderUnit (fk `orderUnitId`, onDelete Cascade, back `OrderUnit.warrantyCard`)
- Indexes: none beyond the uniques

### EmiInstalment
EMI amortisation rows — powers the customer "EMI status tracker".
- `id` String @id @default(cuid())
- `orderId` String
- `seqNo` Int — 1-based instalment number
- `dueDate` DateTime
- `amountPaise` Int
- `principalPaise` Int
- `interestPaise` Int
- `status` String @default("upcoming") — enum-like: upcoming | paid | overdue | failed
- `paidAt` DateTime?
- Relations: `order` → Order (fk `orderId`, onDelete Cascade, back `Order.emiSchedule`)
- Indexes: @@unique([orderId, seqNo]) — **no @@index([status, dueDate])** for the overdue sweep

## PAYMENTS

### PaymentAttempt
- `id` String @id @default(cuid())
- `orderId` String
- `gateway` String @default("mock") — enum-like: mock | razorpay
- `gatewayOrderId` String?
- `gatewayPaymentId` String? @unique
- `method` String — `PaymentMethod` (no default): card | upi | netbanking | wallet | emi | cod
- `instrumentLabel` String? — display text, e.g. "HDFC •••• 4242" / "user@upi"
- `amountPaise` Int
- `currency` String @default("INR")
- `status` String @default("created") — `PaymentAttemptStatus`
- `errorCode` String?
- `errorDescription` String?
- `rawPayload` String? // JSON: gateway response, kept for reconciliation
- `attemptNo` Int @default(1)
- `isRetryOf` String? — id of the previous PaymentAttempt; loose, no relation
- `createdAt` DateTime @default(now())
- `capturedAt` DateTime?
- `failedAt` DateTime?
- Relations: `order` → Order (fk `orderId`, onDelete Cascade, back `Order.payments`) · `refunds` → Refund[]
- Indexes: @@index([orderId]) @@index([status]) @@index([gateway])

### Refund
- `id` String @id @default(cuid())
- `orderId` String
- `paymentAttemptId` String?
- `amountPaise` Int
- `reason` String?
- `mode` String @default("gateway") — enum-like: gateway | wallet
- `status` String @default("initiated") — enum-like: initiated | processing | completed | failed
- `gatewayRefundId` String? — **not unique**
- `speed` String @default("normal")
- `createdAt` DateTime @default(now())
- `processedAt` DateTime?
- Relations: `order` → Order (fk `orderId`, onDelete Cascade, back `Order.refunds`) · `paymentAttempt` → PaymentAttempt? (fk `paymentAttemptId`, back `PaymentAttempt.refunds`)
- Indexes: @@index([orderId]) — no @@index([status])

### WebhookEvent
- `id` String @id @default(cuid())
- `gateway` String
- `eventId` String @unique — provider event id; the idempotency key
- `eventType` String
- `payload` String — **required** // JSON: full webhook body
- `signatureValid` Boolean @default(false)
- `processedAt` DateTime?
- `error` String?
- `createdAt` DateTime @default(now())
- Relations: none
- Indexes: @@index([eventType]) — **no index on `processedAt`** for the unprocessed sweep

### PincodeServiceability
- `id` String @id @default(cuid())
- `pincode` String @unique
- `city` String
- `state` String
- `zone` String @default("metro") — enum-like: metro | tier1 | tier2 | remote
- `isServiceable` Boolean @default(true)
- `codAvailable` Boolean @default(true)
- `codLimitPaise` Int @default(5000000)
- `expressAvailable` Boolean @default(false)
- `deliveryDays` Int @default(3)
- `updatedAt` DateTime @updatedAt
- Relations: none
- Indexes: @@index([codAvailable])
- Note: no `createdAt`

## WALLET & PAYOUTS

### LoyaltyTransaction
Points ledger, kept separate from the wallet: points are not money and never become withdrawable cash.
- `id` String @id @default(cuid())
- `userId` String
- `orderId` String? — loose id, **no relation to Order**
- `points` Int — signed
- `direction` String — enum-like: earn | redeem | expire | adjustment (no default)
- `description` String (required)
- `balanceAfter` Int @default(0) — points, **not paise**
- `createdAt` DateTime @default(now())
- Relations: `user` → User (fk `userId`, onDelete Cascade, back `User.loyaltyTxns`)
- Indexes: @@index([userId]) @@index([createdAt])

### Wallet
- `id` String @id @default(cuid())
- `userId` String @unique — one wallet per user
- `balancePaise` Int @default(0) — withdrawable + spendable now
- `pendingPaise` Int @default(0) — credited but inside the return/cancellation hold window
- `lockedPaise` Int @default(0) — reserved against an in-flight withdrawal
- `currency` String @default("INR")
- `createdAt` DateTime @default(now())
- `updatedAt` DateTime @updatedAt
- Relations: `user` → User (fk `userId`, onDelete Cascade, back `User.wallet`) · `transactions` → WalletTransaction[]
- Indexes: none beyond the @unique

### WalletTransaction
- `id` String @id @default(cuid())
- `walletId` String
- `type` String — `WalletTxnType` (no default): referral_commission | cashback | refund | order_payment | withdrawal | adjustment | reversal | signup_bonus
- `direction` String — enum-like: credit | debit (no default)
- `amountPaise` Int
- `balanceAfterPaise` Int
- `status` String @default("completed") — `WalletTxnStatus`: pending (in hold) | available | processing | completed | failed | reversed
- `referenceType` String? — enum-like: order | referral_commission | withdrawal | manual
- `referenceId` String? — polymorphic id, no relation
- `orderId` String?
- `description` String (required)
- `availableAt` DateTime? — when a held credit becomes withdrawable
- `createdById` String? — admin id for manual adjustments; loose, no relation
- `createdAt` DateTime @default(now())
- `updatedAt` DateTime @updatedAt
- Relations: `wallet` → Wallet (fk `walletId`, onDelete Cascade, back `Wallet.transactions`) · `order` → Order? (fk `orderId`, back `Order.walletTxns`) · `commission` → ReferralCommission? (back side of `ReferralCommission.walletTxn`, one-to-one) · `withdrawal` → WithdrawalRequest? (back side of `WithdrawalRequest.walletTxn`, one-to-one)
- Indexes: @@index([walletId, createdAt]) @@index([type]) @@index([status, availableAt])

### WithdrawalRequest
- `id` String @id @default(cuid())
- `userId` String
- `requestNo` String @unique
- `amountPaise` Int
- `destinationType` String @default("bank") — enum-like: bank | vpa
- `bankAccountId` String?
- `destinationSnapshot` String — **required** // JSON: destination snapshot at request time
- `walletTxnId` String? @unique
- `status` String @default("requested") — `WithdrawalStatus`
- `isAutoApproved` Boolean @default(false)
- `approvedById` String?
- `approvedAt` DateTime?
- `rejectionReason` String?
- `adminNote` String?
- `createdAt` DateTime @default(now())
- `updatedAt` DateTime @updatedAt
- Relations: `user` → User (fk `userId`, onDelete Cascade, back `User.withdrawals`) · `bankAccount` → BankAccount? (fk `bankAccountId`, back `BankAccount.withdrawals`) · `walletTxn` → WalletTransaction? (fk `walletTxnId`, back `WalletTransaction.withdrawal`) · `approvedBy` → User? (relation "PayoutApprover", fk `approvedById`, back `User.approvedPayouts`) · `payouts` → Payout[]
- Indexes: @@index([userId]) @@index([status])

### Payout
- `id` String @id @default(cuid())
- `withdrawalRequestId` String
- `provider` String @default("mock") — enum-like: mock | razorpayx | cashfree
- `providerPayoutId` String? — **not unique**
- `mode` String @default("IMPS") — enum-like: IMPS | NEFT | UPI | RTGS
- `amountPaise` Int
- `feePaise` Int @default(0)
- `taxPaise` Int @default(0)
- `status` String @default("created") — `PayoutStatus`: created | queued | processing | processed | reversed | failed | cancelled
- `utr` String? — bank UTR
- `failureReason` String?
- `rawResponse` String? // JSON: provider response
- `attemptNo` Int @default(1)
- `createdAt` DateTime @default(now())
- `processedAt` DateTime?
- Relations: `withdrawalRequest` → WithdrawalRequest (fk `withdrawalRequestId`, onDelete Cascade, back `WithdrawalRequest.payouts`)
- Indexes: @@index([withdrawalRequestId]) @@index([status])

## REFERRAL ENGINE

### ReferralRule
- `id` String @id @default(cuid())
- `name` String
- `commissionType` String @default("percent") — enum-like: percent | flat
- `commissionValue` Int — whole percent, or paise when flat
- `maxCommissionPaise` Int?
- `appliesTo` String @default("first_order_only") — enum-like: first_order_only | recurring
- `minOrderPaise` Int @default(100000)
- `holdDays` Int @default(15) — days a commission is held before becoming withdrawable
- `tierMinConversions` Int @default(0) — rule applies once referrer has >= this many conversions
- `tierLabel` String?
- `refereeCouponCode` String? — coupon auto-issued to the referred user; loose code, no relation
- `isActive` Boolean @default(true)
- `priority` Int @default(0)
- `createdAt` DateTime @default(now())
- `updatedAt` DateTime @updatedAt
- Relations: `commissions` → ReferralCommission[]
- Indexes: @@index([isActive, tierMinConversions])

### Referral
- `id` String @id @default(cuid())
- `referrerId` String
- `refereeId` String @unique — a user can be referred only once
- `code` String — the referral code used; loose copy of `User.referralCode`
- `status` String @default("signed_up") — `ReferralStatus`: invited | signed_up | converted
- `signedUpAt` DateTime @default(now())
- `firstOrderId` String? — loose id, **no relation to Order**
- `convertedAt` DateTime?
- `signupIp` String?
- `signupDevice` String?
- `fraudFlags` String @default("[]") // JSON: FraudFlag[] e.g. ["same_ip","same_device"]
- `riskScore` Int @default(0)
- `isBlocked` Boolean @default(false)
- `blockReason` String?
- `createdAt` DateTime @default(now())
- `updatedAt` DateTime @updatedAt
- Relations: `referrer` → User (relation "Referrer", fk `referrerId`, onDelete Cascade, back `User.referralsMade`) · `referee` → User (relation "Referee", fk `refereeId`, onDelete Cascade, back `User.referralAsReferee`) · `commissions` → ReferralCommission[]
- Indexes: @@index([referrerId]) @@index([status])

### ReferralCommission
- `id` String @id @default(cuid())
- `referralId` String
- `referrerId` String
- `refereeId` String — denormalised copy, **no relation field**
- `orderId` String
- `ruleId` String?
- `orderValuePaise` Int
- `commissionPaise` Int
- `status` String @default("held") — `CommissionStatus`: pending | held | unlocked | paid | reversed | rejected
- `unlockAt` DateTime?
- `walletTxnId` String? @unique
- `isAdminAdjusted` Boolean @default(false)
- `originalPaise` Int? — pre-adjustment commission
- `adminNote` String?
- `adjustedById` String? — loose admin id, no relation
- `reversedReason` String?
- `createdAt` DateTime @default(now())
- `updatedAt` DateTime @updatedAt
- Relations: `referral` → Referral (fk `referralId`, onDelete Cascade, back `Referral.commissions`) · `referrer` → User (relation "CommissionReferrer", fk `referrerId`, onDelete Cascade, back `User.commissionsEarned`) · `order` → Order (fk `orderId`, onDelete Cascade, back `Order.commissions`) · `rule` → ReferralRule? (fk `ruleId`, back `ReferralRule.commissions`) · `walletTxn` → WalletTransaction? (fk `walletTxnId`, back `WalletTransaction.commission`)
- Indexes: @@unique([orderId, referrerId]) — pays once per order per referrer · @@index([referrerId, status]) @@index([status, unlockAt])

## WARRANTY / SERVICE / SUPPORT

### ServiceCenter
- `id` String @id @default(cuid())
- `name` String
- `code` String @unique
- `addressLine` String
- `city` String
- `state` String
- `pincode` String
- `latitude` Float?
- `longitude` Float?
- `phone` String (required)
- `email` String?
- `openHours` String @default("10:00–19:00, Mon–Sat") — note the en-dash in the default
- `dailyCapacity` Int @default(20)
- `isAuthorized` Boolean @default(true)
- `isActive` Boolean @default(true)
- Relations: `brands` → ServiceCenterBrand[] · `requests` → ServiceRequest[]
- Indexes: @@index([pincode]) @@index([city])
- Note: no timestamps

### ServiceCenterBrand
Join table (which brands a centre services).
- `id` String @id @default(cuid())
- `serviceCenterId` String
- `brandId` String
- Relations: `serviceCenter` → ServiceCenter (fk `serviceCenterId`, onDelete Cascade, back `ServiceCenter.brands`) · `brand` → Brand (fk `brandId`, onDelete Cascade, back `Brand.serviceCenters`)
- Indexes: @@unique([serviceCenterId, brandId])

### ServiceRequest
RMA / repair / replacement workflow.
- `id` String @id @default(cuid())
- `ticketNo` String @unique
- `userId` String
- `orderId` String?
- `orderUnitId` String?
- `type` String — `ServiceType` (no default): repair | replacement | return | inspection
- `issueCategory` String? — enum-like: screen | battery | camera | software | water_damage | other
- `issueDescription` String (required)
- `isUnderWarranty` Boolean @default(true)
- `status` String @default("requested") — `ServiceStatus`
- `serviceCenterId` String?
- `assignedToId` String? — staff id; loose, **no relation field**
- `diagnosis` String?
- `estimatedCostPaise` Int?
- `actualCostPaise` Int?
- `replacementImei` String?
- `receivedAt` DateTime?
- `completedAt` DateTime?
- `slaDueAt` DateTime?
- `createdAt` DateTime @default(now())
- `updatedAt` DateTime @updatedAt
- Relations: `user` → User (fk `userId`, onDelete Cascade, back `User.serviceRequests`) · `order` → Order? (fk `orderId`, back `Order.serviceRequests`) · `orderUnit` → OrderUnit? (fk `orderUnitId`, back `OrderUnit.serviceRequests`) · `serviceCenter` → ServiceCenter? (fk `serviceCenterId`, back `ServiceCenter.requests`) · `events` → ServiceEvent[]
- Indexes: @@index([userId]) @@index([status]) @@index([serviceCenterId]) — **no index on `slaDueAt`** for SLA breach queries

### ServiceEvent
- `id` String @id @default(cuid())
- `serviceRequestId` String
- `status` String — a `ServiceStatus` value (no default)
- `note` String?
- `actorId` String? — loose, no relation
- `createdAt` DateTime @default(now())
- Relations: `serviceRequest` → ServiceRequest (fk `serviceRequestId`, onDelete Cascade, back `ServiceRequest.events`)
- Indexes: @@index([serviceRequestId])

### SupportTicket
- `id` String @id @default(cuid())
- `ticketNo` String @unique
- `userId` String
- `orderId` String?
- `subject` String
- `category` String @default("general") — enum-like: order | payment | wallet | product | general
- `priority` String @default("normal") — enum-like: low | normal | high | urgent
- `status` String @default("open") — enum-like: open | pending | resolved | closed
- `assignedToId` String?
- `firstResponseAt` DateTime?
- `resolvedAt` DateTime?
- `createdAt` DateTime @default(now())
- `updatedAt` DateTime @updatedAt
- Relations: `user` → User (relation "TicketOwner", fk `userId`, onDelete Cascade, back `User.supportTickets`) · `order` → Order? (fk `orderId`, back `Order.supportTickets`) · `assignedTo` → User? (relation "TicketAssignee", fk `assignedToId`, back `User.assignedTickets`) · `messages` → SupportMessage[]
- Indexes: @@index([userId]) @@index([status]) — no index on `assignedToId`

### SupportMessage
- `id` String @id @default(cuid())
- `ticketId` String
- `authorId` String? — null for system messages
- `isStaff` Boolean @default(false)
- `body` String
- `createdAt` DateTime @default(now())
- Relations: `ticket` → SupportTicket (fk `ticketId`, onDelete Cascade, back `SupportTicket.messages`) · `author` → User? (fk `authorId`, back `User.supportMessages`)
- Indexes: @@index([ticketId])

## INVENTORY

### Warehouse
- `id` String @id @default(cuid())
- `name` String
- `code` String @unique
- `addressLine` String
- `city` String
- `state` String
- `pincode` String
- `gstin` String?
- `priority` Int @default(0) — allocation preference
- `isActive` Boolean @default(true)
- `createdAt` DateTime @default(now())
- Relations: `stocks` → InventoryStock[] · `movements` → StockMovement[] · `pos` → PurchaseOrder[] · `units` → OrderUnit[]
- Indexes: none beyond the @unique

### InventoryStock
- `id` String @id @default(cuid())
- `warehouseId` String
- `variantId` String
- `quantity` Int @default(0) — on hand
- `reserved` Int @default(0)
- `damaged` Int @default(0)
- `lowStockThreshold` Int @default(5)
- `updatedAt` DateTime @updatedAt
- Relations: `warehouse` → Warehouse (fk `warehouseId`, onDelete Cascade, back `Warehouse.stocks`) · `variant` → ProductVariant (fk `variantId`, onDelete Cascade, back `ProductVariant.stocks`)
- Indexes: @@unique([warehouseId, variantId]) @@index([variantId])
- Note: no `createdAt`

### StockMovement
- `id` String @id @default(cuid())
- `variantId` String
- `warehouseId` String
- `type` String — `StockMovementType` (no default): inbound | outbound | transfer | adjustment | return | damage
- `quantity` Int — signed by convention of `type`
- `reason` String?
- `referenceType` String? — polymorphic, no documented value set
- `referenceId` String? — polymorphic id, no relation
- `actorId` String? — loose, no relation
- `createdAt` DateTime @default(now())
- Relations: `variant` → ProductVariant (fk `variantId`, onDelete Cascade, back `ProductVariant.stockMovements`) · `warehouse` → Warehouse (fk `warehouseId`, onDelete Cascade, back `Warehouse.movements`)
- Indexes: @@index([variantId]) @@index([createdAt]) — no index on `warehouseId`

### Supplier
- `id` String @id @default(cuid())
- `name` String
- `code` String @unique
- `gstin` String?
- `contactName` String?
- `phone` String?
- `email` String?
- `addressLine` String?
- `city` String?
- `state` String?
- `paymentTermsDays` Int @default(30)
- `rating` Float @default(4)
- `isActive` Boolean @default(true)
- `createdAt` DateTime @default(now())
- Relations: `purchaseOrders` → PurchaseOrder[]
- Indexes: none beyond the @unique

### PurchaseOrder
- `id` String @id @default(cuid())
- `poNo` String @unique
- `supplierId` String
- `warehouseId` String
- `status` String @default("draft") — `PoStatus`: draft | sent | partially_received | received | cancelled
- `expectedAt` DateTime?
- `receivedAt` DateTime?
- `subtotalPaise` Int @default(0)
- `taxPaise` Int @default(0)
- `totalPaise` Int @default(0)
- `notes` String?
- `createdById` String? — loose admin id, no relation
- `createdAt` DateTime @default(now())
- `updatedAt` DateTime @updatedAt
- Relations: `supplier` → Supplier (fk `supplierId`, no onDelete, back `Supplier.purchaseOrders`) · `warehouse` → Warehouse (fk `warehouseId`, no onDelete, back `Warehouse.pos`) · `items` → PurchaseOrderItem[]
- Indexes: @@index([status]) — no index on `supplierId` / `warehouseId`

### PurchaseOrderItem
- `id` String @id @default(cuid())
- `poId` String — **field is `poId`, relation field is `po`**
- `variantId` String
- `quantity` Int
- `receivedQty` Int @default(0)
- `unitCostPaise` Int
- `gstRate` Int @default(18) — whole percent
- Relations: `po` → PurchaseOrder (fk `poId`, onDelete Cascade, back `PurchaseOrder.items`) · `variant` → ProductVariant (fk `variantId`, no onDelete, back `ProductVariant.poItems`)
- Indexes: @@index([poId])

## MARKETING / CMS

### Banner
- `id` String @id @default(cuid())
- `title` String
- `subtitle` String?
- `eyebrow` String?
- `ctaLabel` String?
- `ctaHref` String?
- `gradient` String @default("from-cyan-500/25 via-blue-600/10 to-transparent") — tailwind classes, keeps the build asset-free
- `accent` String @default("#22d3ee")
- `placement` String @default("hero") — enum-like: hero | strip | category | pdp
- `sortOrder` Int @default(0)
- `startsAt` DateTime?
- `endsAt` DateTime?
- `isActive` Boolean @default(true)
- `clickCount` Int @default(0)
- `createdAt` DateTime @default(now())
- `updatedAt` DateTime @updatedAt
- Relations: none
- Indexes: @@index([placement, isActive])

### HomepageSection
- `id` String @id @default(cuid())
- `key` String @unique
- `type` String — enum-like (no default): hero | featured | flash_sale | brand_rail | comparison | launch_countdown | testimonial | category_grid
- `title` String?
- `subtitle` String?
- `config` String @default("{}") // JSON: renderer config, shape varies by `type`
- `sortOrder` Int @default(0)
- `isActive` Boolean @default(true)
- `updatedAt` DateTime @updatedAt
- Relations: none
- Indexes: none beyond the @unique
- Note: no `createdAt`

### PushNotification
- `id` String @id @default(cuid())
- `title` String
- `body` String
- `segment` String @default("all") — enum-like: all | loyalty_tier | abandoned_cart | segment_query
- `segmentConfig` String @default("{}") // JSON: segment parameters (shape depends on `segment`)
- `deepLink` String?
- `scheduledAt` DateTime?
- `sentAt` DateTime?
- `status` String @default("draft") — enum-like: draft | scheduled | sent | failed
- `audienceCount` Int @default(0)
- `deliveredCount` Int @default(0)
- `openCount` Int @default(0)
- `createdById` String? — loose admin id, no relation
- `createdAt` DateTime @default(now())
- Relations: none
- Indexes: none — **no index on `status` / `scheduledAt`** for the send scheduler

### AbandonedCart
- `id` String @id @default(cuid())
- `cartId` String @unique — one-to-one with Cart
- `userId` String? — loose, no relation
- `email` String?
- `phone` String?
- `valuePaise` Int (required)
- `itemCount` Int @default(0)
- `reminderCount` Int @default(0)
- `lastReminderAt` DateTime?
- `recoveredOrderId` String? — loose, no relation
- `status` String @default("open") — enum-like: open | reminded | recovered | lost
- `couponIssued` String? — coupon code, loose
- `detectedAt` DateTime @default(now()) — note: **`detectedAt`, not `createdAt`**
- `updatedAt` DateTime @updatedAt
- Relations: `cart` → Cart (fk `cartId`, onDelete Cascade, back `Cart.abandonedCart`)
- Indexes: @@index([status])

### CmsPage
- `id` String @id @default(cuid())
- `slug` String @unique
- `title` String
- `content` String — markdown/HTML body
- `seoTitle` String?
- `seoDescription` String?
- `isPublished` Boolean @default(false)
- `updatedAt` DateTime @updatedAt
- Relations: none
- Indexes: none beyond the @unique
- Note: no `createdAt`

## ANALYTICS

### TrafficEvent
- `id` String @id @default(cuid())
- `path` String
- `eventType` String @default("pageview") — enum-like: pageview | add_to_cart | begin_checkout | purchase | search
- `sessionId` String?
- `userId` String? — loose, no relation
- `referrer` String?
- `device` String @default("desktop") — enum-like: desktop | mobile | tablet
- `source` String? — enum-like: direct | organic | referral | social | paid
- `productId` String? — loose, no relation
- `valuePaise` Int?
- `createdAt` DateTime @default(now())
- Relations: none
- Indexes: @@index([createdAt]) @@index([eventType]) — no index on `userId` / `sessionId` / `productId`

### DailyMetric
Pre-aggregated rollups so the dashboard never scans raw events.
- `id` String @id @default(cuid())
- `date` DateTime @unique — one row per day
- `revenuePaise` Int @default(0)
- `orderCount` Int @default(0)
- `unitCount` Int @default(0)
- `visitors` Int @default(0)
- `sessions` Int @default(0)
- `addToCarts` Int @default(0)
- `checkouts` Int @default(0)
- `returnCount` Int @default(0)
- `cancelCount` Int @default(0)
- `codOrders` Int @default(0)
- `onlineOrders` Int @default(0)
- `newUsers` Int @default(0)
- Relations: none
- Indexes: none beyond the @unique on `date`
- Note: no timestamps

## SETTINGS & OPS

### Setting
- `id` String @id @default(cuid())
- `key` String @unique
- `value` String — **required** // JSON-encoded value (any shape)
- `groupName` String @default("general") — enum-like: general | payment | shipping | tax | seo | theme | referral | wallet
- `label` String?
- `isSecret` Boolean @default(false)
- `updatedAt` DateTime @updatedAt
- Relations: none
- Indexes: @@index([groupName])
- Note: no `createdAt`

### ShippingZone
- `id` String @id @default(cuid())
- `name` String
- `states` String @default("[]") // JSON: string[] of state names
- `pincodePrefixes` String @default("[]") // JSON: string[] of pincode prefixes
- `baseRatePaise` Int @default(0)
- `freeAbovePaise` Int @default(4999900)
- `codFeePaise` Int @default(4900)
- `expressRatePaise` Int @default(19900)
- `deliveryDays` Int @default(3)
- `isActive` Boolean @default(true)
- `sortOrder` Int @default(0)
- Relations: none
- Indexes: none
- Note: no timestamps

### TaxRule
- `id` String @id @default(cuid())
- `name` String
- `hsnCode` String — **not unique**
- `gstRate` Int — whole percent
- `cessRate` Int @default(0) — whole percent
- `categorySlug` String? — loose slug, no relation to Category
- `isActive` Boolean @default(true)
- Relations: none
- Indexes: @@index([hsnCode])
- Note: no timestamps

### AuditLog
- `id` String @id @default(cuid())
- `actorId` String?
- `actorEmail` String? — denormalised for when the user is deleted
- `action` String — free-form dotted key, e.g. "order.cancel", "payout.approve"
- `entity` String — model name
- `entityId` String?
- `before` String? // JSON: snapshot before the change
- `after` String? // JSON: snapshot after the change
- `ip` String?
- `createdAt` DateTime @default(now())
- Relations: `actor` → User? (fk `actorId`, back `User.auditLogs`)
- Indexes: @@index([entity, entityId]) @@index([createdAt]) — no index on `actorId` / `action`

## CHATBOT

### ChatSession
- `id` String @id @default(cuid())
- `sessionId` String @unique — client-supplied session key
- `userId` String? — loose, no relation
- `context` String @default("{}") // JSON: extracted intent, e.g. {"budget":5000000,"priority":"camera"}
- `createdAt` DateTime @default(now())
- `updatedAt` DateTime @updatedAt
- Relations: `messages` → ChatMessage[]
- Indexes: none beyond the @unique

### ChatMessage
- `id` String @id @default(cuid())
- `chatSessionId` String
- `role` String — enum-like: user | assistant (no default)
- `content` String
- `recommendations` String @default("[]") // JSON: string[] of recommended product ids
- `createdAt` DateTime @default(now())
- Relations: `chatSession` → ChatSession (fk `chatSessionId`, onDelete Cascade, back `ChatSession.messages`)
- Indexes: @@index([chatSessionId])
