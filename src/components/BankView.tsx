import React, { useState } from 'react';
import {
  Building2,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowRightLeft,
  Plus,
  Scale,
  Search,
  Receipt,
  FileSpreadsheet,
  Edit3,
  Trash2,
  CheckSquare,
  Download,
} from 'lucide-react';
import {
  BankAccount,
  Transaction,
  COAAccount,
  UserProfile,
  CompanyProfile,
} from '../types/finance';
import { formatRupiah, formatDate } from '../utils/formatters';
import { ConfirmModal } from './ConfirmModal';
import { exportTransactionsToExcel } from '../utils/export';

interface BankViewProps {
  banks: BankAccount[];
  transactions: Transaction[];
  coaList: COAAccount[];
  onOpenAddIncome: (bankId?: string) => void;
  onOpenAddExpense: (bankId?: string) => void;
  onOpenTransfer: () => void;
  onOpenReconciliation: (bankId: string) => void;
  onViewReceipt: (tx: Transaction) => void;
  currentUser: UserProfile;
  companyProfile?: CompanyProfile;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onEditTransaction?: (tx: Transaction) => void;
  onBatchDelete?: (ids: string[]) => void;
}

export const BankView: React.FC<BankViewProps> = ({
  banks,
  transactions,
  onOpenAddIncome,
  onOpenAddExpense,
  onOpenTransfer,
  onOpenReconciliation,
  onViewReceipt,
  currentUser,
  companyProfile,
  onApprove,
  onReject,
  onEditTransaction,
  onBatchDelete,
}) => {
  const [selectedBankId, setSelectedBankId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const isAdmin = currentUser?.role === 'super_admin' || currentUser?.role === 'finance_manager';

  // Calculate balance per bank
  const bankStats = banks.map((b) => {
    let inc = 0;
    let exp = 0;

    transactions.forEach((t) => {
      if (t.destAccount === b.id || (t.sourceAccount === b.id && t.type === 'income')) {
        inc += t.amount;
      } else if (t.sourceAccount === b.id && (t.type === 'expense' || t.type === 'transfer')) {
        exp += t.amount;
      }
    });

    const ending = b.initialBalance + inc - exp;
    return {
      ...b,
      totalIncome: inc,
      totalExpense: exp,
      calculatedBalance: ending,
    };
  });

  const totalAllBanksBalance = bankStats.reduce((sum, b) => sum + b.calculatedBalance, 0);

  // Filtered transactions for banks
  const bankTxs = transactions.filter((t) => {
    const isBankModule = t.module === 'bank';
    const isBankSourceOrDest = banks.some((b) => b.id === t.sourceAccount || b.id === t.destAccount);
    return isBankModule || isBankSourceOrDest;
  });

  const filtered = bankTxs.filter((t) => {
    const matchBank =
      selectedBankId === 'all' ||
      t.sourceAccount === selectedBankId ||
      t.destAccount === selectedBankId;

    const matchSearch =
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.recipientOrPayer.toLowerCase().includes(searchQuery.toLowerCase());

    return matchBank && matchSearch;
  });

  // Selection handlers
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filtered.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map((t) => t.id));
    }
  };

  // Export handlers
  const handleExportAll = () => {
    const title = selectedBankId === 'all'
      ? 'BUKU MUTASI SELURUH REKENING BANK'
      : `BUKU MUTASI BANK (${banks.find(b => b.id === selectedBankId)?.bankName || 'BANK'})`;
    exportTransactionsToExcel(filtered, companyProfile, title, 'Mutasi_Rekening_Bank.xlsx');
  };

  const handleExportSelected = () => {
    const selectedTxs = filtered.filter((t) => selectedIds.includes(t.id));
    exportTransactionsToExcel(selectedTxs, companyProfile, 'MUTASI BANK - DATA TERPILIH', 'Mutasi_Bank_Terpilih.xlsx');
  };

  const handleConfirmBatchDelete = () => {
    if (onBatchDelete && selectedIds.length > 0) {
      onBatchDelete(selectedIds);
      setSelectedIds([]);
      setIsDeleteModalOpen(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-10">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400">
              <Building2 className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Manajemen Kas Bank & Giro
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Rekonsiliasi Rekening Koran • Mutasi Kliring & Antar Bank
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => onOpenReconciliation(selectedBankId !== 'all' ? selectedBankId : banks[0]?.id || '')}
            className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
          >
            <Scale className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
            <span>Rekonsiliasi Bank</span>
          </button>
          <button
            onClick={handleExportAll}
            className="px-3.5 py-2 rounded-xl bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 transition"
            title="Download seluruh data mutasi bank ke format Excel .xlsx"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Export Excel (.xlsx)</span>
          </button>
          <button
            onClick={onOpenTransfer}
            className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-indigo-500" />
            <span>Transfer Bank</span>
          </button>
          <button
            onClick={() => onOpenAddIncome(selectedBankId !== 'all' ? selectedBankId : undefined)}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-sm shadow-emerald-600/20"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Penerimaan Bank</span>
          </button>
          <button
            onClick={() => onOpenAddExpense(selectedBankId !== 'all' ? selectedBankId : undefined)}
            className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-sm shadow-rose-600/20"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Pengeluaran Bank</span>
          </button>
        </div>
      </div>

      {/* Total Aggregated Balance */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-sky-900/40 via-indigo-900/30 to-slate-900 border border-sky-500/30 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-sky-400 uppercase tracking-wider">
            Total Likuiditas Seluruh Rekening Bank
          </span>
          <h2 className="text-3xl font-extrabold text-white mt-1 font-mono tracking-tight">
            {formatRupiah(totalAllBanksBalance)}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Tersebar di {banks.length} rekening bank resmi {companyProfile?.companyName || 'PT Nabastala'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[11px] text-slate-400 block">Total Mutasi Masuk</span>
            <span className="text-sm font-bold text-emerald-400 font-mono">
              +{formatRupiah(bankStats.reduce((s, b) => s + b.totalIncome, 0))}
            </span>
          </div>
          <div className="h-8 w-px bg-slate-700" />
          <div className="text-right">
            <span className="text-[11px] text-slate-400 block">Total Mutasi Keluar</span>
            <span className="text-sm font-bold text-rose-400 font-mono">
              -{formatRupiah(bankStats.reduce((s, b) => s + b.totalExpense, 0))}
            </span>
          </div>
        </div>
      </div>

      {/* Bank Account Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {bankStats.map((bank) => (
          <div
            key={bank.id}
            onClick={() => setSelectedBankId(selectedBankId === bank.id ? 'all' : bank.id)}
            className={`p-5 rounded-2xl border transition-all cursor-pointer shadow-sm ${
              selectedBankId === bank.id
                ? 'bg-sky-50/80 dark:bg-sky-950/40 border-sky-500 ring-2 ring-sky-500/20 shadow-md'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider">
                  {bank.bankName}
                </span>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white font-mono mt-0.5">
                  {bank.accountNumber}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  a.n. {bank.holderName} {bank.branch ? `• Cab. ${bank.branch}` : ''}
                </p>
              </div>
              <div
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: bank.color || '#0284c7' }}
              />
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex justify-between items-end">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">Saldo Terkini</span>
                <span className="text-lg font-bold text-slate-900 dark:text-white font-mono">
                  {formatRupiah(bank.calculatedBalance)}
                </span>
              </div>
              <div className="text-right text-[10px] text-slate-400 space-y-0.5">
                <div className="text-emerald-600 dark:text-emerald-400">+{formatRupiah(bank.totalIncome)}</div>
                <div className="text-rose-600 dark:text-rose-400">-{formatRupiah(bank.totalExpense)}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Table Section */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl space-y-4">
        {/* Toolbar & Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Filter Rekening:</span>
            <select
              value={selectedBankId}
              onChange={(e) => setSelectedBankId(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">Semua Rekening Bank ({bankTxs.length})</option>
              {banks.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.bankName} - {b.accountNumber}
                </option>
              ))}
            </select>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari mutasi bank..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700/80 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Batch Action Toolbar */}
        {selectedIds.length > 0 && (
          <div className="flex items-center justify-between p-3 rounded-xl bg-indigo-50 dark:bg-indigo-600/15 border border-indigo-200 dark:border-indigo-500/30 text-xs text-indigo-900 dark:text-indigo-300 animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span className="font-semibold">{selectedIds.length} mutasi dipilih</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportSelected}
                className="px-3 py-1.5 rounded-lg bg-emerald-600/15 hover:bg-emerald-600/25 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 font-medium flex items-center gap-1.5 transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Terpilih</span>
              </button>
              {onBatchDelete && (
                <button
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="px-3 py-1.5 rounded-lg bg-rose-600/15 hover:bg-rose-600/25 text-rose-700 dark:text-rose-400 border border-rose-500/30 font-medium flex items-center gap-1.5 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus Terpilih</span>
                </button>
              )}
              <button
                onClick={() => setSelectedIds([])}
                className="px-2.5 py-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition"
              >
                Batal
              </button>
            </div>
          </div>
        )}

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold bg-slate-50 dark:bg-slate-950/50">
                <th className="py-3 px-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === filtered.length && filtered.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                </th>
                <th className="py-3 px-3">No Bukti</th>
                <th className="py-3 px-3">Tanggal</th>
                <th className="py-3 px-3">Rekening Bank</th>
                <th className="py-3 px-3">Pihak / Rekanan</th>
                <th className="py-3 px-3">Uraian Mutasi</th>
                <th className="py-3 px-3 text-right">Debit (Masuk)</th>
                <th className="py-3 px-3 text-right">Kredit (Keluar)</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-200">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-10 text-center text-slate-400">
                    Tidak ada transaksi mutasi bank yang cocok.
                  </td>
                </tr>
              ) : (
                filtered.map((t) => {
                  const isSelected = selectedIds.includes(t.id);
                  const isIncome = t.type === 'income' || banks.some((b) => b.id === t.destAccount);
                  const isExpense = t.type === 'expense' || banks.some((b) => b.id === t.sourceAccount);
                  const relevantBank = banks.find((b) => b.id === t.sourceAccount || b.id === t.destAccount);

                  return (
                    <tr
                      key={t.id}
                      className={`transition-colors ${
                        isSelected
                          ? 'bg-indigo-50/70 dark:bg-indigo-950/30'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'
                      }`}
                    >
                      <td className="py-3 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(t.id)}
                          className="rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-sky-600 dark:text-sky-400">
                        {t.code}
                      </td>
                      <td className="py-3 px-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {formatDate(t.date)}
                      </td>
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: relevantBank?.color || '#0284c7' }}
                          />
                          {relevantBank ? `${relevantBank.bankName} (${relevantBank.accountNumber})` : 'Bank'}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-medium text-slate-900 dark:text-white">
                        {t.recipientOrPayer}
                      </td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-300 max-w-sm truncate">
                        {t.description}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                        {isIncome ? formatRupiah(t.amount) : '-'}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-rose-600 dark:text-rose-400 whitespace-nowrap">
                        {isExpense ? formatRupiah(t.amount) : '-'}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            t.status === 'approved'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                              : t.status === 'rejected'
                              ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                          }`}
                        >
                          {t.status === 'approved' ? 'Disetujui' : t.status === 'rejected' ? 'Ditolak' : 'Menunggu'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {t.receiptUrl && (
                            <button
                              onClick={() => onViewReceipt(t)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-indigo-400 transition"
                              title="Lihat Bukti"
                            >
                              <Receipt className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {onEditTransaction && (
                            <button
                              onClick={() => onEditTransaction(t)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-amber-400 transition"
                              title="Edit Transaksi Ini"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {isAdmin && t.status === 'pending' && onApprove && (
                            <button
                              onClick={() => onApprove(t.id)}
                              className="px-2 py-1 rounded-lg bg-emerald-600 text-white text-[10px] font-bold hover:bg-emerald-500 transition"
                            >
                              Setujui
                            </button>
                          )}
                          {isAdmin && t.status === 'pending' && onReject && (
                            <button
                              onClick={() => onReject(t.id)}
                              className="px-2 py-1 rounded-lg bg-rose-600 text-white text-[10px] font-bold hover:bg-rose-500 transition"
                            >
                              Tolak
                            </button>
                          )}
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

      {/* Confirmation Modal for Batch Deletion */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title="Hapus Mutasi Bank Terpilih"
        message={`Apakah Anda yakin ingin menghapus ${selectedIds.length} transaksi mutasi bank yang dipilih? Tindakan ini akan menghapus catatan dan jurnal otomatis terkait.`}
        confirmText="Ya, Hapus Terpilih"
        cancelText="Batal"
        variant="danger"
        onConfirm={handleConfirmBatchDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
      />
    </div>
  );
};
