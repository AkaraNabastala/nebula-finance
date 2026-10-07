import React, { useState } from 'react';
import {
  PieChart,
  FileSpreadsheet,
  Printer,
  Download,
  Scale,
  TrendingUp,
  Layers,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import {
  CompanyProfile,
  COAAccount,
  JournalEntry,
  Transaction,
  HutangRecord,
  PiutangRecord,
} from '../types/finance';
import { formatRupiah, formatDate } from '../utils/formatters';
import {
  computeTrialBalance,
  computeProfitAndLoss,
  computeBalanceSheet,
  computeCashFlow,
} from '../utils/accountingEngine';
import { exportComprehensiveFinancialReportToExcel } from '../utils/export';

interface LaporanViewProps {
  coaList: COAAccount[];
  journals: JournalEntry[];
  transactions: Transaction[];
  hutangList: HutangRecord[];
  piutangList: PiutangRecord[];
  companyProfile?: CompanyProfile;
}

export const LaporanView: React.FC<LaporanViewProps> = ({
  coaList,
  journals,
  transactions,
  hutangList,
  piutangList,
  companyProfile,
}) => {
  const [reportTab, setReportTab] = useState<'pnl' | 'neraca' | 'cashflow' | 'trial_balance'>('pnl');

  const pnl = React.useMemo(() => computeProfitAndLoss(coaList, journals), [coaList, journals]);
  const bs = React.useMemo(() => computeBalanceSheet(coaList, journals), [coaList, journals]);
  const cashFlow = React.useMemo(() => computeCashFlow(transactions), [transactions]);
  const tb = React.useMemo(() => computeTrialBalance(coaList, journals), [coaList, journals]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    exportComprehensiveFinancialReportToExcel(
      coaList,
      journals,
      transactions,
      hutangList,
      piutangList,
      companyProfile,
      `Laporan_Keuangan_${new Date().toISOString().split('T')[0]}.xlsx`
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Export Buttons */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl print:hidden">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20">
            Pusat Pelaporan Keuangan (Financial Statements)
          </span>
          <h2 className="text-2xl font-bold text-white mt-2">Laporan Akuntansi Standar Perusahaan</h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Laporan Laba Rugi, Neraca Posisi Keuangan, Arus Kas, dan Neraca Saldo Terverifikasi.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handlePrint}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4 text-indigo-400" />
            <span>Cetak / PDF</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            <span>Ekspor Semua ke Excel</span>
          </button>
        </div>
      </div>

      {/* Report Tabs (Print Hidden) */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3 print:hidden">
        {[
          { id: 'pnl', label: 'Laporan Laba Rugi (Income Statement)', icon: TrendingUp },
          { id: 'neraca', label: 'Laporan Neraca (Balance Sheet)', icon: Layers },
          { id: 'cashflow', label: 'Laporan Arus Kas (Cash Flow)', icon: PieChart },
          { id: 'trial_balance', label: 'Neraca Saldo (Trial Balance)', icon: Scale },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = reportTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setReportTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Printable Report Wrapper */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm dark:shadow-xl text-slate-900 dark:text-slate-100 print:bg-white print:text-black print:border-none print:shadow-none print:p-0">
        {/* Printable Letterhead Header */}
        <div className="text-center pb-6 mb-6 border-b border-slate-200 dark:border-slate-800 print:border-slate-300">
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white print:text-black uppercase">
            {companyProfile?.companyName || 'PT NABASTALA'}
          </h1>
          {companyProfile?.address && (
            <p className="text-[11px] text-slate-500 dark:text-slate-400 print:text-slate-600 mt-0.5">
              {companyProfile.address} {companyProfile.phone ? `• Telp: ${companyProfile.phone}` : ''}
            </p>
          )}
          <p className="text-sm font-semibold text-indigo-400 print:text-slate-800 uppercase mt-1">
            {reportTab === 'pnl' && 'LAPORAN LABA / RUGI KOMPREHENSIF'}
            {reportTab === 'neraca' && 'LAPORAN POSISI KEUANGAN (NERACA)'}
            {reportTab === 'cashflow' && 'LAPORAN ARUS KAS (METODE LANGSUNG)'}
            {reportTab === 'trial_balance' && 'NERACA SALDO (TRIAL BALANCE)'}
          </p>
          <p className="text-xs text-slate-400 print:text-slate-600 mt-0.5">
            Periode Berjalan: September 2026 (Dinyatakan dalam Rupiah Indonesia)
          </p>
        </div>

        {/* 1. Laba Rugi Report */}
        {reportTab === 'pnl' && (
          <div className="max-w-3xl mx-auto space-y-6 text-sm">
            {/* Revenue Section */}
            <div>
              <div className="flex justify-between items-center py-2 border-b border-slate-800 font-bold text-slate-200 print:text-black">
                <span>PENDAPATAN USAHA</span>
                <span>NOMINAL</span>
              </div>
              <div className="divide-y divide-slate-800/60 print:divide-slate-200 py-1">
                {pnl.revenueRows.map((r) => (
                  <div key={r.code} className="flex justify-between py-2 text-xs">
                    <span className="text-slate-300 print:text-black">
                      {r.code} - {r.name}
                    </span>
                    <span className="font-mono text-emerald-400 print:text-black font-semibold">
                      {formatRupiah(r.amount)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center py-2.5 mt-1 border-t-2 border-slate-800 font-bold text-emerald-400 print:text-black">
                <span>TOTAL PENDAPATAN</span>
                <span className="font-mono text-base">{formatRupiah(pnl.totalRevenue)}</span>
              </div>
            </div>

            {/* Expense Section */}
            <div>
              <div className="flex justify-between items-center py-2 border-b border-slate-800 font-bold text-slate-200 print:text-black">
                <span>BEBAN OPERASIONAL</span>
                <span>NOMINAL</span>
              </div>
              <div className="divide-y divide-slate-800/60 print:divide-slate-200 py-1">
                {pnl.expenseRows.map((r) => (
                  <div key={r.code} className="flex justify-between py-2 text-xs">
                    <span className="text-slate-300 print:text-black">
                      {r.code} - {r.name}
                    </span>
                    <span className="font-mono text-rose-400 print:text-black font-semibold">
                      {formatRupiah(r.amount)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center py-2.5 mt-1 border-t-2 border-slate-800 font-bold text-rose-400 print:text-black">
                <span>TOTAL BEBAN OPERASIONAL</span>
                <span className="font-mono text-base">{formatRupiah(pnl.totalExpense)}</span>
              </div>
            </div>

            {/* Net Profit Big Summary Box */}
            <div className={`p-4 rounded-xl border flex justify-between items-center ${
              pnl.netProfit >= 0
                ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-400'
                : 'bg-rose-950/20 border-rose-500/40 text-rose-400'
            }`}>
              <div>
                <span className="text-xs font-bold block uppercase tracking-wider">
                  LABA / (RUGI) BERSIH PERIODE BERJALAN
                </span>
                <span className="text-[11px] text-slate-400 print:text-slate-600">Formula: Total Pendapatan - Total Beban</span>
              </div>
              <span className="text-2xl font-bold font-mono">{formatRupiah(pnl.netProfit)}</span>
            </div>
          </div>
        )}

        {/* 2. Neraca (Balance Sheet) Report */}
        {reportTab === 'neraca' && (
          <div className="max-w-4xl mx-auto space-y-6 text-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column: ASET */}
              <div className="space-y-4">
                <div className="pb-2 border-b-2 border-emerald-500 font-bold text-emerald-400 print:text-black flex justify-between">
                  <span>ASET (AKTIVA)</span>
                  <span>NILAI</span>
                </div>

                <div>
                  <p className="text-xs font-bold text-slate-400 print:text-slate-700 uppercase mb-2">
                    Aset Lancar
                  </p>
                  <div className="space-y-1.5 text-xs">
                    {bs.currentAssetRows.map((r) => (
                      <div key={r.code} className="flex justify-between py-1 border-b border-slate-800/60">
                        <span className="text-slate-300 print:text-black">{r.name}</span>
                        <span className="font-mono font-semibold text-slate-100 print:text-black">
                          {formatRupiah(r.amount)}
                        </span>
                      </div>
                    ))}
                    <div className="flex justify-between pt-2 font-bold text-emerald-400 print:text-black">
                      <span>Total Aset Lancar:</span>
                      <span className="font-mono">{formatRupiah(bs.totalCurrentAssets)}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <p className="text-xs font-bold text-slate-400 print:text-slate-700 uppercase mb-2">
                    Aset Tetap
                  </p>
                  <div className="space-y-1.5 text-xs">
                    {bs.fixedAssetRows.map((r) => (
                      <div key={r.code} className="flex justify-between py-1 border-b border-slate-800/60">
                        <span className="text-slate-300 print:text-black">{r.name}</span>
                        <span className="font-mono font-semibold text-slate-100 print:text-black">
                          {formatRupiah(r.amount)}
                        </span>
                      </div>
                    ))}
                    <div className="flex justify-between pt-2 font-bold text-emerald-400 print:text-black">
                      <span>Total Aset Tetap:</span>
                      <span className="font-mono">{formatRupiah(bs.totalFixedAssets)}</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 flex justify-between items-center font-bold text-emerald-400 print:text-black">
                  <span>TOTAL ASET</span>
                  <span className="font-mono text-lg">{formatRupiah(bs.totalAssets)}</span>
                </div>
              </div>

              {/* Right Column: KEWAJIBAN & EKUITAS */}
              <div className="space-y-4">
                <div className="pb-2 border-b-2 border-indigo-500 font-bold text-indigo-400 print:text-black flex justify-between">
                  <span>KEWAJIBAN & EKUITAS</span>
                  <span>NILAI</span>
                </div>

                <div>
                  <p className="text-xs font-bold text-slate-400 print:text-slate-700 uppercase mb-2">
                    Kewajiban / Hutang
                  </p>
                  <div className="space-y-1.5 text-xs">
                    {bs.liabilityRows.map((r) => (
                      <div key={r.code} className="flex justify-between py-1 border-b border-slate-800/60">
                        <span className="text-slate-300 print:text-black">{r.name}</span>
                        <span className="font-mono font-semibold text-amber-400 print:text-black">
                          {formatRupiah(r.amount)}
                        </span>
                      </div>
                    ))}
                    <div className="flex justify-between pt-2 font-bold text-amber-400 print:text-black">
                      <span>Total Kewajiban:</span>
                      <span className="font-mono">{formatRupiah(bs.totalLiabilities)}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <p className="text-xs font-bold text-slate-400 print:text-slate-700 uppercase mb-2">
                    Ekuitas & Modal
                  </p>
                  <div className="space-y-1.5 text-xs">
                    {bs.equityRows.map((r) => (
                      <div key={r.code} className="flex justify-between py-1 border-b border-slate-800/60">
                        <span className="text-slate-300 print:text-black">{r.name}</span>
                        <span className="font-mono font-semibold text-indigo-300 print:text-black">
                          {formatRupiah(r.amount)}
                        </span>
                      </div>
                    ))}
                    <div className="flex justify-between pt-2 font-bold text-indigo-400 print:text-black">
                      <span>Total Ekuitas:</span>
                      <span className="font-mono">{formatRupiah(bs.totalEquity)}</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-500/30 flex justify-between items-center font-bold text-indigo-400 print:text-black">
                  <span>TOTAL KEWAJIBAN & EKUITAS</span>
                  <span className="font-mono text-lg">{formatRupiah(bs.totalLiabilitiesAndEquity)}</span>
                </div>
              </div>
            </div>

            {/* Balance Equation Proof Box */}
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400">
                Prinsip Neraca: <strong className="text-white">Aset ({formatRupiah(bs.totalAssets)})</strong> ={' '}
                <strong className="text-white">Liabilitas ({formatRupiah(bs.totalLiabilities)})</strong> +{' '}
                <strong className="text-white">Ekuitas ({formatRupiah(bs.totalEquity)})</strong>
              </span>
              <span className="font-bold text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Keseimbangan Neraca Terverifikasi
              </span>
            </div>
          </div>
        )}

        {/* 3. Arus Kas Report */}
        {reportTab === 'cashflow' && (
          <div className="max-w-3xl mx-auto space-y-6 text-sm">
            {/* Operating Activities */}
            <div>
              <div className="flex justify-between items-center py-2 border-b border-slate-800 font-bold text-slate-200 print:text-black">
                <span>ARUS KAS DARI AKTIVITAS OPERASI</span>
                <span>NOMINAL</span>
              </div>
              <div className="divide-y divide-slate-800/60 py-1 text-xs">
                <div className="flex justify-between py-2">
                  <span className="text-slate-300 print:text-black">Penerimaan kas dari penjualan & piutang</span>
                  <span className="font-mono font-semibold text-emerald-400">{formatRupiah(cashFlow.operatingIn)}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-300 print:text-black">Pengeluaran kas untuk beban operasional & hutang</span>
                  <span className="font-mono font-semibold text-rose-400">-{formatRupiah(cashFlow.operatingOut)}</span>
                </div>
              </div>
              <div className="flex justify-between items-center py-2.5 border-t border-slate-800 font-bold text-emerald-400 print:text-black">
                <span>Arus Kas Bersih dari Aktivitas Operasi</span>
                <span className="font-mono">{formatRupiah(cashFlow.netOperating)}</span>
              </div>
            </div>

            {/* Net Cash Flow Summary */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center font-bold">
              <div>
                <span className="text-slate-200 print:text-black block">KENAIKAN / (PENURUNAN) BERSIH KAS & BANK</span>
                <span className="text-xs text-slate-400 print:text-slate-600 font-normal">Pergerakan likuiditas tunai periode September 2026</span>
              </div>
              <span className="text-xl font-mono text-emerald-400">{formatRupiah(cashFlow.netCashFlow)}</span>
            </div>
          </div>
        )}

        {/* 4. Trial Balance (Neraca Saldo) Report */}
        {reportTab === 'trial_balance' && (
          <div className="max-w-3xl mx-auto space-y-4 text-xs font-mono">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold font-sans">
                  <th className="py-2.5 px-4">Kode</th>
                  <th className="py-2.5 px-4">Nama Akun</th>
                  <th className="py-2.5 px-4 text-right">Debit (Rp)</th>
                  <th className="py-2.5 px-4 text-right">Kredit (Rp)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {tb.rows.map((r) => (
                  <tr key={r.code} className="hover:bg-slate-800/20">
                    <td className="py-2 px-4 text-slate-400">{r.code}</td>
                    <td className="py-2 px-4 font-sans text-white">{r.name}</td>
                    <td className="py-2 px-4 text-right text-emerald-400 font-semibold">
                      {r.debit > 0 ? formatRupiah(r.debit, false) : '-'}
                    </td>
                    <td className="py-2 px-4 text-right text-indigo-400 font-semibold">
                      {r.credit > 0 ? formatRupiah(r.credit, false) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-700 font-bold text-sm bg-slate-950/90 text-white">
                  <td colSpan={2} className="py-3 px-4 font-sans uppercase">
                    TOTAL KESEIMBANGAN
                  </td>
                  <td className="py-3 px-4 text-right text-emerald-400">{formatRupiah(tb.totalDebit)}</td>
                  <td className="py-3 px-4 text-right text-indigo-400">{formatRupiah(tb.totalCredit)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
