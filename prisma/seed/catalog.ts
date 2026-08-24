import { chance, int, log, makeRng, prisma, rs, type Rng } from './kit';

const rand = makeRng(560_103);

const BRANDS = [
  { name: 'Apple', slug: 'apple', country: 'USA', accent: '#007AFF', sortOrder: 1 },
  { name: 'Samsung', slug: 'samsung', country: 'South Korea', accent: '#1428A0', sortOrder: 2 },
  { name: 'OnePlus', slug: 'oneplus', country: 'China', accent: '#FF1010', sortOrder: 3 },
  { name: 'Xiaomi', slug: 'xiaomi', country: 'China', accent: '#FF6900', sortOrder: 4 },
  { name: 'Vivo', slug: 'vivo', country: 'China', accent: '#00C4FF', sortOrder: 5 },
  { name: 'Realme', slug: 'realme', country: 'China', accent: '#FFD600', sortOrder: 6 },
  { name: 'Motorola', slug: 'motorola', country: 'USA', accent: '#E31E24', sortOrder: 7 },
  { name: 'Nothing', slug: 'nothing', country: 'UK', accent: '#000000', sortOrder: 8 },
  { name: 'Sony', slug: 'sony', country: 'Japan', accent: '#004E8C', sortOrder: 9 },
  { name: 'Bose', slug: 'bose', country: 'USA', accent: '#D62D20', sortOrder: 10 },
  { name: 'JBL', slug: 'jbl', country: 'USA', accent: '#F58220', sortOrder: 11 },
  { name: 'boAt', slug: 'boat', country: 'India', accent: '#FF3366', sortOrder: 12 },
];

const CATEGORIES = [
  { name: 'Mobiles', slug: 'mobiles', icon: 'smartphone', sortOrder: 1, parentId: null },
  { name: 'Tablets', slug: 'tablets', icon: 'tablet', sortOrder: 2, parentId: null },
  { name: 'Audio', slug: 'audio', icon: 'headphones', sortOrder: 3, parentId: null },
  { name: 'Wearables', slug: 'wearables', icon: 'watch', sortOrder: 4, parentId: null },
  { name: 'Accessories', slug: 'accessories', icon: 'cable', sortOrder: 5, parentId: null },
];

const SUB_CATEGORIES = [
  { name: 'Flagship Phones', slug: 'flagship-phones', parentSlug: 'mobiles', sortOrder: 1 },
  { name: 'Mid-range Phones', slug: 'midrange-phones', parentSlug: 'mobiles', sortOrder: 2 },
  { name: 'Budget Phones', slug: 'budget-phones', parentSlug: 'mobiles', sortOrder: 3 },
  { name: 'iPads', slug: 'ipads', parentSlug: 'tablets', sortOrder: 1 },
  { name: 'Android Tablets', slug: 'android-tablets', parentSlug: 'tablets', sortOrder: 2 },
  { name: 'TWS Earbuds', slug: 'tws-earbuds', parentSlug: 'audio', sortOrder: 1 },
  { name: 'Headphones', slug: 'headphones', parentSlug: 'audio', sortOrder: 2 },
  { name: 'Speakers', slug: 'speakers', parentSlug: 'audio', sortOrder: 3 },
  { name: 'Smartwatches', slug: 'smartwatches', parentSlug: 'wearables', sortOrder: 1 },
  { name: 'Fitness Bands', slug: 'fitness-bands', parentSlug: 'wearables', sortOrder: 2 },
  { name: 'Cases & Covers', slug: 'cases-covers', parentSlug: 'accessories', sortOrder: 1 },
  { name: 'Chargers', slug: 'chargers', parentSlug: 'accessories', sortOrder: 2 },
  { name: 'Cables', slug: 'cables', parentSlug: 'accessories', sortOrder: 3 },
  { name: 'Power Banks', slug: 'power-banks', parentSlug: 'accessories', sortOrder: 4 },
  { name: 'Screen Protection', slug: 'screen-protection', parentSlug: 'accessories', sortOrder: 5 },
];

const SPEC_DEFINITIONS = [
  { key: 'display_size', label: 'Display size', unit: 'inches', dataType: 'number', groupName: 'Display', sortOrder: 1, isKeySpec: true, isFilterable: true, isComparable: true, higherIsBetter: true, scaleMax: 7 },
  { key: 'display_type', label: 'Display type', unit: null, dataType: 'text', groupName: 'Display', sortOrder: 2, isKeySpec: true, isFilterable: true, isComparable: true, higherIsBetter: false },
  { key: 'refresh_rate', label: 'Refresh rate', unit: 'Hz', dataType: 'number', groupName: 'Display', sortOrder: 3, isKeySpec: true, isFilterable: true, isComparable: true, higherIsBetter: true, scaleMax: 144 },
  { key: 'processor', label: 'Processor', unit: null, dataType: 'text', groupName: 'Performance', sortOrder: 1, isKeySpec: true, isFilterable: true, isComparable: true, higherIsBetter: false },
  { key: 'ram', label: 'RAM', unit: 'GB', dataType: 'number', groupName: 'Performance', sortOrder: 2, isKeySpec: true, isFilterable: true, isComparable: true, higherIsBetter: true, scaleMax: 24 },
  { key: 'storage', label: 'Storage', unit: 'GB', dataType: 'number', groupName: 'Performance', sortOrder: 3, isKeySpec: true, isFilterable: true, isComparable: true, higherIsBetter: true, scaleMax: 1024 },
  { key: 'battery_capacity', label: 'Battery capacity', unit: 'mAh', dataType: 'number', groupName: 'Battery', sortOrder: 1, isKeySpec: true, isFilterable: true, isComparable: true, higherIsBetter: true, scaleMax: 6000 },
  { key: 'charging_speed', label: 'Charging speed', unit: 'W', dataType: 'number', groupName: 'Battery', sortOrder: 2, isKeySpec: true, isFilterable: true, isComparable: true, higherIsBetter: true, scaleMax: 120 },
  { key: 'rear_camera_primary', label: 'Primary camera', unit: 'MP', dataType: 'number', groupName: 'Camera', sortOrder: 1, isKeySpec: true, isFilterable: true, isComparable: true, higherIsBetter: true, scaleMax: 200 },
  { key: 'front_camera', label: 'Front camera', unit: 'MP', dataType: 'number', groupName: 'Camera', sortOrder: 2, isKeySpec: true, isFilterable: true, isComparable: true, higherIsBetter: true, scaleMax: 60 },
  { key: 'os', label: 'Operating system', unit: null, dataType: 'text', groupName: 'Software', sortOrder: 1, isKeySpec: false, isFilterable: true, isComparable: true, higherIsBetter: false },
  { key: '5g', label: '5G support', unit: null, dataType: 'boolean', groupName: 'Connectivity', sortOrder: 1, isKeySpec: true, isFilterable: true, isComparable: true, higherIsBetter: true },
  { key: 'weight', label: 'Weight', unit: 'g', dataType: 'number', groupName: 'Physical', sortOrder: 1, isKeySpec: false, isFilterable: false, isComparable: true, higherIsBetter: false, scaleMax: 300 },
  { key: 'water_resistance', label: 'Water resistance', unit: null, dataType: 'text', groupName: 'Physical', sortOrder: 2, isKeySpec: false, isFilterable: true, isComparable: true, higherIsBetter: false },
  { key: 'driver_size', label: 'Driver size', unit: 'mm', dataType: 'number', groupName: 'Audio', sortOrder: 1, isKeySpec: true, isFilterable: true, isComparable: true, higherIsBetter: false, scaleMax: 50 },
  { key: 'anc', label: 'Active noise cancellation', unit: null, dataType: 'boolean', groupName: 'Audio', sortOrder: 2, isKeySpec: true, isFilterable: true, isComparable: true, higherIsBetter: true },
  { key: 'bluetooth_version', label: 'Bluetooth version', unit: null, dataType: 'text', groupName: 'Connectivity', sortOrder: 2, isKeySpec: false, isFilterable: false, isComparable: true, higherIsBetter: false },
  { key: 'health_sensors', label: 'Health sensors', unit: null, dataType: 'text', groupName: 'Health', sortOrder: 1, isKeySpec: true, isFilterable: false, isComparable: true, higherIsBetter: false },
  { key: 'gps', label: 'Built-in GPS', unit: null, dataType: 'boolean', groupName: 'Connectivity', sortOrder: 3, isKeySpec: false, isFilterable: true, isComparable: true, higherIsBetter: true },
  { key: 'power_output', label: 'Power output', unit: 'W', dataType: 'number', groupName: 'Power', sortOrder: 1, isKeySpec: true, isFilterable: true, isComparable: true, higherIsBetter: true, scaleMax: 140 },
  { key: 'capacity', label: 'Capacity', unit: 'mAh', dataType: 'number', groupName: 'Battery', sortOrder: 3, isKeySpec: true, isFilterable: true, isComparable: true, higherIsBetter: true, scaleMax: 50000 },
  { key: 'ports', label: 'Ports', unit: null, dataType: 'text', groupName: 'Connectivity', sortOrder: 4, isKeySpec: false, isFilterable: false, isComparable: true, higherIsBetter: false },
];

