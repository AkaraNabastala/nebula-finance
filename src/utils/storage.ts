import {
  CompanyProfile,
  COAAccount,
  BankAccount,
  Contact,
  TransactionCategory,
  FinancialPeriod,
  Transaction,
  HutangRecord,
  PiutangRecord,
  JournalEntry,
  AuditLog,
  PettyCashReimbursement,
  ReconciliationRecord,
  ProductService,
  UserProfile,
  FixedAsset,
  BudgetLimit,
} from '../types/finance';

export const INITIAL_COA: COAAccount[] = [
  // 1 ASET
  { code: '1000', name: 'ASET', group: '1_aset', normalPosition: 'debit', isHeader: true },
  { code: '1100', name: 'Aset Lancar', group: '1_aset', normalPosition: 'debit', isHeader: true, parentCode: '1000' },
  { code: '1101', name: 'Kas Kecil (Petty Cash)', group: '1_aset', normalPosition: 'debit', parentCode: '1100', initialBalance: 5000000 },
  { code: '1102', name: 'Kas Besar (Main Cash)', group: '1_aset', normalPosition: 'debit', parentCode: '1100', initialBalance: 20000000 },
  { code: '1103', name: 'Bank BCA', group: '1_aset', normalPosition: 'debit', parentCode: '1100', initialBalance: 25000000 },
  { code: '1104', name: 'Bank Mandiri', group: '1_aset', normalPosition: 'debit', parentCode: '1100', initialBalance: 15000000 },
  { code: '1201', name: 'Piutang Usaha', group: '1_aset', normalPosition: 'debit', parentCode: '1100', initialBalance: 0 },
  { code: '1301', name: 'Persediaan Barang', group: '1_aset', normalPosition: 'debit', parentCode: '1100', initialBalance: 0 },
  { code: '1401', name: 'Perlengkapan Kantor', group: '1_aset', normalPosition: 'debit', parentCode: '1100', initialBalance: 0 },
  { code: '1500', name: 'Aset Tetap', group: '1_aset', normalPosition: 'debit', isHeader: true, parentCode: '1000' },
  { code: '1501', name: 'Peralatan & Mesin', group: '1_aset', normalPosition: 'debit', parentCode: '1500', initialBalance: 0 },
  { code: '1502', name: 'Akumulasi Penyusutan', group: '1_aset', normalPosition: 'credit', parentCode: '1500', initialBalance: 0 },

  // 2 KEWAJIBAN
  { code: '2000', name: 'KEWAJIBAN', group: '2_kewajiban', normalPosition: 'credit', isHeader: true },
  { code: '2100', name: 'Kewajiban Jangka Pendek', group: '2_kewajiban', normalPosition: 'credit', isHeader: true, parentCode: '2000' },
  { code: '2101', name: 'Hutang Usaha / Supplier', group: '2_kewajiban', normalPosition: 'credit', parentCode: '2100', initialBalance: 0 },
  { code: '2102', name: 'Hutang Gaji & Upah', group: '2_kewajiban', normalPosition: 'credit', parentCode: '2100', initialBalance: 0 },
  { code: '2103', name: 'Hutang Pajak', group: '2_kewajiban', normalPosition: 'credit', parentCode: '2100', initialBalance: 0 },
  { code: '2201', name: 'Pinjaman Bank', group: '2_kewajiban', normalPosition: 'credit', parentCode: '2000', initialBalance: 0 },

  // 3 MODAL
  { code: '3000', name: 'MODAL & EKUITAS', group: '3_modal', normalPosition: 'credit', isHeader: true },
  { code: '3101', name: 'Modal Pemilik / Disetor', group: '3_modal', normalPosition: 'credit', parentCode: '3000', initialBalance: 65000000 },
  { code: '3201', name: 'Laba Ditahan', group: '3_modal', normalPosition: 'credit', parentCode: '3000', initialBalance: 0 },

  // 4 PENDAPATAN
  { code: '4000', name: 'PENDAPATAN', group: '4_pendapatan', normalPosition: 'credit', isHeader: true },
  { code: '4101', name: 'Pendapatan Penjualan Produk', group: '4_pendapatan', normalPosition: 'credit', parentCode: '4000' },
  { code: '4201', name: 'Pendapatan Jasa & Proyek', group: '4_pendapatan', normalPosition: 'credit', parentCode: '4000' },
  { code: '4301', name: 'Pendapatan Bunga & Finansial', group: '4_pendapatan', normalPosition: 'credit', parentCode: '4000' },

  // 5 BEBAN
  { code: '5000', name: 'BEBAN OPERASIONAL', group: '5_beban', normalPosition: 'debit', isHeader: true },
  { code: '5101', name: 'Beban Gaji & Upah', group: '5_beban', normalPosition: 'debit', parentCode: '5000' },
  { code: '5102', name: 'Beban Listrik & Air', group: '5_beban', normalPosition: 'debit', parentCode: '5000' },
  { code: '5103', name: 'Beban Internet & Telekomunikasi', group: '5_beban', normalPosition: 'debit', parentCode: '5000' },
  { code: '5104', name: 'Beban Sewa Kantor & Fasilitas', group: '5_beban', normalPosition: 'debit', parentCode: '5000' },
  { code: '5105', name: 'Beban Transportasi & Bahan Bakar', group: '5_beban', normalPosition: 'debit', parentCode: '5000' },
  { code: '5106', name: 'Beban Pemasaran & Iklan Digital', group: '5_beban', normalPosition: 'debit', parentCode: '5000' },
  { code: '5107', name: 'Beban Konsumsi & Makan Rapat', group: '5_beban', normalPosition: 'debit', parentCode: '5000' },
  { code: '5108', name: 'Beban Perlengkapan & ATK', group: '5_beban', normalPosition: 'debit', parentCode: '5000' },
  { code: '5109', name: 'Beban Perawatan & Pemeliharaan', group: '5_beban', normalPosition: 'debit', parentCode: '5000' },
  { code: '5110', name: 'Beban Administrasi Bank', group: '5_beban', normalPosition: 'debit', parentCode: '5000' },
  { code: '5199', name: 'Beban Operasional Lainnya', group: '5_beban', normalPosition: 'debit', parentCode: '5000' },
];

