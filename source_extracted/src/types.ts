export type TransactionType = 'income' | 'expense';
export type AccountType = 'cash' | 'bank'; // Kas Tunai vs Rekening Bank

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  color: string;
  iconName?: string;
  isDefault?: boolean;
}

export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  type: TransactionType;
  account?: AccountType; // 'cash' (Kas Tunai) or 'bank' (Rekening Bank)
  categoryId: string;
  amount: number;
  description: string;
  receiptUrl?: string; // Base64 data or image URL
  receiptName?: string;
  createdAt: number;
  updatedAt?: number;
}

export interface TransactionWithBalance extends Transaction {
  runningBalance: number;
  cashRunningBalance?: number;
  bankRunningBalance?: number;
}

export type PeriodFilter = 'all' | 'today' | 'this_week' | 'this_month' | 'last_month' | 'this_year' | 'custom';

export interface DateRange {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
}

export interface FinancialSummary {
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  cashBalance: number;
  bankBalance: number;
  incomeCount: number;
  expenseCount: number;
  transactionCount: number;
}

export type MainTabType = 'bukukas' | 'rekap' | 'rincian' | 'trial_balance' | 'laba_rugi' | 'laporan';
export type ReportType = 'cashflow' | 'income' | 'expense' | 'category_summary';

export interface TrialBalanceAccount {
  code: string;
  name: string;
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  initialDebit: number;
  initialCredit: number;
  movementDebit: number;
  movementCredit: number;
  endingDebit: number;
  endingCredit: number;
}