const PROTECTION_PLANS = [
  { name: 'Essential Protection', tier: 'basic', description: 'Mechanical and electrical failure coverage', durationMonths: 12, priceType: 'percent', priceValue: 3, coverage: ['mechanical_failure', 'electrical_failure'], appliesToKind: 'phone', sortOrder: 1 },
  { name: 'Complete Protection', tier: 'total', description: 'Mechanical, electrical, accidental damage and liquid damage', durationMonths: 12, priceType: 'percent', priceValue: 5, coverage: ['mechanical_failure', 'electrical_failure', 'accidental_damage', 'liquid_damage'], appliesToKind: 'phone', sortOrder: 2 },
  { name: 'Essential Protection 24M', tier: 'basic', description: 'Mechanical and electrical failure coverage for 24 months', durationMonths: 24, priceType: 'percent', priceValue: 5, coverage: ['mechanical_failure', 'electrical_failure'], appliesToKind: 'phone', sortOrder: 3 },
  { name: 'Complete Protection 24M', tier: 'total', description: 'Full coverage including accidental and liquid damage for 24 months', durationMonths: 24, priceType: 'percent', priceValue: 8, coverage: ['mechanical_failure', 'electrical_failure', 'accidental_damage', 'liquid_damage'], appliesToKind: 'phone', sortOrder: 4 },
];

const FLASH_SALES = [
  { name: 'Monsoon Flagship Days', startsAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), endsAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), isActive: true },
];

const EMI_PLANS = [
  { id: 'emi-3m-nc', bankName: 'HDFC Bank', bankCode: 'HDFC', brandSlug: null, tenureMonths: 3, interestBps: 0, isNoCost: true, processingFeePaise: 0, minOrderPaise: 300000, sortOrder: 1 },
  { id: 'emi-6m-nc', bankName: 'ICICI Bank', bankCode: 'ICICI', brandSlug: null, tenureMonths: 6, interestBps: 0, isNoCost: true, processingFeePaise: 0, minOrderPaise: 500000, sortOrder: 2 },
  { id: 'emi-9m-nc', bankName: 'Axis Bank', bankCode: 'AXIS', brandSlug: null, tenureMonths: 9, interestBps: 0, isNoCost: true, processingFeePaise: 0, minOrderPaise: 1000000, sortOrder: 3 },
  { id: 'emi-12m-nc', bankName: 'SBI', bankCode: 'SBI', brandSlug: null, tenureMonths: 12, interestBps: 0, isNoCost: true, processingFeePaise: 0, minOrderPaise: 1500000, sortOrder: 4 },
  { id: 'emi-18m-cost', bankName: 'Bajaj Finserv', bankCode: 'BAJAJ', brandSlug: null, tenureMonths: 18, interestBps: 1200, isNoCost: false, processingFeePaise: 19900, minOrderPaise: 1000000, sortOrder: 5 },
  { id: 'emi-24m-cost', bankName: 'Kotak Mahindra', bankCode: 'KOTAK', brandSlug: null, tenureMonths: 24, interestBps: 1300, isNoCost: false, processingFeePaise: 29900, minOrderPaise: 1500000, sortOrder: 6 },
];

const EXCHANGE_DEVICES = [
  { brand: 'Apple', model: 'iPhone 13', baseValuePaise: 2500000, launchYear: 2021 },
  { brand: 'Apple', model: 'iPhone 12', baseValuePaise: 1800000, launchYear: 2020 },
  { brand: 'Samsung', model: 'Galaxy S23', baseValuePaise: 2200000, launchYear: 2023 },
  { brand: 'Samsung', model: 'Galaxy S22', baseValuePaise: 1500000, launchYear: 2022 },
  { brand: 'OnePlus', model: '11', baseValuePaise: 1800000, launchYear: 2023 },
  { brand: 'Xiaomi', model: '13 Pro', baseValuePaise: 1600000, launchYear: 2023 },
];

const COUPONS = [
  { code: 'WELCOME100', description: 'Welcome ₹100 off', discountType: 'flat', value: 10000, minOrderPaise: 100000, maxDiscountPaise: 10000, perUserLimit: 1, startsAt: new Date(), endsAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), isActive: true },
  { code: 'FESTIVE5', description: 'Festive 5% off', discountType: 'percent', value: 5, minOrderPaise: 2000000, maxDiscountPaise: 250000, perUserLimit: 1, startsAt: new Date(), endsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), isActive: true },
  { code: 'STUDENT5', description: 'Student 5% off', discountType: 'percent', value: 5, minOrderPaise: 1500000, maxDiscountPaise: 200000, perUserLimit: 2, startsAt: new Date(), endsAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), isActive: true },
];

function colorHex(kind: string, idx: number): { hex: string; hex2: string | null; finish: string } {
  const palettes: Record<string, Array<{ hex: string; hex2: string | null; finish: string }>> = {
    phone: [
      { hex: '#000000', hex2: '#1a1a2e', finish: 'Matte' },
      { hex: '#1a1a2e', hex2: '#16213e', finish: 'Glossy' },
      { hex: '#0f0f23', hex2: '#1a1a2e', finish: 'Matte' },
      { hex: '#ffffff', hex2: '#f0f0f0', finish: 'Glossy' },
      { hex: '#0066cc', hex2: '#004499', finish: 'Glass' },
      { hex: '#8b0000', hex2: '#5c0000', finish: 'Matte' },
      { hex: '#004400', hex2: '#002200', finish: 'Matte' },
      { hex: '#996600', hex2: '#664400', finish: 'Brushed' },
    ],
    tablet: [
      { hex: '#1a1a2e', hex2: '#16213e', finish: 'Aluminum' },
      { hex: '#000000', hex2: '#1a1a2e', finish: 'Space Gray' },
      { hex: '#c0c0c0', hex2: '#a0a0a0', finish: 'Silver' },
    ],
    audio: [
      { hex: '#000000', hex2: null, finish: 'Matte' },
      { hex: '#1a1a1a', hex2: null, finish: 'Matte' },
      { hex: '#ffffff', hex2: null, finish: 'Glossy' },
      { hex: '#0066cc', hex2: null, finish: 'Matte' },
    ],
    wearable: [
      { hex: '#000000', hex2: null, finish: 'Aluminum' },
      { hex: '#c0c0c0', hex2: null, finish: 'Stainless Steel' },
      { hex: '#ffd700', hex2: null, finish: 'Gold' },
      { hex: '#8b4513', hex2: null, finish: 'Titanium' },
    ],
    accessory: [
      { hex: '#000000', hex2: null, finish: 'Matte' },
      { hex: '#ffffff', hex2: null, finish: 'Glossy' },
      { hex: '#1a1a1a', hex2: null, finish: 'Matte' },
    ],
  };
  const arr = palettes[kind] || palettes.phone;
  return arr[idx % arr.length];
}

