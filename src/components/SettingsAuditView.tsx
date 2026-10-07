import { ConfirmModal } from './ConfirmModal';
import React, { useState } from 'react';
import {
  Building2,
  Save,
  ShieldAlert,
  Users,
  Lock,
  Unlock,
  History,
  Download,
  Upload,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Clock,
} from 'lucide-react';
import {
  CompanyProfile,
  AuditLog,
  FinancialPeriod,
  UserProfile,
  UserRole,
} from '../types/finance';
import { formatDateTime, formatDate } from '../utils/formatters';
import { resetToFactoryDefault } from '../utils/storage';

interface SettingsAuditViewProps {
  auditLogs: AuditLog[];
  periods: FinancialPeriod[];
  currentUser: UserProfile;
  onTogglePeriod: (periodId: string) => void;
  onRoleChange: (user: UserProfile) => void;
  companyProfile?: CompanyProfile;
  onUpdateCompanyProfile?: (profile: CompanyProfile) => void;
}

export const SettingsAuditView: React.FC<SettingsAuditViewProps> = ({
  auditLogs,
  periods,
  currentUser,
  onTogglePeriod,
  onRoleChange,
  companyProfile,
  onUpdateCompanyProfile,
}) => {
  const [subTab, setSubTab] = useState<'company' | 'audit' | 'roles' | 'closing' | 'backup'>('company');
  const [profileForm, setProfileForm] = useState<CompanyProfile>(companyProfile || {
    companyName: 'PT Nabastala',
    productName: 'NEBULA FINANCE',
    address: 'Gedung Nabastala Tower Lt. 12, Jakarta',
    phone: '+62 21 555-8900',
    email: 'finance@nabastala.com',
    taxNumber: '01.890.123.4-021.000',
    letterheadNotes: 'Sistem Informasi Akuntansi & Keuangan Terpadu',
  });

  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  const roleDescriptions: Record<UserRole, { title: string; perms: string[] }> = {
    super_admin: {
      title: 'Super Administrator',
      perms: [
        'Akses penuh seluruh modul',
        'Manajemen user & role permission',
        'Tutup & buka kembali periode akuntansi',
        'Approval & bypass otorisasi',
        'Backup & reset database',
      ],
    },
    finance_manager: {
      title: 'Finance Manager',
      perms: [
        'Approval pengeluaran kas kecil & transfer kas besar',
        'Otorisasi pembayaran hutang supplier',
        'Penutupan buku (Closing period)',
        'Melihat seluruh laporan keuangan & audit log',
      ],
    },
    accounting: {
      title: 'Accounting Specialist',
      perms: [
        'Input Jurnal Umum & Penyesuaian',
        'Rekonsiliasi bank & kas fisik',
        'Posting ke buku besar & neraca saldo',
        'Verifikasi keabsahan dokumen bukti struk',
      ],
    },
    finance_staff: {
      title: 'Finance Staff / Kasir',
      perms: [
        'Input transaksi kas harian (masuk & keluar)',
        'Upload bukti struk & faktur pengadaan',
        'Input penerimaan piutang & cicilan hutang',
        'Terbatas pada pencatatan operasional',
      ],
    },
    viewer: {
      title: 'Viewer / Auditor Eksternal',
      perms: [
        'Hanya melihat (read-only) seluruh transaksi',
        'Melihat & mencetak laporan akuntansi',
        'Tidak memiliki izin modifikasi data',
      ],
    },
  };

  const handleExportBackup = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(localStorage));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `backup_finance_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6">
      {/* Sub Tab Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3">
        {[
          { id: 'company', label: 'Profil Perusahaan & Pengaturan', icon: Building2 },
          { id: 'audit', label: 'Audit Trail Log', icon: History, count: auditLogs.length },
          { id: 'roles', label: 'Role & Hak Akses', icon: Users },
          { id: 'closing', label: 'Closing Periode (Tutup Buku)', icon: Lock },
          { id: 'backup', label: 'Backup & Pemeliharaan Data', icon: Download },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = subTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSubTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-400">
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 1. Audit Trail View */}
      {subTab === 'audit' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm dark:shadow-xl">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-white text-sm">Riwayat Aktivitas & Perubahan Data (Audit Trail)</h3>
              <p className="text-xs text-slate-400">Pencatatan integritas siapa yang mengubah transaksi, waktu, dan nilainya.</p>
            </div>
            <span className="text-xs text-slate-400">{auditLogs.length} Entri Log</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold">
                  <th className="py-3 px-4">Waktu</th>
                  <th className="py-3 px-4">Pengguna & Role</th>
                  <th className="py-3 px-4">Aksi</th>
                  <th className="py-3 px-4">Modul / ID Entitas</th>
                  <th className="py-3 px-4">Detail Perubahan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3 px-4 text-slate-400 font-mono whitespace-nowrap">
                      {formatDateTime(log.timestamp)}
                    </td>
                    <td className="py-3 px-4 font-medium text-white">
                      <span>{log.userName}</span>
                      <span className="block text-[10px] text-indigo-400 capitalize">
                        {log.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          log.action === 'CREATE'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : log.action === 'APPROVAL'
                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                            : log.action === 'CLOSE_PERIOD'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-indigo-300">
                      {log.module} - {log.entityId}
                    </td>
                    <td className="py-3 px-4 text-slate-300 max-w-md">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. Role & Hak Akses View */}
      {subTab === 'roles' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(Object.keys(roleDescriptions) as UserRole[]).map((r) => {
            const roleInfo = roleDescriptions[r];
            const isCurrent = currentUser.role === r;
            return (
              <div
                key={r}
                className={`p-5 rounded-2xl border transition shadow-lg flex flex-col justify-between ${
                  isCurrent
                    ? 'bg-slate-900 border-indigo-500 shadow-indigo-500/10'
                    : 'bg-slate-900/70 border-slate-800'
                }`}
              >
                <div>
                  <div className="flex justify-between items-start">
                    <h4 className="text-base font-bold text-white">{roleInfo.title}</h4>
                    {isCurrent && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        Aktif Saat Ini
                      </span>
                    )}
                  </div>
                  <ul className="mt-3 space-y-1.5 text-xs text-slate-300">
                    {roleInfo.perms.map((p, idx) => (
                      <li key={idx} className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800">
                  <span className="text-[11px] text-slate-500 block">Identitas Role: {r}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 3. Closing Periode View */}
      {subTab === 'closing' && (
        <div className="space-y-4">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
            <h3 className="text-base font-bold text-white mb-1">Mekanisme Closing Periode (Tutup Buku)</h3>
            <p className="text-xs text-slate-400 mb-6">
              Ketika suatu bulan ditutup, seluruh transaksi operasional kas, bank, hutang, dan piutang di masa lalu
              akan dikunci secara permanen untuk mencegah perubahan nilai pembukuan.
            </p>

            <div className="space-y-3">
              {periods.map((p) => (
                <div
                  key={p.id}
                  className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    {p.status === 'OPEN' ? (
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                        <Unlock className="w-5 h-5" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-slate-800 text-slate-400 flex items-center justify-center border border-slate-700">
                        <Lock className="w-5 h-5" />
                      </div>
                    )}
                    <div>
                      <h4 className="text-sm font-bold text-white">{p.name}</h4>
                      <p className="text-xs text-slate-400">
                        Rentang: {formatDate(p.startDate)} - {formatDate(p.endDate)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                        p.status === 'OPEN'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {p.status === 'OPEN' ? 'TERBUKA (BISA INPUT)' : 'DIKUNCI (CLOSING)'}
                    </span>

                    <button
                      onClick={() => onTogglePeriod(p.id)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                        p.status === 'OPEN'
                          ? 'bg-rose-600 hover:bg-rose-500 text-white shadow'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow'
                      }`}
                    >
                      {p.status === 'OPEN' ? 'Lakukan Closing Sekarang' : 'Buka Kunci Periode'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. Backup & Maintenance */}
      {subTab === 'backup' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl space-y-4">
            <h3 className="text-base font-bold text-white">Ekspor Cadangan Data (JSON Backup)</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Simpan seluruh data master, transaksi, ayat jurnal, dan laporan keuangan ke dalam satu file arsip JSON
              yang dapat dipulihkan kapan saja.
            </p>
            <button
              onClick={handleExportBackup}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>Unduh File Cadangan JSON</span>
            </button>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900 border border-rose-500/30 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-rose-400">Reset ke Data Default Pabrik</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Tindakan ini akan menghapus seluruh perubahan lokal dan mengembalikan data peraga awal perusahaan
              (PT Nabastala) ke kondisi semula.
            </p>
            <button
              onClick={() => setIsResetModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/40 text-rose-400 border border-rose-500/30 text-xs font-semibold flex items-center gap-2 transition-all active:scale-[0.98]"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset Seluruh Data Lokal</span>
            </button>
          </div>
        </div>
      )}
      {/* Confirm Reset Database Modal */}
      <ConfirmModal
        isOpen={isResetModalOpen}
        title="Reset Database ke Kondisi Pabrik"
        message="Tindakan ini akan menghapus seluruh data mutasi lokal dan mengembalikan data peraga awal perusahaan PT Nabastala ke kondisi semula. Tindakan ini tidak dapat dibatalkan!"
        confirmText="Ya, Reset Database"
        cancelText="Batal"
        variant="danger"
        onConfirm={() => {
          resetToFactoryDefault();
          setIsResetModalOpen(false);
        }}
        onCancel={() => setIsResetModalOpen(false)}
      />
    </div>
  );
};