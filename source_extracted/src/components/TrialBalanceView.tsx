import React, { useState, useMemo } from 'react';
import {
  Scale,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Download,
  Printer,
  Search,
  Building2,
  Banknote,
  TrendingUp,
  TrendingDown,
  Info,
  ArrowUpDown
} from 'lucide-react';
import { Category, Transaction, TrialBalanceAccount } from '../types';
import { formatDateIndo, formatRupiah, getMonthNameIndo } from '../utils/formatters';
import { exportTrialBalanceToExcel } from '../utils/export';

interface TrialBalanceViewProps {
  transactions: Transaction[];
  categories: Category[];
}

export function TrialBalanceView({ transactions, categories }: TrialBalanceViewProps) {
  const [periodType, setPeriodType] = useState<'all' | 'monthly' | 'yearly'>('all');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [searchQuery, setSearchQuery] = useState('');

  // Extract available years from transactions
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    years.add(new Date().getFullYear());
    transactions.forEach((t) => {
      const y = parseInt(t.date.split('-')[0], 10);
      if (!isNaN(y)) years.add(y);
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [transactions]);

  // Filter transactions according to selected period
  const periodFilteredTransactions = useMemo(() => {
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

  // Period label for headers and export
  const periodLabel = useMemo(() => {
    if (periodType === 'all') return 'Semua Periode Transaksi';
    if (periodType === 'yearly') return `Tahun ${selectedYear}`;
    if (periodType === 'monthly') return `${getMonthNameIndo(selectedMonth)} ${selectedYear}`;
    return '';
  }, [periodType, selectedYear, selectedMonth]);

  // Build Trial Balance Accounts
  const { trialAccounts, totalDebit, totalCredit, isBalanced } = useMemo(() => {
    const accounts: TrialBalanceAccount[] = [];

    // 1. Kas Tunai (Asset / Aktiva Lancar - Code: 1-1001)
    const cashIncome = periodFilteredTransactions
      .filter((t) => (t.account || 'cash') === 'cash' && t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const cashExpense = periodFilteredTransactions
      .filter((t) => (t.account || 'cash') === 'cash' && t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const cashEnding = cashIncome - cashExpense;

    accounts.push({
      code: '1-1001',
      name: 'Kas Tunai (Cash on Hand)',
      type: 'asset',
      initialDebit: 0,
      initialCredit: 0,
      movementDebit: cashIncome,
      movementCredit: cashExpense,
      endingDebit: cashEnding >= 0 ? cashEnding : 0,
      endingCredit: cashEnding < 0 ? Math.abs(cashEnding) : 0,
    });

    // 2. Rekening Bank (Asset / Aktiva Lancar - Code: 1-1002)
    const bankIncome = periodFilteredTransactions
      .filter((t) => t.account === 'bank' && t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const bankExpense = periodFilteredTransactions
      .filter((t) => t.account === 'bank' && t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const bankEnding = bankIncome - bankExpense;

    accounts.push({
      code: '1-1002',
      name: 'Rekening Bank (Cash in Bank)',
      type: 'asset',
      initialDebit: 0,
      initialCredit: 0,
      movementDebit: bankIncome,
      movementCredit: bankExpense,
      endingDebit: bankEnding >= 0 ? bankEnding : 0,
      endingCredit: bankEnding < 0 ? Math.abs(bankEnding) : 0,
    });

    // 3. Expense Categories (Beban Operasional - Code: 5-XXXX)
    // Expenses have Normal Debit Balance
    const expenseCategories = categories.filter((c) => c.type === 'expense');
    expenseCategories.forEach((cat, idx) => {
      const catAmount = periodFilteredTransactions
        .filter((t) => t.categoryId === cat.id && t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      // Pad code nicely (e.g. 5-1001, 5-1002)
      const codeSuffix = (idx + 1).toString().padStart(4, '0');
      accounts.push({
        code: `5-${codeSuffix}`,
        name: `Beban ${cat.name}`,
        type: 'expense',
        initialDebit: 0,
        initialCredit: 0,
        movementDebit: catAmount,
        movementCredit: 0,
        endingDebit: catAmount,
        endingCredit: 0,
      });
    });

    // 4. Income Categories (Pendapatan Usaha - Code: 4-XXXX)
    // Revenues have Normal Credit Balance
    const incomeCategories = categories.filter((c) => c.type === 'income');
    incomeCategories.forEach((cat, idx) => {
      const catAmount = periodFilteredTransactions
        .filter((t) => t.categoryId === cat.id && t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

      const codeSuffix = (idx + 1).toString().padStart(4, '0');
      accounts.push({
        code: `4-${codeSuffix}`,
        name: `Pendapatan ${cat.name}`,
        type: 'revenue',
        initialDebit: 0,
        initialCredit: 0,
        movementDebit: 0,
        movementCredit: catAmount,
        endingDebit: 0,
        endingCredit: catAmount,
      });
    });

    // Calculate totals
    const sumDebit = accounts.reduce((acc, a) => acc + a.endingDebit, 0);
    const sumCredit = accounts.reduce((acc, a) => acc + a.endingCredit, 0);
    const balanced = sumDebit === sumCredit;

    return {
      trialAccounts: accounts,
      totalDebit: sumDebit,
      totalCredit: sumCredit,
      isBalanced: balanced,
    };
  }, [periodFilteredTransactions, categories]);

  // Filter accounts by search
  const filteredAccounts = useMemo(() => {
    if (!searchQuery.trim()) return trialAccounts;
    const q = searchQuery.toLowerCase();
    return trialAccounts.filter(
      (a) => a.code.toLowerCase().includes(q) || a.name.toLowerCase().includes(q)
    );
  }, [trialAccounts, searchQuery]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* Header Bar with Period Selectors */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs space-y-4 print:border-none print:shadow-none">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-100">
                <Scale className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-base font-bold text-gray-900 tracking-tight">
                  Neraca Saldo (Trial Balance)
                </h2>
                <p className="text-xs text-gray-500 font-normal">
                  Pengecekan keseimbangan saldo Debit &amp; Kredit seluruh akun keuangan
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 print:hidden">
            <button
              onClick={() => exportTrialBalanceToExcel(trialAccounts, periodLabel, totalDebit, totalCredit)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition-all shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Excel</span>
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-xl transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak PDF</span>
            </button>
          </div>
        </div>

        {/* Period Filter Controls */}
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-gray-100 print:hidden">
          <div className="flex items-center gap-1 text-xs font-medium text-gray-500">
            <Calendar className="w-3.5 h-3.5 text-gray-400" />
            <span>Periode:</span>
          </div>

          <div className="inline-flex bg-gray-100 p-0.5 rounded-lg border border-gray-200/60 text-xs">
            <button
              onClick={() => setPeriodType('all')}
              className={`px-3 py-1 rounded-md font-semibold transition-all ${
                periodType === 'all' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Semua Waktu
            </button>
            <button
              onClick={() => setPeriodType('monthly')}
              className={`px-3 py-1 rounded-md font-semibold transition-all ${
                periodType === 'monthly' ? 'bg-indigo-600 text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Bulanan
            </button>
            <button
              onClick={() => setPeriodType('yearly')}
              className={`px-3 py-1 rounded-md font-semibold transition-all ${
                periodType === 'yearly' ? 'bg-indigo-600 text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Tahunan
            </button>
          </div>

          {periodType === 'monthly' && (
            <div className="flex items-center gap-2">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
                className="px-3 py-1 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-800"
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
                className="px-3 py-1 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-800"
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
              className="px-3 py-1 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-800"
            >
              {availableYears.map((y) => (
                <option key={y} value={y}>
                  Tahun {y}
                </option>
              ))}
            </select>
          )}

          {/* Search Box */}
          <div className="relative ml-auto">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari kode / nama akun..."
              className="pl-8 pr-3 py-1 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-800 placeholder:text-gray-400 focus:outline-hidden focus:border-indigo-500 focus:bg-white"
            />
          </div>
        </div>
      </div>

      {/* Balance Indicator Status Banner */}
      <div
        className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${
          isBalanced
            ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
            : 'bg-rose-50/70 border-rose-200 text-rose-900'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`p-2 rounded-xl text-white ${
              isBalanced ? 'bg-emerald-600' : 'bg-rose-600'
            }`}
          >
            {isBalanced ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm">
                Status Neraca Saldo: {isBalanced ? 'SEIMBANG (BALANCED)' : 'TIDAK SEIMBANG (UNBALANCED)'}
              </h3>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-white/70 border border-emerald-200">
                {periodLabel}
              </span>
            </div>
            <p className="text-xs opacity-90 mt-0.5">
              {isBalanced
                ? 'Total mutasi Debit sama dengan total Kredit. Data pembukuan dan kas valid.'
                : `Terdapat selisih pembukuan sebesar ${formatRupiah(Math.abs(totalDebit - totalCredit))}.`}
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-6 text-right">
          <div>
            <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Total Debit</p>
            <p className="text-sm font-mono font-bold text-gray-900">{formatRupiah(totalDebit)}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Total Kredit</p>
            <p className="text-sm font-mono font-bold text-gray-900">{formatRupiah(totalCredit)}</p>
          </div>
        </div>
      </div>

      {/* Trial Balance Table Container */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50/90 border-b border-gray-200/80 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                <th className="py-3.5 px-4 w-12 text-center">No</th>
                <th className="py-3.5 px-4 w-28">Kode Akun</th>
                <th className="py-3.5 px-4">Nama Akun</th>
                <th className="py-3.5 px-4">Klasifikasi</th>
                <th className="py-3.5 px-4 text-right">Mutasi Debet (+)</th>
                <th className="py-3.5 px-4 text-right">Mutasi Kredit (+)</th>
                <th className="py-3.5 px-4 text-right">Saldo Akhir Debet</th>
                <th className="py-3.5 px-4 text-right">Saldo Akhir Kredit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredAccounts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400 text-xs">
                    Tidak ada data akun yang cocok.
                  </td>
                </tr>
              ) : (
                filteredAccounts.map((acc, idx) => {
                  let badge = 'bg-gray-100 text-gray-700';
                  let typeLabel = 'Aset / Aktiva';
                  if (acc.type === 'asset') {
                    badge = 'bg-blue-50 text-blue-700 border border-blue-200';
                    typeLabel = 'Aset (Aktiva Lancar)';
                  } else if (acc.type === 'expense') {
                    badge = 'bg-rose-50 text-rose-700 border border-rose-200';
                    typeLabel = 'Beban Operasional';
                  } else if (acc.type === 'revenue') {
                    badge = 'bg-emerald-50 text-emerald-700 border border-emerald-200';
                    typeLabel = 'Pendapatan Usaha';
                  }

                  return (
                    <tr key={acc.code} className="hover:bg-indigo-50/30 transition-colors text-gray-700">
                      <td className="py-3.5 px-4 text-center text-xs text-gray-400 font-mono">
                        {idx + 1}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-xs text-indigo-700">
                        {acc.code}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-gray-900 text-xs">
                        <div className="flex items-center gap-2">
                          {acc.code.startsWith('1-1001') && <Banknote className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
                          {acc.code.startsWith('1-1002') && <Building2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                          {acc.type === 'expense' && <TrendingDown className="w-3.5 h-3.5 text-rose-500 shrink-0" />}
                          {acc.type === 'revenue' && <TrendingUp className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                          <span>{acc.name}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-semibold ${badge}`}>
                          {typeLabel}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-xs text-gray-600">
                        {acc.movementDebit > 0 ? formatRupiah(acc.movementDebit) : '-'}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-xs text-gray-600">
                        {acc.movementCredit > 0 ? formatRupiah(acc.movementCredit) : '-'}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-xs text-gray-900">
                        {acc.endingDebit > 0 ? (
                          <span className="text-gray-900">{formatRupiah(acc.endingDebit)}</span>
                        ) : (
                          <span className="text-gray-300">-</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-xs text-gray-900">
                        {acc.endingCredit > 0 ? (
                          <span className="text-gray-900">{formatRupiah(acc.endingCredit)}</span>
                        ) : (
                          <span className="text-gray-300">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {/* Grand Total Footer */}
            <tfoot>
              <tr className="bg-gray-100/90 font-bold border-t-2 border-gray-300 text-xs text-gray-900">
                <td colSpan={6} className="py-4 px-6 text-right uppercase tracking-wider">
                  TOTAL KESELURUHAN (NERACA SALDO):
                </td>
                <td className="py-4 px-4 text-right font-mono text-sm text-indigo-900 bg-indigo-50/50">
                  {formatRupiah(totalDebit)}
                </td>
                <td className="py-4 px-4 text-right font-mono text-sm text-indigo-900 bg-indigo-50/50">
                  {formatRupiah(totalCredit)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Accounting Explanation Card */}
      <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-4 flex items-start gap-3">
        <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
        <div className="text-xs text-indigo-900/80 space-y-1">
          <p className="font-semibold text-indigo-950">Prinsip Keseimbangan Akuntansi (Trial Balance):</p>
          <p>
            Neraca Saldo memverifikasi bahwa total Debit (Saldo Kas Tunai + Saldo Bank + Total Beban Pengeluaran) sama persis dengan total Kredit (Total Pendapatan Pemasukan). Hal ini memastikan pencatatan keuangan akurat tanpa transaksi yang tercecer.
          </p>
        </div>
      </div>
    </div>
  );
}
