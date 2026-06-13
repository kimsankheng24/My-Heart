
export enum Currency {
  USD = 'USD',
  KHR = 'KHR',
  THB = 'THB'
}

export enum TransactionType {
  INCOME = 'Income',
  EXPENSE = 'Expense'
}

export enum AccountType {
  BANK = 'Bank',
  CASH = 'Cash',
  WALLET = 'Wallet'
}

export enum AccountStatus {
  ACTIVE = 'Active',
  DEFAULT = 'Default',
  INACTIVE = 'Inactive'
}

export enum GoalStatus {
  ACTIVE = 'Active',
  PAUSED = 'Paused',
  COMPLETED = 'Completed',
  CANCELLED = 'Cancelled'
}

export enum GoalPriority {
  HIGH = 'High',
  MEDIUM = 'Medium',
  LOW = 'Low'
}

export enum DepreciationMethod {
  NONE = 'None',
  STRAIGHT_LINE = 'Straight Line',
  DECLINING_BALANCE = 'Declining Balance'
}

// Added AssetType enum per Section 10.5.2
export enum AssetType {
  FIXED_ASSETS = 'Fixed Assets',
  CURRENT_ASSETS = 'Current Assets'
}

// Added LiabilityType enum per Section 10.6.2
export enum LiabilityType {
  CURRENT_LIABILITIES = 'Current Liabilities',
  NON_CURRENT_LIABILITIES = 'Non-Current Liabilities'
}

export interface ValuationHistoryEntry {
  id: string;
  date: string;
  value: number;
  note?: string;
}

export interface BalanceHistoryEntry {
  id: string;
  date: string;
  balance: number;
  note?: string;
}

export interface GoalProgressEntry {
  id: string;
  date: string;
  addedAmount: number;
  newCurrentAmount: number;
  note?: string;
}

export enum UserStatus {
  ACTIVE = 'Active',
  DENIED = 'Denied',
  LOCKED = 'Locked'
}

export interface User {
  id: string; // User ID (Login Name)
  name: string;
  password: string; // In a real app, this would be a hash
  role: string; // Changed from enum to string to support dynamic roles
  status: UserStatus;
  failedLoginAttempts: number;
  lockoutUntil?: string; // ISO string
  lastLogin?: string; // ISO string
  phone?: string;
  address?: string;
  createdBy?: string;
  createdDate?: string;
}

export type AppModuleName = 
  | 'Transactions' 
  | 'Accounts' 
  | 'Budgets' 
  | 'Goals' 
  | 'Assets' 
  | 'Reports' 
  | 'Analytics' 
  | 'Settings';

export type PermissionAction = 'view' | 'add' | 'edit' | 'delete';

export interface ModulePermissions {
  view: boolean;
  add: boolean;
  edit: boolean;
  delete: boolean;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  // Matrix of module -> actions
  permissions: Record<string, ModulePermissions>;
}

export interface ChartOfAccount {
  id: string;
  code: string;
  name: string;
  localName: string;
  type: string;
  description?: string;
  isSubOf?: string; // Parent ID
}

export interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
  currency: Currency | string;
  note?: string;
  status?: AccountStatus;
  owner?: string;
}

export interface Transaction {
  id: string;
  date: string; // ISO string
  type: TransactionType;
  category: string;
  accountId: string;
  amount: number;
  currency: Currency | string;
  note?: string;
  defaultAmount?: number; // Converted to system default currency
  goalId?: string; // Optional link to a goal
  createdBy?: string;
  isInternalTransfer?: boolean; // Flag to exclude from reports
}

export interface Budget {
  id: string;
  category: string;
  amount: number;
  currency: Currency | string;
  month: string; // MM/YYYY
  spent: number;
  status: 'Active' | 'Paused' | 'Completed' | 'Exceeded';
  rollover: boolean;
  alertThreshold?: number; // Percentage, default 90
}

export interface BudgetTemplate {
  id: string;
  name: string;
  category: string;
  amount: number;
  currency: Currency | string;
  rollover: boolean;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  currency: Currency | string;
  startDate: string;
  endDate: string;
  status: GoalStatus;
  priority: GoalPriority;
  note?: string;
  progressHistory?: GoalProgressEntry[];
}

export interface Attachment {
  id: string;
  name: string;
  url: string; // Data URL or reference
  type: string; // MIME type or extension
  size: number;
}

export interface Asset {
  id: string;
  glCode: string;
  name: string;
  localName?: string;
  // Added type field to Asset interface
  type: AssetType;
  purchaseDate: string;
  cost: number;
  currentValue: number;
  currency: Currency | string;
  status: 'Active' | 'Sold' | 'Dispose';
  note?: string;
  valuationHistory: ValuationHistoryEntry[];
  depreciationMethod: DepreciationMethod;
  documents?: Attachment[];
  saleDate?: string;
  salePrice?: number;
}

export interface Liability {
  id: string;
  glCode: string;
  name: string;
  localName?: string;
  // Added type field to Liability interface
  type: LiabilityType;
  amount: number; // original amount
  remaining: number; // current balance
  interestRate: number;
  monthlyPayment?: number;
  currency: Currency | string;
  startDate: string;
  endDate?: string;
  status: 'Active' | 'Cleared' | 'Paid Off';
  note?: string;
  balanceHistory: BalanceHistoryEntry[];
  documents?: Attachment[];
  payoffDate?: string;
}

export interface ExchangeRateRecord {
  id: string;
  date: string;
  currency: string;
  previousRate: number; // The rate before this change
  rate: number; // Rate relative to Default Currency
  defaultCurrency: Currency;
  source: 'market' | 'manual';
}

export interface AppSettings {
  profileName: string;
  profilePhoto?: string;
  defaultCurrency: Currency;
  exchangeRates: Record<string, number>; // Base is USD. e.g. { "KHR": 4100, "THB": 35 }
  activeCurrencies: (Currency | string)[];
  language: 'en' | 'km';
  theme: 'light' | 'dark' | 'system';
  dateFormat: string;
  timezone: string;
  autoSyncRates: boolean;
  lastRatesSync?: string;
}
