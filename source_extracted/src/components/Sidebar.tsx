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
  X,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { MainTabType, TransactionType } from '../types';
import { formatRupiah } from '../utils/formatters';

interface SidebarProps {
  currentTab: MainTabType;
  onTabChange: (tab: MainTabType) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  totalBalance: number;
  cashBalance: number;
  bankBalance: number;
  onAddTransaction: (type: TransactionType) => void;
  onOpenCategories: () => void;
  onOpenSettings: () => void;
}

export function Sidebar({
  currentTab,
  onTabChange,
  isOpenMobile,
  onCloseMobile,
  totalBalance,
  cashBalance,
  bankBalance,
  onAddTransaction,
  onOpenCategories,
  onOpenSettings,
}: SidebarProps) {
  const navGroups = [
    {
      groupTitle: 'Pencatatan & Analisis',
      items: [
        {
          id: 'bukukas' as MainTabType,
          label: 'Buku Kas & Bank',
          icon: BookOpen,
          badge: 'Utama',
          desc: 'Mutasi harian & saldo berjalan',
        },
        {
          id: 'rekap' as MainTabType,
          label: 'Rekap & Analisis',
          icon: LayoutDashboard,
          desc: 'Grafik ringkasan & tren keuangan',
        },
        {
          id: 'rincian' as MainTabType,
          label: 'Rincian Mutasi',
          icon: ListTree,
          desc: 'Rincian per pos kategori',
        },
      ],
    },
    {
      groupTitle: 'Laporan Keuangan',
      items: [
        {
          id: 'laba_rugi' as MainTabType,
          label: 'Laba Rugi',
          icon: TrendingUp,
          badge: 'P&L',
          desc: 'Pendapatan vs beban operasional',
        },
        {
          id: 'trial_balance' as MainTabType,
          label: 'Neraca Saldo',
          icon: Scale,
          desc: 'Trial balance debit & kredit',
        },
        {
          id: 'laporan' as MainTabType,
          label: 'Laporan & Ekspor',
          icon: FileText,
          desc: 'Cetak PDF & Ekspor Excel',
        },
      ],
    },
  ];

  const handleSelectTab = (tabId: MainTabType) => {
    onTabChange(tabId);
    onCloseMobile();
  };

  const content = (
    <div className="flex flex-col h-full bg-white border-r border-gray-200/80 text-gray-800">
      {/* Brand Header */}
      <div className="p-5 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20 shrink-0">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-base text-gray-900 tracking-tight leading-none">
                Sistem Keuangan
              </h1>
            </div>
            <p className="text-[11px] text-gray-500 font-medium mt-1">
              Buku Kas &amp; Bank Multi-Akun
            </p>
          </div>
        </div>

        {/* Mobile close button */}
        <button
          onClick={onCloseMobile}
          className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          title="Tutup Menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Saldo Summary Card in Sidebar for Quick Glance */}
      <div className="p-4 border-b border-gray-100 bg-slate-50/60">
        <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">
            <span>Total Saldo Aktif</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <p className="text-xl font-bold font-mono text-white tracking-tight">
            {formatRupiah(totalBalance)}
          </p>

          <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-800">
            <div className="bg-slate-800/80 rounded-xl p-2">
              <div className="flex items-center gap-1.5 text-amber-400 text-[10px] font-semibold">
                <Banknote className="w-3 h-3" />
                <span>Kas Tunai</span>
              </div>
              <p className="text-xs font-bold font-mono text-slate-100 mt-0.5 truncate">
                {formatRupiah(cashBalance)}
              </p>
            </div>

            <div className="bg-slate-800/80 rounded-xl p-2">
              <div className="flex items-center gap-1.5 text-blue-400 text-[10px] font-semibold">
                <Building2 className="w-3 h-3" />
                <span>Bank</span>
              </div>
              <p className="text-xs font-bold font-mono text-slate-100 mt-0.5 truncate">
                {formatRupiah(bankBalance)}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Transaction Action Buttons */}
        <div className="grid grid-cols-2 gap-2 mt-3">
          <button
            onClick={() => {
              onAddTransaction('income');
              onCloseMobile();
            }}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-all cursor-pointer"
            title="Catat Pemasukan Baru"
          >
            <ArrowDownRight className="w-4 h-4" />
            <span>+ Masuk</span>
          </button>

          <button
            onClick={() => {
              onAddTransaction('expense');
              onCloseMobile();
            }}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-all cursor-pointer"
            title="Catat Pengeluaran Baru"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>+ Keluar</span>
          </button>
        </div>
      </div>

      {/* Navigation Links (Scrollable if screen is short) */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {navGroups.map((group, gIdx) => (
          <div key={gIdx} className="space-y-1.5">
            <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-gray-400">
              {group.groupTitle}
            </p>
            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectTab(item.id)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-xs sm:text-sm transition-all text-left ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                        : 'text-gray-700 hover:bg-gray-100/80 hover:text-gray-900'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          isActive
                            ? 'bg-indigo-500/40 text-white'
                            : 'bg-gray-100 text-gray-500 group-hover:text-gray-700'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <p className="leading-tight truncate">{item.label}</p>
                        <p
                          className={`text-[10px] truncate ${
                            isActive ? 'text-indigo-100' : 'text-gray-400'
                          }`}
                        >
                          {item.desc}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      {item.badge && (
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                            isActive
                              ? 'bg-white/20 text-white'
                              : 'bg-indigo-50 text-indigo-700'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                      <ChevronRight
                        className={`w-3.5 h-3.5 ${
                          isActive ? 'text-white/70' : 'text-gray-300'
                        }`}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* Master Data & Tools Section */}
        <div className="space-y-1.5 pt-2 border-t border-gray-100">
          <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-gray-400">
            Pengaturan &amp; Master Data
          </p>
          <div className="space-y-1">
            <button
              onClick={() => {
                onOpenCategories();
                onCloseMobile();
              }}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-gray-700 hover:bg-gray-100/80 hover:text-gray-900 transition-colors text-xs sm:text-sm font-medium"
            >
              <div className="w-8 h-8 rounded-lg bg-gray-100 text-gray-500 flex items-center justify-center shrink-0">
                <Tag className="w-4 h-4" />
              </div>
              <div className="text-left">
                <p className="leading-tight">Kategori Transaksi</p>
                <p className="text-[10px] text-gray-400">Pos masuk, keluar &amp; COA</p>
              </div>
            </button>

            <button
              onClick={() => {
                onOpenSettings();
                onCloseMobile();
              }}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-gray-700 hover:bg-gray-100/80 hover:text-gray-900 transition-colors text-xs sm:text-sm font-medium"
            >
              <div className="w-8 h-8 rounded-lg bg-gray-100 text-gray-500 flex items-center justify-center shrink-0">
                <Settings className="w-4 h-4" />
              </div>
              <div className="text-left">
                <p className="leading-tight">Cadangan &amp; Reset</p>
                <p className="text-[10px] text-gray-400">Backup JSON &amp; pengaturan</p>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Footer Status */}
      <div className="p-3.5 border-t border-gray-100 bg-gray-50/60 flex items-center justify-between text-[11px] text-gray-500">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Penyimpanan Lokal Aktif</span>
        </div>
        <span className="text-[10px] font-mono text-gray-400">v2.1</span>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Always Visible on lg and above) */}
      <aside className="hidden lg:block w-72 h-screen sticky top-0 shrink-0 z-30 print:hidden">
        {content}
      </aside>

      {/* Mobile Drawer (Visible when isOpenMobile is true) */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 lg:hidden print:hidden">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-gray-900/60 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          {/* Drawer Panel */}
          <div className="fixed inset-y-0 left-0 w-80 max-w-[85vw] bg-white shadow-2xl z-50 flex flex-col transform transition-transform ease-out duration-200">
            {content}
          </div>
        </div>
      )}
    </>
  );
}
