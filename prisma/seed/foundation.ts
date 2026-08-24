import { ROLE_PRESETS } from '../../src/lib/rbac';
import { chance, int, log, makeRng, prisma, rs, type Rng } from './kit';

/**
 * ════════════════════════════════════════════════════════════════════════
 *  FOUNDATION
 * ════════════════════════════════════════════════════════════════════════
 *  The rows every other module and every request path assumes already
 *  exist: operational settings, RBAC roles, fulfilment centres, suppliers,
 *  shipping zones, GST rules and the pincode serviceability list.
 *
 *  Two of these tables are read by matching logic rather than by id, so the
 *  *shape* of the data matters more than the values:
 *
 *  ShippingZone — `findZoneForPincode` walks every active zone, parses
 *    `pincodePrefixes` as a JSON string array and keeps the LONGEST prefix
 *    that the pincode starts with; if nothing matches it falls back to the
 *    lowest `sortOrder`. So the six metros carry 3-digit prefixes (110, 400,
 *    560 …) and the four regional zones carry 1-digit prefixes (1, 5, 7 …).
 *    A metro therefore always outbids the region it sits in, and because the
 *    1-digit prefixes cover 1–9 between them, every valid pincode resolves to
 *    a zone and the sortOrder fallback is unreachable.
 *    `findZoneForState` takes the FIRST zone (by sortOrder) whose `states`
 *    JSON array contains the state, so every state and UT appears in exactly
 *    one zone list and the Metro zone deliberately has an empty one.
 *
 *  TaxRule — `rateForHsn` does an exact-string `findFirst` on
 *    `{ hsnCode, isActive }`. There is no effective-date column on the model
 *    (and the lookup does not filter on one), so a rule is live purely by
 *    `isActive`. Because products may carry either the 4-digit heading or the
 *    8-digit tariff line, both spellings are seeded for every category —
 *    an exact-match lookup cannot generalise from one to the other.
 *
 *  Money is integer paise throughout; zone rates are kept consistent with the
 *  `standardShippingPaise` / `expressShippingPaise` / `freeShippingAbovePaise`
 *  settings written below, since those are the fallbacks used whenever a zone
 *  lookup misses.
 */

/** Fixed seed — the seller's own pincode, so reruns are byte-identical. */
const rand = makeRng(560_103);

/** VOLTAGE's registered pincode. Must stay serviceable with express + COD. */
const HOME_PINCODE = '560103';

// ─────────────────────────── 1. settings ────────────────────────────────

/**
 * Mirrors `AppSettings` / `DEFAULT_SETTINGS` / `SETTING_GROUPS` /
 * `SETTING_LABELS` in src/lib/services/settings.ts, which cannot be imported
 * here (`server-only`). Values land in the column JSON-encoded, which is what
 * `getSettings` parses back out — and it discards any row whose parsed type
 * does not match the default, so the types below have to line up exactly.
 */
type SettingSeed = {
  key: string;
  value: string | number | boolean;
  group: string;
  label: string;
};

