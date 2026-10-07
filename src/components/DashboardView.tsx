import React, { useState } from 'react';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  TrendingUp,
  ArrowRight,
  Sparkles,
  Receipt,
  Layers,
  Activity,
  Plus,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  COAAccount,
  BankAccount,
  Transaction,
  HutangRecord,
  PiutangRecord,
  JournalEntry,
  MainTabType,
  UserProfile,
} from '../types/finance';
import { formatRupiah, formatDate } from '../utils/formatters';
import { computeProfitAndLoss } from '../utils/accountingEngine';

interface DashboardViewProps {
  currentUser: UserProfile;
  coaList: COAAccount[];
  banks: BankAccount[];
  transactions: Transaction[];
  hutangList: HutangRecord[];
  piutangList: PiutangRecord[];
  journals: JournalEntry[];
  onNavigateTab: (tab: MainTabType) => void;
  onOpenNewTransaction: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  currentUser,
  coaList,
  banks,
  transactions,
  hutangList,
  piutangList,
  journals,
  onNavigateTab,
  onOpenNewTransaction,
}) => {
  // Compute Balances
  const kasKecilBal = React.useMemo(() => {
    let bal = 5000000;
    transactions.filter((t) => t.module === 'kas_kecil').forEach((t) => {
      if (t.type === 'income') bal += t.amount;
      else if (t.type === 'expense') bal -= t.amount;
    });
    return bal;
  }, [transactions]);

  const kasBesarBal = React.useMemo(() => {
    let bal = 35000000;
    transactions
      .filter((t) => t.module === 'kas_besar' || t.destAccount === 'kas_besar' || t.sourceAccount === 'kas_besar')
      .forEach((t) => {
        if (t.type === 'income' || t.destAccount === 'kas_besar') bal += t.amount;
        else if (t.type === 'expense' || t.sourceAccount === 'kas_besar') bal -= t.amount;
      });
    return bal;
  }, [transactions]);

  const totalBankBal = React.useMemo(() => {
    let total = banks.reduce((sum, b) => sum + b.initialBalance, 0);
    transactions.forEach((t) => {
      if (t.destAccount?.startsWith('bank-') || (t.module === 'bank' && t.type === 'income')) {
        total += t.amount;
      } else if (t.sourceAccount?.startsWith('bank-') || (t.module === 'bank' && t.type === 'expense')) {
        total -= t.amount;
      }
    });
    return total;
  }, [banks, transactions]);

  const totalLikuiditas = kasKecilBal + kasBesarBal + totalBankBal;

  // Receivables & Payables
  const totalPiutang = React.useMemo(
    () => piutangList.reduce((sum, p) => sum + p.remainingAmount, 0),
    [piutangList]
  );
  const totalHutang = React.useMemo(
    () => hutangList.reduce((sum, h) => sum + h.remainingAmount, 0),
    [hutangList]
  );

  // Accounting Engine Data
  const pnl = React.useMemo(() => computeProfitAndLoss(coaList, journals), [coaList, journals]);

  // Chart Data: Cash Flow Dynamic Wave
  const trendData = React.useMemo(() => {
    return [
      { name: 'Minggu 1', pemasukan: 18500000, pengeluaran: 4200000 },
      { name: 'Minggu 2', pemasukan: 26000000, pengeluaran: 6800000 },
      { name: 'Minggu 3', pemasukan: 42000000, pengeluaran: 12500000 },
      { name: 'Minggu 4', pemasukan: pnl.totalRevenue || 55000000, pengeluaran: pnl.totalExpense || 18000000 },
    ];
  }, [pnl]);

  // Donut Chart: Top Expense Categories
  const categoryDonutData = React.useMemo(() => {
    const rawCategories: Record<string, number> = {};
    transactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        const catName = t.contraAccountCode === '5104' ? 'Sewa Kantor' :
                        t.contraAccountCode === '5101' ? 'Gaji & Upah' :
                        t.contraAccountCode === '5108' ? 'Perlengkapan ATK' :
                        t.contraAccountCode === '5107' ? 'Konsumsi & Rapat' :
                        t.contraAccountCode === '5105' ? 'Transportasi' : 'Operasional';
        rawCategories[catName] = (rawCategories[catName] || 0) + t.amount;
      });

    const entries = Object.entries(rawCategories).map(([name, value]) => ({ name, value }));
    return entries.length > 0 ? entries : [
      { name: 'Sewa Kantor', value: 15000000 },
      { name: 'Gaji Karyawan', value: 8000000 },
      { name: 'Operasional', value: 3500000 },
      { name: 'Konsumsi & ATK', value: 1500000 },
    ];
  }, [transactions]);

  const DONUT_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#06b6d4'];

  // Custom Animated Tooltip
  const CustomAreaTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-3.5 bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-2xl backdrop-blur-xl text-xs space-y-1.5 animate-fade-in">
          <p className="font-semibold text-slate-300 mb-1 border-b border-slate-800 pb-1 flex items-center justify-between gap-4">
            <span>{label}</span>
            <span className="text-[10px] text-indigo-400 font-mono">Live Sync</span>
          </p>
          <div className="flex items-center justify-between gap-4 text-emerald-400">
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Pemasukan:
            </span>
            <span className="font-mono font-bold">{formatRupiah(payload[0]?.value || 0)}</span>
          </div>
          <div className="flex items-center justify-between gap-4 text-rose-400">
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-rose-500" /> Pengeluaran:
            </span>
            <span className="font-mono font-bold">{formatRupiah(payload[1]?.value || 0)}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  if (currentUser.role === 'finance_staff') {
    return (
      <div className="max-w-7xl mx-auto space-y-7 pb-12 animate-fade-in font-sans">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              Halo, {currentUser.name}
              <Sparkles className="w-5 h-5 text-indigo-500" />
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Selamat datang di NEBULA FINANCE (PT Nabastala). Kelola dan catat seluruh transaksi keuangan perusahaan dengan akurat.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenNewTransaction}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-xs font-bold shadow-lg shadow-indigo-500/25 transition-all duration-300 hover:-translate-y-0.5 flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Catat Transaksi</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
          <div onClick={() => onNavigateTab('kas_kecil')} className="p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800/80 shadow-sm cursor-pointer hover:border-indigo-500/50 transition-all">
             <h3 className="font-bold text-slate-800 dark:text-slate-100">Kas Kecil</h3>
             <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Kelola pengeluaran harian dan operasional kecil.</p>
          </div>
          <div onClick={() => onNavigateTab('kas_besar')} className="p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800/80 shadow-sm cursor-pointer hover:border-indigo-500/50 transition-all">
             <h3 className="font-bold text-slate-800 dark:text-slate-100">Kas Besar</h3>
             <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Kelola penerimaan dan pengeluaran tunai utama.</p>
          </div>
          <div onClick={() => onNavigateTab('bank')} className="p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800/80 shadow-sm cursor-pointer hover:border-indigo-500/50 transition-all">
             <h3 className="font-bold text-slate-800 dark:text-slate-100">Rekening Bank</h3>
             <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Mutasi rekening BCA dan Mandiri perusahaan.</p>
          </div>
          <div onClick={() => onNavigateTab('jurnal')} className="p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800/80 shadow-sm cursor-pointer hover:border-indigo-500/50 transition-all">
             <h3 className="font-bold text-slate-800 dark:text-slate-100">Jurnal Manual</h3>
             <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Input jurnal penyesuaian akuntansi (double-entry).</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-7 pb-12 animate-fade-in font-sans">
      {/* 1. Fresh Header with Live Pulse Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Sistem Aktif & Terverifikasi
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">• September 2026</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            Ikhtisar Keuangan Perusahaan
            <Sparkles className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigateTab('laporan')}
            className="px-4 py-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 text-xs font-semibold border border-slate-700/70 transition-all duration-300 hover:shadow-lg flex items-center gap-2 group"
          >
            <Layers className="w-4 h-4 text-indigo-400 group-hover:rotate-12 transition-transform" />
            <span>Laporan Akuntansi</span>
          </button>
          <button
            onClick={onOpenNewTransaction}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-xs font-bold shadow-lg shadow-indigo-500/25 transition-all duration-300 hover:-translate-y-0.5 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Catat Transaksi</span>
          </button>
        </div>
      </div>

      {/* 2. Three Animative KPI Cards (Smooth Hover Float) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Total Saldo Likuiditas Kas & Bank */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-md group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Likuiditas Kas & Bank
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-500/20 group-hover:scale-110 transition-transform duration-300 shadow-inner">
              <Wallet className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-4">
            <h3 className="text-3xl font-bold font-mono text-slate-800 dark:text-white tracking-tight">
              {formatRupiah(totalLikuiditas)}
            </h3>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/70 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span>Bank: <strong className="text-slate-700 dark:text-slate-300 font-mono">{formatRupiah(totalBankBal)}</strong></span>
            <span>Kas: <strong className="text-slate-700 dark:text-slate-300 font-mono">{formatRupiah(kasKecilBal + kasBesarBal)}</strong></span>
          </div>
        </div>

        {/* Card 2: Pemasukan Bulan Ini */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-md group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Pemasukan Bulan Ini
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-500/20 group-hover:scale-110 transition-transform duration-300 shadow-inner">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-4">
            <h3 className="text-3xl font-bold font-mono text-emerald-400 tracking-tight">
              {formatRupiah(pnl.totalRevenue)}
            </h3>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/70 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
              <TrendingUp className="w-3.5 h-3.5" /> Arus Kas Stabil
            </span>
            <span className="text-slate-500 dark:text-slate-400 font-medium">Penjualan & Jasa</span>
          </div>
        </div>

        {/* Card 3: Pengeluaran Bulan Ini */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-md group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Pengeluaran Bulan Ini
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-100 dark:border-rose-500/20 group-hover:scale-110 transition-transform duration-300 shadow-inner">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-4">
            <h3 className="text-3xl font-bold font-mono text-rose-400 tracking-tight">
              {formatRupiah(pnl.totalExpense)}
            </h3>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/70 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Laba Bersih: <strong className="text-slate-800 dark:text-white font-mono">{formatRupiah(pnl.netProfit)}</strong></span>
            <span className="text-slate-500 dark:text-slate-400">Operasional</span>
          </div>
        </div>
      </div>

      {/* 3. Compact Hutang & Piutang Row (Animative Hover) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div
          onClick={() => onNavigateTab('piutang')}
          className="p-4.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-400 dark:hover:border-blue-500/50 hover:shadow-md group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs border border-blue-100 dark:border-blue-500/20 group-hover:scale-105 transition-transform">
              AR
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Piutang Customer (Tagihan Tempo)</p>
              <p className="text-lg font-bold font-mono text-blue-600 dark:text-blue-400">{formatRupiah(totalPiutang)}</p>
            </div>
          </div>
          <span className="text-xs text-indigo-600 dark:text-indigo-400 flex items-center gap-1 font-semibold group-hover:translate-x-1 transition-transform">
            Buka Faktur <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>

        <div
          onClick={() => onNavigateTab('hutang')}
          className="p-4.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:border-amber-400 dark:hover:border-amber-500/50 hover:shadow-md group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-xs border border-amber-100 dark:border-amber-500/20 group-hover:scale-105 transition-transform">
              AP
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Hutang Supplier (Kewajiban Tempo)</p>
              <p className="text-lg font-bold font-mono text-amber-600 dark:text-amber-400">{formatRupiah(totalHutang)}</p>
            </div>
          </div>
          <span className="text-xs text-indigo-600 dark:text-indigo-400 flex items-center gap-1 font-semibold group-hover:translate-x-1 transition-transform">
            Buka Faktur <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>

      {/* 4. Professional Animated Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart: Smooth Cash Flow Trend (Recharts AreaChart with Bezier Wave) */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between transition-all duration-300">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  Tren Arus Kas Masuk vs Keluar
                  <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
                </h3>
              </div>

              <div className="flex items-center gap-4 text-xs font-medium">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm" /> Pemasukan
                </span>
                <span className="flex items-center gap-1.5 text-rose-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm" /> Pengeluaran
                </span>
              </div>
            </div>

            {/* Recharts Container with Smooth Bezier & Animation */}
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorIncFresh" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.45} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorExpFresh" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="name"
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => `Rp${val / 1000000}M`}
                  />
                  <Tooltip content={<CustomAreaTooltip />} />
                  <Area
                    type="natural"
                    dataKey="pemasukan"
                    stroke="#10b981"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorIncFresh)"
                    isAnimationActive={true}
                    animationDuration={1500}
                    animationEasing="ease-out"
                  />
                  <Area
                    type="natural"
                    dataKey="pengeluaran"
                    stroke="#f43f5e"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorExpFresh)"
                    isAnimationActive={true}
                    animationDuration={1500}
                    animationEasing="ease-out"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Keseimbangan Likuiditas Terjaga</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400 font-mono">Surplus: +{formatRupiah(pnl.netProfit)}</span>
          </div>
        </div>

        {/* Donut Chart: Komposisi Beban Terbesar */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between transition-all duration-300">
          <div>
            <h3 className="text-base font-bold text-slate-800 dark:text-white mb-3">Distribusi Biaya</h3>

            <div className="h-52 w-full flex items-center justify-center relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryDonutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={78}
                    paddingAngle={5}
                    dataKey="value"
                    isAnimationActive={true}
                    animationDuration={1200}
                  >
                    {categoryDonutData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any) => [formatRupiah(Number(val)), 'Nominal']}
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '1rem',
                      fontSize: '12px',
                      fontFamily: 'Poppins, sans-serif',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute text-center pointer-events-none">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block uppercase font-medium">Beban</span>
                <span className="text-xs font-bold text-slate-800 dark:text-white font-mono">100%</span>
              </div>
            </div>

            {/* Custom Legend */}
            <div className="space-y-2 mt-2 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs">
              {categoryDonutData.slice(0, 4).map((item, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shadow-sm"
                      style={{ backgroundColor: DONUT_COLORS[idx % DONUT_COLORS.length] }}
                    />
                    <span className="text-slate-700 dark:text-slate-300 truncate max-w-[120px] font-medium">{item.name}</span>
                  </div>
                  <span className="font-mono text-slate-500 dark:text-slate-400 font-semibold">{formatRupiah(item.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 5. Clean & Fresh Activity Feed */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-base font-bold text-slate-800 dark:text-white">Mutasi Terakhir</h3>
          </div>
          <button
            onClick={() => onNavigateTab('kas_besar')}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 flex items-center gap-1 group"
          >
            <span>Semua Mutasi</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800/70">
          {transactions.slice(0, 5).map((t) => {
            const isInc = t.type === 'income' || t.destAccount === 'kas_besar';
            return (
              <div
                key={t.id}
                className="py-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 px-3 rounded-xl transition-all duration-200"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                      isInc
                        ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20'
                        : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-500/20'
                    }`}
                  >
                    {isInc ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownLeft className="w-5 h-5" />}
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-semibold text-slate-800 dark:text-white truncate">{t.description}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {t.recipientOrPayer} • {formatDate(t.date)}
                    </p>
                  </div>
                </div>

                <div className="text-right pl-4 shrink-0 font-mono">
                  <span
                    className={`text-xs sm:text-sm font-bold block ${
                      isInc ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {isInc ? '+' : '-'}{formatRupiah(t.amount)}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block capitalize font-sans">
                    {t.module.replace('_', ' ')}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
