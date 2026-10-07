import React, { useState } from 'react';
import {
  LayoutDashboard,
  Database,
  Coins,
  Wallet,
  Building2,
  FileSpreadsheet,
  ArrowDownLeft,
  ArrowUpRight,
  BookOpen,
  PieChart,
  ShieldAlert,
  ChevronRight,
  X,
  Plus,
  PanelLeftClose,
  PanelLeftOpen,
  Target,
  Package,
} from 'lucide-react';
import { MainTabType, CompanyProfile } from '../types/finance';
import { formatRupiah } from '../utils/formatters';

interface SidebarProps {
  currentTab: MainTabType;
  onTabChange: (tab: MainTabType) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  totalCashAndBank: number;
  totalPiutang: number;
  totalHutang: number;
  onQuickNewTransaction: (module: 'kas_kecil' | 'kas_besar' | 'bank') => void;
  currentUser?: { name: string; role: string; id: string };
  isDarkMode?: boolean;
  onToggleTheme?: () => void;
  companyProfile?: CompanyProfile;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onTabChange,
  isOpenMobile,
  onCloseMobile,
  totalCashAndBank,
  totalPiutang,
  totalHutang,
  onQuickNewTransaction,
  currentUser,
  isDarkMode,
  onToggleTheme,
  companyProfile,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const isAdmin = currentUser?.role === 'super_admin' || currentUser?.role === 'finance_manager';

  const navSections = [
    {
      title: 'Kas & Perbankan',
      allowedRoles: ['all'],
      items: [
        { id: 'kas_kecil' as MainTabType, label: 'Kas Kecil', icon: Coins },
        { id: 'kas_besar' as MainTabType, label: 'Kas Besar', icon: Wallet },
        { id: 'bank' as MainTabType, label: 'Rekening Bank', icon: Building2 },
      ],
    },
    {
      title: 'Utama',
      allowedRoles: ['all'],
      items: [
        { id: 'dashboard' as MainTabType, label: 'Dashboard', icon: LayoutDashboard, badge: 'Live' },
      ],
    },
    {
      title: 'Fondasi Sistem',
      allowedRoles: ['admin'],
      items: [
        { id: 'master' as MainTabType, label: 'Data Master & COA', icon: Database },
      ],
    },
    {
      title: 'Hutang & Piutang',
      allowedRoles: ['all'],
      items: [
        { id: 'hutang' as MainTabType, label: 'Hutang Supplier', icon: ArrowDownLeft },
        { id: 'piutang' as MainTabType, label: 'Piutang Customer', icon: ArrowUpRight },
      ],
    },
    {
      title: 'Pembukuan (Accounting)',
      allowedRoles: ['admin'],
      items: [
        { id: 'jurnal' as MainTabType, label: 'Jurnal Transaksi', icon: FileSpreadsheet },
        { id: 'buku_besar' as MainTabType, label: 'Buku Besar & Pembantu', icon: BookOpen },
      ],
    },
    {
      title: 'Perencanaan & Aset',
      allowedRoles: ['admin'],
      items: [
        { id: 'budget' as MainTabType, label: 'Manajemen Anggaran', icon: Target },
        { id: 'asset' as MainTabType, label: 'Aset Tetap', icon: Package },
      ],
    },
    {
      title: 'Laporan & Audit',
      allowedRoles: ['admin'],
      items: [
        { id: 'laporan' as MainTabType, label: 'Laporan Keuangan', icon: PieChart },
        { id: 'settings_audit' as MainTabType, label: 'Pengaturan & Audit', icon: ShieldAlert },
      ],
    },
  ];