function gradientFor(kind: string, idx: number): string {
  const gradients: Record<string, string[]> = {
    phone: [
      'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)',
      'linear-gradient(135deg, #000000 0%, #1a1a2e 50%, #0f0f23 100%)',
      'linear-gradient(135deg, #001a33 0%, #003366 50%, #004499 100%)',
      'linear-gradient(135deg, #1a0000 0%, #330000 50%, #5c0000 100%)',
      'linear-gradient(135deg, #001a00 0%, #003300 50%, #004400 100%)',
      'linear-gradient(135deg, #332200 0%, #664400 50%, #996600 100%)',
      'linear-gradient(135deg, #1a0033 0%, #330066 50%, #440099 100%)',
      'linear-gradient(135deg, #ffffff 0%, #e0e0e0 50%, #cccccc 100%)',
    ],
    tablet: [
      'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
      'linear-gradient(135deg, #000000 0%, #1a1a2e 100%)',
      'linear-gradient(135deg, #c0c0c0 0%, #a0a0a0 100%)',
    ],
    audio: [
      'linear-gradient(135deg, #000000 0%, #1a1a1a 100%)',
      'linear-gradient(135deg, #1a1a1a 0%, #000000 100%)',
      'linear-gradient(135deg, #ffffff 0%, #e0e0e0 100%)',
      'linear-gradient(135deg, #001a33 0%, #003366 100%)',
    ],
    wearable: [
      'linear-gradient(135deg, #000000 0%, #1a1a1a 100%)',
      'linear-gradient(135deg, #c0c0c0 0%, #a0a0a0 100%)',
      'linear-gradient(135deg, #ffd700 0%, #b8860b 100%)',
      'linear-gradient(135deg, #8b4513 0%, #5d3a1a 100%)',
    ],
    accessory: [
      'linear-gradient(135deg, #000000 0%, #1a1a1a 100%)',
      'linear-gradient(135deg, #ffffff 0%, #e0e0e0 100%)',
      'linear-gradient(135deg, #1a1a1a 0%, #000000 100%)',
    ],
  };
  const arr = gradients[kind] || gradients.phone;
  return arr[idx % arr.length];
}

