import React from 'react';
import { X, Receipt, Download, Printer } from 'lucide-react';
import { Transaction } from '../types/finance';
import { formatRupiah, formatDate } from '../utils/formatters';

interface ReceiptViewerModalProps {
  transaction: Transaction | null;
  onClose: () => void;
}

export const ReceiptViewerModal: React.FC<ReceiptViewerModalProps> = ({
  transaction,
  onClose,
}) => {
  if (!transaction) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-indigo-400" />
            <h3 className="font-bold text-white text-sm">
              Bukti Transaksi ({transaction.code})
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Metadata Card */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 font-mono">
            <div className="flex justify-between">
              <span className="text-slate-400 font-sans">Tanggal:</span>
              <span className="text-white">{formatDate(transaction.date)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 font-sans">Pihak Rekanan:</span>
              <span className="text-white font-sans font-bold">{transaction.recipientOrPayer}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 font-sans">Nominal:</span>
              <span className="text-emerald-400 font-bold text-sm">{formatRupiah(transaction.amount)}</span>
            </div>
            <div className="pt-2 border-t border-slate-800/80 text-slate-300 font-sans">
              <span className="text-slate-500 block mb-0.5">Uraian:</span>
              {transaction.description}
            </div>
          </div>

          {/* Image Display */}
          <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950 flex items-center justify-center p-4 min-h-64">
            {transaction.receiptUrl ? (
              <img
                src={transaction.receiptUrl}
                alt={transaction.receiptName || 'Bukti Transaksi'}
                className="max-h-96 w-auto object-contain rounded-lg shadow"
              />
            ) : (
              /* Simulated Digital Receipt Voucher */
              <div className="w-full max-w-sm border border-dashed border-slate-700 p-6 rounded-xl bg-slate-900/60 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto border border-indigo-500/20">
                  <Receipt className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm uppercase">Kwitansi Digital Terverifikasi</h4>
                  <p className="text-[11px] text-slate-400">Nomor Voucher: {transaction.code}</p>
                </div>
                <div className="py-2 border-y border-slate-800 text-slate-300 font-mono text-xs">
                  <p className="font-bold text-emerald-400 text-base">{formatRupiah(transaction.amount)}</p>
                  <p className="text-[11px] text-slate-400 mt-1">Dicatat oleh: {transaction.createdBy}</p>
                </div>
                <p className="text-[10px] text-slate-500">
                  Dokumen ini sah sebagai tanda bukti mutasi pembukuan kas internal perusahaan.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
