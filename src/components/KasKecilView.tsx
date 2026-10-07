import React, { useState } from 'react';
import {
  Coins,
  Plus,
  Scale,
  Receipt,
  Search,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingDown,
  FileSpreadsheet,
  Edit3,
  Trash2,
  CheckSquare,
  Square,
  Download,
} from 'lucide-react';
import {
  Transaction,
  COAAccount,
  BankAccount,
  UserProfile,
  CompanyProfile,
} from '../types/finance';
import { formatRupiah, formatDate } from '../utils/formatters';
import { ConfirmModal } from './ConfirmModal';
import { exportTransactionsToExcel, exportSelectedRowsToExcel } from '../utils/export';

interface KasKecilViewProps {
  transactions: Transaction[];
  coaList: COAAccount[];
  banks: BankAccount[];
  onOpenAddExpense: () => void;
  onOpenAddIncome: () => void;
  onOpenReconciliation: (module: 'kas_kecil') => void;
  onViewReceipt: (tx: Transaction) => void;
  currentUser: UserProfile;
  companyProfile?: CompanyProfile;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onEditTransaction?: (tx: Transaction) => void;
  onBatchDelete?: (ids: string[]) => void;
}

export const KasKecilView: React.FC<KasKecilViewProps> = ({
  transactions,
  onOpenAddExpense,
  onOpenAddIncome,
  onOpenReconciliation,
  onViewReceipt,
  currentUser,
  companyProfile,
  onApprove,
  onReject,
  onEditTransaction,
  onBatchDelete,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const isAdmin = currentUser?.role === 'super_admin' || currentUser?.role === 'finance_manager';

  // Plafon Imprest Kas Kecil
  const plafonImprest = 5000000;
  const kasKecilTxs = transactions.filter((t) => t.module === 'kas_kecil' || t.destAccount === 'kas_kecil');

  const totalExpense = kasKecilTxs
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalIncome = kasKecilTxs
    .filter((t) => t.type === 'income' || t.destAccount === 'kas_kecil')
    .reduce((sum, t) => sum + t.amount, 0);

  const currentBalance = 5000000 + totalIncome - totalExpense;
  const needReplenishment = Math.max(0, plafonImprest - currentBalance);

  const filtered = kasKecilTxs.filter(
    (t) =>
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.recipientOrPayer.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
    exportTransactionsToExcel(
      filtered,
      companyProfile,
      'BUKU MUTASI KAS KECIL (PETTY CASH)',
      'Laporan_Kas_Kecil.xlsx'
    );
  };

  const handleExportSelected = () => {
    const selectedTxs = filtered.filter((t) => selectedIds.includes(t.id));
    exportTransactionsToExcel(
      selectedTxs,
      companyProfile,
      'BUKU KAS KECIL - DATA TERPILIH',
      'Laporan_Kas_Kecil_Terpilih.xlsx'
    );
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
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 dark:text-amber-400">
              <Coins className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Buku Kas Kecil (Petty Cash)
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Sistem Imprest Fluktuatif & Tetap • Pencatatan Operasional Harian
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => onOpenReconciliation('kas_kecil')}
            className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
          >
            <Scale className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
            <span>Rekonsiliasi Fisik</span>
          </button>
          <button
            onClick={handleExportAll}
            className="px-3.5 py-2 rounded-xl bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 transition"
            title="Download seluruh data ke format Excel .xlsx"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Export Excel (.xlsx)</span>
          </button>
          <button
            onClick={onOpenAddExpense}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-md shadow-indigo-600/20"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Catat Pengeluaran</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Saldo Fisik */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-lg">
          <div className="flex justify-between items-start">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Saldo Kas Kecil Tersedia</span>
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-2 font-mono">
            {formatRupiah(currentBalance)}
          </h3>
          <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
            <span>Plafon Imprest:</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300 font-mono">{formatRupiah(plafonImprest)}</span>
          </div>
        </div>

        {/* Card 2: Pengeluaran Berjalan */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-lg">
          <div className="flex justify-between items-start">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Pengeluaran Bulan Ini</span>
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-2 font-mono">
            {formatRupiah(totalExpense)}
          </h3>
          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <ArrowDownLeft className="w-3.5 h-3.5 text-rose-500" />
            <span>{kasKecilTxs.filter((t) => t.type === 'expense').length} transaksi pengeluaran</span>
          </div>
        </div>

        {/* Card 3: Rekomendasi Reimburse */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Kebutuhan Pengisian Kembali</span>
              <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2 font-mono">
              {formatRupiah(needReplenishment)}
            </h3>
          </div>
          <button
            onClick={onOpenAddIncome}
            className="mt-3 w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tarik Dana Pengisian</span>
          </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl space-y-4">
        {/* Toolbar & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Daftar Pengeluaran & Struk</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Pencatatan rincian biaya operasional harian</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Cari bukti, uraian, pihak..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700/80 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Batch Action Toolbar */}
        {selectedIds.length > 0 && (
          <div className="flex items-center justify-between p-3 rounded-xl bg-indigo-50 dark:bg-indigo-600/15 border border-indigo-200 dark:border-indigo-500/30 text-xs text-indigo-900 dark:text-indigo-300 animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span className="font-semibold">{selectedIds.length} transaksi dipilih</span>
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
                <th className="py-3 px-3">Penerima / Toko</th>
                <th className="py-3 px-3">Uraian Pengeluaran</th>
                <th className="py-3 px-3 text-right">Nominal (Rp)</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-200">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">
                    Tidak ada mutasi kas kecil yang ditemukan.
                  </td>
                </tr>
              ) : (
                filtered.map((t) => {
                  const isSelected = selectedIds.includes(t.id);
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
                      <td className="py-3 px-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {t.code}
                      </td>
                      <td className="py-3 px-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {formatDate(t.date)}
                      </td>
                      <td className="py-3 px-3 font-medium text-slate-900 dark:text-white">
                        {t.recipientOrPayer}
                      </td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-300 max-w-sm truncate">
                        {t.description}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                        {formatRupiah(t.amount)}
                        {t.taxAmount ? (
                          <span className="block text-[10px] font-normal text-slate-400">
                            + PPN {formatRupiah(t.taxAmount)}
                          </span>
                        ) : null}
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
                          {/* Struk */}
                          {t.receiptUrl && (
                            <button
                              onClick={() => onViewReceipt(t)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-indigo-400 transition"
                              title="Lihat Bukti Struk"
                            >
                              <Receipt className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Edit Button */}
                          {onEditTransaction && (
                            <button
                              onClick={() => onEditTransaction(t)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-amber-400 transition"
                              title="Edit Transaksi Ini"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Approval Actions for Admin/Manager */}
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
        title="Hapus Transaksi Kas Kecil Terpilih"
        message={`Apakah Anda yakin ingin menghapus ${selectedIds.length} transaksi kas kecil yang dipilih? Tindakan ini akan menghapus catatan dan jurnal terkait.`}
        confirmText="Ya, Hapus Terpilih"
        cancelText="Batal"
        variant="danger"
        onConfirm={handleConfirmBatchDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
      />
    </div>
  );
};
