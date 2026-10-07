import React, { useState, useMemo } from 'react';
import {
  Search,
  ArrowDownRight,
  ArrowUpRight,
  Filter,
  FileImage,
  Edit,
  Trash2,
  Calendar,
  Layers,
  FileSpreadsheet,
  Download,
  Plus,
  ArrowUpDown,
  Building2,
  Banknote,
  Wallet,
  X
} from 'lucide-react';
import { AccountType, Category, Transaction, TransactionType, TransactionWithBalance } from '../types';
import { formatDateIndo, formatRupiah } from '../utils/formatters';
import { CategoryIcon } from './CategoryIcon';
import { exportTransactionsToExcel, exportTransactionsToCSV } from '../utils/export';

interface BukuKasViewProps {
  transactionsWithBalance: TransactionWithBalance[];
  categories: Category[];
  onAddTransaction: (type: TransactionType) => void;
  onEditTransaction: (transaction: Transaction) => void;
  onDeleteTransaction: (transactionId: string) => void;
  onViewReceipt: (transaction: Transaction) => void;
}

export function BukuKasView({
  transactionsWithBalance,
  categories,
  onAddTransaction,
  onEditTransaction,
  onDeleteTransaction,
  onViewReceipt,
}: BukuKasViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [accountFilter, setAccountFilter] = useState<'all' | AccountType>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc'); // default latest first

  const categoriesMap = useMemo(() => {
    return new Map(categories.map((c) => [c.id, c]));
  }, [categories]);

  // Filter and Sort
  const filteredTransactions = useMemo(() => {
    let result = [...transactionsWithBalance];

    // Filter by account
    if (accountFilter !== 'all') {
      result = result.filter((t) => (t.account || 'cash') === accountFilter);
    }

    // Filter by type
    if (typeFilter !== 'all') {
      result = result.filter((t) => t.type === typeFilter);
    }

    // Filter by category
    if (categoryFilter !== 'all') {
      result = result.filter((t) => t.categoryId === categoryFilter);
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((t) => {
        const catName = categoriesMap.get(t.categoryId)?.name.toLowerCase() || '';
        const desc = (t.description || '').toLowerCase();
        const amt = t.amount.toString();
        const dateStr = t.date;
        const accStr = t.account === 'bank' ? 'bank rekening transfer' : 'kas tunai cash';
        return catName.includes(q) || desc.includes(q) || amt.includes(q) || dateStr.includes(q) || accStr.includes(q);
      });
    }

    // Sort order
    result.sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time || '00:00'}`).getTime();
      const dateB = new Date(`${b.date}T${b.time || '00:00'}`).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [transactionsWithBalance, accountFilter, typeFilter, categoryFilter, searchQuery, sortOrder, categoriesMap]);

  // Overall totals across system
  const overallCashBalance = useMemo(() => {
    return transactionsWithBalance.reduce((acc, t) => {
      const isCash = (t.account || 'cash') === 'cash';
      if (!isCash) return acc;
      return t.type === 'income' ? acc + t.amount : acc - t.amount;
    }, 0);
  }, [transactionsWithBalance]);

  const overallBankBalance = useMemo(() => {
    return transactionsWithBalance.reduce((acc, t) => {
      const isBank = t.account === 'bank';
      if (!isBank) return acc;
      return t.type === 'income' ? acc + t.amount : acc - t.amount;
    }, 0);
  }, [transactionsWithBalance]);

  const totalOverallBalance = overallCashBalance + overallBankBalance;

  // Summary counts for filtered view
  const totalFilteredIncome = filteredTransactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalFilteredExpense = filteredTransactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const resetFilters = () => {
    setSearchQuery('');
    setTypeFilter('all');
    setAccountFilter('all');
    setCategoryFilter('all');
    setSortOrder('desc');
  };

  const hasActiveFilters = searchQuery !== '' || typeFilter !== 'all' || accountFilter !== 'all' || categoryFilter !== 'all';

  return (
    <div className="space-y-4">
      {/* Account Balances Quick Cards (Clickable Interactive Filters) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Kas Tunai Card */}
        <div
          onClick={() => setAccountFilter(accountFilter === 'cash' ? 'all' : 'cash')}
          className={`cursor-pointer bg-white p-4 rounded-2xl border transition-all ${
            accountFilter === 'cash'
              ? 'border-amber-500 ring-2 ring-amber-400/20 bg-amber-50/20 shadow-xs'
              : 'border-gray-200/80 hover:border-amber-300 shadow-xs'
          }`}
          role="button"
          tabIndex={0}
          title="Klik untuk menyaring transaksi Kas Tunai"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
                <Banknote className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Saldo Kas Tunai</p>
                <p className="text-base sm:text-lg font-bold font-mono text-gray-900 mt-0.5">{formatRupiah(overallCashBalance)}</p>
              </div>
            </div>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors ${
                accountFilter === 'cash'
                  ? 'bg-amber-500 text-white'
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              {accountFilter === 'cash' ? 'Aktif' : 'Kas'}
            </span>
          </div>
        </div>

        {/* Rekening Bank Card */}
        <div
          onClick={() => setAccountFilter(accountFilter === 'bank' ? 'all' : 'bank')}
          className={`cursor-pointer bg-white p-4 rounded-2xl border transition-all ${
            accountFilter === 'bank'
              ? 'border-blue-500 ring-2 ring-blue-400/20 bg-blue-50/20 shadow-xs'
              : 'border-gray-200/80 hover:border-blue-300 shadow-xs'
          }`}
          role="button"
          tabIndex={0}
          title="Klik untuk menyaring transaksi Rekening Bank"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Saldo Rekening Bank</p>
                <p className="text-base sm:text-lg font-bold font-mono text-gray-900 mt-0.5">{formatRupiah(overallBankBalance)}</p>
              </div>
            </div>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors ${
                accountFilter === 'bank'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              {accountFilter === 'bank' ? 'Aktif' : 'Bank'}
            </span>
          </div>
        </div>

        {/* Total Keseluruhan Card */}
        <div
          onClick={() => setAccountFilter('all')}
          className={`cursor-pointer bg-white p-4 rounded-2xl border transition-all ${
            accountFilter === 'all'
              ? 'border-gray-900 ring-2 ring-gray-900/10 shadow-xs bg-gray-50/40'
              : 'border-gray-200/80 hover:border-gray-400 shadow-xs'
          }`}
          role="button"
          tabIndex={0}
          title="Klik untuk menampilkan semua akun"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gray-900 text-white flex items-center justify-center shadow-xs">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Total Kas &amp; Bank</p>
                <p className="text-base sm:text-lg font-bold font-mono text-gray-900 mt-0.5">
                  {formatRupiah(totalOverallBalance)}
                </p>
              </div>
            </div>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors ${
                accountFilter === 'all'
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              {accountFilter === 'all' ? 'Semua' : 'Semua'}
            </span>
          </div>
        </div>
      </div>

      {/* Structured Controls & Filter Toolbar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200/80 shadow-xs space-y-3.5">
        {/* Row 1: Search and Action Buttons */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari transaksi berdasarkan kategori, keterangan, nominal, tanggal..."
              className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-800 placeholder:text-gray-400 focus:outline-hidden focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Action and Export Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onAddTransaction('income')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-semibold rounded-xl transition-all shadow-xs"
            >
              <ArrowDownRight className="w-3.5 h-3.5" />
              <span>+ Pemasukan</span>
            </button>
            <button
              onClick={() => onAddTransaction('expense')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs font-semibold rounded-xl transition-all shadow-xs"
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>+ Pengeluaran</span>
            </button>
            <button
              onClick={() => exportTransactionsToExcel(transactionsWithBalance, categoriesMap)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 text-xs font-semibold rounded-xl transition-colors"
              title="Unduh Excel .xlsx"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Excel</span>
            </button>
            <button
              onClick={() => exportTransactionsToCSV(transactionsWithBalance, categoriesMap)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 text-xs font-semibold rounded-xl transition-colors"
              title="Unduh CSV"
            >
              <Download className="w-3.5 h-3.5 text-gray-600" />
              <span>CSV</span>
            </button>
          </div>
        </div>

        {/* Row 2: Segmented Filters & Dropdowns */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-3 border-t border-gray-100 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            {/* Account Channel Filter */}
            <div className="inline-flex bg-gray-100 p-0.5 rounded-lg border border-gray-200/70">
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

            {/* Type Filter */}
            <div className="inline-flex bg-gray-100 p-0.5 rounded-lg border border-gray-200/70">
              <button
                onClick={() => setTypeFilter('all')}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                  typeFilter === 'all' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Semua Tipe
              </button>
              <button
                onClick={() => setTypeFilter('income')}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                  typeFilter === 'income' ? 'bg-emerald-600 text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Pemasukan
              </button>
              <button
                onClick={() => setTypeFilter('expense')}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                  typeFilter === 'expense' ? 'bg-rose-600 text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Pengeluaran
              </button>
            </div>

            {/* Category Filter Dropdown */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-1 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 text-xs font-semibold focus:outline-hidden focus:border-indigo-500"
            >
              <option value="all">Semua Kategori</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.type === 'income' ? '[+ Masuk]' : '[- Keluar]'} {c.name}
                </option>
              ))}
            </select>

            {/* Reset Button if filter is active */}
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="px-2 py-1 text-gray-500 hover:text-rose-600 text-xs font-semibold transition-colors inline-flex items-center gap-1"
                title="Reset Semua Filter"
              >
                <X className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>

          {/* Sort Order */}
          <button
            onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
            className="px-2.5 py-1 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-gray-700 text-xs font-medium transition-colors inline-flex items-center gap-1.5"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
            <span>Urutan: {sortOrder === 'desc' ? 'Terbaru' : 'Terlama'}</span>
          </button>
        </div>
      </div>

      {/* Cash Book Ledger Table */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
        {/* Table summary sub-header */}
        <div className="bg-gray-50/80 px-5 py-3 border-b border-gray-200/80 flex flex-wrap items-center justify-between text-xs text-gray-600 gap-2">
          <div className="font-semibold text-gray-700 flex items-center gap-2">
            <span>Daftar Transaksi ({filteredTransactions.length})</span>
            {accountFilter !== 'all' && (
              <span className="text-indigo-600 font-medium">
                &bull; Akun {accountFilter === 'bank' ? 'Rekening Bank' : 'Kas Tunai'}
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="text-emerald-700 font-semibold">
              Masuk: +{formatRupiah(totalFilteredIncome)}
            </span>
            <span className="text-rose-700 font-semibold">
              Keluar: -{formatRupiah(totalFilteredExpense)}
            </span>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50/90 border-b border-gray-200/80 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                <th className="py-3 px-4 w-12 text-center">No</th>
                <th className="py-3 px-4">Tanggal &amp; Waktu</th>
                <th className="py-3 px-4">Akun</th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4">Keterangan</th>
                <th className="py-3 px-4 text-right">Pemasukan (+)</th>
                <th className="py-3 px-4 text-right">Pengeluaran (-)</th>
                <th className="py-3 px-4 text-right">Saldo</th>
                <th className="py-3 px-4 text-center">Bukti</th>
                <th className="py-3 px-4 text-center w-24">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-14 text-center text-gray-400">
                    <div className="w-12 h-12 rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center mx-auto mb-3">
                      <Layers className="w-6 h-6" />
                    </div>
                    <p className="font-semibold text-gray-700 text-sm">Belum ada transaksi ditemukan</p>
                    <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                      {hasActiveFilters
                        ? 'Coba sesuaikan kata kunci pencarian atau filter yang dipilih.'
                        : 'Klik tombol "+ Pemasukan" atau "+ Pengeluaran" untuk mulai mencatat.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx, idx) => {
                  const category = categoriesMap.get(tx.categoryId);
                  const isBank = tx.account === 'bank';
                  return (
                    <tr
                      key={tx.id}
                      className="hover:bg-indigo-50/20 transition-colors group text-gray-700 text-xs"
                    >
                      {/* No */}
                      <td className="py-3 px-4 text-center text-gray-400 font-mono">
                        {idx + 1}
                      </td>

                      {/* Date & Time */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-semibold text-gray-900">
                          {formatDateIndo(tx.date)}
                        </div>
                        {tx.time && (
                          <div className="text-[11px] text-gray-400 font-mono mt-0.5">
                            {tx.time} WIB
                          </div>
                        )}
                      </td>

                      {/* Account Badge */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {isBank ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold bg-blue-50 text-blue-700 border border-blue-200/80">
                            <Building2 className="w-3 h-3 text-blue-600" />
                            Bank
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold bg-amber-50 text-amber-800 border border-amber-200/80">
                            <Banknote className="w-3 h-3 text-amber-600" />
                            Kas Tunai
                          </span>
                        )}
                      </td>

                      {/* Category Badge */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium bg-gray-50 border border-gray-200/80">
                          <CategoryIcon
                            name={category?.iconName}
                            color={category?.color}
                            className="w-3.5 h-3.5"
                          />
                          <span className="text-gray-800 truncate max-w-[130px]">
                            {category ? category.name : 'Tanpa Kategori'}
                          </span>
                        </div>
                      </td>

                      {/* Description */}
                      <td className="py-3 px-4 text-gray-600 max-w-xs">
                        <p className="line-clamp-2 leading-relaxed font-normal">
                          {tx.description || <span className="text-gray-400 italic">Tanpa keterangan</span>}
                        </p>
                      </td>

                      {/* Income Column */}
                      <td className="py-3 px-4 text-right whitespace-nowrap font-semibold">
                        {tx.type === 'income' ? (
                          <span className="text-emerald-600 font-mono">
                            +{formatRupiah(tx.amount)}
                          </span>
                        ) : (
                          <span className="text-gray-300">-</span>
                        )}
                      </td>

                      {/* Expense Column */}
                      <td className="py-3 px-4 text-right whitespace-nowrap font-semibold">
                        {tx.type === 'expense' ? (
                          <span className="text-rose-600 font-mono">
                            -{formatRupiah(tx.amount)}
                          </span>
                        ) : (
                          <span className="text-gray-300">-</span>
                        )}
                      </td>

                      {/* Running Balance */}
                      <td className="py-3 px-4 text-right whitespace-nowrap font-mono font-bold">
                        <span
                          className={
                            tx.runningBalance < 0
                              ? 'text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md'
                              : 'text-gray-900'
                          }
                        >
                          {formatRupiah(tx.runningBalance)}
                        </span>
                      </td>

                      {/* Receipt Attachment */}
                      <td className="py-3 px-4 text-center">
                        {tx.receiptUrl ? (
                          <button
                            onClick={() => onViewReceipt(tx)}
                            className="px-2 py-1 rounded-lg text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 transition-colors inline-flex items-center gap-1 font-semibold"
                            title="Lihat Bukti Transaksi"
                          >
                            <FileImage className="w-3.5 h-3.5" />
                            <span>Lihat</span>
                          </button>
                        ) : (
                          <span className="text-gray-300 text-xs">-</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => onEditTransaction(tx)}
                            className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Edit Transaksi"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm('Yakin ingin menghapus transaksi ini?')) {
                                onDeleteTransaction(tx.id);
                              }
                            }}
                            className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Hapus Transaksi"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
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


