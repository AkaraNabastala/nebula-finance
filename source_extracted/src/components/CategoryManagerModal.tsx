import React, { useState } from 'react';
import { X, Plus, Edit2, Trash2, Tag, Check, AlertCircle } from 'lucide-react';
import { Category, Transaction, TransactionType } from '../types';
import { CategoryIcon, AVAILABLE_ICONS } from './CategoryIcon';

interface CategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  transactions: Transaction[];
  onSaveCategory: (category: Category) => void;
  onDeleteCategory: (categoryId: string) => void;
}

const COLOR_PALETTE = [
  '#10b981', '#059669', '#047857', '#0d9488', '#0284c7', 
  '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
  '#ec4899', '#f43f5e', '#ef4444', '#dc2626', '#f97316', 
  '#d97706', '#ca8a04', '#64748b'
];

export function CategoryManagerModal({
  isOpen,
  onClose,
  categories,
  transactions,
  onSaveCategory,
  onDeleteCategory,
}: CategoryManagerModalProps) {
  const [activeTab, setActiveTab] = useState<TransactionType>('income');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [name, setName] = useState<string>('');
  const [color, setColor] = useState<string>('#10b981');
  const [iconName, setIconName] = useState<string>('ShoppingBag');
  const [error, setError] = useState<string>('');

  if (!isOpen) return null;

  const currentCategories = categories.filter((c) => c.type === activeTab);

  const startCreate = () => {
    setEditingCategory(null);
    setName('');
    setColor(activeTab === 'income' ? '#10b981' : '#ef4444');
    setIconName(activeTab === 'income' ? 'ShoppingBag' : 'Store');
    setError('');
  };

  const startEdit = (cat: Category) => {
    setEditingCategory(cat);
    setName(cat.name);
    setColor(cat.color || (activeTab === 'income' ? '#10b981' : '#ef4444'));
    setIconName(cat.iconName || 'Tag');
    setError('');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Nama kategori tidak boleh kosong');
      return;
    }

    const newCategory: Category = {
      id: editingCategory ? editingCategory.id : `cat-${activeTab.slice(0, 3)}-${Date.now()}`,
      name: name.trim(),
      type: activeTab,
      color,
      iconName,
      isDefault: editingCategory ? editingCategory.isDefault : false,
    };

    onSaveCategory(newCategory);
    setEditingCategory(null);
    setName('');
    setError('');
  };

  const handleDelete = (cat: Category) => {
    const txCount = transactions.filter((t) => t.categoryId === cat.id).length;
    if (txCount > 0) {
      setError(`Kategori "${cat.name}" sedang digunakan oleh ${txCount} transaksi dan tidak dapat dihapus.`);
      return;
    }
    if (window.confirm(`Yakin ingin menghapus kategori "${cat.name}"?`)) {
      onDeleteCategory(cat.id);
      if (editingCategory?.id === cat.id) {
        setEditingCategory(null);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-xs">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-xl border border-gray-200/80 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-lg tracking-tight">Kelola Kategori Transaksi</h3>
              <p className="text-xs text-gray-500">Tambah, ubah, atau hapus kategori pemasukan & pengeluaran</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="px-6 pt-3 border-b border-gray-100 bg-white">
          <div className="flex gap-2">
            <button
              onClick={() => {
                setActiveTab('income');
                startCreate();
              }}
              className={`pb-3 px-4 font-bold text-xs border-b-2 transition-all ${
                activeTab === 'income'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              Kategori Pemasukan ({categories.filter((c) => c.type === 'income').length})
            </button>
            <button
              onClick={() => {
                setActiveTab('expense');
                startCreate();
              }}
              className={`pb-3 px-4 font-bold text-xs border-b-2 transition-all ${
                activeTab === 'expense'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              Kategori Pengeluaran ({categories.filter((c) => c.type === 'expense').length})
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-gray-50/50">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs font-medium text-rose-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form Create / Edit */}
          <form onSubmit={handleSave} className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-800">
                {editingCategory ? 'Edit Kategori' : '+ Tambah Kategori Baru'}
              </span>
              {editingCategory && (
                <button
                  type="button"
                  onClick={startCreate}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold underline"
                >
                  Batal Edit
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Nama Kategori</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Honor Konsultan, Listrik..."
                  className="w-full px-3.5 py-2 bg-gray-50/70 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Pilih Ikon</label>
                <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto p-1.5 bg-gray-50/70 border border-gray-200 rounded-xl">
                  {AVAILABLE_ICONS.map((ico) => (
                    <button
                      key={ico}
                      type="button"
                      onClick={() => setIconName(ico)}
                      className={`p-1.5 rounded-lg border transition-all ${
                        iconName === ico
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100'
                      }`}
                      title={ico}
                    >
                      <CategoryIcon name={ico} className="w-3.5 h-3.5" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Warna Label</label>
              <div className="flex flex-wrap gap-1.5">
                {COLOR_PALETTE.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className="w-6 h-6 rounded-full flex items-center justify-center transition-transform hover:scale-110 shadow-xs"
                    style={{ backgroundColor: c }}
                  >
                    {color === c && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl shadow-xs transition-all"
              >
                {editingCategory ? 'Perbarui Kategori' : '+ Simpan Kategori'}
              </button>
            </div>
          </form>

          {/* List of Categories */}
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2.5">
              Daftar Kategori {activeTab === 'income' ? 'Pemasukan' : 'Pengeluaran'} ({currentCategories.length})
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {currentCategories.map((cat) => {
                const count = transactions.filter((t) => t.categoryId === cat.id).length;
                return (
                  <div
                    key={cat.id}
                    className="bg-white p-3.5 rounded-xl border border-gray-200/80 flex items-center justify-between shadow-xs hover:border-gray-300 transition-all"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs"
                        style={{ backgroundColor: cat.color }}
                      >
                        <CategoryIcon name={cat.iconName} className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <p className="text-xs font-semibold text-gray-900 truncate">{cat.name}</p>
                        <p className="text-[11px] text-gray-400 font-medium">{count} transaksi</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => startEdit(cat)}
                        className="p-1.5 text-gray-400 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Edit Kategori"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(cat)}
                        className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Hapus Kategori"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-gray-100 bg-gray-50/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-900 text-white text-xs font-semibold rounded-xl hover:bg-gray-800 transition-colors shadow-xs"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
}
