import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Printer,
  Calendar,
  Layers,
  ArrowDownRight,
  ArrowUpRight,
  TrendingUp,
  Download,
  CalendarDays,
  CheckCircle2,
  FileText,
  FileCheck
} from 'lucide-react';
import { Category, PeriodFilter, ReportType, Transaction, TransactionWithBalance } from '../types';
import { formatDateIndo, formatFullDateIndo, formatRupiah, getStartAndEndDateForPeriod } from '../utils/formatters';
import { exportTransactionsToExcel, exportTransactionsToCSV } from '../utils/export';
import { CategoryIcon } from './CategoryIcon';

interface LaporanViewProps {
  transactionsWithBalance: TransactionWithBalance[];
  categories: Category[];
  period: PeriodFilter;
  setPeriod: (period: PeriodFilter) => void;
  customRange: { startDate: string; endDate: string };
  setCustomRange: (range: { startDate: string; endDate: string }) => void;
}

export function LaporanView({
  transactionsWithBalance,
  categories,
  period,
  setPeriod,
  customRange,
  setCustomRange,
}: LaporanViewProps) {
  const [activeReportType, setActiveReportType] = useState<ReportType>('cashflow');

  const categoriesMap = useMemo(() => {
    return new Map(categories.map((c) => [c.id, c]));
  }, [categories]);

  // Determine active date boundaries
  const { startDate, endDate } = useMemo(() => {
    return getStartAndEndDateForPeriod(period, customRange);
  }, [period, customRange]);

  // Transactions before this period (to compute Beginning Balance / Saldo Awal)
  const previousTransactions = useMemo(() => {
    return transactionsWithBalance.filter((t) => t.date < startDate);
  }, [transactionsWithBalance, startDate]);

  const beginningBalance = useMemo(() => {
    let inc = 0;
    let exp = 0;
    for (const t of previousTransactions) {
      if (t.type === 'income') inc += t.amount;
      else exp += t.amount;
    }
    return inc - exp;
  }, [previousTransactions]);

  // Period transactions
  const periodTransactions = useMemo(() => {
    return transactionsWithBalance.filter((t) => t.date >= startDate && t.date <= endDate);
  }, [transactionsWithBalance, startDate, endDate]);

  // Income & Expense totals in period
  const totalIncomeInPeriod = useMemo(() => {
    return periodTransactions.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  }, [periodTransactions]);

  const totalExpenseInPeriod = useMemo(() => {
    return periodTransactions.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  }, [periodTransactions]);

  const netCashFlow = totalIncomeInPeriod - totalExpenseInPeriod;
  const endingBalance = beginningBalance + netCashFlow;

  // Category breakdown for income
  const incomeCategoryBreakdown = useMemo(() => {
    const map = new Map<string, { count: number; total: number }>();
    for (const t of periodTransactions) {
      if (t.type === 'income') {
        const curr = map.get(t.categoryId) || { count: 0, total: 0 };
        curr.count += 1;
        curr.total += t.amount;
        map.set(t.categoryId, curr);
      }
    }
    return Array.from(map.entries())
      .map(([catId, val]) => ({
        cat: categoriesMap.get(catId),
        ...val,
        percentage: totalIncomeInPeriod > 0 ? (val.total / totalIncomeInPeriod) * 100 : 0,
      }))
      .sort((a, b) => b.total - a.total);
  }, [periodTransactions, totalIncomeInPeriod, categoriesMap]);

  // Category breakdown for expense
  const expenseCategoryBreakdown = useMemo(() => {
    const map = new Map<string, { count: number; total: number }>();
    for (const t of periodTransactions) {
      if (t.type === 'expense') {
        const curr = map.get(t.categoryId) || { count: 0, total: 0 };
        curr.count += 1;
        curr.total += t.amount;
        map.set(t.categoryId, curr);
      }
    }
    return Array.from(map.entries())
      .map(([catId, val]) => ({
        cat: categoriesMap.get(catId),
        ...val,
        percentage: totalExpenseInPeriod > 0 ? (val.total / totalExpenseInPeriod) * 100 : 0,
      }))
      .sort((a, b) => b.total - a.total);
  }, [periodTransactions, totalExpenseInPeriod, categoriesMap]);

  const handlePrint = () => {
    window.print();
  };

  const getReportNameText = () => {
    if (activeReportType === 'cashflow') return 'Laporan Arus Kas (Cash Flow)';
    if (activeReportType === 'income') return 'Laporan Rincian Pemasukan';
    if (activeReportType === 'expense') return 'Laporan Rincian Pengeluaran';
    return 'Laporan Keuangan';
  };

  return (
    <div className="space-y-6">
      {/* Top Filter & Report Selector Controls */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs space-y-4 print:hidden">
        {/* Row 1: Report Type Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3.5">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveReportType('cashflow')}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                activeReportType === 'cashflow'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200/60'
              }`}
            >
              <FileCheck className="w-4 h-4" />
              Laporan Arus Kas
            </button>
            <button
              onClick={() => setActiveReportType('income')}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                activeReportType === 'income'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200/60'
              }`}
            >
              <ArrowDownRight className="w-4 h-4" />
              Laporan Pemasukan
            </button>
            <button
              onClick={() => setActiveReportType('expense')}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                activeReportType === 'expense'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200/60'
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              Laporan Pengeluaran
            </button>
          </div>

          {/* Export & Print actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => exportTransactionsToExcel(periodTransactions, categoriesMap, getReportNameText())}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-semibold rounded-xl transition-all shadow-xs"
              title="Unduh file Excel .xlsx lengkap"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export Excel</span>
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs"
              title="Cetak atau simpan sebagai PDF"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak / PDF</span>
            </button>
          </div>
        </div>

        {/* Row 2: Period Selector */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-gray-500" />
            <span className="font-semibold text-gray-700">Filter Periode Laporan:</span>
          </div>

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
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  period === item.id
                    ? 'bg-white text-gray-900 shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {period === 'custom' && (
            <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-xl border border-gray-200">
              <input
                type="date"
                value={customRange.startDate}
                onChange={(e) => setCustomRange({ ...customRange, startDate: e.target.value })}
                className="px-2.5 py-1 bg-white border border-gray-200 rounded-lg text-gray-700 text-xs font-medium"
              />
              <span className="text-gray-400">s/d</span>
              <input
                type="date"
                value={customRange.endDate}
                onChange={(e) => setCustomRange({ ...customRange, endDate: e.target.value })}
                className="px-2.5 py-1 bg-white border border-gray-200 rounded-lg text-gray-700 text-xs font-medium"
              />
            </div>
          )}
        </div>
      </div>

      {/* Official Printable Report Document Card */}
      <div className="bg-white p-6 lg:p-10 rounded-2xl border border-gray-200/80 shadow-xs space-y-6 print:border-none print:shadow-none print:p-0">
        {/* Document Header */}
        <div className="border-b-2 border-gray-900 pb-5 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="text-[11px] uppercase tracking-widest font-bold text-gray-400 mb-1">
              Sistem Keuangan & Laporan Kas
            </div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">{getReportNameText()}</h2>
            <p className="text-xs text-gray-600 mt-1">
              Periode:{' '}
              <span className="font-semibold text-gray-900">
                {period === 'all'
                  ? 'Seluruh Riwayat Transaksi'
                  : `${formatDateIndo(startDate)} s/d ${formatDateIndo(endDate)}`}
              </span>
            </p>
          </div>
          <div className="text-right text-xs text-gray-500">
            <p>Dicetak pada: {formatFullDateIndo(new Date().toISOString().slice(0, 10))}</p>
            <p className="font-mono text-[11px] text-gray-400">Format Standar Pembukuan Kas</p>
          </div>
        </div>

        {/* 1. REPORT: ARUS KAS (CASH FLOW STATEMENT) */}
        {activeReportType === 'cashflow' && (
          <div className="space-y-6">
            {/* Arus Kas Summary Statement */}
            <div className="bg-gray-50/80 rounded-xl p-5 border border-gray-200 space-y-3">
              <h3 className="font-bold text-sm text-gray-900 uppercase tracking-wider border-b border-gray-200 pb-2">
                Ringkasan Laporan Arus Kas
              </h3>

              {/* Saldo Awal */}
              <div className="flex justify-between items-center text-sm py-1">
                <span className="text-gray-600 font-medium">Saldo Awal Kas (Sebelum Periode Ini)</span>
                <span className="font-mono font-bold text-gray-900">{formatRupiah(beginningBalance)}</span>
              </div>

              {/* Arus Kas Masuk */}
              <div className="pl-4 border-l-2 border-emerald-500 space-y-1.5 py-1">
                <div className="flex justify-between items-center text-sm font-semibold text-emerald-800">
                  <span>Penerimaan Kas (Total Pemasukan)</span>
                  <span className="font-mono font-bold">+{formatRupiah(totalIncomeInPeriod)}</span>
                </div>
                {incomeCategoryBreakdown.map((item) => (
                  <div key={item.cat?.id || 'inc'} className="flex justify-between items-center text-xs text-gray-600 pl-2">
                    <span>&bull; {item.cat?.name || 'Pemasukan Lain'} ({item.count} tx)</span>
                    <span className="font-mono">{formatRupiah(item.total)}</span>
                  </div>
                ))}
              </div>

              {/* Arus Kas Keluar */}
              <div className="pl-4 border-l-2 border-rose-500 space-y-1.5 py-1">
                <div className="flex justify-between items-center text-sm font-semibold text-rose-800">
                  <span>Pengeluaran Kas (Total Biaya & Belanja)</span>
                  <span className="font-mono font-bold">-{formatRupiah(totalExpenseInPeriod)}</span>
                </div>
                {expenseCategoryBreakdown.map((item) => (
                  <div key={item.cat?.id || 'exp'} className="flex justify-between items-center text-xs text-gray-600 pl-2">
                    <span>&bull; {item.cat?.name || 'Pengeluaran Lain'} ({item.count} tx)</span>
                    <span className="font-mono">{formatRupiah(item.total)}</span>
                  </div>
                ))}
              </div>

              {/* Net Cash Flow */}
              <div className="flex justify-between items-center text-sm font-bold pt-2 border-t border-gray-200">
                <span className="text-gray-900">Kenaikan / (Penurunan) Kas Bersih</span>
                <span className={`font-mono ${netCashFlow >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {netCashFlow >= 0 ? '+' : ''}
                  {formatRupiah(netCashFlow)}
                </span>
              </div>

              {/* Saldo Akhir */}
              <div className="flex justify-between items-center text-base font-extrabold p-3 bg-gray-900 text-white rounded-xl">
                <span>Saldo Akhir Kas Tersedia</span>
                <span className="font-mono">{formatRupiah(endingBalance)}</span>
              </div>
            </div>

            {/* Detailed Transaction List in Cash Flow */}
            <div className="space-y-3">
              <h3 className="font-bold text-sm text-gray-900">Rincian Transaksi Arus Kas Periode Ini</h3>
              <div className="overflow-x-auto border border-gray-200 rounded-xl">
                <table className="w-full text-xs text-left">
                  <thead className="bg-gray-50 font-bold text-gray-700 border-b border-gray-200 uppercase">
                    <tr>
                      <th className="py-2.5 px-3">Tanggal</th>
                      <th className="py-2.5 px-3">Kategori</th>
                      <th className="py-2.5 px-3">Keterangan</th>
                      <th className="py-2.5 px-3 text-right">Pemasukan</th>
                      <th className="py-2.5 px-3 text-right">Pengeluaran</th>
                      <th className="py-2.5 px-3 text-right">Saldo Kas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {periodTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-gray-400">
                          Tidak ada transaksi pada periode ini.
                        </td>
                      </tr>
                    ) : (
                      periodTransactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-gray-50/70 transition-colors">
                          <td className="py-2.5 px-3 font-medium whitespace-nowrap text-gray-800">{formatDateIndo(tx.date)}</td>
                          <td className="py-2.5 px-3 whitespace-nowrap font-medium text-gray-800">
                            {categoriesMap.get(tx.categoryId)?.name || '-'}
                          </td>
                          <td className="py-2.5 px-3 text-gray-600 max-w-xs">{tx.description || '-'}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-semibold text-emerald-700">
                            {tx.type === 'income' ? `+${formatRupiah(tx.amount)}` : '-'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-semibold text-rose-700">
                            {tx.type === 'expense' ? `-${formatRupiah(tx.amount)}` : '-'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-gray-900">
                            {formatRupiah(tx.runningBalance)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  <tfoot className="bg-gray-50 font-bold border-t border-gray-200">
                    <tr>
                      <td colSpan={3} className="py-2.5 px-3 text-right text-gray-700">
                        TOTAL PERIODE:
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-emerald-800">
                        +{formatRupiah(totalIncomeInPeriod)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-rose-800">
                        -{formatRupiah(totalExpenseInPeriod)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-gray-900">
                        {formatRupiah(endingBalance)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 2. REPORT: INCOME (LAPORAN PEMASUKAN) */}
        {activeReportType === 'income' && (
          <div className="space-y-6">
            {/* Category breakdown summary */}
            <div className="bg-emerald-50/60 rounded-xl p-5 border border-emerald-100 space-y-3">
              <div className="flex justify-between items-center border-b border-emerald-200 pb-2">
                <span className="font-bold text-sm text-emerald-900 uppercase tracking-wider">
                  Total Pemasukan Periode Ini
                </span>
                <span className="font-bold font-mono text-xl text-emerald-800">
                  +{formatRupiah(totalIncomeInPeriod)}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
                {incomeCategoryBreakdown.map((item) => (
                  <div key={item.cat?.id || 'inc'} className="bg-white p-3 rounded-lg border border-emerald-100 text-xs">
                    <p className="font-semibold text-gray-800">{item.cat?.name || 'Lainnya'}</p>
                    <p className="font-mono font-bold text-emerald-700 text-sm mt-0.5">
                      {formatRupiah(item.total)}
                    </p>
                    <p className="text-[11px] text-gray-400">
                      {item.count} transaksi &bull; {item.percentage.toFixed(1)}%
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Income Table */}
            <div className="overflow-x-auto border border-gray-200 rounded-xl">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-50 font-bold text-gray-700 border-b border-gray-200 uppercase">
                  <tr>
                    <th className="py-2.5 px-3 w-10 text-center">No</th>
                    <th className="py-2.5 px-3">Tanggal</th>
                    <th className="py-2.5 px-3">Sumber Pemasukan</th>
                    <th className="py-2.5 px-3">Keterangan</th>
                    <th className="py-2.5 px-3 text-right">Nominal Pemasukan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {periodTransactions.filter((t) => t.type === 'income').length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-gray-400">
                        Tidak ada pemasukan pada periode ini.
                      </td>
                    </tr>
                  ) : (
                    periodTransactions
                      .filter((t) => t.type === 'income')
                      .map((tx, idx) => (
                        <tr key={tx.id} className="hover:bg-gray-50/70 transition-colors">
                          <td className="py-2.5 px-3 text-center text-gray-400">{idx + 1}</td>
                          <td className="py-2.5 px-3 font-medium whitespace-nowrap text-gray-800">{formatDateIndo(tx.date)}</td>
                          <td className="py-2.5 px-3 font-medium text-gray-800">
                            {categoriesMap.get(tx.categoryId)?.name || '-'}
                          </td>
                          <td className="py-2.5 px-3 text-gray-600 max-w-xs">{tx.description || '-'}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">
                            +{formatRupiah(tx.amount)}
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
                <tfoot className="bg-gray-50 font-bold border-t border-gray-200">
                  <tr>
                    <td colSpan={4} className="py-2.5 px-3 text-right text-gray-700">
                      TOTAL PEMASUKAN:
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-emerald-800 text-sm">
                      +{formatRupiah(totalIncomeInPeriod)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* 3. REPORT: EXPENSE (LAPORAN PENGELUARAN) */}
        {activeReportType === 'expense' && (
          <div className="space-y-6">
            {/* Category breakdown summary */}
            <div className="bg-rose-50/60 rounded-xl p-5 border border-rose-100 space-y-3">
              <div className="flex justify-between items-center border-b border-rose-200 pb-2">
                <span className="font-bold text-sm text-rose-900 uppercase tracking-wider">
                  Total Pengeluaran Periode Ini
                </span>
                <span className="font-bold font-mono text-xl text-rose-800">
                  -{formatRupiah(totalExpenseInPeriod)}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
                {expenseCategoryBreakdown.map((item) => (
                  <div key={item.cat?.id || 'exp'} className="bg-white p-3 rounded-lg border border-rose-100 text-xs">
                    <p className="font-semibold text-gray-800">{item.cat?.name || 'Lainnya'}</p>
                    <p className="font-mono font-bold text-rose-700 text-sm mt-0.5">
                      {formatRupiah(item.total)}
                    </p>
                    <p className="text-[11px] text-gray-400">
                      {item.count} transaksi &bull; {item.percentage.toFixed(1)}%
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Expense Table */}
            <div className="overflow-x-auto border border-gray-200 rounded-xl">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-50 font-bold text-gray-700 border-b border-gray-200 uppercase">
                  <tr>
                    <th className="py-2.5 px-3 w-10 text-center">No</th>
                    <th className="py-2.5 px-3">Tanggal</th>
                    <th className="py-2.5 px-3">Jenis Pengeluaran</th>
                    <th className="py-2.5 px-3">Keterangan</th>
                    <th className="py-2.5 px-3 text-right">Nominal Pengeluaran</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {periodTransactions.filter((t) => t.type === 'expense').length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-gray-400">
                        Tidak ada pengeluaran pada periode ini.
                      </td>
                    </tr>
                  ) : (
                    periodTransactions
                      .filter((t) => t.type === 'expense')
                      .map((tx, idx) => (
                        <tr key={tx.id} className="hover:bg-gray-50/70 transition-colors">
                          <td className="py-2.5 px-3 text-center text-gray-400">{idx + 1}</td>
                          <td className="py-2.5 px-3 font-medium whitespace-nowrap text-gray-800">{formatDateIndo(tx.date)}</td>
                          <td className="py-2.5 px-3 font-medium text-gray-800">
                            {categoriesMap.get(tx.categoryId)?.name || '-'}
                          </td>
                          <td className="py-2.5 px-3 text-gray-600 max-w-xs">{tx.description || '-'}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-700">
                            -{formatRupiah(tx.amount)}
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
                <tfoot className="bg-gray-50 font-bold border-t border-gray-200">
                  <tr>
                    <td colSpan={4} className="py-2.5 px-3 text-right text-gray-700">
                      TOTAL PENGELUARAN:
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-rose-800 text-sm">
                      -{formatRupiah(totalExpenseInPeriod)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* Signature & Verification area for official print */}
        <div className="pt-8 border-t border-gray-200 hidden print:grid grid-cols-2 text-center text-xs">
          <div>
            <p className="text-gray-500">Dibuat & Dicatat Oleh,</p>
            <div className="h-16" />
            <p className="font-semibold text-gray-800 border-t border-gray-300 w-48 mx-auto pt-1">
              ( Bagian Keuangan / Kasir )
            </p>
          </div>
          <div>
            <p className="text-gray-500">Disetujui & Diperiksa Oleh,</p>
            <div className="h-16" />
            <p className="font-semibold text-gray-800 border-t border-gray-300 w-48 mx-auto pt-1">
              ( Pimpinan / Pemilik Usaha )
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
