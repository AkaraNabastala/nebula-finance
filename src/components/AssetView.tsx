import React, { useState } from 'react';
import { Package, Plus } from 'lucide-react';
import { FixedAsset, TransactionCategory } from '../types/finance';
import { formatRupiah, getTodayString } from '../utils/formatters';

interface AssetViewProps {
  assets: FixedAsset[];
  categories: TransactionCategory[];
  onAddAsset: (asset: FixedAsset) => void;
}

export const AssetView: React.FC<AssetViewProps> = ({ assets, categories, onAddAsset }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [acquisitionDate, setAcquisitionDate] = useState(getTodayString());
  const [acquisitionCost, setAcquisitionCost] = useState(0);
  const [usefulLifeYears, setUsefulLifeYears] = useState(4);
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || acquisitionCost <= 0 || usefulLifeYears <= 0) return;
    onAddAsset({
      id: `ast-${Date.now()}`,
      name,
      acquisitionDate,
      acquisitionCost,
      usefulLifeYears,
      categoryId,
      accumulatedDepreciation: 0,
      bookValue: acquisitionCost,
      status: 'active',
    });
    setIsModalOpen(false);
    setName('');
    setAcquisitionCost(0);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Package className="w-6 h-6 text-indigo-500" />
            Aset Tetap
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Kelola aset perusahaan dan nilai penyusutan</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold shadow-lg shadow-indigo-500/30 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Aset</span>
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold">
              <tr>
                <th className="px-4 py-3">Nama Aset</th>
                <th className="px-4 py-3">Kategori</th>
                <th className="px-4 py-3">Tgl Perolehan</th>
                <th className="px-4 py-3 text-right">Nilai Perolehan</th>
                <th className="px-4 py-3 text-right">Akumulasi Susut</th>
                <th className="px-4 py-3 text-right">Nilai Buku</th>
                <th className="px-4 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
              {assets.map((ast) => {
                const cat = categories.find(c => c.id === ast.categoryId);
                return (
                  <tr key={ast.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                    <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">{ast.name}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{cat?.name}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{ast.acquisitionDate}</td>
                    <td className="px-4 py-3 text-right font-mono text-slate-600 dark:text-slate-300">{formatRupiah(ast.acquisitionCost)}</td>
                    <td className="px-4 py-3 text-right font-mono text-rose-500 dark:text-rose-400">{formatRupiah(ast.accumulatedDepreciation)}</td>
                    <td className="px-4 py-3 text-right font-mono text-emerald-600 dark:text-emerald-400 font-semibold">{formatRupiah(ast.bookValue)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                        {ast.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {assets.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                    Belum ada data aset tetap terdaftar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-slate-800 dark:text-slate-100">Tambah Aset Tetap</h3>
            </div>
            <form onSubmit={handleAdd} className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Nama Aset</label>
                <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Contoh: Mobil Box Hino" className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Kategori</label>
                <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500">
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Tgl Perolehan</label>
                  <input type="date" required value={acquisitionDate} onChange={(e) => setAcquisitionDate(e.target.value)} className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Umur Ekonomis (Tahun)</label>
                  <input type="number" required min={1} value={usefulLifeYears} onChange={(e) => setUsefulLifeYears(Number(e.target.value))} className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Nilai Perolehan (Rp)</label>
                <input type="number" required min={1} value={acquisitionCost} onChange={(e) => setAcquisitionCost(Number(e.target.value))} className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">Batal</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-500/30">Simpan Aset</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