const SETTINGS: SettingSeed[] = [
  // Seller identity — printed on every GST invoice
  {
    key: 'sellerName',
    value: 'VOLTAGE Retail Private Limited',
    group: 'general',
    label: 'Registered seller name',
  },
  { key: 'sellerGstin', value: '29AABCV1234K1ZP', group: 'tax', label: 'Seller GSTIN' },
  {
    key: 'sellerState',
    value: 'Karnataka',
    group: 'tax',
    label: 'Seller state (place of supply origin)',
  },
  {
    key: 'sellerAddress',
    value: 'Tower B, Prestige Tech Park, Outer Ring Road, Bengaluru 560103',
    group: 'general',
    label: 'Registered address',
  },
  { key: 'supportEmail', value: 'support@voltage.store', group: 'general', label: 'Support email' },
  { key: 'supportPhone', value: '1800-123-8654', group: 'general', label: 'Support phone' },

  // Commerce rules
  {
    key: 'freeShippingAbovePaise',
    value: rs(4_999),
    group: 'shipping',
    label: 'Free shipping above',
  },
  {
    key: 'standardShippingPaise',
    value: rs(99),
    group: 'shipping',
    label: 'Standard shipping charge',
  },
  {
    key: 'expressShippingPaise',
    value: rs(199),
    group: 'shipping',
    label: 'Express shipping charge',
  },
  { key: 'codFeePaise', value: rs(49), group: 'payment', label: 'COD handling fee' },
  {
    key: 'codMaxOrderPaise',
    value: rs(50_000),
    group: 'payment',
    label: 'Maximum COD order value',
  },
  {
    key: 'walletMaxPercentOnOrder',
    value: 100,
    group: 'wallet',
    label: 'Max wallet usage per order (%)',
  },
  { key: 'returnWindowDays', value: 10, group: 'general', label: 'Return window (days)' },

  // Payouts
  { key: 'payoutMinPaise', value: rs(100), group: 'wallet', label: 'Minimum withdrawal' },
  {
    key: 'payoutMaxPerDayPaise',
    value: rs(50_000),
    group: 'wallet',
    label: 'Withdrawal limit per day',
  },
  {
    key: 'payoutAutoApproveBelowPaise',
    value: rs(1_000),
    group: 'wallet',
    label: 'Auto-approve withdrawals below',
  },
  {
    key: 'payoutRequiresVerifiedBank',
    value: true,
    group: 'wallet',
    label: 'Require verified bank before payout',
  },

  // Loyalty
  {
    key: 'loyaltyEarnRateBps',
    value: 50,
    group: 'general',
    label: 'Loyalty earn rate (bps of order value)',
  },
  {
    key: 'loyaltyRedeemRatePaise',
    value: 100,
    group: 'general',
    label: 'Rupee value of 1 loyalty point (paise)',
  },

  // Storefront
  { key: 'siteTitle', value: 'VOLTAGE — Flagship Tech, Charged Up', group: 'seo', label: 'Site title' },
  {
    key: 'siteTagline',
    value: 'The command centre for your next device.',
    group: 'seo',
    label: 'Site tagline',
  },
  {
    key: 'announcementText',
    // Kept in step with freeShippingAbovePaise above — the banner quotes the
    // threshold checkout actually enforces.
    value: 'Monsoon Flagship Days — free delivery above ₹4,999 · no-cost EMI up to 24 months',
    group: 'theme',
    label: 'Announcement bar text',
  },
  { key: 'announcementEnabled', value: true, group: 'theme', label: 'Show announcement bar' },
];

// ─────────────────────────── 3. warehouses ──────────────────────────────

/**
 * Allocation reserves stock warehouse-by-warehouse ordered by `priority`
 * descending, so Bengaluru's 100 makes it the primary source and Kolkata's 40
 * makes it the last resort. GSTINs share VOLTAGE's PAN under each state's code
 * (29 Karnataka, 06 Haryana, 27 Maharashtra, 19 West Bengal).
 */
const WAREHOUSES = [
  {
    name: 'Bengaluru Fulfilment Centre',
    code: 'FC-BLR-01',
    addressLine: 'Unit 4, Embassy Industrial Park, Bommasandra Industrial Area, Hosur Road',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560099',
    gstin: '29AABCV1234K1ZP',
    priority: 100,
    isActive: true,
  },
  {
    name: 'Delhi NCR Fulfilment Centre',
    code: 'FC-NCR-01',
    addressLine: 'Warehouse C-9, IMT Manesar Sector 8, Pachgaon Road',
    city: 'Gurugram',
    state: 'Haryana',
    pincode: '122052',
    gstin: '06AABCV1234K1ZL',
    priority: 80,
    isActive: true,
  },
  {
    name: 'Mumbai Fulfilment Centre',
    code: 'FC-BOM-01',
    addressLine: 'Godown B-11, Bhiwandi Logistics Park, Kalyan–Bhiwandi Road, Val Village',
    city: 'Bhiwandi',
    state: 'Maharashtra',
    pincode: '421302',
    gstin: '27AABCV1234K1Z5',
    priority: 70,
    isActive: true,
  },
  {
    name: 'Kolkata Fulfilment Centre',
    code: 'FC-CCU-01',
    addressLine: 'Block 6, Dankuni Logistics Hub, Durgapur Expressway',
    city: 'Dankuni',
    state: 'West Bengal',
    pincode: '712310',
    gstin: '19AABCV1234K1ZK',
    priority: 40,
    isActive: true,
  },
];

// ─────────────────────────── 4. suppliers ───────────────────────────────

