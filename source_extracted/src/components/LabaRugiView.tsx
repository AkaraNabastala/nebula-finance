import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Download,
  Printer,
  DollarSign,
  Percent,
  Calculator,
  Building2,
  Banknote,
  PieChart,
  BarChart3,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Layers,
  ArrowDownRight,
  ArrowUpRight
} from 'lucide-react';
import { AccountType, Category, Transaction } from '../types';
import { formatDateIndo, formatRupiah, getMonthNameIndo } from '../utils/formatters';
import { exportLabaRugiToExcel, LabaRugiCategorySummary } from '../utils/export';
import { CategoryIcon } from './CategoryIcon';

interface LabaRugiViewProps {
  transactions: Transaction[];
  categories: Category[];
}

export function LabaRugiView({ transactions, categories }: LabaRugiViewProps) {
  const [periodType, setPeriodType] = useState<'all' | 'monthly' | 'yearly' | 'custom'>('this_month');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [accountFilter, setAccountFilter] = useState<'all' | AccountType>('all');
  const [customStartDate, setCustomStartDate] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  });
  const [customEndDate, setCustomEndDate] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });

  const categoriesMap = useMemo(() => {
    return new Map(categories.map((c) => [c.id, c]));
  }, [categories]);

  // Available Years
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    years.add(new Date().getFullYear());
    transactions.forEach((t) => {
      const y = parseInt(t.date.split('-')[0], 10);
      if (!isNaN(y)) years.add(y);
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [transactions]);

  // Filter transactions according to selected Period & Account
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    const currentY = now.getFullYear();
    const currentM = now.getMonth() + 1;

    return transactions.filter((t) => {
      // Account filter
      if (accountFilter !== 'all' && (t.account || 'cash') !== accountFilter) {
        return false;
      }

      const [yStr, mStr] = t.date.split('-');
      const y = parseInt(yStr, 10);
      const m = parseInt(mStr, 10);

      if (periodType === 'this_month') {
        return y === currentY && m === currentM;
      }
      if (periodType === 'monthly') {
        return y === selectedYear && m === selectedMonth;
      }
      if (periodType === 'yearly') {
        return y === selectedYear;
      }
      if (periodType === 'custom') {
        return t.date >= customStartDate && t.date <= customEndDate;
      }
      if (periodType === 'all') {
        return true;
      }
      return true;
    });
  }, [transactions, periodType, selectedYear, selectedMonth, customStartDate, customEndDate, accountFilter]);

  // Period label for headers & export
  const periodLabel = useMemo(() => {
    const now = new Date();
    if (periodType === 'this_month') return `Bulan Ini (${getMonthNameIndo(now.getMonth() + 1)} ${now.getFullYear()})`;
    if (periodType === 'monthly') return `${getMonthNameIndo(selectedMonth)} ${selectedYear}`;
    if (periodType === 'yearly') return `Tahun ${selectedYear}`;
    if (periodType === 'custom') return `${formatDateIndo(customStartDate)} s.d ${formatDateIndo(customEndDate)}`;
    if (periodType === 'all') return 'Semua Waktu';
    return '';
  }, [periodType, selectedMonth, selectedYear, customStartDate, customEndDate]);

  // Income summary items
  const { incomeItems, totalIncome } = useMemo(() => {
    const incomeCats = categories.filter((c) => c.type === 'income');
    const incomeTxs = filteredTransactions.filter((t) => t.type === 'income');
    const totIncome = incomeTxs.reduce((sum, t) => sum + t.amount, 0);

    const items: LabaRugiCategorySummary[] = incomeCats.map((cat, idx) => {
      const catTxs = incomeTxs.filter((t) => t.categoryId === cat.id);
      const total = catTxs.reduce((sum, t) => sum + t.amount, 0);
      const percentage = totIncome > 0 ? (total / totIncome) * 100 : 0;
      const code = `4-${(idx + 1).toString().padStart(4, '0')}`;

      return {
        code,
        name: cat.name,
        type: 'income',
        count: catTxs.length,
        total,
        percentage,
      };
    });

    // Also include any orphan income categories if any
    const registeredCatIds = new Set(incomeCats.map((c) => c.id));
    const orphanTxs = incomeTxs.filter((t) => !registeredCatIds.has(t.categoryId));
    if (orphanTxs.length > 0) {
      const orphanTotal = orphanTxs.reduce((sum, t) => sum + t.amount, 0);
      items.push({
        code: '4-9999',
        name: 'Pendapatan Lain-lain',
        type: 'income',
        count: orphanTxs.length,
        total: orphanTotal,
        percentage: totIncome > 0 ? (orphanTotal / totIncome) * 100 : 0,
      });
    }

    return {
      incomeItems: items.filter((i) => i.total > 0 || i.count > 0),
      totalIncome: totIncome,
    };
  }, [filteredTransactions, categories]);

  // Expense summary items
  const { expenseItems, totalExpense } = useMemo(() => {
    const expenseCats = categories.filter((c) => c.type === 'expense');
    const expenseTxs = filteredTransactions.filter((t) => t.type === 'expense');
    const totExpense = expenseTxs.reduce((sum, t) => sum + t.amount, 0);

    const items: LabaRugiCategorySummary[] = expenseCats.map((cat, idx) => {
      const catTxs = expenseTxs.filter((t) => t.categoryId === cat.id);
      const total = catTxs.reduce((sum, t) => sum + t.amount, 0);
      const percentage = totalIncome > 0 ? (total / totalIncome) * 100 : 0;
      const code = `5-${(idx + 1).toString().padStart(4, '0')}`;

      return {
        code,
        name: cat.name,
        type: 'expense',
        count: catTxs.length,
        total,
        percentage,
      };
    });

    // Orphan expenses
    const registeredCatIds = new Set(expenseCats.map((c) => c.id));
    const orphanTxs = expenseTxs.filter((t) => !registeredCatIds.has(t.categoryId));
    if (orphanTxs.length > 0) {
      const orphanTotal = orphanTxs.reduce((sum, t) => sum + t.amount, 0);
      items.push({
        code: '5-9999',
        name: 'Beban Operasional Lain-lain',
        type: 'expense',
        count: orphanTxs.length,
        total: orphanTotal,
        percentage: totalIncome > 0 ? (orphanTotal / totalIncome) * 100 : 0,
      });
    }

    return {
      expenseItems: items.filter((i) => i.total > 0 || i.count > 0),
      totalExpense: totExpense,
    };
  }, [filteredTransactions, categories, totalIncome]);

  // Profit / Loss calculation
  const netProfit = totalIncome - totalExpense;
  const isProfit = netProfit >= 0;
  const netProfitMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;
  const expenseRatio = totalIncome > 0 ? (totalExpense / totalIncome) * 100 : 0;

  // Monthly Trend Breakdown for the active year
  const activeYearForTrend = periodType === 'monthly' || periodType === 'yearly' ? selectedYear : new Date().getFullYear();

  const monthlyTrendData = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, i) => i + 1);
    return months.map((m) => {
      const txs = transactions.filter((t) => {
        if (accountFilter !== 'all' && (t.account || 'cash') !== accountFilter) return false;
        const [yStr, mStr] = t.date.split('-');
        return parseInt(yStr, 10) === activeYearForTrend && parseInt(mStr, 10) === m;
      });

      const inc = txs.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
      const exp = txs.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
      const net = inc - exp;
      const margin = inc > 0 ? (net / inc) * 100 : 0;

      return {
        month: m,
        monthName: getMonthNameIndo(m),
        income: inc,
        expense: exp,
        netProfit: net,
        margin,
        txCount: txs.length,
      };
    });
  }, [transactions, activeYearForTrend, accountFilter]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* Top Header Controls Bar */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs space-y-4 print:border-none print:shadow-none">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100">
              <TrendingUp className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-gray-900 tracking-tight">
                  Laporan Laba Rugi (Profit &amp; Loss Statement)
                </h2>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full">
                  Income Statement
                </span>
              </div>
              <p className="text-xs text-gray-500 font-normal">
                Analisis pendapatan operasional, pos beban, laba/rugi bersih &amp; margin keuntungan usaha
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 print:hidden">
            <button
              onClick={() =>
                exportLabaRugiToExcel(
                  incomeItems,
                  expenseItems,
                  totalIncome,
                  totalExpense,
                  netProfit,
                  periodLabel
                )
              }
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-semibold rounded-xl transition-all shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Excel</span>
            </button>

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-xl transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Laporan</span>
            </button>
          </div>
        </div>

        {/* Filters and Period Selectors */}
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-gray-100 print:hidden">
          {/* Period Type Selection */}
          <div className="inline-flex bg-gray-100 p-0.5 rounded-lg border border-gray-200/60 text-xs">
            <button
              onClick={() => setPeriodType('this_month')}
              className={`px-3 py-1 rounded-md font-semibold transition-all ${
                periodType === 'this_month' ? 'bg-indigo-600 text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Bulan Ini
            </button>
            <button
              onClick={() => setPeriodType('monthly')}
              className={`px-3 py-1 rounded-md font-semibold transition-all ${
                periodType === 'monthly' ? 'bg-indigo-600 text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Pilih Bulan
            </button>
            <button
              onClick={() => setPeriodType('yearly')}
              className={`px-3 py-1 rounded-md font-semibold transition-all ${
                periodType === 'yearly' ? 'bg-indigo-600 text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Tahunan
            </button>
            <button
              onClick={() => setPeriodType('all')}
              className={`px-3 py-1 rounded-md font-semibold transition-all ${
                periodType === 'all' ? 'bg-indigo-600 text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Semua Waktu
            </button>
            <button
              onClick={() => setPeriodType('custom')}
              className={`px-3 py-1 rounded-md font-semibold transition-all ${
                periodType === 'custom' ? 'bg-indigo-600 text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Kustom
            </button>
          </div>

          {/* Account Channel Filter */}
          <div className="inline-flex bg-gray-100 p-0.5 rounded-lg border border-gray-200/60 text-xs">
            <button
              onClick={() => setAccountFilter('all')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                accountFilter === 'all' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Semua Akun
            </button>
            <button
              onClick={() => setAccountFilter('cash')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all flex items-center gap-1 ${
                accountFilter === 'cash' ? 'bg-amber-500 text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Banknote className="w-3 h-3" />
              Kas Tunai
            </button>
            <button
              onClick={() => setAccountFilter('bank')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all flex items-center gap-1 ${
                accountFilter === 'bank' ? 'bg-blue-600 text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Building2 className="w-3 h-3" />
              Bank
            </button>
          </div>

          {/* Month / Year pickers */}
          {periodType === 'monthly' && (
            <div className="flex items-center gap-1.5 text-xs">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
                className="px-2.5 py-1 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold text-gray-800"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>
                    {getMonthNameIndo(m)}
                  </option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
                className="px-2.5 py-1 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold text-gray-800"
              >
                {availableYears.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          )}

          {periodType === 'yearly' && (
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
              className="px-2.5 py-1 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold text-gray-800"
            >
              {availableYears.map((y) => (
                <option key={y} value={y}>
                  Tahun {y}
                </option>
              ))}
            </select>
          )}

          {periodType === 'custom' && (
            <div className="flex items-center gap-1.5 text-xs">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold text-gray-800"
              />
              <span className="text-gray-400">s/d</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold text-gray-800"
              />
            </div>
          )}

          <span className="text-xs font-semibold text-gray-500 ml-auto bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-200/60">
            {periodLabel}
          </span>
        </div>
      </div>

      {/* Printable Report Header for Official Print / Export */}
      <div className="hidden print:block text-center border-b pb-4 mb-4">
        <h1 className="text-xl font-bold uppercase tracking-tight">LAPORAN LABA RUGI (INCOME STATEMENT)</h1>
        <p className="text-sm text-gray-600 mt-0.5">Periode: {periodLabel}</p>
        <p className="text-xs text-gray-400 mt-0.5">Dicetak pada: {new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}</p>
      </div>

      {/* Executive Key Performance Cards (KPI) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Pendapatan */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Total Pendapatan</span>
            <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-bold font-mono text-emerald-600 mt-1">
            +{formatRupiah(totalIncome)}
          </p>
          <div className="flex items-center justify-between text-[11px] text-gray-500 mt-2 pt-2 border-t border-gray-100">
            <span>{incomeItems.reduce((sum, i) => sum + i.count, 0)} transaksi</span>
            <span className="font-semibold text-emerald-700">100% Basis</span>
          </div>
        </div>

        {/* Total Beban */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Total Beban Operasional</span>
            <div className="p-1.5 bg-rose-50 text-rose-600 rounded-lg">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-bold font-mono text-rose-600 mt-1">
            -{formatRupiah(totalExpense)}
          </p>
          <div className="flex items-center justify-between text-[11px] text-gray-500 mt-2 pt-2 border-t border-gray-100">
            <span>{expenseItems.reduce((sum, i) => sum + i.count, 0)} transaksi</span>
            <span className="font-semibold text-rose-700">Rasio: {expenseRatio.toFixed(1)}%</span>
          </div>
        </div>

        {/* Laba / Rugi Bersih */}
        <div
          className={`p-4 rounded-2xl border shadow-xs ${
            isProfit
              ? 'bg-emerald-600 text-white border-emerald-700'
              : 'bg-rose-600 text-white border-rose-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider opacity-90">
              {isProfit ? 'LABA BERSIH (SURPLUS)' : 'RUGI BERSIH (DEFISIT)'}
            </span>
            <div className="p-1.5 bg-white/20 rounded-lg text-white">
              {isProfit ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            </div>
          </div>
          <p className="text-xl font-bold font-mono text-white mt-1">
            {formatRupiah(netProfit)}
          </p>
          <div className="flex items-center justify-between text-[11px] opacity-90 mt-2 pt-2 border-t border-white/20">
            <span>Hasil Akhir Usaha</span>
            <span className="font-semibold">{isProfit ? 'Kinerja Menguntungkan' : 'Evaluasi Pengeluaran'}</span>
          </div>
        </div>

        {/* Profit Margin (%) */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Net Profit Margin</span>
            <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <p className={`text-xl font-bold font-mono mt-1 ${isProfit ? 'text-indigo-600' : 'text-rose-600'}`}>
            {netProfitMargin.toFixed(1)}%
          </p>
          <div className="flex items-center justify-between text-[11px] text-gray-500 mt-2 pt-2 border-t border-gray-100">
            <span>Efisiensi Usaha</span>
            <span className="font-semibold text-indigo-700">Margin Laba</span>
          </div>
        </div>
      </div>

      {/* Formal Income Statement Table (Standard Indonesian P&L) */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
        <div className="bg-gray-50/80 px-6 py-4 border-b border-gray-200/80 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-gray-900">Format Laporan Laba Rugi Komprehensif</h3>
            <p className="text-xs text-gray-500 mt-0.5">Klasifikasi standar akun pendapatan dan beban periode {periodLabel}</p>
          </div>
          <span className="text-xs font-mono font-bold text-gray-700 bg-white px-3 py-1 rounded-lg border border-gray-200">
            Mata Uang: IDR (Rupiah)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-gray-100/70 border-b border-gray-200 text-[11px] font-bold uppercase tracking-wider text-gray-600">
                <th className="py-3 px-6 w-32">Kode Akun</th>
                <th className="py-3 px-4">Pos Keuangan / Kategori</th>
                <th className="py-3 px-4 text-center w-28">Transaksi</th>
                <th className="py-3 px-4 text-right w-28">% Pendapatan</th>
                <th className="py-3 px-6 text-right w-44">Jumlah Nominal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {/* SECTION I: PENDAPATAN OPERASIONAL */}
              <tr className="bg-emerald-50/50 font-bold text-xs text-emerald-950">
                <td colSpan={5} className="py-3 px-6 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-600" />
                  <span>I. PENDAPATAN OPERASIONAL (REVENUES)</span>
                </td>
              </tr>

              {incomeItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-4 px-6 text-center text-xs text-gray-400 italic">
                    Tidak ada pos pendapatan dicatat pada periode ini.
                  </td>
                </tr>
              ) : (
                incomeItems.map((item) => (
                  <tr key={item.code} className="hover:bg-gray-50/80 transition-colors text-xs">
                    <td className="py-2.5 px-6 font-mono text-gray-500 font-medium">{item.code}</td>
                    <td className="py-2.5 px-4 font-semibold text-gray-900">
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span>{item.name}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-4 text-center text-gray-500">{item.count} tx</td>
                    <td className="py-2.5 px-4 text-right font-mono text-gray-600">{item.percentage.toFixed(1)}%</td>
                    <td className="py-2.5 px-6 text-right font-mono font-semibold text-emerald-700">
                      +{formatRupiah(item.total)}
                    </td>
                  </tr>
                ))
              )}

              {/* Subtotal Pendapatan */}
              <tr className="bg-emerald-50/80 font-bold text-xs text-emerald-950 border-t border-emerald-200">
                <td colSpan={4} className="py-3 px-6 uppercase tracking-wider text-right">
                  TOTAL PENDAPATAN OPERASIONAL:
                </td>
                <td className="py-3 px-6 text-right font-mono text-sm text-emerald-800">
                  +{formatRupiah(totalIncome)}
                </td>
              </tr>

              {/* SECTION II: BEBAN OPERASIONAL */}
              <tr className="bg-rose-50/50 font-bold text-xs text-rose-950">
                <td colSpan={5} className="py-3 px-6 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-600" />
                  <span>II. BEBAN OPERASIONAL (OPERATING EXPENSES)</span>
                </td>
              </tr>

              {expenseItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-4 px-6 text-center text-xs text-gray-400 italic">
                    Tidak ada pos beban dicatat pada periode ini.
                  </td>
                </tr>
              ) : (
                expenseItems.map((item) => (
                  <tr key={item.code} className="hover:bg-gray-50/80 transition-colors text-xs">
                    <td className="py-2.5 px-6 font-mono text-gray-500 font-medium">{item.code}</td>
                    <td className="py-2.5 px-4 font-semibold text-gray-900">
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                        <span>{item.name}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-4 text-center text-gray-500">{item.count} tx</td>
                    <td className="py-2.5 px-4 text-right font-mono text-gray-600">
                      {totalIncome > 0 ? `${((item.total / totalIncome) * 100).toFixed(1)}%` : '-'}
                    </td>
                    <td className="py-2.5 px-6 text-right font-mono font-semibold text-rose-700">
                      -{formatRupiah(item.total)}
                    </td>
                  </tr>
                ))
              )}

              {/* Subtotal Beban */}
              <tr className="bg-rose-50/80 font-bold text-xs text-rose-950 border-t border-rose-200">
                <td colSpan={4} className="py-3 px-6 uppercase tracking-wider text-right">
                  TOTAL BEBAN OPERASIONAL:
                </td>
                <td className="py-3 px-6 text-right font-mono text-sm text-rose-800">
                  -{formatRupiah(totalExpense)}
                </td>
              </tr>

              {/* SECTION III: LABA / RUGI BERSIH (NET PROFIT / LOSS) */}
              <tr className="bg-gray-900 text-white font-bold text-xs border-t-2 border-gray-900">
                <td colSpan={4} className="py-4 px-6 uppercase tracking-wider text-right">
                  {isProfit ? 'LABA BERSIH TAHUN/PERIODE BERJALAN (NET PROFIT):' : 'RUGI BERSIH TAHUN/PERIODE BERJALAN (NET LOSS):'}
                </td>
                <td className={`py-4 px-6 text-right font-mono text-base font-bold ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {formatRupiah(netProfit)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Monthly Comparative Performance Table (Performa Laba Rugi per Bulan) */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
              <BarChart3 className="w-4 h-4" />
            </span>
            <div>
              <h3 className="font-bold text-sm text-gray-900">Performa Laba Rugi Bulanan (Tahun {activeYearForTrend})</h3>
              <p className="text-xs text-gray-500">Tinjauan histori pendapatan, beban, laba bersih dan margin bulanan</p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                <th className="py-2.5 px-4 w-12 text-center">Bulan</th>
                <th className="py-2.5 px-4">Nama Bulan</th>
                <th className="py-2.5 px-4 text-right">Pendapatan (+)</th>
                <th className="py-2.5 px-4 text-right">Beban (-)</th>
                <th className="py-2.5 px-4 text-right">Laba / Rugi Bersih</th>
                <th className="py-2.5 px-4 text-right">Margin (%)</th>
                <th className="py-2.5 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {monthlyTrendData.map((m) => {
                const isMonthlyProfit = m.netProfit >= 0;
                const hasData = m.income > 0 || m.expense > 0;

                return (
                  <tr
                    key={m.month}
                    className={`hover:bg-gray-50/80 transition-colors ${
                      periodType === 'monthly' && selectedMonth === m.month && selectedYear === activeYearForTrend
                        ? 'bg-indigo-50/40 font-semibold'
                        : ''
                    }`}
                  >
                    <td className="py-2.5 px-4 text-center text-gray-400 font-mono">{m.month}</td>
                    <td className="py-2.5 px-4 font-semibold text-gray-800">{m.monthName}</td>
                    <td className="py-2.5 px-4 text-right font-mono text-emerald-700">
                      {m.income > 0 ? `+${formatRupiah(m.income)}` : '-'}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono text-rose-700">
                      {m.expense > 0 ? `-${formatRupiah(m.expense)}` : '-'}
                    </td>
                    <td
                      className={`py-2.5 px-4 text-right font-mono font-bold ${
                        !hasData ? 'text-gray-300' : isMonthlyProfit ? 'text-emerald-700' : 'text-rose-700'
                      }`}
                    >
                      {hasData ? formatRupiah(m.netProfit) : '-'}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono text-gray-600">
                      {hasData ? `${m.margin.toFixed(1)}%` : '-'}
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      {!hasData ? (
                        <span className="text-gray-300">-</span>
                      ) : isMonthlyProfit ? (
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Laba
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          Rugi
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Official Signatures Block (Visible in Print Mode) */}
      <div className="hidden print:grid grid-cols-3 gap-8 pt-12 text-center text-xs text-gray-800">
        <div>
          <p className="font-medium">Dibuat Oleh,</p>
          <p className="text-[11px] text-gray-500 mt-0.5">Bendahara / Staf Keuangan</p>
          <div className="h-16" />
          <p className="font-bold border-t border-gray-400 pt-1 inline-block min-w-[140px]">( ................................ )</p>
        </div>

        <div>
          <p className="font-medium">Diperiksa Oleh,</p>
          <p className="text-[11px] text-gray-500 mt-0.5">Auditor Internal / Pengawas</p>
          <div className="h-16" />
          <p className="font-bold border-t border-gray-400 pt-1 inline-block min-w-[140px]">( ................................ )</p>
        </div>

        <div>
          <p className="font-medium">Disetujui Oleh,</p>
          <p className="text-[11px] text-gray-500 mt-0.5">Pimpinan / Direktur</p>
          <div className="h-16" />
          <p className="font-bold border-t border-gray-400 pt-1 inline-block min-w-[140px]">( ................................ )</p>
        </div>
      </div>
    </div>
  );
}
