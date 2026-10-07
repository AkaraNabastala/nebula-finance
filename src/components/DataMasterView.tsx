import React, { useState } from 'react';
import {
  Database,
  FileSpreadsheet,
  Edit3,
  ListTree,
  Building2,
  Tag,
  Users,
  Briefcase,
  Package,
  Calendar,
  Plus,
  Search,
  CheckCircle2,
  Lock,
  Unlock,
  CreditCard,
  Phone,
  Mail,
  MapPin,
} from 'lucide-react';
import {
  CompanyProfile,
  COAAccount,
  BankAccount,
  Contact,
  TransactionCategory,
  ProductService,
  FinancialPeriod,
} from '../types/finance';
import { formatRupiah } from '../utils/formatters';
import { exportCOAToExcel, exportSelectedRowsToExcel } from '../utils/export';
import { ConfirmModal } from './ConfirmModal';

interface DataMasterViewProps {
  coaList: COAAccount[];
  banks: BankAccount[];
  contacts: Contact[];
  categories: TransactionCategory[];
  products: ProductService[];
  periods: FinancialPeriod[];
  onAddCOA: (account: COAAccount) => void;
  onAddBank: (bank: BankAccount) => void;
  onAddContact: (contact: Contact) => void;
  onAddCategory: (cat: TransactionCategory) => void;
  onAddProduct: (prod: ProductService) => void;
  onTogglePeriodStatus: (periodId: string) => void;
  onDeleteCOA?: (code: string) => void;
  companyProfile?: CompanyProfile;
  onUpdateCOA?: (acc: COAAccount) => void;
  onUpdateBank?: (bank: BankAccount) => void;
  onUpdateContact?: (contact: Contact) => void;
}