const SUPPLIERS = [
  {
    name: 'Redwing Distribution India Pvt Ltd',
    code: 'SUP-RDW',
    gstin: '27AAECR4521M1Z8',
    contactName: 'Farhan Qureshi',
    phone: '+91 98200 41172',
    email: 'orders@redwingdist.in',
    addressLine: 'Unit 302, Kensington SEZ, Powai',
    city: 'Mumbai',
    state: 'Maharashtra',
    paymentTermsDays: 30,
    rating: 4.7,
    isActive: true,
  },
  {
    name: 'Samvridh Teleworld Pvt Ltd',
    code: 'SUP-SVT',
    gstin: '09AABCS7788Q1ZR',
    contactName: 'Ritu Bhargava',
    phone: '+91 99104 33810',
    email: 'channel@samvridhtele.com',
    addressLine: 'B-42, Sector 63, Electronic City',
    city: 'Noida',
    state: 'Uttar Pradesh',
    paymentTermsDays: 45,
    rating: 4.5,
    isActive: true,
  },
  {
    name: 'Nexcell Mobility Distributors Pvt Ltd',
    code: 'SUP-NXC',
    gstin: '29AAGCN3390H1ZD',
    contactName: 'Sandeep Achar',
    phone: '+91 80456 22190',
    email: 'sales@nexcellmobility.in',
    addressLine: '17/2, Hosur Main Road, Madiwala',
    city: 'Bengaluru',
    state: 'Karnataka',
    paymentTermsDays: 21,
    rating: 4.2,
    isActive: true,
  },
  {
    name: 'Vertex Digital Trading LLP',
    code: 'SUP-VDT',
    gstin: '06AAFCV5612L1ZW',
    contactName: 'Ankit Malhotra',
    phone: '+91 98999 70254',
    email: 'procurement@vertexdigital.co.in',
    addressLine: 'Tower 2, Udyog Vihar Phase IV',
    city: 'Gurugram',
    state: 'Haryana',
    paymentTermsDays: 30,
    rating: 4.4,
    isActive: true,
  },
  {
    name: 'Sonarc Audio Distribution Pvt Ltd',
    code: 'SUP-SNA',
    gstin: '33AADCS8834R1ZQ',
    contactName: 'Meera Krishnan',
    phone: '+91 44287 65401',
    email: 'trade@sonarcaudio.in',
    addressLine: '9 Anna Salai, Guindy Industrial Estate',
    city: 'Chennai',
    state: 'Tamil Nadu',
    paymentTermsDays: 30,
    rating: 4.1,
    isActive: true,
  },
  {
    // Cases, cables, chargers and screen protection — imported in bulk, so the
    // shortest credit terms and the weakest quality record of the six.
    name: 'Kanishk Global Imports Pvt Ltd',
    code: 'SUP-KGI',
    gstin: '24AAKCK2207F1ZN',
    contactName: 'Jignesh Pandya',
    phone: '+91 79402 11836',
    email: 'imports@kanishkglobal.com',
    addressLine: '204 Sarthik Complex, Sarkhej–Gandhinagar Highway',
    city: 'Ahmedabad',
    state: 'Gujarat',
    paymentTermsDays: 15,
    rating: 3.8,
    isActive: true,
  },
];

// ─────────────────────────── 5. shipping zones ──────────────────────────

/**
 * `states` and `pincodePrefixes` are String columns holding JSON arrays —
 * `parseJson<string[]>` on the read side — so both are stringified below.
 */
