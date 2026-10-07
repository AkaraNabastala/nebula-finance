import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  ArrowDownRight,
  ArrowUpRight,
  Upload,
  Trash2,
  Calendar,
  Clock,
  Tag,
  AlignLeft,
  Image as ImageIcon,
  AlertCircle,
  Building2,
  Banknote,
} from 'lucide-react';
import { AccountType, Category, Transaction, TransactionType } from '../types';
import { formatRupiah, getTodayString, getCurrentTimeString } from '../utils/formatters';
import { CategoryIcon } from './CategoryIcon';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transaction: Omit<Transaction, 'id' | 'createdAt'> & { id?: string }) => void;
  initialType?: TransactionType;
  editingTransaction?: Transaction | null;
  categories: Category[];
  onOpenCategoryManager?: () => void;
}

export function TransactionModal({
  isOpen,
  onClose,
  onSave,
  initialType = 'income',
  editingTransaction,
  categories,
  onOpenCategoryManager,
}: TransactionModalProps) {
  const [type, setType] = useState<TransactionType>(initialType);
  const [account, setAccount] = useState<AccountType>('cash');
  const [date, setDate] = useState<string>(getTodayString());
  const [time, setTime] = useState<string>(getCurrentTimeString());
  const [categoryId, setCategoryId] = useState<string>('');
  const [amountStr, setAmountStr] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [receiptUrl, setReceiptUrl] = useState<string | undefined>(undefined);
  const [receiptName, setReceiptName] = useState<string | undefined>(undefined);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter categories matching current transaction type
  const activeCategories = categories.filter((c) => c.type === type);

  useEffect(() => {
    if (editingTransaction) {
      setType(editingTransaction.type);
      setAccount(editingTransaction.account || 'cash');
      setDate(editingTransaction.date);
      setTime(editingTransaction.time || getCurrentTimeString());
      setCategoryId(editingTransaction.categoryId);
      setAmountStr(editingTransaction.amount.toString());
      setDescription(editingTransaction.description || '');
      setReceiptUrl(editingTransaction.receiptUrl);
      setReceiptName(editingTransaction.receiptName);
      setErrorMessage('');
    } else {
      setType(initialType);
      setAccount('cash');
      setDate(getTodayString());
      setTime(getCurrentTimeString());
      const filtered = categories.filter((c) => c.type === initialType);
      setCategoryId(filtered.length > 0 ? filtered[0].id : '');
      setAmountStr('');
      setDescription('');
      setReceiptUrl(undefined);
      setReceiptName(undefined);
      setErrorMessage('');
    }
  }, [editingTransaction, initialType, isOpen, categories]);

  // When type changes, ensure valid category is selected
  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    const newCategories = categories.filter((c) => c.type === newType);
    if (!newCategories.some((c) => c.id === categoryId)) {
      setCategoryId(newCategories.length > 0 ? newCategories[0].id : '');
    }
  };

  const handleAmountInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    setAmountStr(raw);
    if (errorMessage) setErrorMessage('');
  };

  const addQuickAmount = (val: number) => {
    const current = parseInt(amountStr || '0', 10);
    setAmountStr((current + val).toString());
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('Ukuran file maksimal 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setReceiptUrl(event.target?.result as string);
      setReceiptName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveReceipt = () => {
    setReceiptUrl(undefined);
    setReceiptName(undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseInt(amountStr, 10);

    if (!parsedAmount || parsedAmount <= 0) {
      setErrorMessage('Harap masukkan nominal transaksi yang valid lebih dari 0.');
      return;
    }

    if (!categoryId) {
      setErrorMessage('Harap pilih kategori transaksi.');
      return;
    }

    onSave({
      id: editingTransaction ? editingTransaction.id : undefined,
      type,
      account,
      date,
      time,
      categoryId,
      amount: parsedAmount,
      description: description.trim(),
      receiptUrl,
      receiptName,
    });

    onClose();
  };

  if (!isOpen) return null;

  const numericAmount = parseInt(amountStr || '0', 10);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl border border-gray-200/80 overflow-hidden my-6">
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl ${
                type === 'income' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'
              }`}
            >
              {type === 'income' ? <ArrowDownRight className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-lg tracking-tight">
                {editingTransaction ? 'Edit Transaksi' : type === 'income' ? 'Catat Pemasukan Baru' : 'Catat Pengeluaran Baru'}
              </h3>
              <p className="text-xs text-gray-500">
                {type === 'income' ? 'Pemasukan kas & bank operasional' : 'Pengeluaran kas & bank operasional'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Transaction Type Selector (if not editing) */}
        {!editingTransaction && (
          <div className="p-4 bg-gray-50/80 border-b border-gray-100">
            <div className="grid grid-cols-2 gap-2 bg-gray-200/70 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => handleTypeChange('income')}
                className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                  type === 'income'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <ArrowDownRight className="w-4 h-4" />
                Pemasukan (Uang Masuk)
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('expense')}
                className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                  type === 'expense'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <ArrowUpRight className="w-4 h-4" />
                Pengeluaran (Uang Keluar)
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-xs font-medium text-rose-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Account Selection (Kas Tunai vs Bank) */}
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
              Akun Pembayaran / Penyimpanan <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setAccount('cash')}
                className={`p-3 rounded-xl border flex items-center gap-2.5 transition-all text-left ${
                  account === 'cash'
                    ? 'border-amber-500 bg-amber-50/70 ring-2 ring-amber-500/20 shadow-xs'
                    : 'border-gray-200 bg-gray-50/50 hover:bg-gray-100 text-gray-700'
                }`}
              >
                <div className={`p-2 rounded-lg ${account === 'cash' ? 'bg-amber-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
                  <Banknote className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900">Kas Tunai (Cash)</p>
                  <p className="text-[11px] text-gray-500">Uang fisik / brankas</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setAccount('bank')}
                className={`p-3 rounded-xl border flex items-center gap-2.5 transition-all text-left ${
                  account === 'bank'
                    ? 'border-blue-500 bg-blue-50/70 ring-2 ring-blue-500/20 shadow-xs'
                    : 'border-gray-200 bg-gray-50/50 hover:bg-gray-100 text-gray-700'
                }`}
              >
                <div className={`p-2 rounded-lg ${account === 'bank' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900">Rekening Bank</p>
                  <p className="text-[11px] text-gray-500">Transfer / QRIS / Bank</p>
                </div>
              </button>
            </div>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
              Nominal (Rp) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-base text-gray-400">
                Rp
              </span>
              <input
                type="text"
                value={numericAmount > 0 ? numericAmount.toLocaleString('id-ID') : amountStr}
                onChange={handleAmountInputChange}
                placeholder="0"
                className="w-full pl-12 pr-4 py-3 bg-gray-50/70 border border-gray-200 rounded-xl font-bold font-mono text-2xl text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all placeholder:text-gray-300"
                autoFocus
              />
            </div>

            {/* Quick Amount Buttons */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {[50000, 100000, 500000, 1000000, 5000000].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => addQuickAmount(val)}
                  className="px-2.5 py-1 text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                >
                  +{val >= 1000000 ? `${val / 1000000}jt` : `${val / 1000}rb`}
                </button>
              ))}
              {numericAmount > 0 && (
                <button
                  type="button"
                  onClick={() => setAmountStr('')}
                  className="px-2.5 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Category Dropdown */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wider flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-gray-400" />
                {type === 'income' ? 'Sumber Pemasukan / Kategori' : 'Jenis Pengeluaran / Kategori'} <span className="text-rose-500">*</span>
              </label>
              {onOpenCategoryManager && (
                <button
                  type="button"
                  onClick={onOpenCategoryManager}
                  className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold hover:underline"
                >
                  + Kelola Kategori
                </button>
              )}
            </div>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-gray-900 font-medium text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all"
            >
              {activeCategories.length === 0 ? (
                <option value="">Tidak ada kategori tersedia</option>
              ) : (
                activeCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                Tanggal <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50/70 border border-gray-200 rounded-xl text-gray-900 text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-gray-400" />
                Waktu
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50/70 border border-gray-200 rounded-xl text-gray-900 text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Description (Keterangan) */}
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <AlignLeft className="w-3.5 h-3.5 text-gray-400" />
              Keterangan Transaksi
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Contoh: Pembayaran invoice #102, beli perlengkapan kantor, dll..."
              className="w-full px-3.5 py-2 bg-gray-50/70 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all placeholder:text-gray-400"
            />
          </div>

          {/* Receipt Proof Upload (Bukti Transaksi) */}
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-gray-400" />
              Bukti Transaksi (Struk / Nota / Transfer)
            </label>

            {receiptUrl ? (
              <div className="relative p-3 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3 overflow-hidden">
                  <img
                    src={receiptUrl}
                    alt="Preview Bukti"
                    className="w-12 h-12 object-cover rounded-lg border border-gray-200 shrink-0"
                  />
                  <div className="truncate">
                    <p className="text-xs font-medium text-gray-800 truncate">{receiptName || 'Bukti Transaksi Terlampir'}</p>
                    <p className="text-[11px] text-emerald-600 font-medium">Siap disimpan</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveReceipt}
                  className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors shrink-0"
                  title="Hapus Bukti"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border border-dashed border-gray-300 hover:border-indigo-400 rounded-xl p-3 text-center cursor-pointer bg-gray-50/50 hover:bg-gray-50 transition-colors"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*,.pdf"
                  className="hidden"
                />
                <div className="flex items-center justify-center gap-2 text-xs text-gray-500 font-medium">
                  <Upload className="w-4 h-4 text-gray-400" />
                  <span>Unggah foto nota, struk atau slip transfer (Maks 5MB)</span>
                </div>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className={`px-5 py-2.5 text-xs font-semibold rounded-xl text-white shadow-xs transition-all ${
                type === 'income'
                  ? 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800'
                  : 'bg-rose-600 hover:bg-rose-700 active:bg-rose-800'
              }`}
            >
              {editingTransaction ? 'Simpan Perubahan' : type === 'income' ? 'Catat Pemasukan' : 'Catat Pengeluaran'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

