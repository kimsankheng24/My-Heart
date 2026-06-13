-- My Heart Database Schema for Cloudflare D1 (SQLite)

-- Roles and Permissions Table
CREATE TABLE IF NOT EXISTS roles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    permissions TEXT NOT NULL -- JSON stringified Record<string, ModulePermissions>
);

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY, -- User ID / Login Name
    name TEXT NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL REFERENCES roles(name) ON UPDATE CASCADE,
    status TEXT NOT NULL, -- UserStatus
    failedLoginAttempts INTEGER DEFAULT 0,
    lockoutUntil TEXT, -- ISO string
    lastLogin TEXT, -- ISO string
    phone TEXT,
    address TEXT,
    createdBy TEXT,
    createdDate TEXT
);

-- Settings Table (restricted to a single row)
CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    profileName TEXT NOT NULL DEFAULT 'User',
    profilePhoto TEXT,
    defaultCurrency TEXT NOT NULL DEFAULT 'USD',
    exchangeRates TEXT NOT NULL DEFAULT '{}', -- JSON string of Currency Rates
    activeCurrencies TEXT NOT NULL DEFAULT '[]', -- JSON string array of active currencies
    language TEXT NOT NULL DEFAULT 'km',
    theme TEXT NOT NULL DEFAULT 'system',
    dateFormat TEXT NOT NULL DEFAULT 'dd/MM/yyyy',
    timezone TEXT NOT NULL DEFAULT 'Asia/Phnom_Penh',
    autoSyncRates INTEGER DEFAULT 0, -- 0 or 1
    lastRatesSync TEXT
);

-- Accounts Table
CREATE TABLE IF NOT EXISTS accounts (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    balance REAL NOT NULL DEFAULT 0.0,
    currency TEXT NOT NULL,
    note TEXT,
    status TEXT DEFAULT 'Active',
    owner TEXT
);

-- Chart of Accounts Table
CREATE TABLE IF NOT EXISTS chart_of_accounts (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    localName TEXT NOT NULL,
    type TEXT NOT NULL,
    description TEXT,
    isSubOf TEXT REFERENCES chart_of_accounts(id) ON DELETE CASCADE
);

-- Goals Table
CREATE TABLE IF NOT EXISTS goals (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    targetAmount REAL NOT NULL,
    currentAmount REAL NOT NULL DEFAULT 0.0,
    currency TEXT NOT NULL,
    startDate TEXT NOT NULL,
    endDate TEXT NOT NULL,
    status TEXT NOT NULL, -- GoalStatus
    priority TEXT NOT NULL, -- GoalPriority
    note TEXT,
    progressHistory TEXT NOT NULL DEFAULT '[]' -- JSON string of GoalProgressEntry[]
);

-- Transactions Table
CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL, -- ISO string
    type TEXT NOT NULL, -- TransactionType
    category TEXT NOT NULL,
    accountId TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    amount REAL NOT NULL,
    currency TEXT NOT NULL,
    note TEXT,
    defaultAmount REAL,
    goalId TEXT REFERENCES goals(id) ON DELETE SET NULL,
    createdBy TEXT,
    isInternalTransfer INTEGER DEFAULT 0 -- 0 or 1
);

-- Budgets Table
CREATE TABLE IF NOT EXISTS budgets (
    id TEXT PRIMARY KEY,
    category TEXT NOT NULL,
    amount REAL NOT NULL,
    currency TEXT NOT NULL,
    month TEXT NOT NULL, -- MM/YYYY
    spent REAL NOT NULL DEFAULT 0.0,
    status TEXT NOT NULL DEFAULT 'Active',
    rollover INTEGER DEFAULT 0, -- 0 or 1
    alertThreshold REAL DEFAULT 90.0
);

-- Budget Templates Table
CREATE TABLE IF NOT EXISTS budget_templates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    amount REAL NOT NULL,
    currency TEXT NOT NULL,
    rollover INTEGER DEFAULT 0 -- 0 or 1
);

-- Assets Table
CREATE TABLE IF NOT EXISTS assets (
    id TEXT PRIMARY KEY,
    glCode TEXT NOT NULL,
    name TEXT NOT NULL,
    localName TEXT,
    type TEXT NOT NULL, -- AssetType
    purchaseDate TEXT NOT NULL,
    cost REAL NOT NULL,
    currentValue REAL NOT NULL,
    currency TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Active',
    note TEXT,
    depreciationMethod TEXT NOT NULL,
    valuationHistory TEXT NOT NULL DEFAULT '[]', -- JSON string of ValuationHistoryEntry[]
    documents TEXT NOT NULL DEFAULT '[]', -- JSON string of Attachment[]
    saleDate TEXT,
    salePrice REAL
);

-- Liabilities Table
CREATE TABLE IF NOT EXISTS liabilities (
    id TEXT PRIMARY KEY,
    glCode TEXT NOT NULL,
    name TEXT NOT NULL,
    localName TEXT,
    type TEXT NOT NULL, -- LiabilityType
    amount REAL NOT NULL,
    remaining REAL NOT NULL,
    interestRate REAL NOT NULL,
    monthlyPayment REAL,
    currency TEXT NOT NULL,
    startDate TEXT NOT NULL,
    endDate TEXT,
    status TEXT NOT NULL DEFAULT 'Active',
    note TEXT,
    balanceHistory TEXT NOT NULL DEFAULT '[]', -- JSON string of BalanceHistoryEntry[]
    documents TEXT NOT NULL DEFAULT '[]', -- JSON string of Attachment[]
    payoffDate TEXT
);

-- SEED DATA

-- Insert default role
INSERT INTO roles (id, name, description, permissions) 
VALUES (
    '1', 
    'Administrator', 
    'Full access', 
    '{"Transactions":{"view":true,"add":true,"edit":true,"delete":true},"Accounts":{"view":true,"add":true,"edit":true,"delete":true},"Budgets":{"view":true,"add":true,"edit":true,"delete":true},"Goals":{"view":true,"add":true,"edit":true,"delete":true},"Assets":{"view":true,"add":true,"edit":true,"delete":true},"Reports":{"view":true,"add":true,"edit":true,"delete":true},"Analytics":{"view":true,"add":true,"edit":true,"delete":true},"Settings":{"view":true,"add":true,"edit":true,"delete":true}}'
);

-- Insert default admin user
INSERT INTO users (id, name, password, role, status, failedLoginAttempts, createdBy, createdDate)
VALUES ('KIMSAN', 'MR. KHENG Kimsan', '4289', 'Administrator', 'Active', 0, 'SYSTEM', '2026-06-03T11:00:00Z');

-- Insert default settings
INSERT INTO settings (id, profileName, defaultCurrency, exchangeRates, activeCurrencies, language, theme, dateFormat, timezone, autoSyncRates)
VALUES (1, 'User', 'USD', '{"USD":1,"KHR":4100,"THB":35}', '["USD","KHR","THB"]', 'km', 'system', 'dd/MM/yyyy', 'Asia/Phnom_Penh', 0);