const ZONES = [
  {
    name: 'Metro',
    sortOrder: 0,
    // 3-digit prefixes: Delhi + NCR, Mumbai + MMR, Bengaluru, Hyderabad,
    // Chennai, Kolkata. Longest-prefix wins, so these beat the regional rows.
    pincodePrefixes: [
      '110', '121', '122', '201',
      '400', '401', '421',
      '500', '501',
      '560', '561', '562',
      '600', '601',
      '700', '711', '712',
    ],
    // Empty on purpose: a metro is not a state, and `findZoneForState` takes
    // the first zone listing the state, so any entry here would shadow the
    // regional zone that actually owns it.
    states: [],
    baseRatePaise: rs(49),
    expressRatePaise: rs(149),
    codFeePaise: rs(39),
    freeAbovePaise: rs(4_999),
    deliveryDays: 2,
    isActive: true,
  },
  {
    name: 'South',
    sortOrder: 1,
    pincodePrefixes: ['5', '6'],
    states: [
      'Andhra Pradesh',
      'Telangana',
      'Karnataka',
      'Tamil Nadu',
      'Kerala',
      'Puducherry',
      'Lakshadweep',
    ],
    baseRatePaise: rs(79),
    expressRatePaise: rs(179),
    codFeePaise: rs(49),
    freeAbovePaise: rs(4_999),
    deliveryDays: 3,
    isActive: true,
  },
  {
    name: 'North',
    sortOrder: 2,
    pincodePrefixes: ['1', '2'],
    states: [
      'Delhi',
      'Haryana',
      'Punjab',
      'Chandigarh',
      'Himachal Pradesh',
      'Jammu & Kashmir',
      'Ladakh',
      'Uttar Pradesh',
      'Uttarakhand',
    ],
    baseRatePaise: rs(99),
    expressRatePaise: rs(199),
    codFeePaise: rs(49),
    freeAbovePaise: rs(4_999),
    deliveryDays: 4,
    isActive: true,
  },
  {
    name: 'West & Central',
    sortOrder: 3,
    pincodePrefixes: ['3', '4'],
    states: [
      'Rajasthan',
      'Gujarat',
      'Dadra & Nagar Haveli and Daman & Diu',
      'Maharashtra',
      'Goa',
      'Madhya Pradesh',
      'Chhattisgarh',
    ],
    baseRatePaise: rs(89),
    expressRatePaise: rs(189),
    codFeePaise: rs(49),
    freeAbovePaise: rs(4_999),
    deliveryDays: 4,
    isActive: true,
  },
  {
    name: 'East & North-East',
    sortOrder: 4,
    // '9' catches Army Postal Service pincodes, which are legal per
    // `isValidPincode` but belong to no civilian region — the longest SLA is
    // the right default for them.
    pincodePrefixes: ['7', '8', '9'],
    states: [
      'West Bengal',
      'Odisha',
      'Bihar',
      'Jharkhand',
      'Sikkim',
      'Assam',
      'Arunachal Pradesh',
      'Nagaland',
      'Manipur',
      'Mizoram',
      'Tripura',
      'Meghalaya',
      'Andaman & Nicobar Islands',
    ],
    baseRatePaise: rs(129),
    expressRatePaise: rs(249),
    codFeePaise: rs(59),
    freeAbovePaise: rs(4_999),
    deliveryDays: 6,
    isActive: true,
  },
];

// ─────────────────────────── 6. tax rules ───────────────────────────────

/**
 * Every consumer-electronics line VOLTAGE sells sits at 18% GST with no cess.
 * Both the 4-digit heading and the 8-digit tariff line are seeded per category
 * because `rateForHsn` matches the string exactly — `Product.hsnCode` defaults
 * to '85171300', so a lone '8517' row would silently fall through to the 18%
 * hard-coded default instead of resolving.
 */
const TAX_RULES = [
  { name: 'Smartphones & feature phones', hsnCode: '8517', gstRate: 18, categorySlug: 'smartphones' },
  { name: 'Smartphones (tariff line)', hsnCode: '85171300', gstRate: 18, categorySlug: 'smartphones' },
  { name: 'Mobile handset parts & accessories', hsnCode: '85177090', gstRate: 18, categorySlug: 'accessories' },
  { name: 'Smartwatches & fitness bands', hsnCode: '85176290', gstRate: 18, categorySlug: 'smartwatches' },
  { name: 'Tablets & data-processing machines', hsnCode: '8471', gstRate: 18, categorySlug: 'tablets' },
  { name: 'Tablets & laptops under 10kg (tariff line)', hsnCode: '84713010', gstRate: 18, categorySlug: 'tablets' },
  { name: 'Headphones, earphones & speakers', hsnCode: '8518', gstRate: 18, categorySlug: 'audio' },
  { name: 'Headphones & earphones (tariff line)', hsnCode: '85183000', gstRate: 18, categorySlug: 'audio' },
  { name: 'Bluetooth & multi-speaker sets', hsnCode: '85182200', gstRate: 18, categorySlug: 'audio' },
  { name: 'Chargers, adapters & power supplies', hsnCode: '8504', gstRate: 18, categorySlug: 'chargers' },
  { name: 'Mobile chargers & adapters (tariff line)', hsnCode: '85044030', gstRate: 18, categorySlug: 'chargers' },
  { name: 'Cables & connectors', hsnCode: '8544', gstRate: 18, categorySlug: 'cables' },
  { name: 'USB & data cables (tariff line)', hsnCode: '85444299', gstRate: 18, categorySlug: 'cables' },
  { name: 'Power banks (lithium-ion)', hsnCode: '85076000', gstRate: 18, categorySlug: 'power-banks' },
  { name: 'Cases, covers & sleeves', hsnCode: '4202', gstRate: 18, categorySlug: 'cases-covers' },
  { name: 'Cases & covers (tariff line)', hsnCode: '42029900', gstRate: 18, categorySlug: 'cases-covers' },
  { name: 'Tempered glass screen protection', hsnCode: '70072900', gstRate: 18, categorySlug: 'screen-protection' },
  // Service accounting codes the invoice generator emits directly.
  { name: 'Protection plans & extended warranty (SAC)', hsnCode: '9971', gstRate: 18, categorySlug: null },
  { name: 'Courier & delivery charges (SAC)', hsnCode: '996812', gstRate: 18, categorySlug: null },
];

