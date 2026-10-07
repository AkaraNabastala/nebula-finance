import React, { useState, useMemo } from 'react';
import { Target, Plus, AlertCircle } from 'lucide-react';
import { BudgetLimit, TransactionCategory, FinancialPeriod, Transaction } from '../types/finance';
import { formatRupiah } from '../utils/formatters';

interface BudgetViewProps {
  budgets: BudgetLimit[];
  categories: TransactionCategory[];
  periods: FinancialPeriod[];
  transactions: Transaction[];
  onAddBudget: (budget: BudgetLimit) => void;
}

export const BudgetView: React.FC<BudgetViewProps> = ({ budgets, categories, periods, transactions, onAddBudget }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [periodId, setPeriodId] = useState(periods[0]?.id || '');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '');
  const [limitAmount, setLimitAmount] = useState(0);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (limitAmount <= 0 || !periodId || !categoryId) return;
    onAddBudget({
      id: `bdg-${Date.now()}`,
      periodId,
      categoryId,
      limitAmount,
    });
    setIsModalOpen(false);
    setLimitAmount(0);
  };

  const getActualAmount = (pId: string, cId: string) => {
    const period = periods.find(p => p.id === pId);
    if (!period) return 0;
    return transactions.filter(t => t.categoryId === cId && t.date >= period.startDate && t.date <= period.endDate && t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Target className="w-6 h-6 text-indigo-500" />
            Manajemen Anggaran
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Pantau batas anggaran pengeluaran per kategori</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold shadow-lg shadow-indigo-500/30 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Set Anggaran Baru</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {budgets.map(budget => {
          const actual = getActualAmount(budget.periodId, budget.categoryId);
          const percent = Math.min(100, Math.round((actual / budget.limitAmount) * 100));
          const cat = categories.find(c => c.id === budget.categoryId);
          const per = periods.find(p => p.id === budget.periodId);
          return (
            <div key={budget.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-slate-100">{cat?.name}</h3>
                  <p className="text-xs text-slate-500">{per?.name}</p>
                </div>
                {percent >= 90 && <AlertCircle className="w-5 h-5 text-rose-500" />}
              </div>
              <div className="mb-2 flex justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">Terpakai: {formatRupiah(actual)}</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{formatRupiah(budget.limitAmount)}</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                <div 
                  className={`h-2.5 rounded-full ${percent >= 90 ? 'bg-rose-500' : percent >= 75 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                  style={{ width: `${percent}%` }}
                ></div>
              </div>
              <p className="text-right text-[10px] text-slate-500 mt-1">{percent}% Terpakai</p>
            </div>
          );
        })}
        {budgets.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-500 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
            Belum ada anggaran yang diatur.
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-slate-800 dark:text-slate-100">Set Anggaran Pengeluaran</h3>
            </div>
            <form onSubmit={handleAdd} className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Periode</label>
                <select value={periodId} onChange={(e) => setPeriodId(e.target.value)} className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500">
                  {periods.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Kategori Beban</label>
                <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500">
                  {categories.filter(c => c.type === 'expense').map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Batas Nominal (Rp)</label>
                <input type="number" required min={1} value={limitAmount} onChange={(e) => setLimitAmount(Number(e.target.value))} className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">Batal</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-500/30">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