const PHONES = [
  { brand: 'Apple', model: 'iPhone 15 Pro Max', kind: 'phone', categorySlug: 'flagship-phones', basePrice: 159900, mrp: 159900, imageUrl: '/products/iphone-15-pro-max.jpg', specs: { display_size: 6.7, display_type: 'Super Retina XDR OLED', refresh_rate: 120, processor: 'A17 Pro', ram: 8, storage: [256, 512, 1024], battery_capacity: 4441, charging_speed: 27, rear_camera_primary: 48, front_camera: 12, os: 'iOS 17', '5g': true, weight: 221, water_resistance: 'IP68' }, highlights: ['A17 Pro chip', 'Titanium design', 'Action Button', 'USB-C', '48MP Main camera'], badges: ['flagship', 'bestseller'], isFeatured: true, sortOrder: 1 },
  { brand: 'Apple', model: 'iPhone 15 Pro', kind: 'phone', categorySlug: 'flagship-phones', basePrice: 134900, mrp: 134900, specs: { display_size: 6.1, display_type: 'Super Retina XDR OLED', refresh_rate: 120, processor: 'A17 Pro', ram: 8, storage: [128, 256, 512, 1024], battery_capacity: 3274, charging_speed: 27, rear_camera_primary: 48, front_camera: 12, os: 'iOS 17', '5g': true, weight: 187, water_resistance: 'IP68' }, highlights: ['A17 Pro chip', 'Titanium design', 'Action Button', 'USB-C', '48MP Main camera'], badges: ['flagship'], isFeatured: true, sortOrder: 2 },
  { brand: 'Apple', model: 'iPhone 15', kind: 'phone', categorySlug: 'midrange-phones', basePrice: 79900, mrp: 79900, specs: { display_size: 6.1, display_type: 'Super Retina XDR OLED', refresh_rate: 60, processor: 'A16 Bionic', ram: 6, storage: [128, 256, 512], battery_capacity: 3349, charging_speed: 20, rear_camera_primary: 48, front_camera: 12, os: 'iOS 17', '5g': true, weight: 171, water_resistance: 'IP68' }, highlights: ['Dynamic Island', 'A16 Bionic', '48MP Main camera', 'USB-C', 'Color-infused glass'], badges: ['popular'], isFeatured: true, sortOrder: 3 },
  { brand: 'Apple', model: 'iPhone 14', kind: 'phone', categorySlug: 'midrange-phones', basePrice: 69900, mrp: 79900, specs: { display_size: 6.1, display_type: 'Super Retina XDR OLED', refresh_rate: 60, processor: 'A15 Bionic', ram: 6, storage: [128, 256, 512], battery_capacity: 3279, charging_speed: 20, rear_camera_primary: 12, front_camera: 12, os: 'iOS 16', '5g': true, weight: 172, water_resistance: 'IP68' }, highlights: ['A15 Bionic', 'Photonic Engine', 'Action mode video', 'Crash Detection'], badges: ['value'], isFeatured: false, sortOrder: 4 },
  { brand: 'Samsung', model: 'Galaxy S24 Ultra', kind: 'phone', categorySlug: 'flagship-phones', basePrice: 129999, mrp: 139999, imageUrl: '/products/galaxy-s24-ultra.jpg', specs: { display_size: 6.8, display_type: 'Dynamic AMOLED 2X', refresh_rate: 120, processor: 'Snapdragon 8 Gen 3', ram: 12, storage: [256, 512, 1024], battery_capacity: 5000, charging_speed: 45, rear_camera_primary: 200, front_camera: 12, os: 'Android 14', '5g': true, weight: 232, water_resistance: 'IP68' }, highlights: ['Galaxy AI', '200MP camera', 'S Pen included', 'Titanium frame', '7 years updates'], badges: ['flagship', 'ai', 'bestseller'], isFeatured: true, sortOrder: 5 },
  { brand: 'Samsung', model: 'Galaxy S24+', kind: 'phone', categorySlug: 'flagship-phones', basePrice: 99999, mrp: 109999, specs: { display_size: 6.7, display_type: 'Dynamic AMOLED 2X', refresh_rate: 120, processor: 'Exynos 2400', ram: 12, storage: [256, 512], battery_capacity: 4900, charging_speed: 45, rear_camera_primary: 50, front_camera: 12, os: 'Android 14', '5g': true, weight: 196, water_resistance: 'IP68' }, highlights: ['Galaxy AI', '50MP triple camera', '4900 mAh battery', 'Armor aluminum'], badges: ['flagship', 'ai'], isFeatured: true, sortOrder: 6 },
  { brand: 'Samsung', model: 'Galaxy S24', kind: 'phone', categorySlug: 'flagship-phones', basePrice: 79999, mrp: 89999, specs: { display_size: 6.2, display_type: 'Dynamic AMOLED 2X', refresh_rate: 120, processor: 'Exynos 2400', ram: 8, storage: [128, 256], battery_capacity: 4000, charging_speed: 25, rear_camera_primary: 50, front_camera: 12, os: 'Android 14', '5g': true, weight: 167, water_resistance: 'IP68' }, highlights: ['Galaxy AI', 'Compact flagship', '50MP triple camera', '7 years updates'], badges: ['flagship', 'ai', 'compact'], isFeatured: true, sortOrder: 7 },
  { brand: 'OnePlus', model: '12', kind: 'phone', categorySlug: 'flagship-phones', basePrice: 64999, mrp: 69999, imageUrl: '/products/oneplus-12.jpg', specs: { display_size: 6.82, display_type: 'LTPO AMOLED', refresh_rate: 120, processor: 'Snapdragon 8 Gen 3', ram: 12, storage: [256, 512], battery_capacity: 5400, charging_speed: 100, rear_camera_primary: 50, front_camera: 32, os: 'OxygenOS 14', '5g': true, weight: 220, water_resistance: 'IP65' }, highlights: ['Snapdragon 8 Gen 3', '100W SuperVOOC', 'Hasselblad camera', '5400 mAh battery', 'Aqua Touch'], badges: ['flagship', 'fast-charging'], isFeatured: true, sortOrder: 8 },
  { brand: 'OnePlus', model: '12R', kind: 'phone', categorySlug: 'midrange-phones', basePrice: 39999, mrp: 44999, specs: { display_size: 6.78, display_type: 'LTPO AMOLED', refresh_rate: 120, processor: 'Snapdragon 8 Gen 2', ram: 8, storage: [128, 256], battery_capacity: 5500, charging_speed: 100, rear_camera_primary: 50, front_camera: 16, os: 'OxygenOS 14', '5g': true, weight: 207, water_resistance: 'IP64' }, highlights: ['Snapdragon 8 Gen 2', '100W SuperVOOC', '5500 mAh battery', 'Sony IMX890'], badges: ['value', 'fast-charging'], isFeatured: true, sortOrder: 9 },
  { brand: 'Xiaomi', model: '14', kind: 'phone', categorySlug: 'flagship-phones', basePrice: 69999, mrp: 74999, specs: { display_size: 6.36, display_type: 'LTPO AMOLED', refresh_rate: 120, processor: 'Snapdragon 8 Gen 3', ram: 12, storage: [256, 512], battery_capacity: 4610, charging_speed: 90, rear_camera_primary: 50, front_camera: 32, os: 'HyperOS', '5g': true, weight: 193, water_resistance: 'IP68' }, highlights: ['Leica optics', 'Snapdragon 8 Gen 3', '90W HyperCharge', 'Variable aperture'], badges: ['flagship'], isFeatured: false, sortOrder: 10 },
  { brand: 'Xiaomi', model: '13 Pro', kind: 'phone', categorySlug: 'flagship-phones', basePrice: 54999, mrp: 79999, specs: { display_size: 6.73, display_type: 'LTPO AMOLED', refresh_rate: 120, processor: 'Snapdragon 8 Gen 2', ram: 12, storage: [256, 512], battery_capacity: 4820, charging_speed: 120, rear_camera_primary: 50, front_camera: 32, os: 'MIUI 14', '5g': true, weight: 229, water_resistance: 'IP68' }, highlights: ['Leica 1-inch sensor', '120W HyperCharge', 'Snapdragon 8 Gen 2', 'WQHD+ 120Hz'], badges: ['flagship', 'camera', 'fast-charging'], isFeatured: false, sortOrder: 11 },
  { brand: 'Nothing', model: 'Phone (2)', kind: 'phone', categorySlug: 'midrange-phones', basePrice: 44999, mrp: 49999, specs: { display_size: 6.7, display_type: 'LTPO OLED', refresh_rate: 120, processor: 'Snapdragon 8+ Gen 1', ram: 8, storage: [128, 256, 512], battery_capacity: 4700, charging_speed: 45, rear_camera_primary: 50, front_camera: 32, os: 'Nothing OS 2.0', '5g': true, weight: 201, water_resistance: 'IP54' }, highlights: ['Glyph Interface', 'Snapdragon 8+ Gen 1', 'Transparent design', 'Clean Android'], badges: ['design', 'unique'], isFeatured: true, sortOrder: 12 },
  { brand: 'Motorola', model: 'Edge 40 Pro', kind: 'phone', categorySlug: 'flagship-phones', basePrice: 49999, mrp: 59999, specs: { display_size: 6.67, display_type: 'pOLED', refresh_rate: 165, processor: 'Snapdragon 8 Gen 2', ram: 12, storage: [256, 512], battery_capacity: 4600, charging_speed: 125, rear_camera_primary: 50, front_camera: 60, os: 'Android 13', '5g': true, weight: 199, water_resistance: 'IP68' }, highlights: ['165Hz display', '125W TurboPower', 'Snapdragon 8 Gen 2', '60MP selfie'], badges: ['fast-charging', 'display'], isFeatured: false, sortOrder: 13 },
  { brand: 'Vivo', model: 'X100 Pro', kind: 'phone', categorySlug: 'flagship-phones', basePrice: 89999, mrp: 99999, specs: { display_size: 6.78, display_type: 'LTPO AMOLED', refresh_rate: 120, processor: 'Dimensity 9300', ram: 16, storage: [512], battery_capacity: 5400, charging_speed: 100, rear_camera_primary: 50, front_camera: 32, os: 'Funtouch OS 14', '5g': true, weight: 225, water_resistance: 'IP68' }, highlights: ['Zeiss 1-inch sensor', 'Dimensity 9300', '100W FlashCharge', 'Periscope telephoto'], badges: ['camera', 'flagship'], isFeatured: false, sortOrder: 14 },
  { brand: 'Realme', model: 'GT 5 Pro', kind: 'phone', categorySlug: 'flagship-phones', basePrice: 39999, mrp: 44999, specs: { display_size: 6.78, display_type: 'LTPO AMOLED', refresh_rate: 144, processor: 'Snapdragon 8 Gen 3', ram: 12, storage: [256, 512], battery_capacity: 5400, charging_speed: 100, rear_camera_primary: 50, front_camera: 32, os: 'Realme UI 5.0', '5g': true, weight: 195, water_resistance: 'IP64' }, highlights: ['Snapdragon 8 Gen 3', '144Hz display', '100W charging', 'Periscope 3x'], badges: ['value', 'flagship'], isFeatured: false, sortOrder: 15 },
];

