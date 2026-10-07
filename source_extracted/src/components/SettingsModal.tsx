import React, { useRef, useState } from 'react';
import { X, Download, Upload, RotateCcw, Trash2, Database, ShieldAlert, CheckCircle } from 'lucide-react';
import { Category, Transaction } from '../types';
import { DEFAULT_CATEGORIES, getInitialTransactions, saveCategories, saveTransactions } from '../utils/storage';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  categories: Category[];
  onDataRestored: (newTransactions: Transaction[], newCategories: Category[]) => void;
}

export function SettingsModal({
  isOpen,
  onClose,
  transactions,
  categories,
  onDataRestored,
}: SettingsModalProps) {
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Export JSON Backup
  const handleBackup = () => {
    const backupData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      transactions,
      categories,
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `cadangan_sistem_keuangan_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    setSuccessMsg('File cadangan JSON berhasil diunduh.');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  // Restore JSON Backup
  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target?.result as string);
        if (parsed && Array.isArray(parsed.transactions) && Array.isArray(parsed.categories)) {
          saveTransactions(parsed.transactions);
          saveCategories(parsed.categories);
          onDataRestored(parsed.transactions, parsed.categories);
          setSuccessMsg('Data berhasil dipulihkan dari file cadangan.');
          setTimeout(() => {
            setSuccessMsg('');
            onClose();
          }, 1500);
        } else {
          setErrorMsg('Format file cadangan tidak valid.');
        }
      } catch {
        setErrorMsg('Gagal membaca file JSON.');
      }
    };
    reader.readAsText(file);
  };

  // Reset to Sample
  const handleResetSample = () => {
    if (window.confirm('Muat ulang data contoh simulasi? Transaksi saat ini akan diganti dengan data contoh.')) {
      const sampleTx = getInitialTransactions();
      saveTransactions(sampleTx);
      saveCategories(DEFAULT_CATEGORIES);
      onDataRestored(sampleTx, DEFAULT_CATEGORIES);
      setSuccessMsg('Data contoh berhasil dimuat.');
      setTimeout(() => {
        setSuccessMsg('');
        onClose();
      }, 1000);
    }
  };

  // Clear all data
  const handleClearAll = () => {
    if (window.confirm('PERINGATAN: Yakin ingin menghapus seluruh catatan transaksi? Tindakan ini tidak dapat dibatalkan.')) {
      saveTransactions([]);
      onDataRestored([], categories);
      setSuccessMsg('Seluruh data transaksi telah dikosongkan.');
      setTimeout(() => {
        setSuccessMsg('');
        onClose();
      }, 1000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-xs">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-200/80 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-lg tracking-tight">Cadangan & Pengaturan</h3>
              <p className="text-xs text-gray-500">Kelola penyimpanan data buku kas</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-3.5">
          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800 font-medium">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-800 font-medium">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Backup Action */}
          <div className="p-4 bg-gray-50/80 rounded-2xl border border-gray-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-gray-900">Unduh Cadangan (Backup)</p>
                <p className="text-[11px] text-gray-500">Simpan salinan data lengkap transaksi ke file JSON</p>
              </div>
              <button
                onClick={handleBackup}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <Download className="w-3.5 h-3.5" /> Backup
              </button>
            </div>
          </div>

          {/* Restore Action */}
          <div className="p-4 bg-gray-50/80 rounded-2xl border border-gray-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-gray-900">Pulihkan Data (Restore)</p>
                <p className="text-[11px] text-gray-500">Impor data transaksi dari file JSON cadangan</p>
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-3.5 py-2 bg-white hover:bg-gray-100 text-gray-800 border border-gray-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <Upload className="w-3.5 h-3.5" /> Impor
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileImport}
                accept=".json"
                className="hidden"
              />
            </div>
          </div>

          {/* Reset to Sample Action */}
          <div className="p-4 bg-gray-50/80 rounded-2xl border border-gray-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-gray-900">Muat Data Contoh</p>
                <p className="text-[11px] text-gray-500">Isi buku kas dengan contoh simulasi transaksi awal</p>
              </div>
              <button
                onClick={handleResetSample}
                className="px-3.5 py-2 bg-white hover:bg-gray-100 text-gray-800 border border-gray-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset Contoh
              </button>
            </div>
          </div>

          {/* Clear All Data */}
          <div className="p-4 bg-rose-50/40 rounded-2xl border border-rose-100 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-rose-900">Kosongkan Semua Transaksi</p>
                <p className="text-[11px] text-rose-600">Hapus seluruh catatan dari buku kas</p>
              </div>
              <button
                onClick={handleClearAll}
                className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <Trash2 className="w-3.5 h-3.5" /> Hapus Semua
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-gray-50/50 border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-900 text-white text-xs font-semibold rounded-xl hover:bg-gray-800 transition-colors shadow-xs"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
