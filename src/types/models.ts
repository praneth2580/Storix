import { parseAttributes } from "../utils";

// 📦 Product / Inventory Item
export interface IProduct {
  id: string;
  name: string;
  category: string;
  description?: string;

  barcode?: string;
  hasVariants: boolean,

  // NEW — product inventory type
  type: "simple" | "measured" | "variant";

  // For measured products only (kg, g, L, ml …)
  baseUnit?: string;

  // Default prices (variant can override)
  defaultCostPrice: number;
  defaultSellingPrice: number;

  createdAt: string;
  updatedAt: string;
}

// Variant
export interface IVariant {
  id: string;
  productId: string;

  sku?: string;

  // Flexible dynamic attributes — size, color, material, etc.
  attributes: Record<string, string>;

  // Per-variant pricing (optional)
  costPrice?: number;
  sellingPrice?: number;

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

// ⚙️ Settings
export interface ISettings {
  shopName: string;
  currency: string;
  lowStockGlobalThreshold: number;
  googleSheetId: string;
  theme?: "light" | "dark";
  offlineMode?: boolean;
  updatedAt: string;
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
  hasVariants: boolean;

  defaultCostPrice: number;
  defaultSellingPrice: number;

  createdAt: string;
  updatedAt: string;

  constructor(data: IProduct) {
    this.id = data.id;
    this.name = data.name;
    this.category = data.category;
    this.description = data.description;
    this.barcode = data.barcode;
    this.hasVariants = data.hasVariants;
    this.type = data.type;
    this.baseUnit = data.baseUnit;
    this.defaultCostPrice = data.defaultCostPrice;
    this.defaultSellingPrice = data.defaultSellingPrice;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  get baseProfitMargin(): number {
    return this.defaultSellingPrice - this.defaultCostPrice;
  }
}

export class Variant implements IVariant {
  id: string;
  productId: string;
  sku?: string;
  // Flexible dynamic attributes — size, color, material, etc.
  attributes: Record<string, string>;
  // Per-variant pricing (optional)
  costPrice: number;
  sellingPrice: number;
  product?: IProduct | undefined;
  createdAt: string;
  updatedAt: string;

  constructor(data: IVariant) {
    this.id = data.id;
    this.productId = data.productId;
    this.sku = data.sku;
    this.attributes = parseAttributes(String(data.attributes));
    if (data.product) this.product = new Product(data.product);
    this.costPrice = data.costPrice || 0;
    this.sellingPrice = data.sellingPrice || 0;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  get baseProfitMargin(): number {
    return this.sellingPrice - this.costPrice;
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