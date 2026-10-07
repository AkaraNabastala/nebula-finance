import React, { useState, useMemo } from 'react';
import {
  ListTree,
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  Search,
  Filter,
  Download,
  Printer,
  Building2,
  Banknote,
  PieChart as PieIcon,
  Tag,
  FileImage,
  ArrowUpDown,
  TrendingUp,
  TrendingDown,
  Layers
} from 'lucide-react';
import { AccountType, Category, Transaction, TransactionType } from '../types';
import { formatDateIndo, formatRupiah, getMonthNameIndo } from '../utils/formatters';
import { CategoryIcon } from './CategoryIcon';
import { exportTransactionsToExcel } from '../utils/export';

interface RincianKasViewProps {
  transactions: Transaction[];
  categories: Category[];
  onViewReceipt: (transaction: Transaction) => void;
}

export function RincianKasView({ transactions, categories, onViewReceipt }: RincianKasViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<'income' | 'expense' | 'all'>('all');
  const [accountFilter, setAccountFilter] = useState<'all' | AccountType>('all');
  const [periodType, setPeriodType] = useState<'all' | 'monthly' | 'yearly'>('all');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');

  const categoriesMap = useMemo(() => {
    return new Map(categories.map((c) => [c.id, c]));
  }, [categories]);

  // Extract available years
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    years.add(new Date().getFullYear());
    transactions.forEach((t) => {
      const y = parseInt(t.date.split('-')[0], 10);
      if (!isNaN(y)) years.add(y);
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [transactions]);

  // Filter transactions by Period
  const periodTransactions = useMemo(() => {
    return transactions.filter((t) => {
      if (periodType === 'all') return true;
      const [yStr, mStr] = t.date.split('-');
      const y = parseInt(yStr, 10);
      const m = parseInt(mStr, 10);

      if (periodType === 'yearly') {
        return y === selectedYear;
      }
      if (periodType === 'monthly') {
        return y === selectedYear && m === selectedMonth;
      }
      return true;
    });
  }, [transactions, periodType, selectedYear, selectedMonth]);

  // Filter by Account, SubTab (Type), Category, Search
  const filteredList = useMemo(() => {
    return periodTransactions.filter((t) => {
      // Account filter
      if (accountFilter !== 'all' && (t.account || 'cash') !== accountFilter) {
        return false;
      }
      // Type filter
      if (activeSubTab !== 'all' && t.type !== activeSubTab) {
        return false;
      }
      // Category filter
      if (selectedCategoryId !== 'all' && t.categoryId !== selectedCategoryId) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const catName = categoriesMap.get(t.categoryId)?.name.toLowerCase() || '';
        const desc = (t.description || '').toLowerCase();
        const amt = t.amount.toString();
        const dateStr = t.date;
        if (!catName.includes(q) && !desc.includes(q) && !amt.includes(q) && !dateStr.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [periodTransactions, accountFilter, activeSubTab, selectedCategoryId, searchQuery, categoriesMap]);

  // Summary Metrics
  const incomeTxs = useMemo(() => {
    return periodTransactions.filter((t) => {
      if (accountFilter !== 'all' && (t.account || 'cash') !== accountFilter) return false;
      return t.type === 'income';
    });
  }, [periodTransactions, accountFilter]);

  const expenseTxs = useMemo(() => {
    return periodTransactions.filter((t) => {
      if (accountFilter !== 'all' && (t.account || 'cash') !== accountFilter) return false;
      return t.type === 'expense';
    });
  }, [periodTransactions, accountFilter]);

  const totalIncome = useMemo(() => incomeTxs.reduce((sum, t) => sum + t.amount, 0), [incomeTxs]);
  const totalExpense = useMemo(() => expenseTxs.reduce((sum, t) => sum + t.amount, 0), [expenseTxs]);
  const netBalance = totalIncome - totalExpense;

  // Category Aggregations for Income
  const incomeCategoryBreakdown = useMemo(() => {
    const map = new Map<string, { total: number; count: number; cashTotal: number; bankTotal: number }>();
    incomeTxs.forEach((t) => {
      const existing = map.get(t.categoryId) || { total: 0, count: 0, cashTotal: 0, bankTotal: 0 };
      existing.total += t.amount;
      existing.count += 1;
      if (t.account === 'bank') {
        existing.bankTotal += t.amount;
      } else {
        existing.cashTotal += t.amount;
      }
      map.set(t.categoryId, existing);
    });

    const items = Array.from(map.entries()).map(([catId, data]) => {
      const cat = categoriesMap.get(catId);
      const percentage = totalIncome > 0 ? (data.total / totalIncome) * 100 : 0;
      return {
        catId,
        catName: cat?.name || 'Lain-lain',
        color: cat?.color || '#10b981',
        iconName: cat?.iconName || 'Wallet',
        total: data.total,
        count: data.count,
        cashTotal: data.cashTotal,
        bankTotal: data.bankTotal,
        percentage,
      };
    });

    return items.sort((a, b) => b.total - a.total);
  }, [incomeTxs, categoriesMap, totalIncome]);

  // Category Aggregations for Expense
  const expenseCategoryBreakdown = useMemo(() => {
    const map = new Map<string, { total: number; count: number; cashTotal: number; bankTotal: number }>();
    expenseTxs.forEach((t) => {
      const existing = map.get(t.categoryId) || { total: 0, count: 0, cashTotal: 0, bankTotal: 0 };
      existing.total += t.amount;
      existing.count += 1;
      if (t.account === 'bank') {
        existing.bankTotal += t.amount;
      } else {
        existing.cashTotal += t.amount;
      }
      map.set(t.categoryId, existing);
    });

    const items = Array.from(map.entries()).map(([catId, data]) => {
      const cat = categoriesMap.get(catId);
      const percentage = totalExpense > 0 ? (data.total / totalExpense) * 100 : 0;
      return {
        catId,
        catName: cat?.name || 'Lain-lain',
        color: cat?.color || '#f43f5e',
        iconName: cat?.iconName || 'Tag',
        total: data.total,
        count: data.count,
        cashTotal: data.cashTotal,
        bankTotal: data.bankTotal,
        percentage,
      };
    });

    return items.sort((a, b) => b.total - a.total);
  }, [expenseTxs, categoriesMap, totalExpense]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* Top Filter and Controls Bar */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs space-y-4 print:border-none print:shadow-none">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-100">
              <ListTree className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-gray-900 tracking-tight">
                Rincian Pemasukan &amp; Pengeluaran
              </h2>
              <p className="text-xs text-gray-500 font-normal">
                Daftar terperinci per pos kategori, sumber dana, mutasi kas tunai &amp; rekening bank
              </p>
            </div>
          </div>

          {/* Export & Print */}
          <div className="flex items-center gap-2 print:hidden">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-xl transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Laporan</span>
            </button>
          </div>
        </div>

        {/* Period & Account Filters */}
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-gray-100 print:hidden">
          {/* Main SubTab (Semua, Hanya Masuk, Hanya Keluar) */}
          <div className="inline-flex bg-gray-100 p-0.5 rounded-lg border border-gray-200/60 text-xs">
            <button
              onClick={() => {
                setActiveSubTab('all');
                setSelectedCategoryId('all');
              }}
              className={`px-3 py-1 rounded-md font-semibold transition-all ${
                activeSubTab === 'all' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Semua Mutasi
            </button>
            <button
              onClick={() => {
                setActiveSubTab('income');
                setSelectedCategoryId('all');
              }}
              className={`px-3 py-1 rounded-md font-semibold transition-all flex items-center gap-1 ${
                activeSubTab === 'income' ? 'bg-emerald-600 text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <ArrowDownRight className="w-3 h-3" />
              Rincian Pemasukan
            </button>
            <button
              onClick={() => {
                setActiveSubTab('expense');
                setSelectedCategoryId('all');
              }}
              className={`px-3 py-1 rounded-md font-semibold transition-all flex items-center gap-1 ${
                activeSubTab === 'expense' ? 'bg-rose-600 text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <ArrowUpRight className="w-3 h-3" />
              Rincian Pengeluaran
            </button>
          </div>

          {/* Account Filter */}
          <div className="inline-flex bg-gray-100 p-0.5 rounded-lg border border-gray-200/60 text-xs">
            <button
              onClick={() => setAccountFilter('all')}
              className={`px-3 py-1 rounded-md font-semibold transition-all ${
                accountFilter === 'all' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Semua Akun
            </button>
            <button
              onClick={() => setAccountFilter('cash')}
              className={`px-3 py-1 rounded-md font-semibold transition-all flex items-center gap-1 ${
                accountFilter === 'cash' ? 'bg-amber-500 text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Banknote className="w-3 h-3" />
              Kas Tunai
            </button>
            <button
              onClick={() => setAccountFilter('bank')}
              className={`px-3 py-1 rounded-md font-semibold transition-all flex items-center gap-1 ${
                accountFilter === 'bank' ? 'bg-blue-600 text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Building2 className="w-3 h-3" />
              Bank
            </button>
          </div>

          {/* Period Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <select
              value={periodType}
              onChange={(e) => setPeriodType(e.target.value as any)}
              className="px-2.5 py-1 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700"
            >
              <option value="all">Semua Waktu</option>
              <option value="monthly">Bulanan</option>
              <option value="yearly">Tahunan</option>
            </select>

            {periodType === 'monthly' && (
              <>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
                  className="px-2.5 py-1 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-700"
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
                  className="px-2.5 py-1 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-700"
                >
                  {availableYears.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </>
            )}

            {periodType === 'yearly' && (
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
                className="px-2.5 py-1 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-700"
              >
                {availableYears.map((y) => (
                  <option key={y} value={y}>
                    Tahun {y}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Search Box */}
          <div className="relative ml-auto">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari rincian..."
              className="pl-8 pr-3 py-1 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-800 placeholder:text-gray-400 focus:outline-hidden focus:border-indigo-500 focus:bg-white"
            />
          </div>
        </div>
      </div>

      {/* Rincian Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Total Pemasukan Card */}
        <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-emerald-800 tracking-wider">Total Pemasukan</span>
            <div className="p-1.5 bg-emerald-600 text-white rounded-lg">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <p className="font-mono font-bold text-lg sm:text-xl text-emerald-950 mt-1">
            +{formatRupiah(totalIncome)}
          </p>
          <p className="text-[11px] text-emerald-700 mt-1 font-medium">
            {incomeTxs.length} transaksi pemasukan dicatat
          </p>
        </div>

        {/* Total Pengeluaran Card */}
        <div className="bg-rose-50/80 border border-rose-200/80 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-rose-800 tracking-wider">Total Pengeluaran</span>
            <div className="p-1.5 bg-rose-600 text-white rounded-lg">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <p className="font-mono font-bold text-lg sm:text-xl text-rose-950 mt-1">
            -{formatRupiah(totalExpense)}
          </p>
          <p className="text-[11px] text-rose-700 mt-1 font-medium">
            {expenseTxs.length} transaksi pengeluaran dicatat
          </p>
        </div>

        {/* Arus Kas Bersih (Net Cash Flow) */}
        <div className="bg-gray-900 text-white rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-gray-300 tracking-wider">Surplus / Arus Kas Bersih</span>
            <div className="p-1.5 bg-gray-800 text-emerald-400 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className={`font-mono font-bold text-lg sm:text-xl mt-1 ${netBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {formatRupiah(netBalance)}
          </p>
          <p className="text-[11px] text-gray-400 mt-1">
            {netBalance >= 0 ? 'Kondisi surplus (Pemasukan > Pengeluaran)' : 'Kondisi defisit (Pengeluaran > Pemasukan)'}
          </p>
        </div>
      </div>

      {/* Category Breakdowns Section (Show both or active) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Income by Category Breakdown */}
        {(activeSubTab === 'all' || activeSubTab === 'income') && (
          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-5 space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <h3 className="font-bold text-sm text-gray-900">Rincian Pos Pemasukan (Per Kategori)</h3>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-700">
                Total: +{formatRupiah(totalIncome)}
              </span>
            </div>

            {incomeCategoryBreakdown.length === 0 ? (
              <p className="text-xs text-gray-400 py-6 text-center">Tidak ada transaksi pemasukan pada periode ini.</p>
            ) : (
              <div className="space-y-3">
                {incomeCategoryBreakdown.map((item) => (
                  <div
                    key={item.catId}
                    onClick={() =>
                      setSelectedCategoryId(selectedCategoryId === item.catId ? 'all' : item.catId)
                    }
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${
                      selectedCategoryId === item.catId
                        ? 'border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-400/20'
                        : 'border-gray-100 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <div className="flex items-center gap-2 font-semibold text-gray-900">
                        <CategoryIcon name={item.iconName} color={item.color} className="w-3.5 h-3.5" />
                        <span>{item.catName}</span>
                        <span className="text-gray-400 font-normal">({item.count} tx)</span>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-emerald-700">+{formatRupiah(item.total)}</span>
                        <span className="text-gray-400 ml-1.5 font-normal">({item.percentage.toFixed(1)}%)</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${Math.min(item.percentage, 100)}%` }}
                      />
                    </div>

                    {/* Cash vs Bank detail */}
                    <div className="flex items-center justify-between text-[11px] text-gray-500 mt-2 pt-1 border-t border-gray-100/60">
                      <span className="flex items-center gap-1">
                        <Banknote className="w-3 h-3 text-amber-600" />
                        Kas Tunai: <strong className="text-gray-700 font-mono">{formatRupiah(item.cashTotal)}</strong>
                      </span>
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-blue-600" />
                        Bank: <strong className="text-gray-700 font-mono">{formatRupiah(item.bankTotal)}</strong>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Expense by Category Breakdown */}
        {(activeSubTab === 'all' || activeSubTab === 'expense') && (
          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-5 space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <h3 className="font-bold text-sm text-gray-900">Rincian Pos Pengeluaran (Per Beban)</h3>
              </div>
              <span className="text-xs font-mono font-bold text-rose-700">
                Total: -{formatRupiah(totalExpense)}
              </span>
            </div>

            {expenseCategoryBreakdown.length === 0 ? (
              <p className="text-xs text-gray-400 py-6 text-center">Tidak ada transaksi pengeluaran pada periode ini.</p>
            ) : (
              <div className="space-y-3">
                {expenseCategoryBreakdown.map((item) => (
                  <div
                    key={item.catId}
                    onClick={() =>
                      setSelectedCategoryId(selectedCategoryId === item.catId ? 'all' : item.catId)
                    }
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${
                      selectedCategoryId === item.catId
                        ? 'border-rose-500 bg-rose-50/40 ring-2 ring-rose-400/20'
                        : 'border-gray-100 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <div className="flex items-center gap-2 font-semibold text-gray-900">
                        <CategoryIcon name={item.iconName} color={item.color} className="w-3.5 h-3.5" />
                        <span>{item.catName}</span>
                        <span className="text-gray-400 font-normal">({item.count} tx)</span>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-rose-700">-{formatRupiah(item.total)}</span>
                        <span className="text-gray-400 ml-1.5 font-normal">({item.percentage.toFixed(1)}%)</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-rose-500 rounded-full"
                        style={{ width: `${Math.min(item.percentage, 100)}%` }}
                      />
                    </div>

                    {/* Cash vs Bank detail */}
                    <div className="flex items-center justify-between text-[11px] text-gray-500 mt-2 pt-1 border-t border-gray-100/60">
                      <span className="flex items-center gap-1">
                        <Banknote className="w-3 h-3 text-amber-600" />
                        Kas Tunai: <strong className="text-gray-700 font-mono">{formatRupiah(item.cashTotal)}</strong>
                      </span>
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-blue-600" />
                        Bank: <strong className="text-gray-700 font-mono">{formatRupiah(item.bankTotal)}</strong>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Itemized Transactions Table */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
        <div className="bg-gray-50/70 px-6 py-3.5 border-b border-gray-200/80 flex flex-wrap items-center justify-between text-xs text-gray-600 gap-2">
          <div className="font-semibold text-gray-800 flex items-center gap-2">
            <span>Daftar Transaksi Rinci ({filteredList.length} item)</span>
            {selectedCategoryId !== 'all' && (
              <button
                onClick={() => setSelectedCategoryId('all')}
                className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md hover:bg-indigo-100"
              >
                Filter Kategori: {categoriesMap.get(selectedCategoryId)?.name} (Klik untuk Reset)
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50/90 border-b border-gray-200/80 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                <th className="py-3.5 px-4 w-12 text-center">No</th>
                <th className="py-3.5 px-4">Tanggal &amp; Waktu</th>
                <th className="py-3.5 px-4">Akun</th>
                <th className="py-3.5 px-4">Kategori Pos</th>
                <th className="py-3.5 px-4">Keterangan / Rincian</th>
                <th className="py-3.5 px-4 text-right">Nominal</th>
                <th className="py-3.5 px-4 text-center">Bukti</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400 text-xs">
                    Tidak ada rincian transaksi ditemukan untuk kriteria ini.
                  </td>
                </tr>
              ) : (
                filteredList.map((tx, idx) => {
                  const category = categoriesMap.get(tx.categoryId);
                  const isIncome = tx.type === 'income';
                  const isBank = tx.account === 'bank';

                  return (
                    <tr key={tx.id} className="hover:bg-indigo-50/30 transition-colors text-gray-700">
                      <td className="py-3 px-4 text-center text-xs text-gray-400 font-mono">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-semibold text-gray-900 text-xs">{formatDateIndo(tx.date)}</div>
                        {tx.time && <div className="text-[11px] text-gray-400 font-mono">{tx.time} WIB</div>}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {isBank ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                            <Building2 className="w-3 h-3 text-blue-600" />
                            Bank
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                            <Banknote className="w-3 h-3 text-amber-600" />
                            Kas Tunai
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-50 border border-gray-200/80">
                          <CategoryIcon name={category?.iconName} color={category?.color} className="w-3.5 h-3.5" />
                          <span className="text-gray-800 truncate max-w-[140px]">
                            {category ? category.name : 'Tanpa Kategori'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-xs text-gray-600 max-w-sm">
                        <p className="line-clamp-2 leading-relaxed">
                          {tx.description || <span className="text-gray-400 italic">Tanpa keterangan</span>}
                        </p>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap font-mono font-bold text-xs">
                        {isIncome ? (
                          <span className="text-emerald-600">+{formatRupiah(tx.amount)}</span>
                        ) : (
                          <span className="text-rose-600">-{formatRupiah(tx.amount)}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {tx.receiptUrl ? (
                          <button
                            onClick={() => onViewReceipt(tx)}
                            className="px-2 py-1 rounded-lg text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 transition-colors inline-flex items-center gap-1 text-xs font-semibold"
                          >
                            <FileImage className="w-3.5 h-3.5" />
                            <span>Lihat</span>
                          </button>
                        ) : (
                          <span className="text-gray-300 text-xs">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
