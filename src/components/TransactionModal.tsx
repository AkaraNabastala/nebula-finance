import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Coins,
  Wallet,
  Building2,
  ArrowRightLeft,
  Upload,
  Receipt,
  CheckCircle2,
  FileSpreadsheet,
} from 'lucide-react';
import {
  Transaction,
  TransactionModule,
  TransactionType,
  TransactionCategory,
  COAAccount,
  BankAccount,
} from '../types/finance';
import { formatRupiah, getTodayString } from '../utils/formatters';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tx: Partial<Transaction>) => void;
  categories: TransactionCategory[];
  coaList: COAAccount[];
  banks: BankAccount[];
  defaultModule?: TransactionModule;
  defaultType?: TransactionType;
  editingTransaction?: Transaction | null;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  categories,
  coaList,
  banks,
  defaultModule = 'kas_kecil',
  defaultType = 'expense',
  editingTransaction = null,
}) => {
  const [module, setModule] = useState<TransactionModule>(defaultModule);
  const [type, setType] = useState<TransactionType>(defaultType);
  const [date, setDate] = useState<string>(getTodayString());
  const [time, setTime] = useState<string>('10:00');
  const [amount, setAmount] = useState<number>(0);
  const [recipientOrPayer, setRecipientOrPayer] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>(categories[0]?.id || '');
  const [sourceAccount, setSourceAccount] = useState<string>(
    defaultModule === 'bank' ? banks[0]?.id || '' : defaultModule
  );
  const [destAccount, setDestAccount] = useState<string>('kas_kecil');
  const [contraAccountCode, setContraAccountCode] = useState<string>('5108'); // default ATK
  const [receiptName, setReceiptName] = useState<string>('');
  const [receiptUrl, setReceiptUrl] = useState<string>('');
  const [isTaxIncluded, setIsTaxIncluded] = useState<boolean>(false);
  useEffect(() => {
    if (editingTransaction) {
      setModule(editingTransaction.module);
      setType(editingTransaction.type);
      setDate(editingTransaction.date);
      setTime(editingTransaction.time || '10:00');
      setAmount(editingTransaction.amount);
      setRecipientOrPayer(editingTransaction.recipientOrPayer || '');
      setDescription(editingTransaction.description || '');
      setCategoryId(editingTransaction.categoryId || categories[0]?.id || '');
      setSourceAccount(editingTransaction.sourceAccount || '');
      setDestAccount(editingTransaction.destAccount || 'kas_kecil');
      setContraAccountCode(editingTransaction.contraAccountCode || '5108');
      setReceiptName(editingTransaction.receiptName || '');
      setReceiptUrl(editingTransaction.receiptUrl || '');
      setIsTaxIncluded(!!editingTransaction.taxAmount);
    } else {
      setModule(defaultModule);
      setType(defaultType);
      setDate(getTodayString());
      setTime('10:00');
      setAmount(0);
      setRecipientOrPayer('');
      setDescription('');
      setCategoryId(categories[0]?.id || '');
      setSourceAccount(defaultModule === 'bank' ? banks[0]?.id || '' : defaultModule);
      setDestAccount('kas_kecil');
      setContraAccountCode('5108');
      setReceiptName('');
      setReceiptUrl('');
      setIsTaxIncluded(false);
    }
  }, [isOpen, editingTransaction, defaultModule, defaultType]);


  if (!isOpen) return null;

  // Handle file input for receipt
  const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReceiptName(file.name);
      const reader = new FileReader();
      reader.onload = () => {
        setReceiptUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0 || !description || !recipientOrPayer) return;
    let taxAmount = undefined;
    let taxRate = undefined;
    if (isTaxIncluded) {
      taxRate = 0.11;
      taxAmount = Math.round(amount * 11 / 111); // If amount includes 11% tax
    }

    onSave({
      module,
      type,
      date,
      time,
      amount,
      recipientOrPayer,
      description,
      categoryId,
      sourceAccount: module === 'bank' ? sourceAccount : module,
      destAccount: type === 'transfer' ? destAccount : undefined,
      contraAccountCode,
      receiptName,
      receiptUrl,
      taxRate,
      taxAmount,
      status: 'approved',
      createdBy: 'Finance Staff',
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
            <h3 className="font-bold text-white text-sm">Pencatatan Transaksi Keuangan Baru</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* Module Selector */}
          <div>
            <label className="block text-slate-400 font-semibold mb-1">Modul Pembukuan</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'kas_kecil', label: 'Kas Kecil', icon: Coins },
                { id: 'kas_besar', label: 'Kas Besar', icon: Wallet },
                { id: 'bank', label: 'Rekening Bank', icon: Building2 },
              ].map((m) => {
                const Icon = m.icon;
                const isSel = module === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setModule(m.id as any);
                      if (m.id === 'bank') setSourceAccount(banks[0]?.id || '');
                    }}
                    className={`p-2.5 rounded-xl border flex items-center justify-center gap-1.5 font-semibold transition ${
                      isSel
                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-md'
                        : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Type Selector */}
          <div>
            <label className="block text-slate-400 font-semibold mb-1">Tipe Transaksi</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setType('expense')}
                className={`py-2 rounded-xl border font-bold ${
                  type === 'expense'
                    ? 'bg-rose-600 border-rose-500 text-white'
                    : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
              >
                Pengeluaran (-)
              </button>
              <button
                type="button"
                onClick={() => setType('income')}
                className={`py-2 rounded-xl border font-bold ${
                  type === 'income'
                    ? 'bg-emerald-600 border-emerald-500 text-white'
                    : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
              >
                Pemasukan (+)
              </button>
              <button
                type="button"
                onClick={() => setType('transfer')}
                className={`py-2 rounded-xl border font-bold ${
                  type === 'transfer'
                    ? 'bg-blue-600 border-blue-500 text-white'
                    : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
              >
                Transfer Antar
              </button>
            </div>
          </div>

          {/* Nominal Input */}
          <div>
            <label className="block text-slate-400 font-semibold mb-1">Nominal Transaksi (Rp)</label>
            <input
              type="number"
              required
              min={1}
              value={amount || ''}
              placeholder="0"
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-lg font-mono font-bold text-white focus:outline-none focus:border-indigo-500"
            />
            {amount > 0 && (
              <p className="text-[11px] font-mono text-emerald-400 mt-1">
                Terbilang: {formatRupiah(amount)}
              </p>
            )}
            
            {type !== 'transfer' && (
              <label className="flex items-center gap-2 mt-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isTaxIncluded}
                  onChange={(e) => setIsTaxIncluded(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-900 text-indigo-500 focus:ring-indigo-500 w-4 h-4"
                />
                <span className="text-slate-300 font-semibold text-xs">Termasuk PPN 11%</span>
              </label>
            )}
            {isTaxIncluded && amount > 0 && (
              <div className="mt-2 p-2 bg-slate-900 rounded-lg border border-slate-800 text-[10px] text-slate-400">
                <p>Dasar Pengenaan Pajak (DPP): {formatRupiah(Math.round(amount * 100 / 111))}</p>
                <p>PPN 11%: <span className="text-rose-400 font-mono">{formatRupiah(Math.round(amount * 11 / 111))}</span></p>
              </div>
            )}
          </div>

          {/* Bank Account Picker if Module Bank */}
          {module === 'bank' && (
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Pilih Rekening Bank</label>
              <select
                value={sourceAccount}
                onChange={(e) => setSourceAccount(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
              >
                {banks.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.bankName} - {b.accountNumber} ({b.holderName})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Destination for Transfer */}
          {type === 'transfer' && (
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Rekening / Kas Tujuan</label>
              <select
                value={destAccount}
                onChange={(e) => setDestAccount(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
              >
                <option value="kas_kecil">Kas Kecil (Pengisian Petty Cash)</option>
                <option value="kas_besar">Kas Besar (Tarik Tunai Brankas)</option>
                {banks.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.bankName} - {b.accountNumber}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Tanggal</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Waktu</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
              />
            </div>
          </div>

          {/* Recipient / Payer */}
          <div>
            <label className="block text-slate-400 font-semibold mb-1">
              {type === 'income' ? 'Diterima Dari (Payer)' : 'Penerima Dana / Vendor'}
            </label>
            <input
              type="text"
              required
              placeholder="Nama pihak ketiga atau rekanan..."
              value={recipientOrPayer}
              onChange={(e) => setRecipientOrPayer(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-slate-400 font-semibold mb-1">Keterangan Transaksi</label>
            <input
              type="text"
              required
              placeholder="Uraian detail peruntukan transaksi..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
            />
          </div>

          {/* COA Opposite Account */}
          {type !== 'transfer' && (
            <div>
              <label className="block text-slate-400 font-semibold mb-1">
                Akun Lawan COA ({type === 'income' ? 'Akun Pendapatan' : 'Akun Beban'})
              </label>
              <select
                value={contraAccountCode}
                onChange={(e) => setContraAccountCode(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
              >
                {coaList
                  .filter((c) => !c.isHeader)
                  .map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code} - {c.name}
                    </option>
                  ))}
              </select>
            </div>
          )}

          {/* Receipt Upload */}
          <div>
            <label className="block text-slate-400 font-semibold mb-1">Lampiran Bukti Struk / Faktur</label>
            <div className="flex items-center gap-2">
              <label className="flex-1 border border-dashed border-slate-700 hover:border-slate-500 rounded-xl p-3 text-center cursor-pointer bg-slate-950 transition">
                <Upload className="w-4 h-4 text-slate-400 mx-auto mb-1" />
                <span className="text-[11px] text-slate-400 block">
                  {receiptName ? receiptName : 'Pilih file gambar struk/kwitansi...'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleReceiptUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Journal Preview Box */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px]">
            <span className="text-slate-400 font-semibold flex items-center gap-1 mb-1.5">
              <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-400" />
              <span>Otomatisasi Jurnal (Debit = Kredit Terjamin)</span>
            </span>
            <div className="text-slate-300 font-mono space-y-0.5">
              <p>
                [Debit]: {type === 'expense' ? `Akun Beban (${contraAccountCode})` : 'Kas / Bank'} - {formatRupiah(amount || 0)}
              </p>
              <p className="pl-4">
                [Kredit]: {type === 'expense' ? 'Kas / Bank' : `Akun Pendapatan (${contraAccountCode})`} - {formatRupiah(amount || 0)}
              </p>
            </div>
          </div>

          {/* Buttons */}
          <div className="pt-2 flex justify-end gap-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-600/20"
            >
              Simpan Transaksi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
