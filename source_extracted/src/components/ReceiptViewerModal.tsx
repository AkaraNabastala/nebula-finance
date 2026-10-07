import React from 'react';
import { X, Download, FileText, ExternalLink } from 'lucide-react';
import { Transaction } from '../types';
import { formatDateIndo, formatRupiah } from '../utils/formatters';

interface ReceiptViewerModalProps {
  transaction: Transaction | null;
  onClose: () => void;
  categoryName?: string;
}

export function ReceiptViewerModal({ transaction, onClose, categoryName }: ReceiptViewerModalProps) {
  if (!transaction || !transaction.receiptUrl) return null;

  const isImage = transaction.receiptUrl.startsWith('data:image/') || transaction.receiptUrl.match(/\.(jpeg|jpg|gif|png|webp)($|\?)/i);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = transaction.receiptUrl!;
    link.download = transaction.receiptName || `bukti_transaksi_${transaction.id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200/80">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-gray-100 bg-gray-50/50">
          <div>
            <h3 className="font-bold text-gray-900 text-lg tracking-tight">Bukti Transaksi</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {formatDateIndo(transaction.date)} &bull; {categoryName || 'Kategori'} &bull;{' '}
              <span className={transaction.type === 'income' ? 'text-emerald-600 font-semibold font-mono' : 'text-rose-600 font-semibold font-mono'}>
                {transaction.type === 'income' ? '+' : '-'}
                {formatRupiah(transaction.amount)}
              </span>
            </p>
          </div>
          <div className="flex items-center space-x-1.5">
            <button
              onClick={handleDownload}
              className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
              title="Unduh Bukti Transaksi"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
              title="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 bg-gray-50/60 max-h-[75vh] overflow-auto flex flex-col items-center justify-center">
          {isImage ? (
            <img
              src={transaction.receiptUrl}
              alt={`Bukti ${transaction.description}`}
              className="max-h-[60vh] max-w-full rounded-xl object-contain shadow-xs border border-gray-200 bg-white"
            />
          ) : (
            <div className="p-12 text-center bg-white rounded-2xl shadow-xs border border-gray-200 w-full">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-3" />
              <p className="font-semibold text-gray-800 text-sm">{transaction.receiptName || 'Dokumen Bukti'}</p>
              <a
                href={transaction.receiptUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
              >
                <ExternalLink className="w-4 h-4" /> Buka Dokumen
              </a>
            </div>
          )}

          {transaction.description && (
            <div className="mt-4 w-full bg-white p-4 rounded-xl border border-gray-200/80 text-xs text-gray-600">
              <span className="font-bold text-gray-900">Keterangan: </span>
              {transaction.description}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