export const INITIAL_BANKS: BankAccount[] = [
  {
    id: 'bank-bca',
    bankName: 'Bank BCA',
    accountNumber: '8820-1928-301',
    holderName: 'PT Nabastala',
    branch: 'KCU Thamrin',
    initialBalance: 25000000,
    currentBalance: 25000000,
    color: '#0284c7',
    coaCode: '1103',
  },
  {
    id: 'bank-mandiri',
    bankName: 'Bank Mandiri',
    accountNumber: '122-00-982182-1',
    holderName: 'PT Nabastala',
    branch: 'KC Sudirman',
    initialBalance: 15000000,
    currentBalance: 15000000,
    color: '#0d9488',
    coaCode: '1104',
  },
];

export const INITIAL_CONTACTS: Contact[] = [
  {
    id: 'cont-1',
    type: 'customer',
    name: 'PT Maju Bersama Sukses',
    phone: '0812-3456-7890',
    email: 'finance@majubersama.com',
    company: 'PT Maju Bersama',
    address: 'Jl. Jend. Sudirman No. 45, Jakarta Selatan',
    taxId: '01.234.567.8-012.000',
    termDays: 30,
    createdAt: Date.now() - 86400000 * 10,
  },
  {
    id: 'cont-2',
    type: 'supplier',
    name: 'CV Berkah Sumber Abadi',
    phone: '0813-9876-5432',
    email: 'sales@berkahsumber.com',
    company: 'CV Berkah Sumber',
    address: 'Kawasan Industri Pulogadung, Jakarta Timur',
    taxId: '02.345.678.9-023.000',
    termDays: 14,
    createdAt: Date.now() - 86400000 * 15,
  },
];

export const INITIAL_CATEGORIES: TransactionCategory[] = [
  // Income
  { id: 'cat-inc-1', name: 'Penjualan Produk', type: 'income', defaultCOACode: '4101', color: '#10b981', iconName: 'ShoppingBag' },
  { id: 'cat-inc-2', name: 'Pendapatan Jasa Proyek', type: 'income', defaultCOACode: '4201', color: '#059669', iconName: 'Briefcase' },
  { id: 'cat-inc-3', name: 'Pendapatan Bunga & Finansial', type: 'income', defaultCOACode: '4301', color: '#0d9488', iconName: 'TrendingUp' },
  // Expense
  { id: 'cat-exp-1', name: 'Gaji & Upah Karyawan', type: 'expense', defaultCOACode: '5101', color: '#ef4444', iconName: 'Users' },
  { id: 'cat-exp-2', name: 'Listrik, Air & Utilitas', type: 'expense', defaultCOACode: '5102', color: '#f59e0b', iconName: 'Zap' },
  { id: 'cat-exp-3', name: 'Internet & Komunikasi', type: 'expense', defaultCOACode: '5103', color: '#8b5cf6', iconName: 'Wifi' },
  { id: 'cat-exp-4', name: 'Sewa Kantor & Fasilitas', type: 'expense', defaultCOACode: '5104', color: '#ec4899', iconName: 'Building' },
  { id: 'cat-exp-5', name: 'Transportasi & Bahan Bakar', type: 'expense', defaultCOACode: '5105', color: '#f97316', iconName: 'Truck' },
  { id: 'cat-exp-6', name: 'Pemasaran & Promosi', type: 'expense', defaultCOACode: '5106', color: '#e11d48', iconName: 'Megaphone' },
  { id: 'cat-exp-7', name: 'Konsumsi Rapat & Tamu', type: 'expense', defaultCOACode: '5107', color: '#14b8a6', iconName: 'Coffee' },
  { id: 'cat-exp-8', name: 'Perlengkapan & ATK', type: 'expense', defaultCOACode: '5108', color: '#6366f1', iconName: 'FileText' },
  { id: 'cat-exp-9', name: 'Pemeliharaan Kantor', type: 'expense', defaultCOACode: '5109', color: '#84cc16', iconName: 'Wrench' },
  { id: 'cat-exp-10', name: 'Beban Administrasi Bank', type: 'expense', defaultCOACode: '5110', color: '#64748b', iconName: 'CreditCard' },
  { id: 'cat-exp-11', name: 'Operasional Lainnya', type: 'expense', defaultCOACode: '5199', color: '#94a3b8', iconName: 'MoreHorizontal' },
];

