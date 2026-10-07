import React, { useState } from 'react';
import {
  BookOpen,
  Search,
  Filter,
  Calendar,
  Layers,
  Users,
  Briefcase,
  FileSpreadsheet,
} from 'lucide-react';
import {
  CompanyProfile,
  COAAccount,
  JournalEntry,
  HutangRecord,
  PiutangRecord,
  Contact,
} from '../types/finance';
import { formatRupiah, formatDate } from '../utils/formatters';
import { computeGeneralLedger } from '../utils/accountingEngine';
import { exportSelectedRowsToExcel } from '../utils/export';

interface BukuBesarViewProps {
  coaList: COAAccount[];
  journals: JournalEntry[];
  hutangList: HutangRecord[];
  piutangList: PiutangRecord[];
  contacts: Contact[];
  companyProfile?: CompanyProfile;
}

export const BukuBesarView: React.FC<BukuBesarViewProps> = ({
  coaList,
  journals,
  hutangList,
  piutangList,
  contacts,
  companyProfile,
}) => {
  const [activeTab, setActiveTab] = useState<'gl' | 'sub_piutang' | 'sub_hutang'>('gl');
  const [selectedAccountCode, setSelectedAccountCode] = useState<string>('1101'); // default Kas Kecil
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');

  const generalLedgerMap = React.useMemo(
    () => computeGeneralLedger(coaList, journals),
    [coaList, journals]
  );

  const selectedLedger = generalLedgerMap[selectedAccountCode];
  const customers = contacts.filter((c) => c.type === 'customer');
  const suppliers = contacts.filter((c) => c.type === 'supplier');

  // Subsidiary Piutang calculation
  const customerPiutangMap = React.useMemo(() => {
    const map: Record<string, { totalInv: number; totalPaid: number; remaining: number; records: PiutangRecord[] }> = {};
    customers.forEach((c) => {
      map[c.id] = { totalInv: 0, totalPaid: 0, remaining: 0, records: [] };
    });
    piutangList.forEach((p) => {
      if (!map[p.customerId]) {
        map[p.customerId] = { totalInv: 0, totalPaid: 0, remaining: 0, records: [] };
      }
      map[p.customerId].totalInv += p.totalAmount;
      map[p.customerId].totalPaid += p.paidAmount;
      map[p.customerId].remaining += p.remainingAmount;
      map[p.customerId].records.push(p);
    });
    return map;
  }, [customers, piutangList]);

  // Subsidiary Hutang calculation
  const supplierHutangMap = React.useMemo(() => {
    const map: Record<string, { totalInv: number; totalPaid: number; remaining: number; records: HutangRecord[] }> = {};
    suppliers.forEach((s) => {
      map[s.id] = { totalInv: 0, totalPaid: 0, remaining: 0, records: [] };
    });
    hutangList.forEach((h) => {
      if (!map[h.supplierId]) {
        map[h.supplierId] = { totalInv: 0, totalPaid: 0, remaining: 0, records: [] };
      }
      map[h.supplierId].totalInv += h.totalAmount;
      map[h.supplierId].totalPaid += h.paidAmount;
      map[h.supplierId].remaining += h.remainingAmount;
      map[h.supplierId].records.push(h);
    });
    return map;
  }, [suppliers, hutangList]);

  return (
    <div className="space-y-6">
      {/* Sub Tabs Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex gap-2">
          {[
            { id: 'gl', label: 'Buku Besar Umum (General Ledger)', icon: BookOpen },
            { id: 'sub_piutang', label: 'Buku Pembantu Piutang', icon: Users },
            { id: 'sub_hutang', label: 'Buku Pembantu Hutang', icon: Briefcase },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 1. General Ledger View */}
      {activeTab === 'gl' && (
        <div className="space-y-4">
          {/* Account Selector & Stats */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm dark:shadow-xl">
            <div className="flex-1 max-w-md">
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                Pilih Akun Buku Besar (Chart of Accounts):
              </label>
              <select
                value={selectedAccountCode}
                onChange={(e) => setSelectedAccountCode(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-500 font-semibold"
              >
                {coaList
                  .filter((c) => !c.isHeader)
                  .map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code} - {c.name} ({c.group.replace('_', ' ').toUpperCase()})
                    </option>
                  ))}
              </select>
            </div>

            {selectedLedger && (
              <div className="flex items-center gap-6 text-right">
                <div>
                  <span className="text-xs text-slate-400 block">Saldo Awal:</span>
                  <span className="font-mono font-semibold text-slate-200 text-sm">
                    {formatRupiah(selectedLedger.initialBalance)}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">Total Mutasi Debit:</span>
                  <span className="font-mono font-semibold text-emerald-400 text-sm">
                    +{formatRupiah(selectedLedger.totalDebit)}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">Total Mutasi Kredit:</span>
                  <span className="font-mono font-semibold text-indigo-400 text-sm">
                    +{formatRupiah(selectedLedger.totalCredit)}
                  </span>
                </div>
                <div className="pl-4 border-l border-slate-800">
                  <span className="text-xs text-slate-400 block">Saldo Akhir Akun:</span>
                  <span className="font-mono font-bold text-emerald-400 text-lg">
                    {formatRupiah(selectedLedger.endingBalance)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Ledger Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm dark:shadow-xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-white text-sm">
                Rincian Transaksi Akun: {selectedLedger?.account.code} - {selectedLedger?.account.name}
              </h3>
              <span className="text-xs text-slate-400">
                {selectedLedger?.entries.length || 0} Mutasi Terposting
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold font-mono">
                    <th className="py-3 px-4">Tanggal</th>
                    <th className="py-3 px-4">No Jurnal</th>
                    <th className="py-3 px-4">Ref Transaksi</th>
                    <th className="py-3 px-4">Keterangan</th>
                    <th className="py-3 px-4 text-right">Debit</th>
                    <th className="py-3 px-4 text-right">Kredit</th>
                    <th className="py-3 px-4 text-right">Saldo Berjalan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-200 font-mono">
                  {/* Initial balance row */}
                  <tr className="bg-slate-950/40 text-slate-400 font-semibold italic">
                    <td className="py-2.5 px-4">-</td>
                    <td className="py-2.5 px-4">-</td>
                    <td className="py-2.5 px-4">-</td>
                    <td className="py-2.5 px-4 font-sans">Saldo Awal Periode</td>
                    <td className="py-2.5 px-4 text-right">-</td>
                    <td className="py-2.5 px-4 text-right">-</td>
                    <td className="py-2.5 px-4 text-right font-bold text-slate-200">
                      {formatRupiah(selectedLedger?.initialBalance || 0)}
                    </td>
                  </tr>

                  {selectedLedger?.entries.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400 font-sans">
                        Belum ada mutasi transaksi untuk akun ini pada periode berjalan.
                      </td>
                    </tr>
                  ) : (
                    selectedLedger?.entries.map((entry, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/30 transition">
                        <td className="py-3 px-4 text-slate-400">{formatDate(entry.date)}</td>
                        <td className="py-3 px-4 font-bold text-indigo-400">{entry.journalCode}</td>
                        <td className="py-3 px-4 text-slate-400">{entry.referenceCode || '-'}</td>
                        <td className="py-3 px-4 font-sans text-white max-w-xs truncate">
                          {entry.description}
                        </td>
                        <td className="py-3 px-4 text-right text-emerald-400 font-bold">
                          {entry.debit > 0 ? formatRupiah(entry.debit) : '-'}
                        </td>
                        <td className="py-3 px-4 text-right text-indigo-400 font-bold">
                          {entry.credit > 0 ? formatRupiah(entry.credit) : '-'}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-white">
                          {formatRupiah(entry.runningBalance)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2. Buku Pembantu Piutang (Subsidiary Ledger AR) */}
      {activeTab === 'sub_piutang' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {customers.map((c) => {
              const data = customerPiutangMap[c.id] || { totalInv: 0, totalPaid: 0, remaining: 0, records: [] };
              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedCustomerId(selectedCustomerId === c.id ? '' : c.id)}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer shadow-lg ${
                    selectedCustomerId === c.id
                      ? 'bg-slate-900 border-blue-500'
                      : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    Kartu Piutang Customer
                  </span>
                  <h4 className="text-base font-bold text-white mt-2">{c.name}</h4>
                  <p className="text-xs text-slate-400">{c.company} - Termin {c.termDays} Hari</p>

                  <div className="mt-4 pt-3 border-t border-slate-800 space-y-1.5 text-xs font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Total Tagihan:</span>
                      <span className="text-white font-bold">{formatRupiah(data.totalInv)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Telah Dibayar:</span>
                      <span className="text-emerald-400 font-bold">{formatRupiah(data.totalPaid)}</span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-slate-800/80">
                      <span className="text-slate-400">Sisa Piutang:</span>
                      <span className="text-blue-400 font-bold">{formatRupiah(data.remaining)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Rincian Faktur Customer Terpilih */}
          {selectedCustomerId && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm dark:shadow-xl p-4">
              <h4 className="font-bold text-white text-sm mb-3">
                Rincian Faktur & Penerimaan: {customers.find((c) => c.id === selectedCustomerId)?.name}
              </h4>
              <div className="space-y-2">
                {customerPiutangMap[selectedCustomerId]?.records.map((r) => (
                  <div key={r.id} className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/60 flex justify-between items-center text-xs">
                    <div>
                      <span className="font-mono font-bold text-indigo-300">{r.invoiceNumber}</span>
                      <span className="text-slate-400 ml-2">Tgl: {formatDate(r.date)} | JT: {formatDate(r.dueDate)}</span>
                      <p className="text-slate-300 mt-0.5">{r.notes}</p>
                    </div>
                    <div className="text-right font-mono">
                      <span className="text-white font-bold block">{formatRupiah(r.totalAmount)}</span>
                      <span className="text-blue-400 font-semibold block">Sisa: {formatRupiah(r.remainingAmount)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. Buku Pembantu Hutang (Subsidiary Ledger AP) */}
      {activeTab === 'sub_hutang' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {suppliers.map((s) => {
              const data = supplierHutangMap[s.id] || { totalInv: 0, totalPaid: 0, remaining: 0, records: [] };
              return (
                <div
                  key={s.id}
                  onClick={() => setSelectedSupplierId(selectedSupplierId === s.id ? '' : s.id)}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer shadow-lg ${
                    selectedSupplierId === s.id
                      ? 'bg-slate-900 border-amber-500'
                      : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Kartu Hutang Supplier
                  </span>
                  <h4 className="text-base font-bold text-white mt-2">{s.name}</h4>
                  <p className="text-xs text-slate-400">{s.company} - Termin {s.termDays} Hari</p>

                  <div className="mt-4 pt-3 border-t border-slate-800 space-y-1.5 text-xs font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Total Faktur Beli:</span>
                      <span className="text-white font-bold">{formatRupiah(data.totalInv)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Telah Dibayar:</span>
                      <span className="text-emerald-400 font-bold">{formatRupiah(data.totalPaid)}</span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-slate-800/80">
                      <span className="text-slate-400">Sisa Kewajiban:</span>
                      <span className="text-amber-400 font-bold">{formatRupiah(data.remaining)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Rincian Faktur Supplier Terpilih */}
          {selectedSupplierId && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm dark:shadow-xl p-4">
              <h4 className="font-bold text-white text-sm mb-3">
                Rincian Faktur Pengadaan: {suppliers.find((s) => s.id === selectedSupplierId)?.name}
              </h4>
              <div className="space-y-2">
                {supplierHutangMap[selectedSupplierId]?.records.map((r) => (
                  <div key={r.id} className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/60 flex justify-between items-center text-xs">
                    <div>
                      <span className="font-mono font-bold text-indigo-300">{r.invoiceNumber}</span>
                      <span className="text-slate-400 ml-2">Tgl: {formatDate(r.date)} | JT: {formatDate(r.dueDate)}</span>
                      <p className="text-slate-300 mt-0.5">{r.notes}</p>
                    </div>
                    <div className="text-right font-mono">
                      <span className="text-white font-bold block">{formatRupiah(r.totalAmount)}</span>
                      <span className="text-amber-400 font-semibold block">Sisa: {formatRupiah(r.remainingAmount)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
