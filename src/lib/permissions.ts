import type { Role } from "@prisma/client";

export const MODULES = [
  "dashboard",
  "users",
  "customers",
  "products",
  "pricing",
  "poultry",
  "plots",
  "quotations",
  "bookings",
  "sales",
  "invoices",
  "payments",
  "credit",
  "inventory",
  "purchases",
  "expenses",
  "cash",
  "reports",
  "audit-logs",
  "settings",
] as const;

export type ModuleKey = (typeof MODULES)[number];

/** Modules visible (at least read) to each role — drives sidebar + route gating. */
const READ: Record<Role, ModuleKey[]> = {
  ADMIN: [...MODULES],
  MANAGER: [
    "dashboard", "customers", "products", "pricing", "poultry", "plots", "quotations",
    "bookings", "sales", "invoices", "payments", "credit", "inventory", "purchases",
    "expenses", "cash", "reports", "audit-logs", "settings",
  ],
  SALES: ["dashboard", "customers", "products", "quotations", "bookings", "sales", "invoices", "credit"],
  CASHIER: ["dashboard", "payments", "invoices", "credit", "cash", "customers"],
  ACCOUNTANT: ["dashboard", "payments", "expenses", "credit", "cash", "reports", "invoices", "customers", "purchases"],
  PRODUCTION: ["dashboard", "poultry", "plots", "inventory"],
  POULTRY: ["dashboard", "poultry"],
  STOREKEEPER: ["dashboard", "inventory", "products", "purchases"],
  PROCUREMENT: ["dashboard", "inventory", "products", "purchases"],
  DELIVERY: ["dashboard", "bookings", "invoices"],
  MANAGEMENT: ["dashboard", "reports", "sales", "invoices", "inventory", "customers"],
};

/** Modules each role can create/update in (subset of READ). Anything not listed is read-only for that role. */
const WRITE: Record<Role, ModuleKey[]> = {
  ADMIN: [...MODULES],
  MANAGER: [
    "customers", "products", "pricing", "poultry", "plots", "quotations", "bookings",
    "sales", "invoices", "payments", "credit", "inventory", "purchases", "expenses", "cash",
  ],
  SALES: ["customers", "quotations", "bookings", "sales", "invoices"],
  CASHIER: ["payments", "cash"],
  ACCOUNTANT: ["payments", "expenses", "cash", "credit"],
  PRODUCTION: ["poultry", "plots", "inventory"],
  POULTRY: ["poultry"],
  STOREKEEPER: ["inventory", "purchases"],
  PROCUREMENT: ["inventory", "purchases"],
  DELIVERY: ["bookings"],
  MANAGEMENT: [],
};

export function canRead(role: Role, module: ModuleKey): boolean {
  return READ[role]?.includes(module) ?? false;
}

export function canWrite(role: Role, module: ModuleKey): boolean {
  return WRITE[role]?.includes(module) ?? false;
}

export function visibleModules(role: Role): ModuleKey[] {
  return READ[role] ?? [];
}

// ---- Fine-grained business rules beyond simple module CRUD ----

export function canOverridePrice(role: Role): boolean {
  return role === "ADMIN" || role === "MANAGER";
}

export function canApproveExpense(role: Role): boolean {
  return role === "ADMIN" || role === "MANAGER";
}

export function canApproveStockAdjustment(role: Role): boolean {
  return role === "ADMIN" || role === "MANAGER";
}

export function canApprovePriceChange(role: Role): boolean {
  return role === "ADMIN" || role === "MANAGER";
}

export function canReverseCashVariance(role: Role): boolean {
  return role === "ADMIN" || role === "MANAGER";
}

export function canReversePayment(role: Role): boolean {
  return role === "ADMIN" || role === "MANAGER" || role === "ACCOUNTANT";
}

export function canCancelInvoice(role: Role): boolean {
  return role === "ADMIN" || role === "MANAGER";
}

export function canApproveCreditSale(role: Role): boolean {
  return role === "ADMIN" || role === "MANAGER";
}

export function canManageUsers(role: Role): boolean {
  return role === "ADMIN";
}

export const MODULE_LABELS: Record<ModuleKey, string> = {
  dashboard: "Dashboard",
  users: "Users & Roles",
  customers: "Customers",
  products: "Products",
  pricing: "Pricing",
  poultry: "Poultry",
  plots: "Plots & Crop Rotation",
  quotations: "Quotations",
  bookings: "Bookings",
  sales: "Sales / POS",
  invoices: "Invoices",
  payments: "Payments",
  credit: "Credit & Statements",
  inventory: "Inventory",
  purchases: "Purchases",
  expenses: "Expenses",
  cash: "Cash Management",
  reports: "Reports",
  "audit-logs": "Audit Logs",
  settings: "Settings",
};