// ─────────────────────────── 7. pincodes ────────────────────────────────

/** [pincode, city, state] */
type Pin = readonly [string, string, string];

type PincodeRow = {
  pincode: string;
  city: string;
  state: string;
  zone: string;
  isServiceable: boolean;
  codAvailable: boolean;
  codLimitPaise: number;
  expressAvailable: boolean;
  deliveryDays: number;
};

type Band = {
  /** `PincodeServiceability.zone` — metro | tier1 | tier2 | remote. */
  zone: 'metro' | 'tier1' | 'tier2' | 'remote';
  minDays: number;
  maxDays: number;
  /** Stays under `codMaxOrderPaise`; checkout takes the lower of the two. */
  codLimitPaise: number;
  codOdds: number;
  expressOdds: number;
};

const BANDS = {
  metro: { zone: 'metro', minDays: 1, maxDays: 2, codLimitPaise: rs(50_000), codOdds: 1, expressOdds: 1 },
  tier1: { zone: 'tier1', minDays: 2, maxDays: 3, codLimitPaise: rs(30_000), codOdds: 0.95, expressOdds: 0.8 },
  tier2: { zone: 'tier2', minDays: 4, maxDays: 5, codLimitPaise: rs(20_000), codOdds: 0.85, expressOdds: 0.35 },
  remote: { zone: 'remote', minDays: 6, maxDays: 9, codLimitPaise: rs(10_000), codOdds: 0.3, expressOdds: 0 },
} as const satisfies Record<string, Band>;

/** Same-day or next-day express, COD to the full ceiling. */
const METRO_PINS: Pin[] = [
  ['560001', 'Bengaluru', 'Karnataka'],
  ['560034', 'Bengaluru', 'Karnataka'],
  ['560037', 'Bengaluru', 'Karnataka'],
  ['560038', 'Bengaluru', 'Karnataka'],
  ['560066', 'Bengaluru', 'Karnataka'],
  ['560068', 'Bengaluru', 'Karnataka'],
  ['560078', 'Bengaluru', 'Karnataka'],
  ['560102', 'Bengaluru', 'Karnataka'],
  [HOME_PINCODE, 'Bengaluru', 'Karnataka'],
  ['110001', 'New Delhi', 'Delhi'],
  ['110016', 'New Delhi', 'Delhi'],
  ['110019', 'New Delhi', 'Delhi'],
  ['110058', 'New Delhi', 'Delhi'],
  ['110070', 'New Delhi', 'Delhi'],
  ['110092', 'Delhi', 'Delhi'],
  ['122001', 'Gurugram', 'Haryana'],
  ['122018', 'Gurugram', 'Haryana'],
  ['121001', 'Faridabad', 'Haryana'],
  ['201301', 'Noida', 'Uttar Pradesh'],
  ['201309', 'Noida', 'Uttar Pradesh'],
  ['201001', 'Ghaziabad', 'Uttar Pradesh'],
  ['400001', 'Mumbai', 'Maharashtra'],
  ['400013', 'Mumbai', 'Maharashtra'],
  ['400020', 'Mumbai', 'Maharashtra'],
  ['400050', 'Mumbai', 'Maharashtra'],
  ['400058', 'Mumbai', 'Maharashtra'],
  ['400076', 'Mumbai', 'Maharashtra'],
  ['400601', 'Thane', 'Maharashtra'],
  ['400703', 'Navi Mumbai', 'Maharashtra'],
  ['600001', 'Chennai', 'Tamil Nadu'],
  ['600017', 'Chennai', 'Tamil Nadu'],
  ['600020', 'Chennai', 'Tamil Nadu'],
  ['600034', 'Chennai', 'Tamil Nadu'],
  ['600096', 'Chennai', 'Tamil Nadu'],
  ['500001', 'Hyderabad', 'Telangana'],
  ['500016', 'Hyderabad', 'Telangana'],
  ['500032', 'Hyderabad', 'Telangana'],
  ['500034', 'Hyderabad', 'Telangana'],
  ['500081', 'Hyderabad', 'Telangana'],
  ['500003', 'Secunderabad', 'Telangana'],
  ['700001', 'Kolkata', 'West Bengal'],
  ['700016', 'Kolkata', 'West Bengal'],
  ['700019', 'Kolkata', 'West Bengal'],
  ['700064', 'Kolkata', 'West Bengal'],
  ['700091', 'Kolkata', 'West Bengal'],
];