export const DataMasterView: React.FC<DataMasterViewProps> = ({
  coaList,
  banks,
  contacts,
  categories,
  products,
  periods,
  onAddCOA,
  onAddBank,
  onAddContact,
  onAddCategory,
  onAddProduct,
  onTogglePeriodStatus,
  onDeleteCOA,
  companyProfile,
  onUpdateCOA,
  onUpdateBank,
  onUpdateContact,
}) => {
  const [subTab, setSubTab] = useState<'coa' | 'bank' | 'category' | 'customer' | 'supplier' | 'product' | 'period'>('coa');
  const [searchQuery, setSearchQuery] = useState('');
  const [coaToDelete, setCoaToDelete] = useState<COAAccount | null>(null);
  const [editingCOA, setEditingCOA] = useState<COAAccount | null>(null);
  const [editingBank, setEditingBank] = useState<BankAccount | null>(null);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);


  // Modals for adding master records
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states
  const [newCOA, setNewCOA] = useState<Partial<COAAccount>>({
    code: '',
    name: '',
    group: '1_aset',
    normalPosition: 'debit',
  });

  const [newContact, setNewContact] = useState<Partial<Contact>>({
    name: '',
    phone: '',
    email: '',
    company: '',
    address: '',
    termDays: 30,
  });

  const [newBank, setNewBank] = useState<Partial<BankAccount>>({
    bankName: '',
    accountNumber: '',
    holderName: '',
    branch: '',
    initialBalance: 0,
  });

  const customers = contacts.filter((c) => c.type === 'customer');
  const suppliers = contacts.filter((c) => c.type === 'supplier');

  const filteredCOA = coaList.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.code.includes(searchQuery)
  );

  return (
    <div className="space-y-6">
      {/* Sub Tabs Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'coa', label: 'Chart of Accounts (COA)', icon: ListTree, count: coaList.length },
            { id: 'bank', label: 'Kas & Rekening Bank', icon: Building2, count: banks.length + 2 },
            { id: 'category', label: 'Kategori Transaksi', icon: Tag, count: categories.length },
            { id: 'customer', label: 'Customer (Piutang)', icon: Users, count: customers.length },
            { id: 'supplier', label: 'Supplier (Hutang)', icon: Briefcase, count: suppliers.length },
            { id: 'product', label: 'Produk & Jasa', icon: Package, count: products.length },
            { id: 'period', label: 'Periode Keuangan', icon: Calendar, count: periods.length },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = subTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setSubTab(tab.id as any);
                  setSearchQuery('');
                }}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Action button */}
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Data</span>
        </button>
      </div>

      {/* 1. COA View */}
      {subTab === 'coa' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Cari kode atau nama akun COA..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => exportCOAToExcel(coaList, companyProfile, 'Bagan_Akun_COA.xlsx')}
                className="px-3 py-1.5 rounded-xl bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
                title="Download Bagan Akun ke format Excel .xlsx"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Export Excel (.xlsx)</span>
              </button>
              <span className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
                {filteredCOA.length} Akun Terdaftar
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm dark:shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold">
                    <th className="py-3 px-4">Kode</th>
                    <th className="py-3 px-4">Nama Akun</th>
                    <th className="py-3 px-4">Kelompok / Grup</th>
                    <th className="py-3 px-4">Posisi Normal</th>
                    <th className="py-3 px-4 text-right">Saldo Awal</th>
                    <th className="py-3 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredCOA.map((acc) => (
                    <tr
                      key={acc.code}
                      className={
                        acc.isHeader
                          ? 'bg-slate-800/40 font-bold text-indigo-300'
                          : 'hover:bg-slate-800/30 text-slate-200'
                      }
                    >
                      <td className="py-3 px-4 font-mono font-semibold">{acc.code}</td>
                      <td className="py-3 px-4">
                        <span className={acc.isHeader ? 'uppercase tracking-wider' : 'pl-4'}>
                          {acc.name}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        {acc.group.replace('_', ' ').toUpperCase()}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            acc.normalPosition === 'debit'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                          }`}
                        >
                          {acc.normalPosition}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-medium">
                        {acc.isHeader ? '-' : formatRupiah(acc.initialBalance || 0)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {!acc.isHeader && onDeleteCOA && (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => setEditingCOA(acc)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                              title="Edit Akun"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setCoaToDelete(acc)}
                              className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition"
                              title="Hapus Akun"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2M10 11v6M14 11v6"/></svg>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2. Kas & Bank View */}
      {subTab === 'bank' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Kas Kecil Physical Card */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950/30 border border-slate-800 shadow-lg">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase">
                    Kas Fisik Operasional
                  </span>
                  <h4 className="text-lg font-bold text-white mt-2">Kas Kecil (Petty Cash)</h4>
                  <p className="text-xs text-slate-400">Plafon operasional harian kantor & ATK</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
                  <CreditCard className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800/80">
                <span className="text-xs text-slate-400">Plafon Standar Imprest:</span>
                <p className="text-xl font-bold text-emerald-400 font-mono mt-0.5">Rp 5.000.000</p>
              </div>
            </div>

            {/* Kas Besar Physical Card */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-emerald-950/30 border border-slate-800 shadow-lg">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase">
                    Kas Fisik Brankas
                  </span>
                  <h4 className="text-lg font-bold text-white mt-2">Kas Besar (Main Cash)</h4>
                  <p className="text-xs text-slate-400">Penerimaan penjualan tunai & setoran bank</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                  <Building2 className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800/80">
                <span className="text-xs text-slate-400">Saldo Awal Terdaftar:</span>
                <p className="text-xl font-bold text-emerald-400 font-mono mt-0.5">Rp 35.000.000</p>
              </div>
            </div>

            {/* Bank Accounts */}
            {banks.map((b) => (
              <div
                key={b.id}
                className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg hover:border-slate-700 transition"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 uppercase">
                      Rekening Bank
                    </span>
                    <h4 className="text-lg font-bold text-white mt-2">{b.bankName}</h4>
                    <p className="text-xs font-mono text-slate-300">{b.accountNumber}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">a.n. {b.holderName}</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
                    <Building2 className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-800/80">
                  <span className="text-xs text-slate-400">Saldo Awal Rekening:</span>
                  <p className="text-xl font-bold text-blue-400 font-mono mt-0.5">
                    {formatRupiah(b.initialBalance)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Customer View */}
      {subTab === 'customer' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm dark:shadow-xl">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold">
                  <th className="py-3 px-4">Nama Customer / Perusahaan</th>
                  <th className="py-3 px-4">Kontak (Telp / Email)</th>
                  <th className="py-3 px-4">Alamat</th>
                  <th className="py-3 px-4">Termin Kredit</th>
                  <th className="py-3 px-4 text-right">Status Relasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-200">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-800/30">
                    <td className="py-3 px-4 font-medium">
                      <p className="text-sm font-bold text-white">{c.name}</p>
                      <p className="text-[11px] text-slate-400">{c.company}</p>
                    </td>
                    <td className="py-3 px-4 space-y-1">
                      <p className="flex items-center gap-1 text-slate-300">
                        <Phone className="w-3 h-3 text-slate-500" /> {c.phone}
                      </p>
                      <p className="flex items-center gap-1 text-slate-400">
                        <Mail className="w-3 h-3 text-slate-500" /> {c.email}
                      </p>
                    </td>
                    <td className="py-3 px-4 text-slate-400 max-w-xs truncate">{c.address}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">
                        {c.termDays} Hari
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium text-[11px]">
                        Aktif
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. Supplier View */}
      {subTab === 'supplier' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm dark:shadow-xl">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold">
                  <th className="py-3 px-4">Nama Supplier</th>
                  <th className="py-3 px-4">Kontak</th>
                  <th className="py-3 px-4">Alamat Gudang / Kantor</th>
                  <th className="py-3 px-4">Termin Pembayaran</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-200">
                {suppliers.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-800/30">
                    <td className="py-3 px-4 font-medium">
                      <p className="text-sm font-bold text-white">{s.name}</p>
                      <p className="text-[11px] text-slate-400">{s.company}</p>
                    </td>
                    <td className="py-3 px-4 space-y-1">
                      <p className="flex items-center gap-1 text-slate-300">
                        <Phone className="w-3 h-3 text-slate-500" /> {s.phone}
                      </p>
                      <p className="flex items-center gap-1 text-slate-400">
                        <Mail className="w-3 h-3 text-slate-500" /> {s.email}
                      </p>
                    </td>
                    <td className="py-3 px-4 text-slate-400 max-w-xs truncate">{s.address}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
                        {s.termDays} Hari
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium text-[11px]">
                        Terverifikasi
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. Period View */}
      {subTab === 'period' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {periods.map((p) => (
              <div
                key={p.id}
                className={`p-5 rounded-2xl border transition shadow-lg ${
                  p.status === 'OPEN'
                    ? 'bg-slate-900 border-emerald-500/40 shadow-emerald-500/5'
                    : 'bg-slate-900/60 border-slate-800 opacity-80'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-lg font-bold text-white">{p.name}</h4>
                    <p className="text-xs text-slate-400">
                      {p.startDate} s/d {p.endDate}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {p.status === 'OPEN' ? (
                      <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold">
                        <Unlock className="w-3 h-3" /> Periode Aktif
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700 text-xs font-bold">
                        <Lock className="w-3 h-3" /> Ditutup
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-400">
                    {p.status === 'OPEN'
                      ? 'Transaksi pada periode ini dapat diubah & dicatat.'
                      : `Ditutup oleh ${p.closedBy || 'Admin'}.`}
                  </span>
                  <button
                    onClick={() => onTogglePeriodStatus(p.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      p.status === 'OPEN'
                        ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}
                  >
                    {p.status === 'OPEN' ? 'Tutup Periode' : 'Buka Kembali'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Generic Modal for Adding Data */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4">
              Tambah Data Master Baru: {subTab.toUpperCase()}
            </h3>

            {subTab === 'coa' && (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Kode Akun (misal: 5111)</label>
                  <input
                    type="text"
                    value={newCOA.code}
                    onChange={(e) => setNewCOA({ ...newCOA, code: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Nama Akun</label>
                  <input
                    type="text"
                    value={newCOA.name}
                    onChange={(e) => setNewCOA({ ...newCOA, name: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Grup Akun</label>
                  <select
                    value={newCOA.group}
                    onChange={(e) => setNewCOA({ ...newCOA, group: e.target.value as any })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="1_aset">1 ASET</option>
                    <option value="2_kewajiban">2 KEWAJIBAN</option>
                    <option value="3_modal">3 MODAL</option>
                    <option value="4_pendapatan">4 PENDAPATAN</option>
                    <option value="5_beban">5 BEBAN</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Posisi Normal</label>
                  <select
                    value={newCOA.normalPosition}
                    onChange={(e) => setNewCOA({ ...newCOA, normalPosition: e.target.value as any })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="debit">DEBIT</option>
                    <option value="credit">KREDIT</option>
                  </select>
                </div>
              </div>
            )}

            {subTab === 'bank' && (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Nama Bank (misal: Bank BNI / Mandiri)</label>
                  <input
                    type="text"
                    value={newBank.bankName || ''}
                    onChange={(e) => setNewBank({ ...newBank, bankName: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    placeholder="Contoh: Bank BNI"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Nomor Rekening</label>
                  <input
                    type="text"
                    value={newBank.accountNumber || ''}
                    onChange={(e) => setNewBank({ ...newBank, accountNumber: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                    placeholder="0123-456-789"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-400 mb-1">Nama Pemilik Rekening</label>
                    <input
                      type="text"
                      value={newBank.holderName || ''}
                      onChange={(e) => setNewBank({ ...newBank, holderName: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                      placeholder="PT Nabastala"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Kantor Cabang</label>
                    <input
                      type="text"
                      value={newBank.branch || ''}
                      onChange={(e) => setNewBank({ ...newBank, branch: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                      placeholder="KCU Jakarta"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-400 mb-1">Saldo Awal (Rp)</label>
                    <input
                      type="number"
                      value={newBank.initialBalance || 0}
                      onChange={(e) => setNewBank({ ...newBank, initialBalance: Number(e.target.value) })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Akun COA Terkait</label>
                    <select
                      value={newBank.coaCode || '1103'}
                      onChange={(e) => setNewBank({ ...newBank, coaCode: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    >
                      {coaList.filter(c => c.group === '1_aset' && !c.isHeader).map(acc => (
                        <option key={acc.code} value={acc.code}>
                          {acc.code} - {acc.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {(subTab === 'customer' || subTab === 'supplier') && (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Nama Rekanan / Kontak</label>
                  <input
                    type="text"
                    value={newContact.name}
                    onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Perusahaan</label>
                  <input
                    type="text"
                    value={newContact.company}
                    onChange={(e) => setNewContact({ ...newContact, company: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-400 mb-1">Telepon</label>
                    <input
                      type="text"
                      value={newContact.phone}
                      onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Termin (Hari)</label>
                    <input
                      type="number"
                      value={newContact.termDays}
                      onChange={(e) => setNewContact({ ...newContact, termDays: Number(e.target.value) })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  if (subTab === 'coa' && newCOA.code && newCOA.name) {
                    onAddCOA(newCOA as COAAccount);
                  } else if (subTab === 'bank' && newBank.bankName && newBank.accountNumber) {
                    onAddBank({
                      id: `bank-${Date.now()}`,
                      bankName: newBank.bankName,
                      accountNumber: newBank.accountNumber,
                      holderName: newBank.holderName || 'PT Nabastala',
                      branch: newBank.branch || 'Pusat',
                      initialBalance: Number(newBank.initialBalance) || 0,
                      currentBalance: Number(newBank.initialBalance) || 0,
                      color: '#0284c7',
                      coaCode: newBank.coaCode || '1103',
                    });
                    setNewBank({ bankName: '', accountNumber: '', holderName: '', branch: '', initialBalance: 0, coaCode: '1103' });
                  } else if ((subTab === 'customer' || subTab === 'supplier') && newContact.name) {
                    onAddContact({
                      ...newContact,
                      id: `cnt-${Date.now()}`,
                      type: subTab as any,
                      createdAt: Date.now(),
                    } as Contact);
                  }
                  setShowAddModal(false);
                }}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
              >
                Simpan Data
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Edit COA Modal */}
      {editingCOA && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Edit Akun Akuntansi ({editingCOA.code})</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">Nama Akun</label>
                <input
                  type="text"
                  value={editingCOA.name}
                  onChange={(e) => setEditingCOA({ ...editingCOA, name: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">Kelompok</label>
                  <select
                    value={editingCOA.group}
                    onChange={(e) => setEditingCOA({ ...editingCOA, group: e.target.value as any })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                  >
                    <option value="1_aset">1 - Aset</option>
                    <option value="2_kewajiban">2 - Kewajiban</option>
                    <option value="3_modal">3 - Modal</option>
                    <option value="4_pendapatan">4 - Pendapatan</option>
                    <option value="5_beban">5 - Beban</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">Posisi Normal</label>
                  <select
                    value={editingCOA.normalPosition}
                    onChange={(e) => setEditingCOA({ ...editingCOA, normalPosition: e.target.value as any })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                  >
                    <option value="debit">Debit</option>
                    <option value="credit">Credit</option>
                  </select>
                </div>
              </div>
              {!editingCOA.isHeader && (
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">Saldo Awal (Rp)</label>
                  <input
                    type="number"
                    value={editingCOA.initialBalance || 0}
                    onChange={(e) => setEditingCOA({ ...editingCOA, initialBalance: Number(e.target.value) || 0 })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setEditingCOA(null)}
                className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  if (onUpdateCOA && editingCOA) {
                    onUpdateCOA(editingCOA);
                    setEditingCOA(null);
                  }
                }}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
              >
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete COA Modal */}
      <ConfirmModal
        isOpen={!!coaToDelete}
        title="Hapus Akun Akuntansi (COA)"
        message={`Apakah Anda yakin ingin menghapus akun ${coaToDelete?.code} - ${coaToDelete?.name}? Pastikan akun ini belum digunakan dalam transaksi berjalan.`}
        confirmText="Ya, Hapus Akun"
        cancelText="Batal"
        variant="danger"
        onConfirm={() => {
          if (coaToDelete && onDeleteCOA) {
            onDeleteCOA(coaToDelete.code);
            setCoaToDelete(null);
          }
        }}
        onCancel={() => setCoaToDelete(null)}
      />
    </div>
  );
};