const TABLETS = [
  { brand: 'Apple', model: 'iPad Pro 13" M4', kind: 'tablet', categorySlug: 'ipads', basePrice: 129900, mrp: 129900, imageUrl: '/products/ipad-pro-m4.jpg', specs: { display_size: 13, display_type: 'Ultra Retina XDR OLED', refresh_rate: 120, processor: 'M4', ram: 8, storage: [256, 512, 1024, 2048], battery_capacity: 10209, charging_speed: 30, rear_camera_primary: 12, front_camera: 12, os: 'iPadOS 18', '5g': true, weight: 579 }, highlights: ['M4 chip', 'Tandem OLED', 'ProMotion 120Hz', 'Apple Pencil Pro'], badges: ['flagship', 'pro'], isFeatured: true, sortOrder: 1 },
  { brand: 'Apple', model: 'iPad Air 11" M2', kind: 'tablet', categorySlug: 'ipads', basePrice: 59900, mrp: 59900, specs: { display_size: 11, display_type: 'Liquid Retina IPS', refresh_rate: 60, processor: 'M2', ram: 8, storage: [128, 256, 512, 1024], battery_capacity: 7606, charging_speed: 20, rear_camera_primary: 12, front_camera: 12, os: 'iPadOS 18', '5g': true, weight: 462 }, highlights: ['M2 chip', 'Landscape front camera', 'Apple Pencil Pro', 'All-day battery'], badges: ['popular'], isFeatured: true, sortOrder: 2 },
  { brand: 'Samsung', model: 'Galaxy Tab S9 Ultra', kind: 'tablet', categorySlug: 'android-tablets', basePrice: 109999, mrp: 119999, specs: { display_size: 14.6, display_type: 'Dynamic AMOLED 2X', refresh_rate: 120, processor: 'Snapdragon 8 Gen 2', ram: 12, storage: [256, 512, 1024], battery_capacity: 11200, charging_speed: 45, rear_camera_primary: 13, front_camera: 12, os: 'Android 13', '5g': true, weight: 732 }, highlights: ['14.6" AMOLED', 'S Pen included', 'IP68', 'DeX mode'], badges: ['flagship', 'large'], isFeatured: false, sortOrder: 3 },
  { brand: 'Xiaomi', model: 'Pad 6 Pro', kind: 'tablet', categorySlug: 'android-tablets', basePrice: 34999, mrp: 39999, specs: { display_size: 11, display_type: 'LCD', refresh_rate: 144, processor: 'Snapdragon 8+ Gen 1', ram: 8, storage: [256], battery_capacity: 8600, charging_speed: 67, rear_camera_primary: 50, front_camera: 20, os: 'MIUI Pad 14', '5g': false, weight: 490 }, highlights: ['144Hz 2.8K display', 'Snapdragon 8+ Gen 1', '67W charging', 'Quad speakers'], badges: ['value', 'display'], isFeatured: true, sortOrder: 4 },
  { brand: 'OnePlus', model: 'Pad 2', kind: 'tablet', categorySlug: 'android-tablets', basePrice: 39999, mrp: 44999, specs: { display_size: 12.1, display_type: 'LCD', refresh_rate: 144, processor: 'Snapdragon 8 Gen 3', ram: 8, storage: [128, 256], battery_capacity: 9510, charging_speed: 67, rear_camera_primary: 13, front_camera: 8, os: 'OxygenOS 14', '5g': false, weight: 552 }, highlights: ['Snapdragon 8 Gen 3', '144Hz 3K display', '67W SuperVOOC', 'Dolby Atmos'], badges: ['flagship', 'display'], isFeatured: false, sortOrder: 5 },
];

const AUDIO = [
  { brand: 'Sony', model: 'WH-1000XM5', kind: 'audio', categorySlug: 'headphones', basePrice: 29990, mrp: 34990, imageUrl: '/products/sony-wh1000xm5.jpg', specs: { driver_size: 30, anc: true, bluetooth_version: '5.2', battery_capacity: 30000, charging_speed: 0, weight: 250 }, highlights: ['Industry-leading ANC', '30hr battery', 'Multipoint', 'Speak-to-chat'], badges: ['bestseller', 'anc'], isFeatured: true, sortOrder: 1 },
  { brand: 'Bose', model: 'QuietComfort Ultra', kind: 'audio', categorySlug: 'headphones', basePrice: 34900, mrp: 39900, specs: { driver_size: 40, anc: true, bluetooth_version: '5.3', battery_capacity: 24000, charging_speed: 0, weight: 254 }, highlights: ['Immersive Audio', 'CustomTune', '24hr battery', 'Aware Mode'], badges: ['anc', 'premium'], isFeatured: false, sortOrder: 2 },
  { brand: 'Apple', model: 'AirPods Pro (2nd gen)', kind: 'audio', categorySlug: 'tws-earbuds', basePrice: 24900, mrp: 26900, specs: { driver_size: 11, anc: true, bluetooth_version: '5.3', battery_capacity: 6000, charging_speed: 0, weight: 5.3 }, highlights: ['H2 chip', 'Adaptive Transparency', 'Personalised Spatial Audio', 'USB-C case'], badges: ['bestseller', 'anc', 'apple'], isFeatured: true, sortOrder: 3 },
  { brand: 'Samsung', model: 'Galaxy Buds2 Pro', kind: 'audio', categorySlug: 'tws-earbuds', basePrice: 17999, mrp: 22999, specs: { driver_size: 10, anc: true, bluetooth_version: '5.3', battery_capacity: 5000, charging_speed: 0, weight: 5.5 }, highlights: ['24-bit Hi-Fi', 'Intelligent ANC', '360 Audio', 'Voice Detect'], badges: ['anc', 'samsung'], isFeatured: true, sortOrder: 4 },
  { brand: 'JBL', model: 'Tour One M2', kind: 'audio', categorySlug: 'headphones', basePrice: 19999, mrp: 24999, specs: { driver_size: 40, anc: true, bluetooth_version: '5.3', battery_capacity: 50000, charging_speed: 0, weight: 256 }, highlights: ['True Adaptive ANC', '50hr battery', 'JBL Spatial Sound', 'Personi-Fi 2.0'], badges: ['anc', 'battery'], isFeatured: false, sortOrder: 5 },
  { brand: 'boAt', model: 'Nirvana Ion', kind: 'audio', categorySlug: 'tws-earbuds', basePrice: 3999, mrp: 5999, specs: { driver_size: 13, anc: true, bluetooth_version: '5.3', battery_capacity: 3500, charging_speed: 0, weight: 4.8 }, highlights: ['Hybrid ANC', '32hr battery', 'Beast Mode', 'ENx Tech'], badges: ['value', 'anc', 'indian'], isFeatured: true, sortOrder: 6 },
];

const WEARABLES = [
  { brand: 'Apple', model: 'Apple Watch Series 9', kind: 'wearable', categorySlug: 'smartwatches', basePrice: 41900, mrp: 41900, imageUrl: '/products/apple-watch-s9.jpg', specs: { display_size: 1.9, display_type: 'LTPO OLED', refresh_rate: 60, processor: 'S9 SiP', ram: 1, storage: 64, battery_capacity: 1000, charging_speed: 0, weight: 41.5, health_sensors: 'Heart, ECG, Blood O₂, Temp', gps: true, water_resistance: 'WR50' }, highlights: ['S9 SiP', 'Double tap gesture', 'Brightness 2000 nits', 'watchOS 10'], badges: ['flagship', 'apple', 'health'], isFeatured: true, sortOrder: 1 },
  { brand: 'Samsung', model: 'Galaxy Watch 6 Classic', kind: 'wearable', categorySlug: 'smartwatches', basePrice: 36999, mrp: 42999, specs: { display_size: 1.5, display_type: 'Super AMOLED', refresh_rate: 60, processor: 'Exynos W930', ram: 2, storage: 16, battery_capacity: 425, charging_speed: 10, weight: 59, health_sensors: 'Heart, ECG, Blood O₂, BIA', gps: true, water_resistance: '5ATM + IP68' }, highlights: ['Rotating bezel', 'Wear OS 4', 'BioActive sensor', 'Sapphire crystal'], badges: ['flagship', 'rotating-bezel'], isFeatured: true, sortOrder: 2 },
  { brand: 'OnePlus', model: 'Watch 2', kind: 'wearable', categorySlug: 'smartwatches', basePrice: 24999, mrp: 29999, specs: { display_size: 1.43, display_type: 'AMOLED', refresh_rate: 60, processor: 'Snapdragon W5 Gen 1', ram: 2, storage: 32, battery_capacity: 500, charging_speed: 10, weight: 49, health_sensors: 'Heart, Blood O₂, Stress', gps: true, water_resistance: '5ATM' }, highlights: ['Dual-chip architecture', '100hr battery', 'Wear OS 4', 'Sapphire glass'], badges: ['battery', 'wearos'], isFeatured: false, sortOrder: 3 },
  { brand: 'Xiaomi', model: 'Watch S3', kind: 'wearable', categorySlug: 'smartwatches', basePrice: 18999, mrp: 22999, specs: { display_size: 1.43, display_type: 'AMOLED', refresh_rate: 60, processor: 'Snapdragon W5 Gen 1', ram: 2, storage: 32, battery_capacity: 486, charging_speed: 10, weight: 45, health_sensors: 'Heart, Blood O₂, Stress', gps: true, water_resistance: '5ATM' }, highlights: ['HyperOS', '15-day battery', 'Dual-band GPS', 'Stainless steel'], badges: ['value', 'battery'], isFeatured: true, sortOrder: 4 },
];