/** State capitals and large tier-1 cities — express on most of them. */
const TIER1_PINS: Pin[] = [
  ['411001', 'Pune', 'Maharashtra'],
  ['411004', 'Pune', 'Maharashtra'],
  ['411014', 'Pune', 'Maharashtra'],
  ['411028', 'Pune', 'Maharashtra'],
  ['411057', 'Pune', 'Maharashtra'],
  ['380001', 'Ahmedabad', 'Gujarat'],
  ['380009', 'Ahmedabad', 'Gujarat'],
  ['380015', 'Ahmedabad', 'Gujarat'],
  ['380054', 'Ahmedabad', 'Gujarat'],
  ['302001', 'Jaipur', 'Rajasthan'],
  ['302017', 'Jaipur', 'Rajasthan'],
  ['302020', 'Jaipur', 'Rajasthan'],
  ['226001', 'Lucknow', 'Uttar Pradesh'],
  ['226010', 'Lucknow', 'Uttar Pradesh'],
  ['226016', 'Lucknow', 'Uttar Pradesh'],
  ['160017', 'Chandigarh', 'Chandigarh'],
  ['160022', 'Chandigarh', 'Chandigarh'],
  ['682016', 'Kochi', 'Kerala'],
  ['682020', 'Kochi', 'Kerala'],
  ['682024', 'Kochi', 'Kerala'],
  ['641012', 'Coimbatore', 'Tamil Nadu'],
  ['641028', 'Coimbatore', 'Tamil Nadu'],
  ['395007', 'Surat', 'Gujarat'],
  ['395009', 'Surat', 'Gujarat'],
  ['452001', 'Indore', 'Madhya Pradesh'],
  ['452010', 'Indore', 'Madhya Pradesh'],
  ['440010', 'Nagpur', 'Maharashtra'],
  ['440022', 'Nagpur', 'Maharashtra'],
  ['462016', 'Bhopal', 'Madhya Pradesh'],
  ['462039', 'Bhopal', 'Madhya Pradesh'],
  ['530003', 'Visakhapatnam', 'Andhra Pradesh'],
  ['530016', 'Visakhapatnam', 'Andhra Pradesh'],
  ['570001', 'Mysuru', 'Karnataka'],
  ['570017', 'Mysuru', 'Karnataka'],
  ['390007', 'Vadodara', 'Gujarat'],
  ['422005', 'Nashik', 'Maharashtra'],
  ['208001', 'Kanpur', 'Uttar Pradesh'],
  ['141001', 'Ludhiana', 'Punjab'],
];

