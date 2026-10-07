import { toast } from 'sonner';
import { ConfirmModal } from './ConfirmModal';
import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Trash2,
  CheckSquare,
  Download,
  ArrowUpRight,
  Plus,
  Search,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Building2,
  Wallet,
  Receipt,
  FileText,
} from 'lucide-react';
import {
  CompanyProfile,
  PiutangRecord,
  Contact,
  PaymentInstallment,
  BankAccount,
  UserProfile,
} from '../types/finance';
import { formatRupiah, formatDate } from '../utils/formatters';
import { exportPiutangToExcel } from '../utils/export';

interface PiutangViewProps {
  piutangList: PiutangRecord[];
  customers: Contact[];
  banks: BankAccount[];
  onAddPiutang: (piutang: PiutangRecord) => void;
  onReceivePiutang: (piutangId: string, installment: PaymentInstallment) => void;
  currentUser: UserProfile;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  companyProfile?: CompanyProfile;
  onBatchDelete?: (ids: string[]) => void;
}

export const PiutangView: React.FC<PiutangViewProps> = ({
  piutangList,
  customers,
  banks,
  onAddPiutang,
  onReceivePiutang,
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

  // Receive Payment Modal State
  const [receivingPiutang, setReceivingPiutang] = useState<PiutangRecord | null>(null);
  const [receiveAmount, setReceiveAmount] = useState<number>(0);
  const [receiveMethod, setReceiveMethod] = useState<'bank' | 'kas_besar'>('bank');
  const [receiveBankId, setReceiveBankId] = useState<string>(banks[0]?.id || '');
  const [receiveRef, setReceiveRef] = useState<string>('');
  const [receiveNotes, setReceiveNotes] = useState<string>('');

  // Add Piutang Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPiutang, setNewPiutang] = useState<Partial<PiutangRecord>>({
    customerId: customers[0]?.id || '',
    invoiceNumber: '',
    date: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    totalAmount: 0,
    notes: '',
    revenueAccountCode: '4101',
  });

  const totalPiutang = piutangList.reduce((sum, p) => sum + p.totalAmount, 0);
  const totalDiterima = piutangList.reduce((sum, p) => sum + p.paidAmount, 0);
  const totalSisa = piutangList.reduce((sum, p) => sum + p.remainingAmount, 0);

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
      setSelectedIds(filteredList.map((p) => p.id));
    }
  };

  const handleExportSelected = () => {
    const selectedRows = piutangList.filter((p) => selectedIds.includes(p.id));
    exportPiutangToExcel(selectedRows, customers, companyProfile);
    toast.success(`Berhasil mengekspor ${selectedRows.length} data piutang terpilih!`);
  };

  const handleConfirmBatchDelete = () => {
    if (onBatchDelete) {
      onBatchDelete(selectedIds);
      setSelectedIds([]);
      setIsDeleteModalOpen(false);
    }
  };


  const filteredList = piutangList.filter((p) => {
    const customer = customers.find((c) => c.id === p.customerId);
    const custName = customer ? customer.name.toLowerCase() : '';

    const matchSearch =
      p.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      custName.includes(searchQuery.toLowerCase());

    const isOverdue = p.remainingAmount > 0 && p.dueDate < todayStr;
    let actualStatus = p.status;
    if (isOverdue) actualStatus = 'overdue';

    if (filterStatus === 'all') return matchSearch;
    if (filterStatus === 'overdue') return matchSearch && isOverdue;
    return matchSearch && actualStatus === filterStatus;
  });

  const handleOpenReceive = (p: PiutangRecord) => {
    setReceivingPiutang(p);
    setReceiveAmount(p.remainingAmount);
    setReceiveRef(`REC-PT-${Date.now().toString().slice(-4)}`);
    setReceiveNotes(`Penerimaan pelunasan invoice ${p.invoiceNumber}`);
  };

  const handleConfirmReceive = () => {
    if (!receivingPiutang || receiveAmount <= 0) return;

    const installment: PaymentInstallment = {
      id: `rec-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      amount: receiveAmount,
      paymentMethod: receiveMethod,
      bankAccountId: receiveMethod === 'bank' ? receiveBankId : undefined,
      referenceNumber: receiveRef,
      notes: receiveNotes,
      createdBy: 'Finance Staff',
      createdAt: Date.now(),
    };

    onReceivePiutang(receivingPiutang.id, installment);
    setReceivingPiutang(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-lg">
          <span className="text-xs font-medium text-slate-400">Total Penjualan Tempo (Faktur)</span>
          <p className="text-2xl font-bold text-white font-mono mt-2">{formatRupiah(totalPiutang)}</p>
          <p className="text-[11px] text-slate-400 mt-1">{piutangList.length} tagihan terdaftar</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-lg">
          <span className="text-xs font-medium text-slate-400">Total Pembayaran Masuk</span>
          <p className="text-2xl font-bold text-emerald-400 font-mono mt-2">{formatRupiah(totalDiterima)}</p>
          <p className="text-[11px] text-slate-400 mt-1">Realisasi penerimaan transfer bank & kas</p>
        </div>

        <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-950/40 to-slate-900 border border-blue-500/30 shadow-lg">
          <span className="text-xs font-semibold text-blue-300">Sisa Piutang Belum Tertagih</span>
          <p className="text-2xl font-bold text-blue-400 font-mono mt-2">{formatRupiah(totalSisa)}</p>
          <p className="text-[11px] text-blue-200/80 mt-1">Potensi kas masuk dari penagihan customer</p>
        </div>
      </div>

      {/* Control Bar & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari invoice atau customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-1">
            {[
              { id: 'all', label: 'Semua' },
              { id: 'unpaid', label: 'Belum Bayar' },
              { id: 'partial', label: 'Sebagian' },
              { id: 'paid', label: 'Lunas' },
              { id: 'overdue', label: 'Jatuh Tempo' },
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => setFilterStatus(st.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  filterStatus === st.id
                    ? 'bg-blue-600 text-white'
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
          className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>+ Buat Faktur Piutang</span>
        </button>
      </div>

      {/* Piutang Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm dark:shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-white text-sm flex items-center gap-2">
            <ArrowUpRight className="w-4 h-4 text-blue-400" />
            <span>Daftar Piutang Usaha ke Customer</span>
          </h3>
          <span className="text-xs text-slate-400">{filteredList.length} Faktur Terdaftar</span>
        </div>

        
        {/* Batch Action Toolbar */}
        {selectedIds.length > 0 && (
          <div className="flex items-center justify-between p-3 rounded-xl bg-indigo-50 dark:bg-indigo-600/15 border border-indigo-200 dark:border-indigo-500/30 text-xs text-indigo-900 dark:text-indigo-300 animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span className="font-semibold">{selectedIds.length} faktur piutang dipilih</span>
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
                <th className="py-3 px-4">No Piutang</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">No Faktur / Invoice</th>
                <th className="py-3 px-4">Tanggal / Jatuh Tempo</th>
                <th className="py-3 px-4 text-right">Total Piutang</th>
                <th className="py-3 px-4 text-right">Sudah Dibayar</th>
                <th className="py-3 px-4 text-right">Sisa Piutang</th>
                <th className="py-3 px-4 text-center">Approve/Status</th>
                <th className="py-3 px-4 text-center">Status Lunas</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-200">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    Tidak ada data piutang sesuai filter.
                  </td>
                </tr>
              ) : (
                filteredList.map((p) => {
                  const customer = customers.find((c) => c.id === p.customerId);
                  const isOverdue = p.remainingAmount > 0 && p.dueDate < todayStr;
                  return (
                    <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition">
                      <td className="py-3 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(p.id)}
                          onChange={() => handleToggleSelect(p.id)}
                          className="rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold text-indigo-300">{p.code}</td>
                      <td className="py-3 px-4 font-medium text-white">
                        {customer ? customer.name : 'Customer'}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-300">{p.invoiceNumber}</td>
                      <td className="py-3 px-4 space-y-0.5">
                        <span className="block text-slate-400">{formatDate(p.date)}</span>
                        <span
                          className={`text-[11px] font-bold block ${
                            isOverdue ? 'text-rose-400' : 'text-blue-400'
                          }`}
                        >
                          JT: {formatDate(p.dueDate)} {isOverdue && '(!)'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-white">
                        {formatRupiah(p.totalAmount)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-emerald-400">
                        {formatRupiah(p.paidAmount)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-blue-400">
                        {formatRupiah(p.remainingAmount)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          p.approvalStatus === 'approved' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400' :
                          p.approvalStatus === 'rejected' ? 'bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400' :
                          'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400'
                        }`}>
                          {p.approvalStatus === 'approved' ? 'Disetujui' : p.approvalStatus === 'rejected' ? 'Ditolak' : 'Menunggu'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            p.remainingAmount === 0
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : isOverdue
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              : p.paidAmount > 0
                              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                              : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {p.remainingAmount === 0
                            ? 'Lunas'
                            : isOverdue
                            ? 'Terlambat'
                            : p.paidAmount > 0
                            ? 'Sebagian'
                            : 'Belum Bayar'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center flex items-center justify-center gap-1">
                        {p.approvalStatus === 'pending' && isAdmin && (
                          <>
                            <button onClick={() => onApprove && onApprove(p.id)} className="px-2 py-1 text-[10px] bg-emerald-600 hover:bg-emerald-500 text-white rounded">Setuju</button>
                            <button onClick={() => onReject && onReject(p.id)} className="px-2 py-1 text-[10px] bg-rose-600 hover:bg-rose-500 text-white rounded">Tolak</button>
                          </>
                        )}
                        {p.remainingAmount > 0 && p.approvalStatus === 'approved' ? (
                          <button
                            onClick={() => handleOpenReceive(p)}
                            className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold shadow transition"
                          >
                            Terima Bayar
                          </button>
                        ) : p.remainingAmount === 0 ? (
                          <span className="text-[11px] text-emerald-400 font-semibold flex items-center justify-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Lunas
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

      {/* Receive Payment Modal */}
      {receivingPiutang && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white">
              Terima Pembayaran Piutang Customer ({receivingPiutang.invoiceNumber})
            </h3>
            <p className="text-xs text-slate-400">
              Sisa tagihan:{' '}
              <span className="text-blue-400 font-bold font-mono">
                {formatRupiah(receivingPiutang.remainingAmount)}
              </span>
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Nominal Yang Diterima (Rp)</label>
                <input
                  type="number"
                  value={receiveAmount}
                  max={receivingPiutang.remainingAmount}
                  onChange={(e) => setReceiveAmount(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono font-bold text-sm"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Metode Masuk Dana</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setReceiveMethod('bank')}
                    className={`py-2 rounded-xl font-semibold border flex items-center justify-center gap-1.5 ${
                      receiveMethod === 'bank'
                        ? 'bg-blue-600 border-blue-500 text-white'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    <Building2 className="w-4 h-4" />
                    <span>Masuk Rekening Bank</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setReceiveMethod('kas_besar')}
                    className={`py-2 rounded-xl font-semibold border flex items-center justify-center gap-1.5 ${
                      receiveMethod === 'kas_besar'
                        ? 'bg-emerald-600 border-emerald-500 text-white'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    <Wallet className="w-4 h-4" />
                    <span>Masuk Kas Besar</span>
                  </button>
                </div>
              </div>

              {receiveMethod === 'bank' && (
                <div>
                  <label className="block text-slate-400 mb-1">Pilih Rekening Bank Penerima</label>
                  <select
                    value={receiveBankId}
                    onChange={(e) => setReceiveBankId(e.target.value)}
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
                <label className="block text-slate-400 mb-1">Nomor Referensi Transfer / Bukti</label>
                <input
                  type="text"
                  value={receiveRef}
                  onChange={(e) => setReceiveRef(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Catatan Penerimaan</label>
                <input
                  type="text"
                  value={receiveNotes}
                  onChange={(e) => setReceiveNotes(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
              <button
                onClick={() => setReceivingPiutang(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmReceive}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow"
              >
                Konfirmasi Penerimaan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Piutang Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white">Buat Faktur Tagihan Piutang Baru</h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Pilih Customer</label>
                <select
                  value={newPiutang.customerId}
                  onChange={(e) => setNewPiutang({ ...newPiutang, customerId: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.company})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Nomor Faktur / Invoice</label>
                <input
                  type="text"
                  placeholder="Contoh: INV-2026-09-08"
                  value={newPiutang.invoiceNumber}
                  onChange={(e) => setNewPiutang({ ...newPiutang, invoiceNumber: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Tanggal Transaksi</label>
                  <input
                    type="date"
                    value={newPiutang.date}
                    onChange={(e) => setNewPiutang({ ...newPiutang, date: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Jatuh Tempo</label>
                  <input
                    type="date"
                    value={newPiutang.dueDate}
                    onChange={(e) => setNewPiutang({ ...newPiutang, dueDate: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Total Nilai Tagihan Piutang (Rp)</label>
                <input
                  type="number"
                  value={newPiutang.totalAmount}
                  onChange={(e) => setNewPiutang({ ...newPiutang, totalAmount: Number(e.target.value) })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Keterangan Layanan / Produk</label>
                <input
                  type="text"
                  placeholder="Rincian penjualan yang ditagihkan"
                  value={newPiutang.notes}
                  onChange={(e) => setNewPiutang({ ...newPiutang, notes: e.target.value })}
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
                  if (newPiutang.invoiceNumber && (newPiutang.totalAmount || 0) > 0) {
                    onAddPiutang({
                      id: `pt-${Date.now()}`,
                      code: `PT-${new Date().getFullYear()}-${String(piutangList.length + 1).padStart(4, '0')}`,
                      customerId: newPiutang.customerId || customers[0]?.id || '',
                      invoiceNumber: newPiutang.invoiceNumber,
                      date: newPiutang.date || todayStr,
                      dueDate: newPiutang.dueDate || todayStr,
                      totalAmount: newPiutang.totalAmount || 0,
                      paidAmount: 0,
                      remainingAmount: newPiutang.totalAmount || 0,
                      status: 'unpaid',
                      notes: newPiutang.notes || '',
                      revenueAccountCode: '4101',
                      payments: [],
                      createdAt: Date.now(),
                    });
                    setShowAddModal(false);
                  }
                }}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow"
              >
                Simpan Faktur Piutang
              </button>
            </div>
          </div>
        </div>
      )}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title="Hapus Faktur Piutang Terpilih"
        message={`Apakah Anda yakin ingin menghapus ${selectedIds.length} faktur piutang yang dipilih? Tindakan ini akan menghapus data tagihan dan jurnal terkait.`}
        confirmText="Ya, Hapus Terpilih"
        cancelText="Batal"
        variant="danger"
        onConfirm={handleConfirmBatchDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
      />
    </div>
  );
};