import { Category, Transaction } from '../types';
import { getTodayString } from './formatters';

export const DEFAULT_CATEGORIES: Category[] = [
  // Categories for Income (Pemasukan)
  { id: 'cat-inc-1', name: 'Penjualan Produk / Jasa', type: 'income', color: '#10b981', iconName: 'ShoppingBag', isDefault: true },
  { id: 'cat-inc-2', name: 'Gaji & Upah Kerja', type: 'income', color: '#059669', iconName: 'Briefcase', isDefault: true },
  { id: 'cat-inc-3', name: 'Komisi & Fee Proyek', type: 'income', color: '#047857', iconName: 'BadgePercent', isDefault: true },
  { id: 'cat-inc-4', name: 'Investasi & Dividen', type: 'income', color: '#0d9488', iconName: 'TrendingUp', isDefault: true },
  { id: 'cat-inc-5', name: 'Pemasukan Lain-lain', type: 'income', color: '#14b8a6', iconName: 'PlusCircle', isDefault: true },

  // Categories for Expense (Pengeluaran)
  { id: 'cat-exp-1', name: 'Operasional & Belanja Toko', type: 'expense', color: '#ef4444', iconName: 'Store', isDefault: true },
  { id: 'cat-exp-2', name: 'Gaji & Upah Karyawan', type: 'expense', color: '#f97316', iconName: 'Users', isDefault: true },
  { id: 'cat-exp-3', name: 'Sewa Tempat & Fasilitas', type: 'expense', color: '#e11d48', iconName: 'Building', isDefault: true },
  { id: 'cat-exp-4', name: 'Listrik, Air & Internet', type: 'expense', color: '#d97706', iconName: 'Zap', isDefault: true },
  { id: 'cat-exp-5', name: 'Transportasi & Pengiriman', type: 'expense', color: '#b45309', iconName: 'Truck', isDefault: true },
  { id: 'cat-exp-6', name: 'Konsumsi & Makan Minum', type: 'expense', color: '#f43f5e', iconName: 'Coffee', isDefault: true },
  { id: 'cat-exp-7', name: 'Pemasaran & Iklan', type: 'expense', color: '#be123c', iconName: 'Megaphone', isDefault: true },
  { id: 'cat-exp-8', name: 'Perlengkapan & ATK', type: 'expense', color: '#9f1239', iconName: 'Paperclip', isDefault: true },
  { id: 'cat-exp-9', name: 'Pengeluaran Lain-lain', type: 'expense', color: '#dc2626', iconName: 'MinusCircle', isDefault: true },
];

export function getInitialTransactions(): Transaction[] {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  
  // Create sample dates in current month
  const d01 = `${year}-${month}-01`;
  const d03 = `${year}-${month}-03`;
  const d07 = `${year}-${month}-07`;
  const d10 = `${year}-${month}-10`;
  const d12 = `${year}-${month}-12`;
  const d15 = `${year}-${month}-15`;
  const d18 = `${year}-${month}-18`;
  const dToday = getTodayString();

  return [
    {
      id: 'tx-seed-1',
      date: d01,
      time: '09:00',
      type: 'income',
      account: 'bank',
      categoryId: 'cat-inc-1',
      amount: 15500000,
      description: 'Penjualan Paket Layanan Desain & Web Batch 1 (Transfer Bank)',
      createdAt: Date.now() - 86400000 * 20,
    },
    {
      id: 'tx-seed-2',
      date: d03,
      time: '11:30',
      type: 'expense',
      account: 'bank',
      categoryId: 'cat-exp-3',
      amount: 3500000,
      description: 'Sewa Ruang Kerja / Kantor Bulanan (Transfer Bank)',
      createdAt: Date.now() - 86400000 * 18,
    },
    {
      id: 'tx-seed-3',
      date: d07,
      time: '14:15',
      type: 'expense',
      account: 'bank',
      categoryId: 'cat-exp-4',
      amount: 650000,
      description: 'Pembayaran Tagihan Listrik PLN & Internet Wi-Fi (Autodebet Bank)',
      createdAt: Date.now() - 86400000 * 14,
    },
    {
      id: 'tx-seed-4',
      date: d10,
      time: '10:00',
      type: 'income',
      account: 'bank',
      categoryId: 'cat-inc-3',
      amount: 8200000,
      description: 'Fee Konsultasi Pengembangan Aplikasi Klien A (Transfer Bank)',
      createdAt: Date.now() - 86400000 * 11,
    },
    {
      id: 'tx-seed-5',
      date: d12,
      time: '15:45',
      type: 'expense',
      account: 'cash',
      categoryId: 'cat-exp-1',
      amount: 1250000,
      description: 'Restock Perlengkapan Kantor & ATK Printer (Tunai)',
      createdAt: Date.now() - 86400000 * 9,
    },
    {
      id: 'tx-seed-6',
      date: d15,
      time: '13:20',
      type: 'expense',
      account: 'bank',
      categoryId: 'cat-exp-7',
      amount: 1500000,
      description: 'Iklan Digital Facebook Ads & Google Search Ads (Kartu/Bank)',
      createdAt: Date.now() - 86400000 * 6,
    },
    {
      id: 'tx-seed-7',
      date: d18,
      time: '16:00',
      type: 'income',
      account: 'cash',
      categoryId: 'cat-inc-1',
      amount: 4800000,
      description: 'Penjualan Produk Retail & Layanan Konsumen (Kas Tunai)',
      createdAt: Date.now() - 86400000 * 3,
    },
    {
      id: 'tx-seed-8',
      date: dToday,
      time: '10:15',
      type: 'expense',
      account: 'cash',
      categoryId: 'cat-exp-6',
      amount: 320000,
      description: 'Konsumsi Rapat Bulanan Tim & Snack (Kas Tunai)',
      createdAt: Date.now() - 86400000 * 1,
    }
  ];
}

const STORAGE_KEYS = {
  TRANSACTIONS: 'sistem_keuangan_transactions_v1',
  CATEGORIES: 'sistem_keuangan_categories_v1',
  APP_SETTINGS: 'sistem_keuangan_settings_v1',
};

export function loadCategories(): Category[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    if (!data) {
      saveCategories(DEFAULT_CATEGORIES);
      return DEFAULT_CATEGORIES;
    }
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_CATEGORIES;
  } catch (err) {
    console.error('Error loading categories from localStorage:', err);
    return DEFAULT_CATEGORIES;
  }
}

export function saveCategories(categories: Category[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  } catch (err) {
    console.error('Error saving categories to localStorage:', err);
  }
}

export function loadTransactions(): Transaction[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    if (!data) {
      const initial = getInitialTransactions();
      saveTransactions(initial);
      return initial;
    }
    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed)) return [];
    // Ensure every transaction has an account field
    return parsed.map((t) => ({
      ...t,
      account: t.account || 'cash',
    }));
  } catch (err) {
    console.error('Error loading transactions from localStorage:', err);
    return [];
  }
}

export function saveTransactions(transactions: Transaction[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  } catch (err) {
    console.error('Error saving transactions to localStorage:', err);
  }
}