export const INITIAL_PRODUCTS: ProductService[] = [];

export const INITIAL_PERIODS: FinancialPeriod[] = [
  { id: 'per-2026-09', name: 'September 2026', year: 2026, month: 9, startDate: '2026-09-01', endDate: '2026-09-30', status: 'OPEN' },
  { id: 'per-2026-08', name: 'Agustus 2026', year: 2026, month: 8, startDate: '2026-08-01', endDate: '2026-08-31', status: 'CLOSED', closedAt: 1788220800000, closedBy: 'Finance Manager' },
];

export const INITIAL_HUTANG: HutangRecord[] = [];
export const INITIAL_PIUTANG: PiutangRecord[] = [];
export const INITIAL_TRANSACTIONS: Transaction[] = [];
export const INITIAL_JOURNALS: JournalEntry[] = [];
export const INITIAL_AUDIT_LOGS: AuditLog[] = [];
export const INITIAL_ASSETS: FixedAsset[] = [];
export const INITIAL_BUDGETS: BudgetLimit[] = [];


export const DEFAULT_COMPANY_PROFILE: CompanyProfile = {
  companyName: 'PT Nabastala',
  productName: 'NEBULA FINANCE',
  address: 'Gedung Nabastala Tower Lt. 12, Jl. Jend. Sudirman Kav. 21, Jakarta Selatan',
  phone: '+62 21 555-8900',
  email: 'finance@nabastala.com',
  taxNumber: '01.890.123.4-021.000',
  letterheadNotes: 'Sistem Informasi Akuntansi & Keuangan Terpadu',
};

export const INITIAL_USERS: UserProfile[] = [
  { id: 'usr-admin', name: 'Super Admin', role: 'super_admin', email: 'admin@nabastala.com' },
  { id: 'usr-mgr', name: 'Dewi Lestari (Finance Manager)', role: 'finance_manager', email: 'manager.finance@nabastala.com' },
  { id: 'usr-acc', name: 'Bambang Irawan (Accounting)', role: 'accounting', email: 'accounting@nabastala.com' },
  { id: 'usr-stf', name: 'Ahmad Faiz (Finance Staff)', role: 'finance_staff', email: 'staff.finance@nabastala.com' },
  { id: 'usr-view', name: 'Rina Kartika (Viewer / Auditor)', role: 'viewer', email: 'auditor@nabastala.com' },
];

export const STORAGE_KEYS = {
  COA: 'finance_coa_v4',
  BANKS: 'finance_banks_v4',
  CONTACTS: 'finance_contacts_v4',
  CATEGORIES: 'finance_categories_v4',
  PRODUCTS: 'finance_products_v4',
  PERIODS: 'finance_periods_v4',
  HUTANG: 'finance_hutang_v4',
  PIUTANG: 'finance_piutang_v4',
  TRANSACTIONS: 'finance_transactions_v4',
  JOURNALS: 'finance_journals_v4',
  AUDIT: 'finance_audit_v4',
  ASSETS: 'finance_assets_v4',
  BUDGETS: 'finance_budgets_v4',
  CURRENT_USER: 'finance_current_user_v4',
  CURRENT_PERIOD: 'finance_current_period_v4',
  COMPANY_PROFILE: 'finance_company_profile_v4',
};