  const visibleSections = navSections.filter(
    (sec) => sec.allowedRoles.includes('all') || (sec.allowedRoles.includes('admin') && isAdmin)
  );

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-all duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-0 ${isOpenMobile ? 'translate-x-0 w-72' : `-translate-x-full lg:translate-x-0 ${isCollapsed ? 'w-20' : 'w-72'}`
          }`}
      >
        {/* Brand Header */}
        <div className={`p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between ${isCollapsed ? 'flex-col gap-4' : ''}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 shrink-0 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 p-1 flex items-center justify-center shadow-md shadow-indigo-500/10 overflow-hidden">
              <img src="/logonabastala.png" alt="Logo" className="w-full h-full object-contain rounded-lg" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            </div>
            {!isCollapsed && (
              <div className="animate-fade-in truncate">
                <h1 className="font-bold text-slate-900 dark:text-slate-100 text-sm tracking-tight truncate">{companyProfile?.productName || "NEBULA FINANCE"}</h1>
                <p className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 tracking-wider truncate uppercase">{companyProfile?.companyName ? "BY " + companyProfile.companyName.toUpperCase() : "BY NABASTALA"}</p>
              </div>
            )}
          </div>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title={isCollapsed ? "Buka Sidebar" : "Tutup Sidebar"}
          >
            {isCollapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
          </button>

          <button
            onClick={onCloseMobile}
            className="lg:hidden text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Info */}
        {!isCollapsed && (
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between animate-fade-in">
            <div className="flex flex-col truncate">
              <span className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">{currentUser?.name || 'Pengguna'}</span>
              <span className="text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400 truncate">{currentUser?.role === 'admin' ? 'Admin / Eksekutif' : 'Staff Operasional'}</span>
            </div>
          </div>
        )}

        {/* Top Quick Financial Snapshot (Moved from bottom) */}
        {!isCollapsed && (
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 animate-fade-in">
            <div className="space-y-2 mb-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 dark:text-slate-400">Kas & Bank</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 font-mono">
                  {formatRupiah(totalCashAndBank)}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 dark:text-slate-400">Piutang Aktif</span>
                <span className="font-semibold text-blue-600 dark:text-blue-400 font-mono">
                  {formatRupiah(totalPiutang)}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 dark:text-slate-400">Hutang Jatuh Tempo</span>
                <span className="font-semibold text-amber-600 dark:text-amber-400 font-mono">
                  {formatRupiah(totalHutang)}
                </span>
              </div>
            </div>

            {/* Quick Action Button */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onQuickNewTransaction('kas_kecil')}
                className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-medium flex items-center justify-center gap-1 transition border border-slate-200 dark:border-slate-700 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                <span>Kas Kecil</span>
              </button>
              <button
                onClick={() => onQuickNewTransaction('kas_besar')}
                className="px-2.5 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-600/30 hover:bg-indigo-100 dark:hover:bg-indigo-600/50 text-indigo-700 dark:text-indigo-200 text-[11px] font-medium flex items-center justify-center gap-1 transition border border-indigo-200 dark:border-indigo-500/30 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Kas Besar</span>
              </button>
            </div>
          </div>
        )}

        {/* Navigation Menus (Scrollable) */}
        <div className={`flex-1 overflow-y-auto py-4 space-y-6 ${isCollapsed ? 'px-2' : 'px-3'}`}>
          {visibleSections.map((section, sIdx) => (
            <div key={sIdx}>
              {!isCollapsed && (
                <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 animate-fade-in">
                  {section.title}
                </p>
              )}
              {isCollapsed && <div className="h-4 border-b border-slate-200 dark:border-slate-800 mb-4 mx-2"></div>}

              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      title={item.label}
                      onClick={() => {
                        onTabChange(item.id);
                        onCloseMobile();
                      }}
                      className={`w-full flex items-center ${isCollapsed ? 'justify-center p-3' : 'justify-between px-3 py-2.5'} rounded-xl text-left transition-all duration-150 group ${isActive
                          ? 'bg-gradient-to-r from-indigo-600/90 to-indigo-700 text-white font-semibold shadow-md shadow-indigo-600/20'
                          : 'text-slate-600 dark:text-slate-300 hover:text-indigo-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 font-medium'
                        }`}
                    >
                      <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 min-w-0'}`}>
                        <Icon
                          className={`w-5 h-5 shrink-0 transition-colors ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-500 dark:group-hover:text-indigo-400'
                            }`}
                        />
                        {!isCollapsed && (
                          <div className="truncate animate-fade-in">
                            <span className="text-xs block leading-tight">{item.label}</span>
                          </div>
                        )}
                      </div>
                      {!isCollapsed && item.badge && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 animate-fade-in">
                          {item.badge}
                        </span>
                      )}
                      {!isCollapsed && isActive && <ChevronRight className="w-4 h-4 text-white/70 shrink-0 animate-fade-in" />}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>


      </aside>
    </>
  );
};