const ACCESSORIES = [
  { brand: 'Apple', model: 'MagSafe Charger', kind: 'accessory', categorySlug: 'chargers', basePrice: 3900, mrp: 4500, specs: { power_output: 15, ports: 'USB-C' }, highlights: ['15W MagSafe', 'Magnetic alignment', 'Qi compatible'], badges: ['apple', 'magsafe'], isFeatured: false, sortOrder: 1 },
  { brand: 'Anker', model: '737 Power Bank 24K', kind: 'accessory', categorySlug: 'power-banks', basePrice: 14999, mrp: 17999, specs: { capacity: 24000, power_output: 140, ports: '2x USB-C, 1x USB-A' }, highlights: ['140W total', 'Smart display', '24,000 mAh', 'Airline safe'], badges: ['bestseller', 'high-capacity'], isFeatured: true, sortOrder: 2 },
  { brand: 'Spigen', model: 'Ultra Hybrid (iPhone 15)', kind: 'accessory', categorySlug: 'cases-covers', basePrice: 1499, mrp: 1999, specs: { material: 'TPU + PC' }, highlights: ['Crystal clear', 'Air Cushion', 'Wireless charging compatible'], badges: ['popular', 'protection'], isFeatured: false, sortOrder: 3 },
  { brand: 'Belkin', model: 'BoostCharge Pro 3-in-1', kind: 'accessory', categorySlug: 'chargers', basePrice: 12999, mrp: 14999, specs: { power_output: 15, ports: 'MagSafe + Apple Watch + Qi' }, highlights: ['15W MagSafe', 'Apple Watch fast charge', 'Simultaneous charging'], badges: ['apple', 'multi-device'], isFeatured: false, sortOrder: 4 },
];

