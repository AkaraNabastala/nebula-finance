import React from 'react';
import {
  BookOpen,
  LayoutDashboard,
  FileText,
  Tag,
  Settings,
  Wallet,
  ArrowDownRight,
  ArrowUpRight,
  Scale,
  ListTree,
  Building2,
  Banknote,
  TrendingUp,
  SlidersHorizontal
} from 'lucide-react';
import { MainTabType, TransactionType } from '../types';
import { formatRupiah } from '../utils/formatters';

interface HeaderProps {
  currentTab: MainTabType;
  onTabChange: (tab: MainTabType) => void;
  totalBalance: number;
  cashBalance: number;
  bankBalance: number;
  totalIncome: number;
  totalExpense: number;
  onAddTransaction: (type: TransactionType) => void;
  onOpenCategories: () => void;
  onOpenSettings: () => void;
}

export function Header({
  currentTab,
  onTabChange,
  totalBalance,
  cashBalance,
  bankBalance,
  onAddTransaction,
  onOpenCategories,
  onOpenSettings,
}: HeaderProps) {
  const tabs = [
    {
      id: 'bukukas' as MainTabType,
      label: 'Buku Kas & Bank',
      icon: BookOpen,
      desc: 'Pencatatan harian & mutasi',
    },
    {
      id: 'rekap' as MainTabType,
      label: 'Rekap & Analisis',
      icon: LayoutDashboard,
      desc: 'Dashboard & grafik',
    },
    {
      id: 'rincian' as MainTabType,
      label: 'Rincian Mutasi',
      icon: ListTree,
      desc: 'Pos pemasukan & pengeluaran',
    },
    {
      id: 'laba_rugi' as MainTabType,
      label: 'Laba Rugi',
      icon: TrendingUp,
      desc: 'Profit & loss statement',
    },
    {
      id: 'trial_balance' as MainTabType,
      label: 'Neraca Saldo',
      icon: Scale,
      desc: 'Trial balance akuntansi',
    },
    {
      id: 'laporan' as MainTabType,
      label: 'Laporan & Ekspor',
      icon: FileText,
      desc: 'Cetak PDF & Excel',
    },
  ];

  return (
    <header className="bg-white border-b border-gray-200/80 sticky top-0 z-40 shadow-xs print:hidden">
      {/* Top Application Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-sm shadow-indigo-600/25 shrink-0">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-base text-gray-900 tracking-tight">Sistem Keuangan Kas &amp; Bank</h1>
                <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100/80 rounded-full">
                  Multi-Akun
                </span>
              </div>
              <p className="text-xs text-gray-500 font-normal">
                Pencatatan kas fisik, rekening bank, neraca saldo &amp; laporan laba rugi
              </p>
            </div>
          </div>

          {/* Quick Balance Summary Pills & Actions */}
          <div className="flex flex-wrap items-center justify-between lg:justify-end gap-2 sm:gap-3">
            {/* Balance Mini Indicators */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Kas Tunai */}
              <div className="bg-amber-50/70 border border-amber-200/70 rounded-xl px-2.5 sm:px-3 py-1.5 flex items-center gap-2">
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
              <div className="bg-blue-50/70 border border-blue-200/70 rounded-xl px-2.5 sm:px-3 py-1.5 flex items-center gap-2">
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
              <div className="bg-gray-900 text-white rounded-xl px-2.5 sm:px-3 py-1.5 flex items-center gap-2 shadow-xs">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <div>
                  <span className="text-[9px] uppercase font-bold text-gray-300 tracking-wider block">Total Saldo</span>
                  <span className="font-mono font-bold text-xs text-white block leading-tight">
                    {formatRupiah(totalBalance)}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Action Buttons */}
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
      </div>

      {/* Main Navigation Tabs */}
      <div className="border-t border-gray-100 bg-gray-50/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center space-x-1.5 py-2 overflow-x-auto no-scrollbar">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = currentTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`py-2 px-3 sm:px-3.5 rounded-xl font-semibold text-xs whitespace-nowrap flex items-center gap-2 transition-all ${
                    isActive
                      ? 'bg-white text-indigo-700 shadow-xs border border-gray-200/90'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/70 border border-transparent'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-600'
                    }`}
                  />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}


