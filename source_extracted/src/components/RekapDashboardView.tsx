import React, { useMemo, useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Calendar,
  ArrowDownRight,
  ArrowUpRight,
  PieChart,
  BarChart3,
  CalendarDays,
  Percent,
  Layers,
  Sparkles
} from 'lucide-react';
import { Category, PeriodFilter, Transaction, TransactionType } from '../types';
import { formatDateIndo, formatRupiah, getStartAndEndDateForPeriod } from '../utils/formatters';
import { CategoryIcon } from './CategoryIcon';

interface RekapDashboardViewProps {
  transactions: Transaction[];
  categories: Category[];
  period: PeriodFilter;
  setPeriod: (period: PeriodFilter) => void;
  customRange: { startDate: string; endDate: string };
  setCustomRange: (range: { startDate: string; endDate: string }) => void;
  onAddTransaction: (type: TransactionType) => void;
}

export function RekapDashboardView({
  transactions,
  categories,
  period,
  setPeriod,
  customRange,
  setCustomRange,
  onAddTransaction,
}: RekapDashboardViewProps) {
  const [activeCategoryTab, setActiveCategoryTab] = useState<'expense' | 'income'>('expense');

  const categoriesMap = useMemo(() => {
    return new Map(categories.map((c) => [c.id, c]));
  }, [categories]);

  // Determine current active date boundaries
  const { startDate, endDate } = useMemo(() => {
    return getStartAndEndDateForPeriod(period, customRange);
  }, [period, customRange]);

  // Filter transactions within the selected period
  const periodTransactions = useMemo(() => {
    return transactions.filter((t) => {
      return t.date >= startDate && t.date <= endDate;
    });
  }, [transactions, startDate, endDate]);

  // Calculate summaries
  const { totalIncome, totalExpense, netBalance, incomeCount, expenseCount } = useMemo(() => {
    let inc = 0;
    let exp = 0;
    let incCnt = 0;
    let expCnt = 0;

    for (const t of periodTransactions) {
      if (t.type === 'income') {
        inc += t.amount;
        incCnt++;
      } else {
        exp += t.amount;
        expCnt++;
      }
    }

    return {
      totalIncome: inc,
      totalExpense: exp,
      netBalance: inc - exp,
      incomeCount: incCnt,
      expenseCount: expCnt,
    };
  }, [periodTransactions]);

  // Category breakdown for current period
  const categoryBreakdown = useMemo(() => {
    const targetTxs = periodTransactions.filter((t) => t.type === activeCategoryTab);
    const total = activeCategoryTab === 'income' ? totalIncome : totalExpense;

    const map = new Map<string, number>();
    for (const t of targetTxs) {
      map.set(t.categoryId, (map.get(t.categoryId) || 0) + t.amount);
    }

    const items = Array.from(map.entries()).map(([catId, amount]) => {
      const cat = categoriesMap.get(catId);
      const percentage = total > 0 ? (amount / total) * 100 : 0;
      return {
        catId,
        name: cat?.name || 'Tanpa Kategori',
        color: cat?.color || '#94a3b8',
        iconName: cat?.iconName,
        amount,
        percentage,
      };
    });

    // Sort highest amount first
    items.sort((a, b) => b.amount - a.amount);
    return items;
  }, [periodTransactions, activeCategoryTab, totalIncome, totalExpense, categoriesMap]);

  // Daily or periodic trend breakdown
  const dailyTrends = useMemo(() => {
    const dayMap = new Map<string, { date: string; income: number; expense: number }>();

    for (const t of periodTransactions) {
      const entry = dayMap.get(t.date) || { date: t.date, income: 0, expense: 0 };
      if (t.type === 'income') entry.income += t.amount;
      else entry.expense += t.amount;
      dayMap.set(t.date, entry);
    }

    const list = Array.from(dayMap.values());
    list.sort((a, b) => a.date.localeCompare(b.date));
    return list;
  }, [periodTransactions]);

  // Max value for bar scaling in charts
  const maxDayValue = useMemo(() => {
    let max = 1;
    for (const d of dailyTrends) {
      if (d.income > max) max = d.income;
      if (d.expense > max) max = d.expense;
    }
    return max;
  }, [dailyTrends]);

  // Top 5 largest transactions
  const topTransactions = useMemo(() => {
    const sorted = [...periodTransactions].sort((a, b) => b.amount - a.amount);
    return sorted.slice(0, 5);
  }, [periodTransactions]);

  return (
    <div className="space-y-6">
      {/* Period Filter Bar */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
            <CalendarDays className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Rentang Waktu</span>
            <p className="text-sm font-bold text-gray-900">Periode Rekap Keuangan</p>
          </div>
        </div>

        {/* Period Pills */}
        <div className="flex flex-wrap items-center gap-1 bg-gray-100 p-1 rounded-xl">
          {[
            { id: 'today', label: 'Hari Ini' },
            { id: 'this_week', label: 'Minggu Ini' },
            { id: 'this_month', label: 'Bulan Ini' },
            { id: 'last_month', label: 'Bulan Lalu' },
            { id: 'this_year', label: 'Tahun Ini' },
            { id: 'all', label: 'Semua Waktu' },
            { id: 'custom', label: 'Kustom' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setPeriod(item.id as PeriodFilter)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                period === item.id
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Custom Date Picker if custom selected */}
        {period === 'custom' && (
          <div className="flex items-center gap-2 text-xs bg-gray-50 p-2 rounded-xl border border-gray-200">
            <input
              type="date"
              value={customRange.startDate}
              onChange={(e) => setCustomRange({ ...customRange, startDate: e.target.value })}
              className="px-2.5 py-1 bg-white border border-gray-200 rounded-lg text-gray-700 font-medium"
            />
            <span className="text-gray-400">s/d</span>
            <input
              type="date"
              value={customRange.endDate}
              onChange={(e) => setCustomRange({ ...customRange, endDate: e.target.value })}
              className="px-2.5 py-1 bg-white border border-gray-200 rounded-lg text-gray-700 font-medium"
            />
          </div>
        )}
      </div>

      {/* Main 3 Key Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Total Pemasukan */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Total Pemasukan
              </span>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div className="font-bold text-2xl lg:text-3xl text-emerald-600 font-mono tracking-tight mb-1">
              +{formatRupiah(totalIncome)}
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-100 mt-4">
            <span>{incomeCount} transaksi masuk</span>
            <button
              onClick={() => onAddTransaction('income')}
              className="font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 hover:underline"
            >
              <ArrowDownRight className="w-3.5 h-3.5" /> + Tambah
            </button>
          </div>
        </div>

        {/* Card 2: Total Pengeluaran */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Total Pengeluaran
              </span>
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <TrendingDown className="w-5 h-5" />
              </div>
            </div>
            <div className="font-bold text-2xl lg:text-3xl text-rose-600 font-mono tracking-tight mb-1">
              -{formatRupiah(totalExpense)}
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-100 mt-4">
            <span>{expenseCount} transaksi keluar</span>
            <button
              onClick={() => onAddTransaction('expense')}
              className="font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 hover:underline"
            >
              <ArrowUpRight className="w-3.5 h-3.5" /> + Catat
            </button>
          </div>
        </div>

        {/* Card 3: Saldo Bersih */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Saldo Bersih Periode Ini
              </span>
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Wallet className="w-5 h-5" />
              </div>
            </div>
            <div
              className={`font-bold text-2xl lg:text-3xl font-mono tracking-tight mb-1 ${
                netBalance >= 0 ? 'text-gray-900' : 'text-rose-600'
              }`}
            >
              {formatRupiah(netBalance)}
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-100 mt-4">
            <span>
              Efisiensi:{' '}
              <span className="font-semibold text-gray-700">
                {totalIncome > 0 ? `${Math.round(((totalIncome - totalExpense) / totalIncome) * 100)}%` : '0%'}
              </span>
            </span>
            <span
              className={`font-semibold px-2.5 py-0.5 rounded-full text-[11px] ${
                netBalance >= 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'
              }`}
            >
              {netBalance >= 0 ? 'Surplus Kas' : 'Defisit Kas'}
            </span>
          </div>
        </div>
      </div>

      {/* Grid: Breakdown per Kategori & Daily Trend Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Category Breakdown (7 cols) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                <PieChart className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm">
                  Distribusi Kategori
                </h3>
                <p className="text-xs text-gray-500">
                  Rincian {activeCategoryTab === 'expense' ? 'pengeluaran' : 'pemasukan'} per kategori
                </p>
              </div>
            </div>

            {/* Toggle Income vs Expense breakdown */}
            <div className="inline-flex bg-gray-100 p-0.5 rounded-lg border border-gray-200/60 text-xs">
              <button
                onClick={() => setActiveCategoryTab('expense')}
                className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
                  activeCategoryTab === 'expense'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Pengeluaran
              </button>
              <button
                onClick={() => setActiveCategoryTab('income')}
                className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
                  activeCategoryTab === 'income'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Pemasukan
              </button>
            </div>
          </div>

          {categoryBreakdown.length === 0 ? (
            <div className="py-14 text-center text-gray-400">
              <div className="w-12 h-12 rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center mx-auto mb-2">
                <Layers className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-gray-700">
                Belum ada data {activeCategoryTab === 'expense' ? 'pengeluaran' : 'pemasukan'} pada periode ini.
              </p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {categoryBreakdown.map((item) => (
                <div key={item.catId} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5 truncate max-w-[65%]">
                      <div
                        className="w-6 h-6 rounded-lg flex items-center justify-center text-white shrink-0 shadow-xs"
                        style={{ backgroundColor: item.color }}
                      >
                        <CategoryIcon name={item.iconName} className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-semibold text-gray-800 truncate">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono">
                      <span className="font-bold text-gray-900">{formatRupiah(item.amount)}</span>
                      <span className="text-[11px] text-gray-400 w-11 text-right font-medium">
                        {item.percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${item.percentage}%`,
                        backgroundColor: item.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Daily Cashflow Trend Bars (5 cols) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm">Tren Arus Kas</h3>
                <p className="text-xs text-gray-500">Aktivitas harian</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-medium">
              <span className="flex items-center gap-1.5 text-emerald-700">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Masuk
              </span>
              <span className="flex items-center gap-1.5 text-rose-700">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" /> Keluar
              </span>
            </div>
          </div>

          {dailyTrends.length === 0 ? (
            <div className="py-14 text-center text-gray-400 text-sm">
              Tidak ada catatan transaksi pada rentang periode ini.
            </div>
          ) : (
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {dailyTrends.map((d) => {
                const incHeight = maxDayValue > 0 ? (d.income / maxDayValue) * 100 : 0;
                const expHeight = maxDayValue > 0 ? (d.expense / maxDayValue) * 100 : 0;
                return (
                  <div key={d.date} className="p-2.5 bg-gray-50 rounded-xl border border-gray-100 text-xs">
                    <div className="flex justify-between items-center mb-1.5 text-gray-600">
                      <span className="font-semibold text-gray-800">{formatDateIndo(d.date)}</span>
                      <span className="font-mono text-[11px] text-gray-500">
                        Net: {formatRupiah(d.income - d.expense)}
                      </span>
                    </div>

                    {/* Comparative bars */}
                    <div className="space-y-1">
                      {d.income > 0 && (
                        <div className="flex items-center gap-2">
                          <div className="w-12 text-[10px] text-emerald-700 font-semibold">+Masuk</div>
                          <div className="flex-1 bg-emerald-100/60 h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-emerald-500 h-full rounded-full"
                              style={{ width: `${incHeight}%` }}
                            />
                          </div>
                          <div className="w-24 text-right text-[11px] font-mono text-emerald-700 font-semibold">
                            {formatRupiah(d.income)}
                          </div>
                        </div>
                      )}

                      {d.expense > 0 && (
                        <div className="flex items-center gap-2">
                          <div className="w-12 text-[10px] text-rose-700 font-semibold">-Keluar</div>
                          <div className="flex-1 bg-rose-100/60 h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-rose-500 h-full rounded-full"
                              style={{ width: `${expHeight}%` }}
                            />
                          </div>
                          <div className="w-24 text-right text-[11px] font-mono text-rose-700 font-semibold">
                            {formatRupiah(d.expense)}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Top 5 Transaksi Terbesar */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-gray-900 text-sm">
              5 Transaksi Nominal Terbesar
            </h3>
            <p className="text-xs text-gray-500">Pada periode yang dipilih</p>
          </div>
          <span className="text-xs text-gray-400 font-mono">Urutan Nominal Tertinggi</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {topTransactions.map((tx, idx) => {
            const cat = categoriesMap.get(tx.categoryId);
            return (
              <div
                key={tx.id}
                className="p-3.5 bg-gray-50/80 border border-gray-200/80 rounded-xl space-y-2 hover:border-gray-300 transition-all"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-gray-400 font-bold">#{idx + 1}</span>
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                      tx.type === 'income'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {tx.type === 'income' ? 'Masuk' : 'Keluar'}
                  </span>
                </div>
                <div
                  className={`font-bold font-mono text-base ${
                    tx.type === 'income' ? 'text-emerald-700' : 'text-rose-700'
                  }`}
                >
                  {tx.type === 'income' ? '+' : '-'}
                  {formatRupiah(tx.amount)}
                </div>
                <p className="text-xs font-semibold text-gray-800 truncate">{cat?.name}</p>
                <p className="text-[11px] text-gray-500 truncate">{tx.description || '-'}</p>
                <p className="text-[10px] text-gray-400 font-mono">{formatDateIndo(tx.date)}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
