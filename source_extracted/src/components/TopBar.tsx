import React from 'react';
import {
  Menu,
  ArrowDownRight,
  ArrowUpRight,
  Building2,
  Banknote,
  Tag,
  Settings,
  BookOpen,
  LayoutDashboard,
  ListTree,
  TrendingUp,
  Scale,
  FileText
} from 'lucide-react';
import { MainTabType, TransactionType } from '../types';
import { formatRupiah } from '../utils/formatters';

interface TopBarProps {
  currentTab: MainTabType;
  onOpenMobileMenu: () => void;
  totalBalance: number;
  cashBalance: number;
  bankBalance: number;
  onAddTransaction: (type: TransactionType) => void;
  onOpenCategories: () => void;
  onOpenSettings: () => void;
}

const tabMeta: Record<
  MainTabType,
  { title: string; subtitle: string; icon: React.ElementType }
> = {
  bukukas: {
    title: 'Buku Kas & Bank',
    subtitle: 'Pencatatan mutasi transaksi harian dan saldo berjalan (running balance)',
    icon: BookOpen,
  },
  rekap: {
    title: 'Rekap & Analisis Keuangan',
    subtitle: 'Ringkasan performa finansial, rasio pengeluaran, dan grafik arus kas',
    icon: LayoutDashboard,
  },
  rincian: {
    title: 'Rincian Pemasukan & Pengeluaran',
    subtitle: 'Pengelompokan detail nominal dan transaksi berdasarkan pos kategori',
    icon: ListTree,
  },
  laba_rugi: {
    title: 'Laporan Laba Rugi (P&L)',
    subtitle: 'Perhitungan laba bersih dari total pendapatan dikurangi beban operasional',
    icon: TrendingUp,
  },
  trial_balance: {
    title: 'Neraca Saldo (Trial Balance)',
    subtitle: 'Keseimbangan saldo debit dan kredit seluruh akun kas dan rekening',
    icon: Scale,
  },
  laporan: {
    title: 'Laporan & Ekspor Dokumen',
    subtitle: 'Pratinjau laporan arus kas, cetak dokumen PDF, dan unduh format Excel',
    icon: FileText,
  },
};

export function TopBar({
  currentTab,
  onOpenMobileMenu,
  totalBalance,
  cashBalance,
  bankBalance,
  onAddTransaction,
  onOpenCategories,
  onOpenSettings,
}: TopBarProps) {
  const currentMeta = tabMeta[currentTab] || tabMeta.bukukas;
  const TabIcon = currentMeta.icon;

  return (
    <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-gray-200/80 px-4 sm:px-6 lg:px-8 py-3.5 shadow-2xs print:hidden">
      <div className="flex items-center justify-between gap-4">
        {/* Left Side: Mobile Menu Button + Page Info */}
        <div className="flex items-center gap-3.5 min-w-0">
          <button
            onClick={onOpenMobileMenu}
            className="lg:hidden p-2 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-200/90 transition-colors shrink-0"
            title="Buka Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 items-center justify-center shrink-0">
                <TabIcon className="w-4 h-4" />
              </div>
              <h2 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight truncate">
                {currentMeta.title}
              </h2>
            </div>
            <p className="text-xs text-gray-500 hidden md:block truncate mt-0.5 font-normal">
              {currentMeta.subtitle}
            </p>
          </div>
        </div>

        {/* Right Side: Quick Balances & Actions */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Quick Balance Indicators (Visible on larger screens) */}
          <div className="hidden xl:flex items-center gap-2">
            {/* Kas Tunai */}
            <div className="bg-amber-50/70 border border-amber-200/70 rounded-xl px-2.5 py-1.5 flex items-center gap-2">
              <div className="p-1 bg-amber-500 text-white rounded-lg shrink-0">
                <Banknote className="w-3 h-3" />
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-amber-800 tracking-wider block">Kas Tunai</span>
                <span className="font-mono font-bold text-xs text-amber-950 block leading-tight">
                  {formatRupiah(cashBalance)}
                </span>
              </div>
            </div>

            {/* Rekening Bank */}
            <div className="bg-blue-50/70 border border-blue-200/70 rounded-xl px-2.5 py-1.5 flex items-center gap-2">
              <div className="p-1 bg-blue-600 text-white rounded-lg shrink-0">
                <Building2 className="w-3 h-3" />
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-blue-800 tracking-wider block">Bank</span>
                <span className="font-mono font-bold text-xs text-blue-950 block leading-tight">
                  {formatRupiah(bankBalance)}
                </span>
              </div>
            </div>

            {/* Total Saldo */}
            <div className="bg-gray-900 text-white rounded-xl px-2.5 py-1.5 flex items-center gap-2 shadow-xs">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <div>
                <span className="text-[9px] uppercase font-bold text-gray-300 tracking-wider block">Total Saldo</span>
                <span className="font-mono font-bold text-xs text-white block leading-tight">
                  {formatRupiah(totalBalance)}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onAddTransaction('income')}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-semibold rounded-xl transition-all shadow-xs"
              title="Catat Pemasukan Baru"
            >
              <ArrowDownRight className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Pemasukan</span>
            </button>

            <button
              onClick={() => onAddTransaction('expense')}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs font-semibold rounded-xl transition-all shadow-xs"
              title="Catat Pengeluaran Baru"
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Pengeluaran</span>
            </button>

            <button
              onClick={onOpenCategories}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-200/90 rounded-xl transition-colors"
              title="Kelola Kategori Transaksi"
            >
              <Tag className="w-4 h-4" />
            </button>

            <button
              onClick={onOpenSettings}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-200/90 rounded-xl transition-colors"
              title="Cadangan Data & Pengaturan"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
