import { toast } from 'sonner';
import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Trash2,
  CheckSquare,
  Download,
  ArrowDownLeft,
  Plus,
  Search,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Building2,
  Wallet,
  CreditCard,
  Receipt,
  FileText,
} from 'lucide-react';
import {
  CompanyProfile,
  HutangRecord,
  Contact,
  PaymentInstallment,
  BankAccount,
  UserProfile,
} from '../types/finance';
import { formatRupiah, formatDate, formatDateShort } from '../utils/formatters';
import { exportHutangToExcel } from '../utils/export';
import { ConfirmModal } from './ConfirmModal';

interface HutangViewProps {
  hutangList: HutangRecord[];
  suppliers: Contact[];
  banks: BankAccount[];
  onAddHutang: (hutang: HutangRecord) => void;
  onPayHutang: (hutangId: string, payment: PaymentInstallment) => void;
  currentUser: UserProfile;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  companyProfile?: CompanyProfile;
  onBatchDelete?: (ids: string[]) => void;
}

export const HutangView: React.FC<HutangViewProps> = ({
  hutangList,
  suppliers,
  banks,
  onAddHutang,
  onPayHutang,
  currentUser,
  onApprove,
  onReject,
  companyProfile,
  onBatchDelete,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const isAdmin = currentUser?.role === 'super_admin' || currentUser?.role === 'finance_manager';

  // Payment Modal State
  const [payingHutang, setPayingHutang] = useState<HutangRecord | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState<'bank' | 'kas_besar'>('bank');
  const [payBankId, setPayBankId] = useState<string>(banks[0]?.id || '');
  const [payRef, setPayRef] = useState<string>('');
  const [payNotes, setPayNotes] = useState<string>('');

  // Add Hutang Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newHutang, setNewHutang] = useState<Partial<HutangRecord>>({
    supplierId: suppliers[0]?.id || '',
    invoiceNumber: '',
    date: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    totalAmount: 0,
    notes: '',
    expenseAccountCode: '5108',
  });

  // Calculate Summary Metrics
  const totalHutang = hutangList.reduce((sum, h) => sum + h.totalAmount, 0);
  const totalDibayar = hutangList.reduce((sum, h) => sum + h.paidAmount, 0);
  const totalSisa = hutangList.reduce((sum, h) => sum + h.remainingAmount, 0);

  const todayStr = new Date().toISOString().split('T')[0];

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredList.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredList.map((h) => h.id));
    }
  };

  const handleExportSelected = () => {
    const selectedRows = hutangList.filter((h) => selectedIds.includes(h.id));
    exportHutangToExcel(selectedRows, suppliers, companyProfile);
    toast.success(`Berhasil mengekspor ${selectedRows.length} data hutang terpilih!`);
  };

  const handleConfirmBatchDelete = () => {
    if (onBatchDelete) {
      onBatchDelete(selectedIds);
      setSelectedIds([]);
      setIsDeleteModalOpen(false);
    }
  };


  const filteredList = hutangList.filter((h) => {
    const supplier = suppliers.find((s) => s.id === h.supplierId);
    const suppName = supplier ? supplier.name.toLowerCase() : '';

    const matchSearch =
      h.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      suppName.includes(searchQuery.toLowerCase());

    const isOverdue = h.remainingAmount > 0 && h.dueDate < todayStr;
    let actualStatus = h.status;
    if (isOverdue) actualStatus = 'overdue';

    if (filterStatus === 'all') return matchSearch;
    if (filterStatus === 'overdue') return matchSearch && isOverdue;
    return matchSearch && actualStatus === filterStatus;
  });

  const handleOpenPay = (h: HutangRecord) => {
    setPayingHutang(h);
    setPayAmount(h.remainingAmount);
    setPayRef(`PAY-HT-${Date.now().toString().slice(-4)}`);
    setPayNotes(`Pelunasan invoice ${h.invoiceNumber}`);
  };

  const handleConfirmPay = () => {
    if (!payingHutang || payAmount <= 0) return;

    const installment: PaymentInstallment = {
      id: `pay-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      amount: payAmount,
      paymentMethod: payMethod,
      bankAccountId: payMethod === 'bank' ? payBankId : undefined,
      referenceNumber: payRef,
      notes: payNotes,
      createdBy: 'Finance Staff',
      createdAt: Date.now(),
    };

    onPayHutang(payingHutang.id, installment);
    setPayingHutang(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-lg">
          <span className="text-xs font-medium text-slate-400">Total Nilai Tagihan Hutang</span>
          <p className="text-2xl font-bold text-white font-mono mt-2">{formatRupiah(totalHutang)}</p>
          <p className="text-[11px] text-slate-400 mt-1">{hutangList.length} faktur terdaftar</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-lg">
          <span className="text-xs font-medium text-slate-400">Total Sudah Dibayarkan</span>
          <p className="text-2xl font-bold text-emerald-400 font-mono mt-2">{formatRupiah(totalDibayar)}</p>
          <p className="text-[11px] text-slate-400 mt-1">Realisasi cicilan & pelunasan kas/bank</p>
        </div>

        <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-950/40 to-slate-900 border border-amber-500/30 shadow-lg">
          <span className="text-xs font-semibold text-amber-300">Sisa Kewajiban Hutang Aktif</span>
          <p className="text-2xl font-bold text-amber-400 font-mono mt-2">{formatRupiah(totalSisa)}</p>
          <p className="text-[11px] text-amber-200/80 mt-1">Harus dilunasi sesuai tanggal jatuh tempo</p>
        </div>
      </div>

      {/* Control Bar & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari invoice atau supplier..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-1">
            {[
              { id: 'all', label: 'Semua' },
              { id: 'unpaid', label: 'Belum Dibayar' },
              { id: 'partial', label: 'Sebagian' },
              { id: 'paid', label: 'Lunas' },
              { id: 'overdue', label: 'Terlambat' },
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => setFilterStatus(st.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  filterStatus === st.id
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>+ Catat Hutang Baru</span>
        </button>
      </div>

      {/* Hutang Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm dark:shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-white text-sm flex items-center gap-2">
            <ArrowDownLeft className="w-4 h-4 text-amber-400" />
            <span>Daftar Hutang Usaha ke Supplier</span>
          </h3>
          <span className="text-xs text-slate-400">{filteredList.length} Tagihan Terdaftar</span>
        </div>

        
        {/* Batch Action Toolbar */}
        {selectedIds.length > 0 && (
          <div className="flex items-center justify-between p-3 rounded-xl bg-indigo-50 dark:bg-indigo-600/15 border border-indigo-200 dark:border-indigo-500/30 text-xs text-indigo-900 dark:text-indigo-300 animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span className="font-semibold">{selectedIds.length} faktur dipilih</span>
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

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold">
                <th className="py-3 px-3 w-10 text-center"><input type="checkbox" checked={selectedIds.length === filteredList.length && filteredList.length > 0} onChange={handleSelectAll} className="rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 cursor-pointer" /></th>
                <th className="py-3 px-4">No Hutang</th>
                <th className="py-3 px-4">Supplier</th>
                <th className="py-3 px-4">No Invoice</th>
                <th className="py-3 px-4">Tanggal / Jatuh Tempo</th>
                <th className="py-3 px-4 text-right">Total Hutang</th>
                <th className="py-3 px-4 text-right">Sudah Dibayar</th>
                <th className="py-3 px-4 text-right">Sisa Hutang</th>
                <th className="py-3 px-4 text-center">Approve/Status</th>
                <th className="py-3 px-4 text-center">Status Lunas</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-200">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    Tidak ada data hutang sesuai filter.
                  </td>
                </tr>
              ) : (
                filteredList.map((h) => {
                  const supplier = suppliers.find((s) => s.id === h.supplierId);
                  const isOverdue = h.remainingAmount > 0 && h.dueDate < todayStr;
                  return (
                    <tr key={h.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition">
                      <td className="py-3 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(h.id)}
                          onChange={() => handleToggleSelect(h.id)}
                          className="rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold text-indigo-300">{h.code}</td>
                      <td className="py-3 px-4 font-medium text-white">
                        {supplier ? supplier.name : 'Supplier'}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-300">{h.invoiceNumber}</td>
                      <td className="py-3 px-4 space-y-0.5">
                        <span className="block text-slate-400">{formatDate(h.date)}</span>
                        <span
                          className={`text-[11px] font-bold block ${
                            isOverdue ? 'text-rose-400' : 'text-amber-400'
                          }`}
                        >
                          JT: {formatDate(h.dueDate)} {isOverdue && '(!)'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-white">
                        {formatRupiah(h.totalAmount)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-emerald-400">
                        {formatRupiah(h.paidAmount)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-amber-400">
                        {formatRupiah(h.remainingAmount)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          h.approvalStatus === 'approved' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400' :
                          h.approvalStatus === 'rejected' ? 'bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400' :
                          'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400'
                        }`}>
                          {h.approvalStatus === 'approved' ? 'Disetujui' : h.approvalStatus === 'rejected' ? 'Ditolak' : 'Menunggu'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            h.remainingAmount === 0
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : isOverdue
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              : h.paidAmount > 0
                              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                              : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {h.remainingAmount === 0
                            ? 'Lunas'
                            : isOverdue
                            ? 'Terlambat'
                            : h.paidAmount > 0
                            ? 'Sebagian'
                            : 'Belum Bayar'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center flex gap-1 items-center justify-center">
                        {h.approvalStatus === 'pending' && isAdmin && (
                          <>
                            <button onClick={() => onApprove && onApprove(h.id)} className="px-2 py-1 text-[10px] bg-emerald-600 hover:bg-emerald-500 text-white rounded">Setuju</button>
                            <button onClick={() => onReject && onReject(h.id)} className="px-2 py-1 text-[10px] bg-rose-600 hover:bg-rose-500 text-white rounded">Tolak</button>
                          </>
                        )}
                        {h.remainingAmount > 0 && h.approvalStatus === 'approved' ? (
                          <button
                            onClick={() => handleOpenPay(h)}
                            className="px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-[11px] font-bold shadow transition"
                          >
                            Bayar
                          </button>
                        ) : h.remainingAmount === 0 ? (
                          <span className="text-[11px] text-emerald-400 font-semibold flex items-center justify-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Selesai
                          </span>
                        ) : null}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Modal */}
      {payingHutang && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white">
              Pembayaran Hutang Supplier ({payingHutang.invoiceNumber})
            </h3>
            <p className="text-xs text-slate-400">
              Sisa yang harus dibayar:{' '}
              <span className="text-amber-400 font-bold font-mono">
                {formatRupiah(payingHutang.remainingAmount)}
              </span>
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Nominal Pembayaran (Rp)</label>
                <input
                  type="number"
                  value={payAmount}
                  max={payingHutang.remainingAmount}
                  onChange={(e) => setPayAmount(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono font-bold text-sm"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Metode Sumber Dana</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPayMethod('bank')}
                    className={`py-2 rounded-xl font-semibold border flex items-center justify-center gap-1.5 ${
                      payMethod === 'bank'
                        ? 'bg-blue-600 border-blue-500 text-white'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    <Building2 className="w-4 h-4" />
                    <span>Transfer Bank</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPayMethod('kas_besar')}
                    className={`py-2 rounded-xl font-semibold border flex items-center justify-center gap-1.5 ${
                      payMethod === 'kas_besar'
                        ? 'bg-emerald-600 border-emerald-500 text-white'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    <Wallet className="w-4 h-4" />
                    <span>Kas Besar Tunai</span>
                  </button>
                </div>
              </div>

              {payMethod === 'bank' && (
                <div>
                  <label className="block text-slate-400 mb-1">Pilih Rekening Bank Pengirim</label>
                  <select
                    value={payBankId}
                    onChange={(e) => setPayBankId(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  >
                    {banks.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.bankName} - {b.accountNumber} ({formatRupiah(b.initialBalance)})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-slate-400 mb-1">Nomor Referensi / Bukti Transfer</label>
                <input
                  type="text"
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Catatan Pembayaran</label>
                <input
                  type="text"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
              <button
                onClick={() => setPayingHutang(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmPay}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow"
              >
                Konfirmasi Pembayaran
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Hutang Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white">Catat Hutang Pembelian Baru</h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Pilih Supplier</label>
                <select
                  value={newHutang.supplierId}
                  onChange={(e) => setNewHutang({ ...newHutang, supplierId: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.company})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Nomor Invoice Supplier</label>
                <input
                  type="text"
                  placeholder="Contoh: INV/SL/2026/099"
                  value={newHutang.invoiceNumber}
                  onChange={(e) => setNewHutang({ ...newHutang, invoiceNumber: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Tanggal Transaksi</label>
                  <input
                    type="date"
                    value={newHutang.date}
                    onChange={(e) => setNewHutang({ ...newHutang, date: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Jatuh Tempo</label>
                  <input
                    type="date"
                    value={newHutang.dueDate}
                    onChange={(e) => setNewHutang({ ...newHutang, dueDate: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Total Nilai Hutang (Rp)</label>
                <input
                  type="number"
                  value={newHutang.totalAmount}
                  onChange={(e) => setNewHutang({ ...newHutang, totalAmount: Number(e.target.value) })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Keterangan Pengadaan</label>
                <input
                  type="text"
                  placeholder="Rincian barang/jasa yang dibeli tempo"
                  value={newHutang.notes}
                  onChange={(e) => setNewHutang({ ...newHutang, notes: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  if (newHutang.invoiceNumber && (newHutang.totalAmount || 0) > 0) {
                    onAddHutang({
                      id: `ht-${Date.now()}`,
                      code: `HT-${new Date().getFullYear()}-${String(hutangList.length + 1).padStart(4, '0')}`,
                      supplierId: newHutang.supplierId || suppliers[0]?.id || '',
                      invoiceNumber: newHutang.invoiceNumber,
                      date: newHutang.date || todayStr,
                      dueDate: newHutang.dueDate || todayStr,
                      totalAmount: newHutang.totalAmount || 0,
                      paidAmount: 0,
                      remainingAmount: newHutang.totalAmount || 0,
                      status: 'unpaid',
                      notes: newHutang.notes || '',
                      expenseAccountCode: '5108',
                      payments: [],
                      createdAt: Date.now(),
                    });
                    setShowAddModal(false);
                  }
                }}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow"
              >
                Simpan Hutang Baru
              </button>
            </div>
          </div>
        </div>
      )}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title="Hapus Faktur Hutang Terpilih"
        message={`Apakah Anda yakin ingin menghapus ${selectedIds.length} faktur hutang yang dipilih? Tindakan ini akan menghapus data kewajiban dan jurnal terkait.`}
        confirmText="Ya, Hapus Terpilih"
        cancelText="Batal"
        variant="danger"
        onConfirm={handleConfirmBatchDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
      />
    </div>
  );
};