/** Tier-2 cities — COD nearly everywhere, express only on some lanes. */
const TIER2_PINS: Pin[] = [
  ['575001', 'Mangaluru', 'Karnataka'],
  ['580020', 'Hubballi', 'Karnataka'],
  ['590001', 'Belagavi', 'Karnataka'],
  ['625002', 'Madurai', 'Tamil Nadu'],
  ['620001', 'Tiruchirappalli', 'Tamil Nadu'],
  ['636007', 'Salem', 'Tamil Nadu'],
  ['695001', 'Thiruvananthapuram', 'Kerala'],
  ['673001', 'Kozhikode', 'Kerala'],
  ['680001', 'Thrissur', 'Kerala'],
  ['605001', 'Puducherry', 'Puducherry'],
  ['520010', 'Vijayawada', 'Andhra Pradesh'],
  ['522002', 'Guntur', 'Andhra Pradesh'],
  ['517501', 'Tirupati', 'Andhra Pradesh'],
  ['506002', 'Warangal', 'Telangana'],
  ['342001', 'Jodhpur', 'Rajasthan'],
  ['313001', 'Udaipur', 'Rajasthan'],
  ['324005', 'Kota', 'Rajasthan'],
  ['282002', 'Agra', 'Uttar Pradesh'],
  ['221010', 'Varanasi', 'Uttar Pradesh'],
  ['211001', 'Prayagraj', 'Uttar Pradesh'],
  ['250002', 'Meerut', 'Uttar Pradesh'],
  ['143001', 'Amritsar', 'Punjab'],
  ['144001', 'Jalandhar', 'Punjab'],
  ['248001', 'Dehradun', 'Uttarakhand'],
  ['171001', 'Shimla', 'Himachal Pradesh'],
  ['180001', 'Jammu', 'Jammu & Kashmir'],
  ['474002', 'Gwalior', 'Madhya Pradesh'],
  ['482002', 'Jabalpur', 'Madhya Pradesh'],
  ['492001', 'Raipur', 'Chhattisgarh'],
  ['431001', 'Aurangabad', 'Maharashtra'],
  ['416001', 'Kolhapur', 'Maharashtra'],
  ['360001', 'Rajkot', 'Gujarat'],
  ['403001', 'Panaji', 'Goa'],
  ['800001', 'Patna', 'Bihar'],
  ['834001', 'Ranchi', 'Jharkhand'],
  ['831001', 'Jamshedpur', 'Jharkhand'],
  ['751001', 'Bhubaneswar', 'Odisha'],
  ['734001', 'Siliguri', 'West Bengal'],
  ['713216', 'Durgapur', 'West Bengal'],
  ['781005', 'Guwahati', 'Assam'],
];

/** North-East, the islands and the high Himalaya — long SLAs, rarely COD. */
const REMOTE_PINS: Pin[] = [
  ['786001', 'Dibrugarh', 'Assam'],
  ['788001', 'Silchar', 'Assam'],
  ['785001', 'Jorhat', 'Assam'],
  ['793001', 'Shillong', 'Meghalaya'],
  ['796001', 'Aizawl', 'Mizoram'],
  ['797001', 'Kohima', 'Nagaland'],
  ['797112', 'Dimapur', 'Nagaland'],
  ['795001', 'Imphal', 'Manipur'],
  ['799001', 'Agartala', 'Tripura'],
  ['791111', 'Itanagar', 'Arunachal Pradesh'],
  ['737101', 'Gangtok', 'Sikkim'],
  ['194101', 'Leh', 'Ladakh'],
  ['190001', 'Srinagar', 'Jammu & Kashmir'],
  ['744101', 'Port Blair', 'Andaman & Nicobar Islands'],
];

/** Reachable "we don't deliver here yet" cases for the storefront path. */
const UNSERVICEABLE_PINS: Pin[] = [
  ['744301', 'Car Nicobar', 'Andaman & Nicobar Islands'],
  ['682555', 'Kavaratti', 'Lakshadweep'],
  ['193222', 'Kupwara', 'Jammu & Kashmir'],
  ['790104', 'Tawang', 'Arunachal Pradesh'],
  ['796321', 'Champhai', 'Mizoram'],
  ['194103', 'Kargil', 'Ladakh'],
];

function bandRows(rng: Rng, band: Band, pins: readonly Pin[]): PincodeRow[] {
  return pins.map(([pincode, city, state]) => {
    const cod = chance(rng, band.codOdds);
    return {
      pincode,
      city,
      state,
      zone: band.zone,
      isServiceable: true,
      codAvailable: cod,
      codLimitPaise: cod ? band.codLimitPaise : 0,
      expressAvailable: chance(rng, band.expressOdds),
      deliveryDays: int(rng, band.minDays, band.maxDays),
    };
  });
}

