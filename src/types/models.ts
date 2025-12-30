import { parseAttributes } from "../utils";

// 📦 Product / Inventory Item
// 📦 Product / Inventory Item
export interface IProduct {
  id: string;
  name: string;
  category: string;
  description?: string;

  barcode?: string;

  // NEW — product inventory type
  type: "simple" | "measured" | "variant";

  // For measured products only (kg, g, L, ml …)
  baseUnit?: string;

  // NEW Fields
  sku?: string;
  minStockLevel?: number;
  supplierId?: string;
  notes?: string;
  status?: string; // "active" | "archived"
  imageUrl?: string;

  createdAt: string;
  updatedAt: string;
}

// Variant
export interface IVariant {
  id: string;
  productId: string;

  sku?: string;

  // Flexible dynamic attributes — size, color, material, etc.
  attributes: Record<string, string> | string;

  // RENAMED fields
  cost: number;  // was costPrice
  price: number; // was sellingPrice

  // NEW fields
  stock?: number;
  lowStock?: number;

  product?: IProduct;

  createdAt: string;
  updatedAt: string;
}

// 👤 Customer
export interface ICustomer {
  id: string;
  name: string;

  phone?: string;
  email?: string;

  address?: string;
  notes?: string;

  // Optional useful business fields
  gstNumber?: string;
  outstandingBalance?: number; // if you allow credit sales

  createdAt: string;
  updatedAt: string;
}

// Stock
export interface IStock {
  id: string;
  variantId: string;
  variant: Variant;

  // For simple = units  
  // For measured = weight/volume  
  // For variants = units per variant
  quantity: number;
  unit: string;
  batchCode: string;
  metadata: string;
  location: string;

  updatedAt: string;
}

// Stock
export interface IStockMovements {
  id: string;
  variantId: string;

  product: Product;
  variant: Variant;

  change: number;
  unit: string;

  type: "sale" | "purchase" | "other";
  refId: string;

  createdAt: string;
}

// 🧾 Order
export interface IOrder {
  id: string;

  customerId?: string;
  totalAmount: number;
  paymentMethod?: "cash" | "card" | "upi" | "cheque" | "other" | "none" | "bank";

  date: string;
  notes: string;
  createdAt: string;

}

// 🧾 Sale Transaction
export interface ISale {
  id: string;

  orderId: string;
  variantId: string;

  quantity: number;       // units or weight
  unit: string;
  sellingPrice: number;   // final applied price
  total: number;

  date: string;

  customerId?: string;
  customer?: ICustomer;
  paymentMethod?: "cash" | "card" | "upi" | "cheque" | "other" | "none" | "bank";
}

// 📥 Purchase / Stock-In
export interface IPurchase {
  id: string;

  productId: string;
  variantId?: string | null;

  quantity: number;   // units or weight
  costPrice: number;
  total: number;

  date: string;
  supplierId?: string;
  invoiceNumber?: string;
}

// 🏢 Supplier
export interface ISupplier {
  id: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// 📊 Reports (generic summary structure)
export interface IReportSummary {
  totalProducts: number;
  totalStockValue: number;
  totalSales: number;
  totalPurchases: number;
  topSellingProducts: IProduct[];
  lowStockItems: IProduct[];
}

// ⚙️ Settings - now dynamic key-value
export interface ISettingItem {
  key: string;
  value: string;
  updatedAt: string;
}

export interface ISettings {
  shopName: string;
  currency: string;
  lowStockGlobalThreshold: number;
  googleSheetId: string;
  theme?: "light" | "dark";
  offlineMode?: boolean;
  // Dynamic index signature for other settings
  [key: string]: string | number | boolean | undefined;
}

// 📝 Base class utilities (Optional)
export class Product implements IProduct {
  id: string;
  name: string;
  category: string;
  description?: string;
  barcode?: string;
  type: "simple" | "measured" | "variant";
  baseUnit?: string;

  sku?: string;
  minStockLevel?: number;
  supplierId?: string;
  notes?: string;
  status?: string;
  imageUrl?: string;

  createdAt: string;
  updatedAt: string;

  constructor(data: IProduct) {
    this.id = data.id;
    this.name = data.name;
    this.category = data.category;
    this.description = data.description;
    this.barcode = data.barcode;
    this.type = data.type;
    this.baseUnit = data.baseUnit;

    this.sku = data.sku;
    this.minStockLevel = data.minStockLevel ? Number(data.minStockLevel) : undefined;
    this.supplierId = data.supplierId;
    this.notes = data.notes;
    this.status = data.status || "active";
    this.imageUrl = data.imageUrl;

    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }
}

export class Variant implements IVariant {
  id: string;
  productId: string;
  sku?: string;
  attributes: Record<string, string> | string;
  cost: number;
  price: number;
  stock?: number;
  lowStock?: number;
  product?: IProduct | undefined;
  createdAt: string;
  updatedAt: string;

  constructor(data: IVariant) {
    this.id = data.id;
    this.productId = data.productId;
    this.sku = data.sku;

    // Check if attributes is string and parse it, otherwise keep as object
    if (typeof data.attributes === 'string') {
      this.attributes = parseAttributes(data.attributes);
    } else {
      this.attributes = data.attributes || {};
    }

    if (data.product) this.product = new Product(data.product);
    this.cost = data.cost ? Number(data.cost) : 0;
    this.price = data.price ? Number(data.price) : 0;
    this.stock = data.stock ? Number(data.stock) : 0;
    this.lowStock = data.lowStock ? Number(data.lowStock) : 0;

    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  get baseProfitMargin(): number {
    return this.price - this.cost;
  }
}

export class Supplier implements ISupplier {
  id: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;

  constructor(data: ISupplier) {
    this.id = data.id;
    this.name = data.name;
    this.contactPerson = data.contactPerson;
    this.phone = data.phone;
    this.email = data.email;
    this.address = data.address;
    this.notes = data.notes;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }
}

export class Customer implements ICustomer {
  id: string;
  name: string;
  phone?: string | undefined;
  email?: string | undefined;
  address?: string | undefined;
  notes?: string | undefined;
  gstNumber?: string | undefined;
  outstandingBalance: number;
  createdAt: string;
  updatedAt: string;

  constructor(data: ICustomer) {
    this.id = data.id;
    this.name = data.name;

    this.phone = data.phone;
    this.email = data.email;
    this.address = data.address;
    this.notes = data.notes;

    this.gstNumber = data.gstNumber;
    this.outstandingBalance = data.outstandingBalance || 0;

    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }
}

export class Stock implements IStock {
  id: string;
  variantId: string;
  variant: Variant;
  quantity: number;
  unit: string;
  batchCode: string;
  metadata: string;
  location: string;
  updatedAt: string;


  constructor(data: IStock) {
    this.id = data.id;
    this.variantId = data.variantId;
    this.variant = new Variant(data.variant);
    this.quantity = data.quantity;
    this.unit = data.unit;
    this.batchCode = data.batchCode;
    this.metadata = data.metadata;
    this.location = data.location;
    this.updatedAt = data.updatedAt;
  }
}

export class StockMovements implements IStockMovements {
  id: string;

  variantId: string;
  product: Product;
  variant: Variant;

  change: number;
  unit: string;

  type: "sale" | "purchase" | "other";
  refId: string;

  createdAt: string;

  constructor(data: IStockMovements) {
    this.id = data.id;
    this.variantId = data.variantId;
    this.product = new Product(data.product);
    this.variant = new Variant(data.variant);
    this.change = data.change;
    this.unit = data.unit;
    this.type = data.type;
    this.refId = data.refId;
    this.createdAt = data.createdAt;
  }
}