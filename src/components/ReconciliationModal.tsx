import React, { useState } from 'react';
import {
  X,
  Scale,
  CheckCircle2,
  AlertCircle,
  Coins,
  Calculator,
  Save,
} from 'lucide-react';
import { ReconciliationRecord } from '../types/finance';
import { formatRupiah, getTodayString } from '../utils/formatters';

interface ReconciliationModalProps {
  isOpen: boolean;
  onClose: () => void;
  moduleType: 'kas_kecil' | 'kas_besar' | 'bank';
  targetName: string;
  systemBalance: number;
  onSaveRecord: (record: ReconciliationRecord) => void;
}

export const ReconciliationModal: React.FC<ReconciliationModalProps> = ({
  isOpen,
  onClose,
  moduleType,
  targetName,
  systemBalance,
  onSaveRecord,
}) => {
  const [denominations, setDenominations] = useState<Record<string, number>>({
    '100000': 0,
    '50000': 0,
    '20000': 0,
    '10000': 0,
    '5000': 0,
    '2000': 0,
    '1000': 0,
    'coin': 0,
  });

  const [bankStatementBalance, setBankStatementBalance] = useState<number>(systemBalance);
  const [notes, setNotes] = useState<string>('');

  if (!isOpen) return null;

  // Compute total physical cash from denominations
  const totalPhysicalCash =
    (denominations['100000'] || 0) * 100000 +
    (denominations['50000'] || 0) * 50000 +
    (denominations['20000'] || 0) * 20000 +
    (denominations['10000'] || 0) * 10000 +
    (denominations['5000'] || 0) * 5000 +
    (denominations['2000'] || 0) * 2000 +
    (denominations['1000'] || 0) * 1000 +
    (denominations['coin'] || 0);

  const physicalBalance = moduleType === 'bank' ? bankStatementBalance : totalPhysicalCash;
  const discrepancy = physicalBalance - systemBalance;
  const isMatch = Math.abs(discrepancy) < 1;

  const handleSave = () => {
    onSaveRecord({
      id: `rec-${Date.now()}`,
      date: getTodayString(),
      accountType: moduleType,
      systemBalance,
      physicalBalance,
      discrepancy,
      breakdown: moduleType !== 'bank' ? denominations : undefined,
      notes: notes || `Rekonsiliasi fisik ${targetName}`,
      reconciledBy: 'Finance Staff & Supervisor',
      createdAt: Date.now(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="font-bold text-white text-sm">
                Rekonsiliasi {moduleType === 'bank' ? 'Rekening Koran Bank' : 'Fisik Kas (Cash Opname)'}
              </h3>
              <p className="text-[11px] text-slate-400">{targetName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* Comparison Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400 font-medium block">Saldo Tercatat Sistem</span>
              <span className="text-lg font-bold font-mono text-white mt-1 block">
                {formatRupiah(systemBalance)}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400 font-medium block">
                {moduleType === 'bank' ? 'Saldo Rekening Koran' : 'Saldo Fisik Dihitung'}
              </span>
              <span className="text-lg font-bold font-mono text-indigo-400 mt-1 block">
                {formatRupiah(physicalBalance)}
              </span>
            </div>
          </div>

          {/* Discrepancy Indicator */}
          <div
            className={`p-3.5 rounded-xl border flex items-center justify-between ${
              isMatch
                ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-400'
                : discrepancy > 0
                ? 'bg-blue-950/20 border-blue-500/30 text-blue-400'
                : 'bg-rose-950/20 border-rose-500/30 text-rose-400'
            }`}
          >
            <div className="flex items-center gap-2">
              {isMatch ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              <div>
                <span className="font-bold block">
                  {isMatch
                    ? 'Saldo Cocok & Seimbang'
                    : discrepancy > 0
                    ? 'Terdapat Selisih Lebih (Surplus)'
                    : 'Terdapat Selisih Kurang (Defisit)'}
                </span>
                <span className="text-[11px] opacity-80">
                  {isMatch ? 'Tidak ada perbedaan uang fisik dan sistem' : 'Perlu pencatatan jurnal penyesuaian selisih'}
                </span>
              </div>
            </div>
            <span className="font-mono font-bold text-base">
              {isMatch ? 'Rp 0' : formatRupiah(discrepancy)}
            </span>
          </div>

          {/* If Cash: Physical Denominations Calculator */}
          {moduleType !== 'bank' && (
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between font-semibold text-slate-300">
                <span className="flex items-center gap-1">
                  <Calculator className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Kalkulator Pecahan Uang Fisik</span>
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setDenominations({
                      '100000': 0,
                      '50000': 0,
                      '20000': 0,
                      '10000': 0,
                      '5000': 0,
                      '2000': 0,
                      '1000': 0,
                      'coin': 0,
                    })
                  }
                  className="text-[11px] text-slate-500 hover:text-slate-300"
                >
                  Reset Hitungan
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800">
                {[
                  { key: '100000', label: 'Rp 100.000' },
                  { key: '50000', label: 'Rp 50.000' },
                  { key: '20000', label: 'Rp 20.000' },
                  { key: '10000', label: 'Rp 10.000' },
                  { key: '5000', label: 'Rp 5.000' },
                  { key: '2000', label: 'Rp 2.000' },
                  { key: '1000', label: 'Rp 1.000' },
                  { key: 'coin', label: 'Total Koin (Rp)' },
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center justify-between gap-2">
                    <span className="text-slate-400 text-[11px] font-mono">{label}</span>
                    <input
                      type="number"
                      min={0}
                      value={denominations[key] || ''}
                      placeholder="0"
                      onChange={(e) =>
                        setDenominations({ ...denominations, [key]: Number(e.target.value) || 0 })
                      }
                      className="w-20 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-right text-white font-mono"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* If Bank: Input Bank Statement Balance */}
          {moduleType === 'bank' && (
            <div>
              <label className="block text-slate-400 font-semibold mb-1">
                Saldo Tertera pada Rekening Koran Bank (Rp)
              </label>
              <input
                type="number"
                value={bankStatementBalance}
                onChange={(e) => setBankStatementBalance(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-base font-mono font-bold text-white"
              />
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-slate-400 font-semibold mb-1">Catatan Berita Acara Rekonsiliasi</label>
            <textarea
              rows={2}
              placeholder="Contoh: Pemeriksaan kas opname fisik mingguan bersama supervisor operasional..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
          >
            Tutup
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-600/20 flex items-center gap-1.5"
          >
            <Save className="w-4 h-4" />
            <span>Simpan Berita Acara</span>
          </button>
        </div>
      </div>
    </div>
  );
};