function buildPincodes(rng: Rng): PincodeRow[] {
  const rows: PincodeRow[] = [
    ...bandRows(rng, BANDS.metro, METRO_PINS),
    ...bandRows(rng, BANDS.tier1, TIER1_PINS),
    ...bandRows(rng, BANDS.tier2, TIER2_PINS),
    ...bandRows(rng, BANDS.remote, REMOTE_PINS),
    ...UNSERVICEABLE_PINS.map(([pincode, city, state]) => ({
      pincode,
      city,
      state,
      zone: BANDS.remote.zone,
      isServiceable: false,
      codAvailable: false,
      codLimitPaise: 0,
      expressAvailable: false,
      // Never surfaced while isServiceable is false, but a sane number keeps
      // the admin grid readable.
      deliveryDays: 12,
    })),
  ];

  // The seller's own pincode is a guarantee, not a dice roll — the demo shows
  // express + COD from the first pincode anyone types.
  const home = rows.find((r) => r.pincode === HOME_PINCODE);
  if (!home) throw new Error(`Foundation seed: ${HOME_PINCODE} missing from the pincode list`);
  home.isServiceable = true;
  home.codAvailable = true;
  home.codLimitPaise = BANDS.metro.codLimitPaise;
  home.expressAvailable = true;
  home.deliveryDays = 1;

  // `pincode` is unique — fail loudly here rather than as an opaque P2002.
  const seen = new Set<string>();
  for (const row of rows) {
    if (seen.has(row.pincode)) {
      throw new Error(`Foundation seed: duplicate pincode ${row.pincode}`);
    }
    seen.add(row.pincode);
  }

  return rows;
}

// ─────────────────────────── run ────────────────────────────────────────

export async function seedFoundation(): Promise<void> {
  await prisma.setting.createMany({
    data: SETTINGS.map((s) => ({
      key: s.key,
      value: JSON.stringify(s.value),
      groupName: s.group,
      label: s.label,
    })),
  });
  log('Settings', SETTINGS.length);

  // Role slugs are the ROLE_PRESETS keys; name, description and the permission
  // array come straight from the preset so the RBAC screens match the code.
  const roles = Object.entries(ROLE_PRESETS);
  await prisma.staffRole.createMany({
    data: roles.map(([slug, preset]) => ({
      name: preset.name,
      slug,
      description: preset.description,
      permissions: JSON.stringify(preset.permissions),
      isSystem: true,
    })),
  });
  log('Staff roles', roles.length);

  // Created one at a time so the primary centre's id is in hand — everything
  // downstream allocates against it first.
  let primaryWarehouseCode = '';
  for (const warehouse of WAREHOUSES) {
    const row = await prisma.warehouse.create({ data: warehouse });
    if (!primaryWarehouseCode) primaryWarehouseCode = row.code;
  }
  log(`Warehouses (primary ${primaryWarehouseCode})`, WAREHOUSES.length);

  await prisma.supplier.createMany({ data: SUPPLIERS });
  log('Suppliers', SUPPLIERS.length);

  await prisma.shippingZone.createMany({
    data: ZONES.map((z) => ({
      name: z.name,
      states: JSON.stringify(z.states),
      pincodePrefixes: JSON.stringify(z.pincodePrefixes),
      baseRatePaise: z.baseRatePaise,
      freeAbovePaise: z.freeAbovePaise,
      codFeePaise: z.codFeePaise,
      expressRatePaise: z.expressRatePaise,
      deliveryDays: z.deliveryDays,
      isActive: z.isActive,
      sortOrder: z.sortOrder,
    })),
  });
  log('Shipping zones', ZONES.length);

  await prisma.taxRule.createMany({
    data: TAX_RULES.map((t) => ({
      name: t.name,
      hsnCode: t.hsnCode,
      gstRate: t.gstRate,
      cessRate: 0,
      categorySlug: t.categorySlug,
      isActive: true,
    })),
  });
  log('Tax rules', TAX_RULES.length);

  const pincodes = buildPincodes(rand);
  await prisma.pincodeServiceability.createMany({ data: pincodes });
  log(
    `Pincodes (${pincodes.filter((p) => !p.isServiceable).length} deliberately unserviceable)`,
    pincodes.length,
  );
}