function getOrSet<T>(key: string, defaultVal: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(defaultVal));
      return defaultVal;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Error loading key ${key}:`, err);
    return defaultVal;
  }
}

function save<T>(key: string, val: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (err) {
    console.error(`Error saving key ${key}:`, err);
  }
}

export function loadAllFinanceData() {
  return {
    coa: getOrSet<COAAccount[]>(STORAGE_KEYS.COA, INITIAL_COA),
    banks: getOrSet<BankAccount[]>(STORAGE_KEYS.BANKS, INITIAL_BANKS),
    contacts: getOrSet<Contact[]>(STORAGE_KEYS.CONTACTS, INITIAL_CONTACTS),
    categories: getOrSet<TransactionCategory[]>(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES),
    products: getOrSet<ProductService[]>(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS),
    periods: getOrSet<FinancialPeriod[]>(STORAGE_KEYS.PERIODS, INITIAL_PERIODS),
    hutang: getOrSet<HutangRecord[]>(STORAGE_KEYS.HUTANG, INITIAL_HUTANG),
    piutang: getOrSet<PiutangRecord[]>(STORAGE_KEYS.PIUTANG, INITIAL_PIUTANG),
    transactions: getOrSet<Transaction[]>(STORAGE_KEYS.TRANSACTIONS, INITIAL_TRANSACTIONS),
    journals: getOrSet<JournalEntry[]>(STORAGE_KEYS.JOURNALS, INITIAL_JOURNALS),
    auditLogs: getOrSet<AuditLog[]>(STORAGE_KEYS.AUDIT, INITIAL_AUDIT_LOGS),
    assets: getOrSet<FixedAsset[]>(STORAGE_KEYS.ASSETS, INITIAL_ASSETS),
    budgets: getOrSet<BudgetLimit[]>(STORAGE_KEYS.BUDGETS, INITIAL_BUDGETS),
    currentUser: getOrSet<UserProfile | null>(STORAGE_KEYS.CURRENT_USER, null),
    companyProfile: getOrSet<CompanyProfile>(STORAGE_KEYS.COMPANY_PROFILE, DEFAULT_COMPANY_PROFILE),
  };
}

export async function syncWithBackendServer(): Promise<any> {
  try {
    // Check Electron IPC first
    if (typeof window !== 'undefined' && (window as any).electronAPI?.getFinanceData) {
      const ipcData = await (window as any).electronAPI.getFinanceData();
      if (ipcData && Object.keys(ipcData).length > 0) {
        return ipcData;
      }
    }
    // Check REST API
    const res = await fetch('/api/finance/data');
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data && Object.keys(json.data).length > 0) {
        return json.data;
      }
    }
  } catch {
    // Backend offline / running purely client-side
  }
  return null;
}

export function pushToBackendServer(data: Record<string, any>): void {
  try {
    if (typeof window !== 'undefined' && (window as any).electronAPI?.saveFinanceData) {
      (window as any).electronAPI.saveFinanceData(data).catch(() => {});
      return;
    }
    fetch('/api/finance/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).catch(() => {});
  } catch {
    // Silently ignore if offline
  }
}

export function saveAllFinanceData(data: {
  coa?: COAAccount[];
  banks?: BankAccount[];
  contacts?: Contact[];
  categories?: TransactionCategory[];
  products?: ProductService[];
  periods?: FinancialPeriod[];
  hutang?: HutangRecord[];
  piutang?: PiutangRecord[];
  transactions?: Transaction[];
  journals?: JournalEntry[];
  auditLogs?: AuditLog[];
  assets?: FixedAsset[];
  budgets?: BudgetLimit[];
  currentUser?: UserProfile;
  companyProfile?: CompanyProfile;
}) {
  if (data.coa) save(STORAGE_KEYS.COA, data.coa);
  if (data.banks) save(STORAGE_KEYS.BANKS, data.banks);
  if (data.contacts) save(STORAGE_KEYS.CONTACTS, data.contacts);
  if (data.categories) save(STORAGE_KEYS.CATEGORIES, data.categories);
  if (data.products) save(STORAGE_KEYS.PRODUCTS, data.products);
  if (data.periods) save(STORAGE_KEYS.PERIODS, data.periods);
  if (data.hutang) save(STORAGE_KEYS.HUTANG, data.hutang);
  if (data.piutang) save(STORAGE_KEYS.PIUTANG, data.piutang);
  if (data.transactions) save(STORAGE_KEYS.TRANSACTIONS, data.transactions);
  if (data.journals) save(STORAGE_KEYS.JOURNALS, data.journals);
  if (data.auditLogs) save(STORAGE_KEYS.AUDIT, data.auditLogs);
  if (data.assets) save(STORAGE_KEYS.ASSETS, data.assets);
  if (data.budgets) save(STORAGE_KEYS.BUDGETS, data.budgets);
  if (data.currentUser) save(STORAGE_KEYS.CURRENT_USER, data.currentUser);
  if (data.companyProfile) save(STORAGE_KEYS.COMPANY_PROFILE, data.companyProfile);

  // Sync to SQLite / Backend in background
  pushToBackendServer(data);
}

export function resetToFactoryDefault(): void {
  try {
    fetch('/api/finance/reset', { method: 'POST' }).catch(() => {});
  } catch {
    // Ignore
  }
  localStorage.clear();
  window.location.reload();
}