async function seedCatalog(): Promise<void> {
  log('Seeding brands...');
  for (const brand of BRANDS) {
    await prisma.brand.upsert({ where: { slug: brand.slug }, update: brand, create: brand });
  }
  log('Brands', BRANDS.length);

  log('Seeding categories...');
  const parentMap = new Map<string, string>();
  for (const cat of CATEGORIES) {
    const row = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, icon: cat.icon, sortOrder: cat.sortOrder, isActive: true },
      create: { name: cat.name, slug: cat.slug, icon: cat.icon, sortOrder: cat.sortOrder, isActive: true },
    });
    parentMap.set(cat.slug, row.id);
  }
  for (const sub of SUB_CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: sub.slug },
      update: { name: sub.name, parentId: parentMap.get(sub.parentSlug), sortOrder: sub.sortOrder, isActive: true },
      create: { name: sub.name, slug: sub.slug, parentId: parentMap.get(sub.parentSlug)!, sortOrder: sub.sortOrder, isActive: true },
    });
  }
  log('Categories', CATEGORIES.length + SUB_CATEGORIES.length);

  log('Seeding spec definitions...');
  for (const spec of SPEC_DEFINITIONS) {
    await prisma.specDefinition.upsert({
      where: { key: spec.key },
      update: { label: spec.label, unit: spec.unit, dataType: spec.dataType, groupName: spec.groupName, sortOrder: spec.sortOrder, isKeySpec: spec.isKeySpec, isFilterable: spec.isFilterable, isComparable: spec.isComparable, higherIsBetter: spec.higherIsBetter, scaleMax: spec.scaleMax },
      create: { key: spec.key, label: spec.label, unit: spec.unit, dataType: spec.dataType, groupName: spec.groupName, sortOrder: spec.sortOrder, isKeySpec: spec.isKeySpec, isFilterable: spec.isFilterable, isComparable: spec.isComparable, higherIsBetter: spec.higherIsBetter, scaleMax: spec.scaleMax },
    });
  }
  log('Spec definitions', SPEC_DEFINITIONS.length);

  log('Seeding protection plans...');
  for (const plan of PROTECTION_PLANS) {
    await prisma.protectionPlan.upsert({
      where: { id: plan.name },
      update: { tier: plan.tier, description: plan.description, durationMonths: plan.durationMonths, priceType: plan.priceType, priceValue: plan.priceValue, coverage: JSON.stringify(plan.coverage), appliesToKind: plan.appliesToKind, sortOrder: plan.sortOrder, isActive: true },
      create: { id: plan.name, name: plan.name, tier: plan.tier, description: plan.description, durationMonths: plan.durationMonths, priceType: plan.priceType, priceValue: plan.priceValue, coverage: JSON.stringify(plan.coverage), appliesToKind: plan.appliesToKind, sortOrder: plan.sortOrder, isActive: true },
    });
  }
  log('Protection plans', PROTECTION_PLANS.length);

  log('Seeding flash sales...');
  for (const sale of FLASH_SALES) {
    await prisma.flashSale.upsert({
      where: { slug: sale.name.toLowerCase().replace(/\s+/g, '-') },
      update: { startsAt: sale.startsAt, endsAt: sale.endsAt, isActive: sale.isActive },
      create: { name: sale.name, slug: sale.name.toLowerCase().replace(/\s+/g, '-'), startsAt: sale.startsAt, endsAt: sale.endsAt, isActive: sale.isActive },
    });
  }
  log('Flash sales', FLASH_SALES.length);

  log('Seeding EMI plans...');
  for (const plan of EMI_PLANS) {
    await prisma.emiPlan.upsert({
      where: { id: plan.id },
      update: { bankName: plan.bankName, bankCode: plan.bankCode, brandId: null, interestBps: plan.interestBps, isNoCost: plan.isNoCost, processingFeePaise: plan.processingFeePaise, minOrderPaise: plan.minOrderPaise, isActive: true, sortOrder: plan.sortOrder },
      create: { id: plan.id, bankName: plan.bankName, bankCode: plan.bankCode, brandId: null, tenureMonths: plan.tenureMonths, interestBps: plan.interestBps, isNoCost: plan.isNoCost, processingFeePaise: plan.processingFeePaise, minOrderPaise: plan.minOrderPaise, isActive: true, sortOrder: plan.sortOrder },
    });
  }
  log('EMI plans', EMI_PLANS.length);

  log('Seeding exchange devices...');
  for (const ex of EXCHANGE_DEVICES) {
    await prisma.exchangeDevice.upsert({
      where: { brandName_modelName: { brandName: ex.brand, modelName: ex.model } },
      update: { baseValuePaise: ex.baseValuePaise, launchYear: ex.launchYear, isActive: true },
      create: { brandName: ex.brand, modelName: ex.model, baseValuePaise: ex.baseValuePaise, launchYear: ex.launchYear, isActive: true },
    });
  }
  log('Exchange devices', EXCHANGE_DEVICES.length);

  log('Seeding coupons...');
  for (const coupon of COUPONS) {
    await prisma.coupon.upsert({
      where: { code: coupon.code },
      update: { description: coupon.description, discountType: coupon.discountType, value: coupon.value, minOrderPaise: coupon.minOrderPaise, maxDiscountPaise: coupon.maxDiscountPaise, perUserLimit: coupon.perUserLimit, startsAt: coupon.startsAt, endsAt: coupon.endsAt, isActive: coupon.isActive },
      create: { code: coupon.code, description: coupon.description, discountType: coupon.discountType, value: coupon.value, minOrderPaise: coupon.minOrderPaise, maxDiscountPaise: coupon.maxDiscountPaise, perUserLimit: coupon.perUserLimit, startsAt: coupon.startsAt, endsAt: coupon.endsAt, isActive: coupon.isActive },
    });
  }
  log('Coupons', COUPONS.length);

  // Fetch created IDs for FKs
  const [brandsMap, categoriesMap, specsMap, protectionPlansMap, flashSalesMap] = await Promise.all([
    prisma.brand.findMany({ select: { id: true, slug: true, name: true } }),
    prisma.category.findMany({ select: { id: true, slug: true } }),
    prisma.specDefinition.findMany({ select: { id: true, key: true } }),
    prisma.protectionPlan.findMany({ select: { id: true, name: true } }),
    prisma.flashSale.findMany({ select: { id: true, name: true } }),
  ]);
  const brandBySlug = new Map(brandsMap.map((b) => [b.slug, b.id]));
  const brandByName = new Map(brandsMap.map((b) => [b.name, b.id]));
  const catBySlug = new Map(categoriesMap.map((c) => [c.slug, c.id]));
  const specByKey = new Map(specsMap.map((s) => [s.key, s.id]));
  const protectionByName = new Map(protectionPlansMap.map((p) => [p.name, p.id]));
  const flashSaleByName = new Map(flashSalesMap.map((f) => [f.name, f.id]));

  const now = new Date();
  const warehouse = await prisma.warehouse.findFirstOrThrow({ where: { code: 'FC-BLR-01' }, select: { id: true } });

  // Helper to create product with variants and specs
  async function createProduct(data: (typeof PHONES)[0] | (typeof TABLETS)[0] | (typeof AUDIO)[0] | (typeof WEARABLES)[0] | (typeof ACCESSORIES)[0], idx: number) {
    const brandId = brandByName.get(data.brand);
    const categoryId = catBySlug.get(data.categorySlug);
    if (!brandId || !categoryId) return;

    const { colors: colorData, specs, variants } = buildVariantsAndSpecs(data, idx);

    const product = await prisma.product.create({
      data: {
        name: data.model,
        slug: `${data.brand.toLowerCase()}-${data.model.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
        tagline: data.highlights.slice(0, 2).join(' · '),
        kind: data.kind,
        status: 'active',
        brandId,
        categoryId,
        heroGradient: gradientFor(data.kind, idx),
        imageUrl: (data as any).imageUrl || null,
        badges: JSON.stringify(data.badges),
        highlights: JSON.stringify(data.highlights),
        mrpPaise: data.mrp * 100,
        pricePaise: data.basePrice * 100,
        warrantyMonths: data.kind === 'accessory' ? 6 : 12,
        gstRate: 18,
        hsnCode: data.kind === 'phone' ? '85171300' : data.kind === 'tablet' ? '84713010' : data.kind === 'audio' ? '85183000' : data.kind === 'wearable' ? '85176290' : '85044030',
        isFeatured: data.isFeatured,
        sortOrder: data.sortOrder,
        soldCount: int(rand, 50, 5000),
        ratingAvg: Math.round((4.0 + rand() * 1.0) * 10) / 10,
        reviewCount: int(rand, 10, 2000),
        variants: {
          create: variants.map((v) => ({
            sku: `VLT-${data.brand.toUpperCase().slice(0,3)}-${idx}-${v.colorName.toUpperCase().replace(/[^A-Z]/g,'')}-${v.ramGb ?? ''}${v.storageGb ?? ''}`.replace(/--/g, '-'),
            ramGb: v.ramGb,
            storageGb: v.storageGb,
            colorName: v.colorName,
            colorHex: v.colorHex,
            colorHex2: v.colorHex2,
            finish: v.finish,
            mrpPaise: v.mrpPaise,
            pricePaise: v.pricePaise,
            isDefault: v.isDefault,
            isActive: true,
            sortOrder: v.sortOrder,
            weightGrams: v.weightGrams,
          })),
        },
        specValues: {
          create: specs.map((s) => ({
            definitionId: specByKey.get(s.key)!,
            valueText: s.valueText,
            valueNumber: s.valueNumber,
            valueBool: s.valueBool,
          })),
        },
      },
    });

    // Link flash sale items
    const saleId = flashSaleByName.get('Monsoon Flagship Days');
    if (saleId && idx < 3) {
      const variant = await prisma.productVariant.findFirst({ where: { productId: product.id }, orderBy: { sortOrder: 'asc' } });
      if (variant) {
        await prisma.flashSaleItem.upsert({
          where: { flashSaleId_variantId: { flashSaleId: saleId, variantId: variant.id } },
          update: { salePricePaise: Math.round(variant.pricePaise * 0.9), quantityCap: 50 },
          create: { flashSaleId: saleId, variantId: variant.id, salePricePaise: Math.round(variant.pricePaise * 0.9), quantityCap: 50 },
        });
      }
    }

    // Stock
    for (const variant of variants) {
      const vRow = await prisma.productVariant.findFirst({ where: { productId: product.id, colorName: variant.colorName, ramGb: variant.ramGb, storageGb: variant.storageGb } });
      if (vRow) {
        await prisma.inventoryStock.upsert({
          where: { warehouseId_variantId: { warehouseId: warehouse.id, variantId: vRow.id } },
          create: { warehouseId: warehouse.id, variantId: vRow.id, quantity: int(rand, 10, 100) },
          update: { quantity: { increment: int(rand, 10, 100) } },
        });
      }
    }

    // Accessory links (phones -> cases, chargers, etc.)
    if (data.kind === 'phone') {
      const accessoryProducts = await prisma.product.findMany({ where: { kind: 'accessory', status: 'active' }, select: { id: true } });
      for (const acc of accessoryProducts.slice(0, 3)) {
        await prisma.accessoryLink.upsert({
          where: { productId_accessoryId: { productId: product.id, accessoryId: acc.id } },
          update: { bundleDiscountPct: int(rand, 5, 15), sortOrder: int(rand, 1, 10) },
          create: { productId: product.id, accessoryId: acc.id, bundleDiscountPct: int(rand, 5, 15), sortOrder: int(rand, 1, 10) },
        });
      }
    }
  }

  function buildVariantsAndSpecs(data: any, idx: number) {
    const isPhoneOrTablet = data.kind === 'phone' || data.kind === 'tablet';
    const storages = isPhoneOrTablet ? (data.specs.storage as number[]) : [data.specs.storage as number].filter(Boolean);
    const colors = ['Black', 'White', 'Blue', 'Green', 'Purple', 'Silver', 'Gold', 'Titanium', 'Graphite', 'Sierra Blue'];
    const ram = isPhoneOrTablet ? data.specs.ram as number : null;

    const variants: Array<{ ramGb: number | null; storageGb: number | null; colorName: string; colorHex: string; colorHex2: string | null; finish: string; mrpPaise: number; pricePaise: number; isDefault: boolean; sortOrder: number; weightGrams: number | null }> = [];
    const specs: Array<{ key: string; valueText: string | null; valueNumber: number | null; valueBool: boolean | null }> = [];

    // Map spec values
    for (const [key, value] of Object.entries(data.specs)) {
      if (key === 'storage' || key === 'ram') continue;
      const specDef = SPEC_DEFINITIONS.find((s) => s.key === key);
      if (!specDef) continue;
      if (typeof value === 'boolean') {
        specs.push({ key, valueText: null, valueNumber: null, valueBool: value });
      } else if (typeof value === 'number') {
        specs.push({ key, valueText: null, valueNumber: value, valueBool: null });
      } else {
        specs.push({ key, valueText: String(value), valueNumber: null, valueBool: null });
      }
    }

    // Create variants
    let variantIdx = 0;
    const validStorages = storages.filter((s): s is number => typeof s === 'number' && !isNaN(s));
    
    if (isPhoneOrTablet && validStorages.length > 0) {
      for (const storage of validStorages) {
        for (let c = 0; c < Math.min(4, colors.length); c++) {
          const colorName = colors[c];
          const color = colorHex(data.kind, c);
          const priceMultiplier = storage / Math.min(...validStorages);
          const mrpPaise = Math.round(data.mrp * 100 * priceMultiplier);
          const pricePaise = Math.round(data.basePrice * 100 * priceMultiplier);

          variants.push({
            ramGb: ram,
            storageGb: storage,
            colorName,
            colorHex: color.hex,
            colorHex2: color.hex2,
            finish: color.finish,
            mrpPaise,
            pricePaise,
            isDefault: variantIdx === 0,
            sortOrder: variantIdx,
            weightGrams: data.specs.weight ?? null,
          });
          variantIdx++;
        }
      }
    } else {
      for (let c = 0; c < Math.min(4, colors.length); c++) {
        const colorName = colors[c];
        const color = colorHex(data.kind, c);
        const mrpPaise = data.mrp * 100;
        const pricePaise = data.basePrice * 100;

        variants.push({
          ramGb: null,
          storageGb: validStorages[0] ?? null,
          colorName,
          colorHex: color.hex,
          colorHex2: color.hex2,
          finish: color.finish,
          mrpPaise,
          pricePaise,
          isDefault: variantIdx === 0,
          sortOrder: variantIdx,
          weightGrams: data.specs.weight ?? null,
        });
        variantIdx++;
      }
    }

    return { colors: colors.slice(0, Math.min(4, colors.length)).map((n, i) => ({ name: n, ...colorHex(data.kind, i) })), specs, variants };
  }

  // Create all products
  let productIdx = 0;
  for (const phone of PHONES) {
    await createProduct(phone, productIdx++);
  }
  for (const tablet of TABLETS) {
    await createProduct(tablet, productIdx++);
  }
  for (const audio of AUDIO) {
    await createProduct(audio, productIdx++);
  }
  for (const wearable of WEARABLES) {
    await createProduct(wearable, productIdx++);
  }
  for (const accessory of ACCESSORIES) {
    await createProduct(accessory, productIdx++);
  }
  log('Products + variants + specs + stock', productIdx);

  log('Seeding service centres...');
  const SERVICE_CENTRES = [
    { name: 'VOLTAGE Service Centre - Bengaluru Central', code: 'SC-BLR-01', addressLine: 'No. 45, M.G. Road', city: 'Bengaluru', state: 'Karnataka', pincode: '560001', latitude: 12.9716, longitude: 77.5946, phone: '080-45678901', email: 'blr-central@voltage.store', openHours: '09:30–19:00, Mon–Sat', isActive: true },
    { name: 'VOLTAGE Service Centre - Bengaluru Whitefield', code: 'SC-BLR-02', addressLine: 'Plot 12, ITPL Main Road', city: 'Bengaluru', state: 'Karnataka', pincode: '560066', latitude: 12.9698, longitude: 77.7500, phone: '080-45678902', email: 'blr-whitefield@voltage.store', openHours: '09:30–19:00, Mon–Sat', isActive: true },
    { name: 'VOLTAGE Service Centre - Delhi Connaught Place', code: 'SC-DEL-01', addressLine: 'Block A, Connaught Place', city: 'New Delhi', state: 'Delhi', pincode: '110001', latitude: 28.6315, longitude: 77.2167, phone: '011-45678901', email: 'del-cp@voltage.store', openHours: '09:30–19:00, Mon–Sat', isActive: true },
    { name: 'VOLTAGE Service Centre - Mumbai BKC', code: 'SC-MUM-01', addressLine: 'Unit 101, Bandra Kurla Complex', city: 'Mumbai', state: 'Maharashtra', pincode: '400051', latitude: 19.0596, longitude: 72.8656, phone: '022-45678901', email: 'mum-bkc@voltage.store', openHours: '09:30–19:00, Mon–Sat', isActive: true },
    { name: 'VOLTAGE Service Centre - Hyderabad HITEC City', code: 'SC-HYD-01', addressLine: 'Cyber Towers, HITEC City', city: 'Hyderabad', state: 'Telangana', pincode: '500081', latitude: 17.4475, longitude: 78.3763, phone: '040-45678901', email: 'hyd-hitec@voltage.store', openHours: '09:30–19:00, Mon–Sat', isActive: true },
    { name: 'VOLTAGE Service Centre - Chennai Anna Nagar', code: 'SC-CHN-01', addressLine: '2nd Avenue, Anna Nagar', city: 'Chennai', state: 'Tamil Nadu', pincode: '600040', latitude: 13.0850, longitude: 80.2101, phone: '044-45678901', email: 'chn-annanagar@voltage.store', openHours: '09:30–19:00, Mon–Sat', isActive: true },
    { name: 'VOLTAGE Service Centre - Kolkata Salt Lake', code: 'SC-KOL-01', addressLine: 'Sector V, Salt Lake City', city: 'Kolkata', state: 'West Bengal', pincode: '700091', latitude: 22.5726, longitude: 88.3639, phone: '033-45678901', email: 'kol-saltlake@voltage.store', openHours: '09:30–19:00, Mon–Sat', isActive: true },
    { name: 'VOLTAGE Service Centre - Pune Baner', code: 'SC-PNE-01', addressLine: 'Baner Road, Baner', city: 'Pune', state: 'Maharashtra', pincode: '411045', latitude: 18.5593, longitude: 73.7875, phone: '020-45678901', email: 'pune-baner@voltage.store', openHours: '09:30–19:00, Mon–Sat', isActive: true },
    { name: 'VOLTAGE Service Centre - Ahmedabad SG Highway', code: 'SC-AMD-01', addressLine: 'SG Highway, Thaltej', city: 'Ahmedabad', state: 'Gujarat', pincode: '380054', latitude: 23.0225, longitude: 72.5714, phone: '079-45678901', email: 'amd-sghighway@voltage.store', openHours: '09:30–19:00, Mon–Sat', isActive: true },
    { name: 'VOLTAGE Service Centre - Jaipur Malviya Nagar', code: 'SC-JPR-01', addressLine: 'Malviya Nagar Industrial Area', city: 'Jaipur', state: 'Rajasthan', pincode: '302017', latitude: 26.8509, longitude: 75.8030, phone: '0141-45678901', email: 'jpr-malviya@voltage.store', openHours: '09:30–19:00, Mon–Sat', isActive: true },
  ];
  for (const sc of SERVICE_CENTRES) {
    const centre = await prisma.serviceCenter.upsert({
      where: { code: sc.code },
      update: sc,
      create: sc,
    });
    // Link brands
    for (const brand of brandsMap) {
      await prisma.serviceCenterBrand.upsert({
        where: { serviceCenterId_brandId: { serviceCenterId: centre.id, brandId: brand.id } },
        update: {},
        create: { serviceCenterId: centre.id, brandId: brand.id },
      });
    }
  }
  log('Service centres', SERVICE_CENTRES.length);
}

export { seedCatalog };