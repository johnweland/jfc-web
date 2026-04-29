export type OrderStatus = "processing" | "shipped" | "delivered" | "cancelled";

export interface FflDealerInfo {
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  licenseNumber: string;
}

export interface OrderLineItem {
  slug: string;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  category: "firearm" | "part" | "apparel";
  requiresFFL: boolean;
  /** Firearm detail fields */
  caliber?: string;
  barrelLength?: string;
  weight?: string;
  /** Apparel variant fields */
  size?: string;
  color?: string;
}

export interface LogisticsEvent {
  label: string;
  date: string;       // ISO date string, or "" if not yet reached
  completed: boolean;
}

export interface Order {
  id: string;
  status: OrderStatus;
  placedAt: string;   // ISO date string
  items: OrderLineItem[];
  subtotal: number;
  shippingCost: number;
  transferFees: number;
  taxAmount: number;
  total: number;
  paymentMethod: { brand: string; last4: string };
  logistics: LogisticsEvent[];
  fflDealer?: FflDealerInfo;
}

// ─── Mock Orders (most recent first) ─────────────────────────────────────────

export const orders: Order[] = [
  {
    id: "JF-99283-RECON",
    status: "shipped",
    placedAt: "2026-03-15T08:42:00Z",
    items: [
      {
        slug: "jfc-15-mod-1",
        name: "JFC-15 MOD 1",
        sku: "JFC-15-M1-001",
        price: 1299.99,
        quantity: 1,
        category: "firearm",
        requiresFFL: true,
        caliber: "5.56 NATO",
        barrelLength: '16"',
        weight: "6.2 LBS",
      },
      {
        slug: "mlok-handguard-15",
        name: "M-LOK Handguard 15\"",
        sku: "PRT-HG-MLOK-15",
        price: 149.99,
        quantity: 1,
        category: "part",
        requiresFFL: false,
      },
    ],
    subtotal: 1449.98,
    shippingCost: 18.00,
    transferFees: 35.00,
    taxAmount: 0.00,
    total: 1502.98,
    paymentMethod: { brand: "Visa", last4: "4242" },
    fflDealer: {
      name: "Twin Cities Armory",
      address: "1250 Gun Club Rd, Suite A",
      city: "Plymouth",
      state: "MN",
      zip: "55441",
      licenseNumber: "07-23-XXX-01-7B-12345",
    },
    logistics: [
      { label: "Order Placed",  date: "2026-03-15", completed: true },
      { label: "FFL Verified",  date: "2026-03-15", completed: true },
      { label: "Processing",    date: "2026-03-16", completed: true },
      { label: "Shipped",       date: "2026-03-18", completed: true },
    ],
  },
  {
    id: "JF-84491-DELTA",
    status: "processing",
    placedAt: "2026-03-22T11:05:00Z",
    items: [
      {
        slug: "sentinel-9-elite",
        name: "SENTINEL-9 ELITE",
        sku: "SEN-9-EL-001",
        price: 849.99,
        quantity: 1,
        category: "firearm",
        requiresFFL: true,
        caliber: "9mm Parabellum",
        barrelLength: '4.5"',
        weight: "2.8 LBS",
      },
      {
        slug: "operator-cap",
        name: "OPERATOR LOW-PRO CAP",
        sku: "APP-CAP-001",
        price: 34.99,
        quantity: 1,
        category: "apparel",
        requiresFFL: false,
        size: "ADJ",
        color: "Ranger Green",
      },
    ],
    subtotal: 884.98,
    shippingCost: 12.00,
    transferFees: 35.00,
    taxAmount: 0.00,
    total: 931.98,
    paymentMethod: { brand: "Visa", last4: "9871" },
    fflDealer: {
      name: "Apex Tactical Solutions",
      address: "1204 Industrial Way, Suite B",
      city: "Austin",
      state: "TX",
      zip: "78744",
      licenseNumber: "5-74-XXX-XX-XX-04921",
    },
    logistics: [
      { label: "Order Placed",  date: "2026-03-22", completed: true },
      { label: "FFL Verified",  date: "",           completed: false },
      { label: "Processing",    date: "",           completed: false },
      { label: "Shipped",       date: "",           completed: false },
    ],
  },
  {
    id: "JF-77012-BRAVO",
    status: "delivered",
    placedAt: "2026-02-14T09:30:00Z",
    items: [
      {
        slug: "range-hoodie",
        name: "RANGE HOODIE",
        sku: "APP-HOOD-001",
        price: 74.99,
        quantity: 2,
        category: "apparel",
        requiresFFL: false,
        size: "L",
        color: "OD Green",
      },
      {
        slug: "jfc-logo-tee",
        name: "JFC LOGO TEE",
        sku: "APP-TEE-001",
        price: 32.99,
        quantity: 1,
        category: "apparel",
        requiresFFL: false,
        size: "L",
        color: "Charcoal",
      },
    ],
    subtotal: 182.97,
    shippingCost: 8.00,
    transferFees: 0.00,
    taxAmount: 14.64,
    total: 205.61,
    paymentMethod: { brand: "Mastercard", last4: "5510" },
    logistics: [
      { label: "Order Placed",  date: "2026-02-14", completed: true },
      { label: "FFL Verified",  date: "2026-02-14", completed: true },
      { label: "Processing",    date: "2026-02-15", completed: true },
      { label: "Shipped",       date: "2026-02-17", completed: true },
    ],
  },
  {
    id: "JF-61205-ALPHA",
    status: "delivered",
    placedAt: "2026-01-09T14:20:00Z",
    items: [
      {
        slug: "titanium-bcg",
        name: "TITANIUM BCG",
        sku: "PRT-BCG-TI-001",
        price: 189.99,
        quantity: 1,
        category: "part",
        requiresFFL: false,
      },
      {
        slug: "adjustable-gas-block",
        name: "ADJUSTABLE GAS BLOCK",
        sku: "PRT-GB-ADJ-001",
        price: 74.99,
        quantity: 1,
        category: "part",
        requiresFFL: false,
      },
    ],
    subtotal: 264.98,
    shippingCost: 9.00,
    transferFees: 0.00,
    taxAmount: 0.00,
    total: 273.98,
    paymentMethod: { brand: "Amex", last4: "0005" },
    logistics: [
      { label: "Order Placed",  date: "2026-01-09", completed: true },
      { label: "FFL Verified",  date: "2026-01-09", completed: true },
      { label: "Processing",    date: "2026-01-10", completed: true },
      { label: "Shipped",       date: "2026-01-11", completed: true },
    ],
  },
];

export function getOrderById(id: string): Order | undefined {
  return orders.find((o) => o.id === id);
}
