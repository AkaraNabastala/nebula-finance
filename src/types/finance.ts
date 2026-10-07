export type UserRole = 'super_admin' | 'finance_manager' | 'accounting' | 'finance_staff' | 'viewer';

export interface UserProfile {
  id: string;
  name: string;
  role: UserRole;
  email: string;
  avatar?: string;
}

export type COAGroup = '1_aset' | '2_kewajiban' | '3_modal' | '4_pendapatan' | '5_beban';
export type NormalPosition = 'debit' | 'credit';

export interface COAAccount {
  code: string; // e.g. '1101'
  name: string;
  group: COAGroup;
  normalPosition: NormalPosition;
  isHeader?: boolean;
  parentCode?: string;
  description?: string;
  initialBalance?: number;
}

export interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  holderName: string;
  branch?: string;
  initialBalance: number;
  currentBalance: number;
  color?: string;
  coaCode?: string; // e.g. '1103'
}

export type ContactType = 'customer' | 'supplier';

export interface Contact {
  id: string;
  type: ContactType;
  name: string;
  phone: string;
  email: string;
  company: string;
  address: string;
  taxId?: string;
  termDays: number; // e.g. 30 days
  createdAt: number;
}

export interface TransactionCategory {
  id: string;
  name: string;
  type: 'income' | 'expense';
  defaultCOACode: string;
  color: string;
  iconName: string;
}

export interface ProductService {
  id: string;
  code: string;
  name: string;
  type: 'product' | 'service';
  price: number;
  unit: string;
  accountCode: string; // revenue account
}

export interface FinancialPeriod {
  id: string;
  name: string; // e.g. "September 2026"
  year: number;
  month: number;
  startDate: string; // YYYY-MM-DD
  endDate: string;
  status: 'OPEN' | 'CLOSED';
  closedAt?: number;
  closedBy?: string;
}

export type TransactionModule = 'kas_kecil' | 'kas_besar' | 'bank';
export type TransactionType = 'income' | 'expense' | 'transfer';

export interface Transaction {
  id: string;
  code: string; // e.g. "KK-2026-0001", "KB-2026-0001", "BK-2026-0001"
  date: string; // YYYY-MM-DD
  time?: string;
  module: TransactionModule;
  type: TransactionType;
  categoryId: string;
  amount: number;
  sourceAccount?: string; // 'kas_kecil', 'kas_besar', or bankId
  destAccount?: string; // for transfers
  contraAccountCode: string; // Opposite COA account (e.g. 5101 Beban Listrik)
  recipientOrPayer: string;
  description: string;
  receiptUrl?: string; // Base64 or URL
  receiptName?: string;
  taxRate?: number; // e.g. 11 for 11%
  taxAmount?: number;
  status: 'approved' | 'pending' | 'rejected';
  approvedBy?: string;
  createdBy: string;
  createdAt: number;
  updatedAt?: number;
}

export interface ReconciliationRecord {
  id: string;
  date: string;
  accountType: 'kas_kecil' | 'kas_besar' | 'bank';
  accountId?: string;
  systemBalance: number;
  physicalBalance: number;
  discrepancy: number; // physicalBalance - systemBalance
  breakdown?: Record<string, number>; // { '100000': 10, '50000': 5 }
  notes: string;
  reconciledBy: string;
  createdAt: number;
}

export interface PettyCashReimbursement {
  id: string;
  code: string; // e.g. "PKK-2026-0001"
  date: string;
  totalAmount: number;
  status: 'submitted' | 'approved' | 'disbursed';
  expenseTransactionIds: string[];
  notes: string;
  approvedBy?: string;
  disbursedDate?: string;
  disbursedFrom: 'kas_besar' | 'bank';
  disbursedBankId?: string;
}

export type DebtStatus = 'unpaid' | 'partial' | 'paid' | 'overdue';

export interface PaymentInstallment {
  id: string;
  date: string;
  amount: number;
  paymentMethod: 'kas_besar' | 'bank';
  bankAccountId?: string;
  referenceNumber?: string;
  notes?: string;
  receiptUrl?: string;
  createdBy: string;
  createdAt: number;
}

export interface HutangRecord {
  id: string;
  code: string; // e.g. "HT-2026-0001"
  supplierId: string;
  invoiceNumber: string;
  date: string;
  dueDate: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  taxRate?: number;
  taxAmount?: number;
  status: DebtStatus;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  notes: string;
  expenseAccountCode: string; // default e.g. 5101 or 1301
  payments: PaymentInstallment[];
  createdAt: number;
}

export interface PiutangRecord {
  id: string;
  code: string; // e.g. "PT-2026-0001"
  customerId: string;
  invoiceNumber: string;
  date: string;
  dueDate: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  taxRate?: number;
  taxAmount?: number;
  status: DebtStatus;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  notes: string;
  revenueAccountCode: string; // default e.g. 4101
  payments: PaymentInstallment[];
  createdAt: number;
}

export type JournalType = 'umum' | 'kas_masuk' | 'kas_keluar' | 'bank' | 'hutang' | 'piutang' | 'penyesuaian';

export interface JournalLine {
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  description?: string;
}

export interface JournalEntry {
  id: string;
  code: string; // e.g. "JU-2026-0001"
  date: string;
  type: JournalType;
  referenceId?: string;
  referenceCode?: string;
  description: string;
  lines: JournalLine[];
  totalDebit: number;
  totalCredit: number;
  isAutoGenerated: boolean;
  createdBy: string;
  createdAt: number;
}

export interface AuditLog {
  id: string;
  timestamp: number;
  userId: string;
  userName: string;
  role: UserRole;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'APPROVAL' | 'RECONCILE' | 'CLOSE_PERIOD';
  module: string;
  entityId: string;
  details: string;
  beforeState?: any;
  afterState?: any;
}

export type MainTabType = 
  | 'dashboard'
  | 'master'
  | 'kas_kecil'
  | 'kas_besar'
  | 'bank'
  | 'hutang'
  | 'piutang'
  | 'jurnal'
  | 'buku_besar'
  | 'laporan'
  | 'settings_audit'
  | 'asset'
  | 'budget';

export interface FixedAsset {
  id: string;
  code?: string; // e.g. "AST-2026-0001"
  name: string;
  purchaseDate?: string; // YYYY-MM-DD
  acquisitionDate?: string; // alias
  purchasePrice?: number;
  acquisitionCost?: number; // alias
  usefulLifeMonths?: number;
  usefulLifeYears?: number; // alias
  salvageValue?: number;
  accumulatedDepreciation: number;
  bookValue: number;
  status: 'active' | 'sold' | 'written_off';
  categoryId: string;
  createdAt?: number;
}

export interface BudgetLimit {
  id: string;
  categoryId: string; // TransactionCategory ID
  periodId: string; // FinancialPeriod ID
  amountLimit?: number;
  limitAmount?: number; // alias
  createdAt?: number;
  createdBy?: string;
}


export interface CompanyProfile {
  companyName: string;
  productName: string;
  address?: string;
  phone?: string;
  email?: string;
  taxNumber?: string;
  letterheadNotes?: string;
}
