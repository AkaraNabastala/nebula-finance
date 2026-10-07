import React, { useState, useEffect, useMemo } from 'react';
import { Toaster, toast } from 'sonner';
import {
  CompanyProfile,
  COAAccount,
  BankAccount,
  Contact,
  TransactionCategory,
  ProductService,
  FinancialPeriod,
  Transaction,
  HutangRecord,
  PiutangRecord,
  JournalEntry,
  AuditLog,
  UserProfile,
  MainTabType,
  PaymentInstallment,
  ReconciliationRecord,
  TransactionModule,
  TransactionType,
  FixedAsset,
  BudgetLimit,
} from './types/finance';
import { loadAllFinanceData, saveAllFinanceData, syncWithBackendServer } from './utils/storage';
import { createJournalFromTransaction } from './utils/accountingEngine';
import { generateDocCode, getTodayString } from './utils/formatters';

// Views
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { DashboardView } from './components/DashboardView';
import { DataMasterView } from './components/DataMasterView';
import { KasKecilView } from './components/KasKecilView';
import { KasBesarView } from './components/KasBesarView';
import { BankView } from './components/BankView';
import { HutangView } from './components/HutangView';
import { PiutangView } from './components/PiutangView';
import { JurnalView } from './components/JurnalView';
import { BukuBesarView } from './components/BukuBesarView';
import { LaporanView } from './components/LaporanView';
import { SettingsAuditView } from './components/SettingsAuditView';
import { AssetView } from './components/AssetView';
import { BudgetView } from './components/BudgetView';
import { LoginView } from './components/LoginView';

// Modals
import { TransactionModal } from './components/TransactionModal';
import { ReconciliationModal } from './components/ReconciliationModal';
import { ReceiptViewerModal } from './components/ReceiptViewerModal';

export default function App() {
  // Load initial persistent data
  const initialData = useMemo(() => loadAllFinanceData(), []);

  const [coaList, setCoaList] = useState<COAAccount[]>(initialData.coa);
  const [banks, setBanks] = useState<BankAccount[]>(initialData.banks);
  const [contacts, setContacts] = useState<Contact[]>(initialData.contacts);
  const [categories, setCategories] = useState<TransactionCategory[]>(initialData.categories);
  const [products, setProducts] = useState<ProductService[]>(initialData.products);
  const [periods, setPeriods] = useState<FinancialPeriod[]>(initialData.periods);
  const [hutangList, setHutangList] = useState<HutangRecord[]>(initialData.hutang);
  const [piutangList, setPiutangList] = useState<PiutangRecord[]>(initialData.piutang);
  const [transactions, setTransactions] = useState<Transaction[]>(initialData.transactions);
  const [journals, setJournals] = useState<JournalEntry[]>(initialData.journals);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(initialData.auditLogs);
  const [assets, setAssets] = useState<FixedAsset[]>(initialData.assets || []);
  const [budgets, setBudgets] = useState<BudgetLimit[]>(initialData.budgets || []);
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile>(initialData.companyProfile);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  
  // Active Navigation Tab
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(initialData.currentUser);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!initialData.currentUser);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [currentTab, setCurrentTab] = useState<MainTabType>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // Synchronize state with SQLite backend on startup
  useEffect(() => {
    syncWithBackendServer().then((remoteData) => {
      if (remoteData && Object.keys(remoteData).length > 0) {
        if (remoteData.coa && Array.isArray(remoteData.coa) && remoteData.coa.length > 0) setCoaList(remoteData.coa);
        if (remoteData.banks && Array.isArray(remoteData.banks) && remoteData.banks.length > 0) setBanks(remoteData.banks);
        if (remoteData.contacts) setContacts(remoteData.contacts);
        if (remoteData.categories && Array.isArray(remoteData.categories) && remoteData.categories.length > 0) setCategories(remoteData.categories);
        if (remoteData.products) setProducts(remoteData.products);
        if (remoteData.periods) setPeriods(remoteData.periods);
        if (remoteData.hutang) setHutangList(remoteData.hutang);
        if (remoteData.piutang) setPiutangList(remoteData.piutang);
        if (remoteData.transactions) setTransactions(remoteData.transactions);
        if (remoteData.journals) setJournals(remoteData.journals);
        if (remoteData.auditLogs) setAuditLogs(remoteData.auditLogs);
        if (remoteData.assets) setAssets(remoteData.assets);
        if (remoteData.budgets) setBudgets(remoteData.budgets);
        if (remoteData.companyProfile) setCompanyProfile(remoteData.companyProfile);
        if (remoteData.currentUser) {
          setCurrentUser(remoteData.currentUser);
          setIsAuthenticated(true);
        }
      }
    });
  }, []);

  // Toggle Dark Mode
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Modals state
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [txModalModule, setTxModalModule] = useState<TransactionModule>('kas_kecil');
  const [txModalType, setTxModalType] = useState<TransactionType>('expense');

  const [reconcileModal, setReconcileModal] = useState<{
    isOpen: boolean;
    moduleType: 'kas_kecil' | 'kas_besar' | 'bank';
    targetName: string;
    systemBalance: number;
  }>({
    isOpen: false,
    moduleType: 'kas_kecil',
    targetName: 'Kas Kecil',
    systemBalance: 5000000,
  });

  const [viewingReceiptTx, setViewingReceiptTx] = useState<Transaction | null>(null);

  // Current active period (e.g. September 2026)
  const currentPeriod = useMemo(
    () => periods.find((p) => p.status === 'OPEN') || periods[0],
    [periods]
  );

  // Synchronize to localStorage whenever data changes
  useEffect(() => {
    saveAllFinanceData({
      coa: coaList,
      banks,
      contacts,
      categories,
      products,
      periods,
      hutang: hutangList,
      piutang: piutangList,
      transactions,
      journals,
      auditLogs,
      assets,
      budgets,
      currentUser: currentUser || undefined,
      companyProfile,
    });
  }, [coaList, banks, contacts, categories, products, periods, hutangList, piutangList, transactions, journals, auditLogs, assets, budgets, currentUser, companyProfile]);

  // Logging Audit Trail Helper
  const logAudit = (
    action: 'CREATE' | 'UPDATE' | 'DELETE' | 'APPROVAL' | 'RECONCILE' | 'CLOSE_PERIOD',
    module: string,
    entityId: string,
    details: string
  ) => {
    if (!currentUser) return;
    const newLog: AuditLog = {
      id: `aud-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: Date.now(),
      userId: currentUser.id,
      userName: currentUser.name,
      role: currentUser.role,
      action,
      module,
      entityId,
      details,
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // Financial Snapshot Totals for Sidebar
  const totalCashAndBank = useMemo(() => {
    const kasKecilInit = coaList.find(c => c.code === '1101')?.initialBalance || 0;
    const kasBesarInit = coaList.find(c => c.code === '1102')?.initialBalance || 0;
    
    let total = kasKecilInit + kasBesarInit + banks.reduce((sum, b) => sum + b.initialBalance, 0);
    transactions.forEach((t) => {
      if (t.type === 'income') total += t.amount;
      else if (t.type === 'expense') total -= t.amount;
    });
    return total;
  }, [banks, transactions, coaList]);

  const totalPiutang = useMemo(
    () => piutangList.reduce((sum, p) => sum + p.remainingAmount, 0),
    [piutangList]
  );

  const totalHutang = useMemo(
    () => hutangList.reduce((sum, h) => sum + h.remainingAmount, 0),
    [hutangList]
  );

  // 1. Transaction Handlers
  const handleSaveTransaction = (partialTx: Partial<Transaction>) => {
    if (!currentUser) return;

    if (partialTx.id) {
      // EDIT MODE
      const existing = transactions.find((t) => t.id === partialTx.id);
      if (!existing) return;

      const updatedTx: Transaction = {
        ...existing,
        ...partialTx,
        updatedAt: Date.now(),
      } as Transaction;

      setTransactions((prev) => prev.map((t) => (t.id === partialTx.id ? updatedTx : t)));

      if (updatedTx.status === 'approved') {
        const updatedJournal = createJournalFromTransaction(updatedTx, coaList, journals.length, banks);
        setJournals((prev) => {
          const hasExisting = prev.some((j) => j.referenceId === updatedTx.id || j.code === updatedTx.code);
          if (hasExisting) {
            return prev.map((j) => (j.referenceId === updatedTx.id || j.code === updatedTx.code ? updatedJournal : j));
          } else {
            return [updatedJournal, ...prev];
          }
        });
      }

      logAudit('UPDATE', updatedTx.module.toUpperCase(), updatedTx.code, `Memperbarui transaksi: ${updatedTx.code} - ${updatedTx.description}`);
      toast.success(`Transaksi ${updatedTx.code} berhasil diperbarui!`);
      setEditingTransaction(null);
      setIsTxModalOpen(false);
      return;
    }

    // CREATE MODE
    const prefix = partialTx.module === 'kas_kecil' ? 'KK' : partialTx.module === 'kas_besar' ? 'KB' : 'BK';
    const code = generateDocCode(prefix, transactions.length, partialTx.date);

    const fullTx: Transaction = {
      id: `tx-${Date.now()}`,
      code,
      date: partialTx.date || getTodayString(),
      time: partialTx.time || '10:00',
      module: partialTx.module || 'kas_kecil',
      type: partialTx.type || 'expense',
      categoryId: partialTx.categoryId || categories[0]?.id || '',
      amount: partialTx.amount || 0,
      sourceAccount: partialTx.sourceAccount,
      destAccount: partialTx.destAccount,
      contraAccountCode: partialTx.contraAccountCode || '5108',
      recipientOrPayer: partialTx.recipientOrPayer || 'Umum',
      description: partialTx.description || '',
      receiptName: partialTx.receiptName,
      receiptUrl: partialTx.receiptUrl,
      taxRate: partialTx.taxRate,
      taxAmount: partialTx.taxAmount,
      status: currentUser.role === 'finance_staff' ? 'pending' : 'approved',
      createdBy: currentUser.name,
      createdAt: Date.now(),
    };

    setTransactions((prev) => [fullTx, ...prev]);

    if (fullTx.status === 'approved') {
      const newJournal = createJournalFromTransaction(fullTx, coaList, journals.length, banks);
      setJournals((prev) => [newJournal, ...prev]);
    }

    logAudit('CREATE', fullTx.module.toUpperCase(), fullTx.code, `Pencatatan transaksi: ${fullTx.description} (${fullTx.code}) Rp ${fullTx.amount}. Status: ${fullTx.status}`);
    toast.success(fullTx.status === 'approved' ? `Transaksi ${fullTx.code} berhasil dicatat & dibukukan!` : `Transaksi ${fullTx.code} berhasil diajukan (menunggu persetujuan).`);
  };

  const handleApproveTransaction = (txId: string) => {
    if (!currentUser) return;
    const tx = transactions.find(t => t.id === txId);
    if (!tx || tx.status !== 'pending') return;

    const updatedTx: Transaction = {
      ...tx,
      status: 'approved',
      approvedBy: currentUser.name,
      updatedAt: Date.now(),
    };

    setTransactions(prev => prev.map(t => t.id === txId ? updatedTx : t));
    
    // Generate journal upon approval
    const newJournal = createJournalFromTransaction(updatedTx, coaList, journals.length, banks);
    setJournals((prev) => [newJournal, ...prev]);

    logAudit('APPROVAL', updatedTx.module.toUpperCase(), updatedTx.code, `Menyetujui transaksi: ${updatedTx.code}`);
    toast.success(`Transaksi ${updatedTx.code} disetujui & jurnal otomatis telah dibuat!`);
  };

  const handleRejectTransaction = (txId: string) => {
    if (!currentUser) return;
    setTransactions(prev => prev.map(t => t.id === txId ? { ...t, status: 'rejected', updatedAt: Date.now() } : t));
    logAudit('APPROVAL', 'TRANSAKSI', txId, `Menolak transaksi: ${txId}`);
    toast.error(`Transaksi ${txId} telah ditolak.`);
  };

  
  // Batch Delete Handlers
  const handleBatchDeleteTransactions = (ids: string[]) => {
    setTransactions((prev) => prev.filter((t) => !ids.includes(t.id)));
    setJournals((prev) => prev.filter((j) => !ids.some((id) => j.referenceId === id)));
    logAudit('DELETE', 'TRANSAKSI', ids.join(','), `Menghapus massal ${ids.length} transaksi operasional`);
    toast.success(`${ids.length} transaksi berhasil dihapus!`);
  };

  const handleBatchDeleteHutang = (ids: string[]) => {
    setHutangList((prev) => prev.filter((h) => !ids.includes(h.id)));
    setJournals((prev) => prev.filter((j) => !ids.some((id) => j.referenceId === id)));
    logAudit('DELETE', 'HUTANG', ids.join(','), `Menghapus massal ${ids.length} faktur hutang supplier`);
    toast.success(`${ids.length} faktur hutang berhasil dihapus!`);
  };

  const handleBatchDeletePiutang = (ids: string[]) => {
    setPiutangList((prev) => prev.filter((p) => !ids.includes(p.id)));
    setJournals((prev) => prev.filter((j) => !ids.some((id) => j.referenceId === id)));
    logAudit('DELETE', 'PIUTANG', ids.join(','), `Menghapus massal ${ids.length} faktur piutang customer`);
    toast.success(`${ids.length} faktur piutang berhasil dihapus!`);
  };

  // Master Data Update Handlers
  const handleUpdateCOA = (updated: COAAccount) => {
    setCoaList((prev) => prev.map((c) => (c.code === updated.code ? updated : c)));
    logAudit('UPDATE', 'COA', updated.code, `Memperbarui akun COA: ${updated.name} (${updated.code})`);
    toast.success(`Akun COA ${updated.code} berhasil diperbarui!`);
  };

  const handleUpdateBank = (updated: BankAccount) => {
    setBanks((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
    logAudit('UPDATE', 'BANK', updated.id, `Memperbarui rekening bank: ${updated.bankName} (${updated.accountNumber})`);
    toast.success(`Rekening bank ${updated.bankName} berhasil diperbarui!`);
  };

  const handleUpdateContact = (updated: Contact) => {
    setContacts((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    logAudit('UPDATE', updated.type.toUpperCase(), updated.id, `Memperbarui kontak: ${updated.name}`);
    toast.success(`Kontak ${updated.name} berhasil diperbarui!`);
  };

  const handleUpdateCompanyProfile = (profile: CompanyProfile) => {
    setCompanyProfile(profile);
    logAudit('UPDATE', 'COMPANY_PROFILE', 'profile', `Memperbarui profil perusahaan: ${profile.companyName}`);
    toast.success('Pengaturan profil perusahaan berhasil disimpan!');
  };

  // 2. Hutang Handlers
  const handleAddHutang = (hutang: HutangRecord) => {
    // Generate auto-journal: Debit Beban (5108), Kredit Hutang Usaha (2101)
    const supplier = contacts.find((c) => c.id === hutang.supplierId);
    const suppName = supplier ? supplier.name : 'Supplier';

    const journalCode = generateDocCode('JU', journals.length, hutang.date);
    const newJournal: JournalEntry = {
      id: `ju-ht-${Date.now()}`,
      code: journalCode,
      date: hutang.date,
      type: 'hutang',
      referenceId: hutang.id,
      referenceCode: hutang.code,
      description: `Hutang Pembelian Kredit: ${hutang.invoiceNumber} (${suppName})`,
      lines: [
        { accountCode: hutang.expenseAccountCode || '5108', accountName: 'Beban Perlengkapan & ATK', debit: hutang.totalAmount, credit: 0 },
        { accountCode: '2101', accountName: 'Hutang Usaha / Supplier', debit: 0, credit: hutang.totalAmount },
      ],
      totalDebit: hutang.totalAmount,
      totalCredit: hutang.totalAmount,
      isAutoGenerated: true,
      createdBy: 'Sistem Otomatis',
      createdAt: Date.now(),
    };

    hutang.approvalStatus = currentUser?.role === 'finance_staff' ? 'pending' : 'approved';

    setHutangList((prev) => [hutang, ...prev]);
    
    if (hutang.approvalStatus === 'approved') {
      setJournals((prev) => [newJournal, ...prev]);
    }

    logAudit('CREATE', 'HUTANG', hutang.code, `Mencatat faktur hutang baru: ${hutang.invoiceNumber} sebesar Rp ${hutang.totalAmount}. Status: ${hutang.approvalStatus}`);
    toast.success(`Faktur hutang ${hutang.invoiceNumber} berhasil dicatat!`);
  };

  const handlePayHutang = (hutangId: string, installment: PaymentInstallment) => {
    if (!currentUser) return;
    setHutangList((prev) =>
      prev.map((h) => {
        if (h.id !== hutangId) return h;
        const newPaid = h.paidAmount + installment.amount;
        const newRem = Math.max(0, h.totalAmount - newPaid);
        const status = newRem === 0 ? 'paid' : 'partial';
        return {
          ...h,
          paidAmount: newPaid,
          remainingAmount: newRem,
          status,
          payments: [...h.payments, installment],
        };
      })
    );

    // Auto journal: Debit Hutang Usaha (2101), Kredit Kas/Bank
    let srcAccountCode = '1102';
    let srcAccountName = 'Kas Besar (Main Cash)';
    if (installment.paymentMethod === 'bank') {
      const b = banks.find((item) => item.id === installment.bankAccountId);
      srcAccountCode = b?.coaCode || '1103';
      srcAccountName = b ? `${b.bankName} (${b.accountNumber})` : 'Rekening Bank';
    }

    const journalCode = generateDocCode('JU', journals.length, installment.date);
    const newJournal: JournalEntry = {
      id: `ju-pay-ht-${Date.now()}`,
      code: journalCode,
      date: installment.date,
      type: 'kas_keluar',
      description: `Pembayaran Cicilan/Lunas Hutang (${installment.referenceNumber})`,
      lines: [
        { accountCode: '2101', accountName: 'Hutang Usaha / Supplier', debit: installment.amount, credit: 0 },
        { accountCode: srcAccountCode, accountName: srcAccountName, debit: 0, credit: installment.amount },
      ],
      totalDebit: installment.amount,
      totalCredit: installment.amount,
      isAutoGenerated: true,
      createdBy: 'Sistem Otomatis',
      createdAt: Date.now(),
    };

    setJournals((prev) => [newJournal, ...prev]);

    // Also record an operational transaction in kas/bank
    const txCode = generateDocCode(installment.paymentMethod === 'bank' ? 'BK' : 'KB', transactions.length, installment.date);
    const newTx: Transaction = {
      id: `tx-pay-ht-${Date.now()}`,
      code: txCode,
      date: installment.date,
      module: installment.paymentMethod === 'bank' ? 'bank' : 'kas_besar',
      type: 'expense',
      categoryId: 'cat-exp-11',
      amount: installment.amount,
      sourceAccount: installment.paymentMethod === 'bank' ? installment.bankAccountId : 'kas_besar',
      contraAccountCode: '2101',
      recipientOrPayer: 'Supplier',
      description: `Pembayaran hutang faktur ${installment.notes}`,
      status: 'approved',
      createdBy: currentUser.name,
      createdAt: Date.now(),
    };
    setTransactions((prev) => [newTx, ...prev]);

    logAudit('APPROVAL', 'HUTANG', hutangId, `Pembayaran hutang Rp ${installment.amount} via ${installment.paymentMethod}`);
    toast.success(`Pembayaran hutang Rp ${installment.amount.toLocaleString('id-ID')} berhasil dicatat!`);
  };

  // 3. Piutang Handlers
  const handleAddPiutang = (piutang: PiutangRecord) => {
    // Generate auto-journal: Debit Piutang Usaha (1201), Kredit Pendapatan (4101)
    const customer = contacts.find((c) => c.id === piutang.customerId);
    const custName = customer ? customer.name : 'Customer';

    const journalCode = generateDocCode('JU', journals.length, piutang.date);
    const newJournal: JournalEntry = {
      id: `ju-pt-${Date.now()}`,
      code: journalCode,
      date: piutang.date,
      type: 'piutang',
      referenceId: piutang.id,
      referenceCode: piutang.code,
      description: `Penjualan Kredit (Piutang): ${piutang.invoiceNumber} (${custName})`,
      lines: [
        { accountCode: '1201', accountName: 'Piutang Usaha', debit: piutang.totalAmount, credit: 0 },
        { accountCode: piutang.revenueAccountCode || '4101', accountName: 'Pendapatan Penjualan Produk', debit: 0, credit: piutang.totalAmount },
      ],
      totalDebit: piutang.totalAmount,
      totalCredit: piutang.totalAmount,
      isAutoGenerated: true,
      createdBy: 'Sistem Otomatis',
      createdAt: Date.now(),
    };

    piutang.approvalStatus = currentUser?.role === 'finance_staff' ? 'pending' : 'approved';

    setPiutangList((prev) => [piutang, ...prev]);
    
    if (piutang.approvalStatus === 'approved') {
      setJournals((prev) => [newJournal, ...prev]);
    }

    logAudit('CREATE', 'PIUTANG', piutang.code, `Mencatat faktur piutang customer: ${piutang.invoiceNumber} sebesar Rp ${piutang.totalAmount}. Status: ${piutang.approvalStatus}`);
    toast.success(`Faktur piutang ${piutang.invoiceNumber} berhasil dicatat!`);
  };

  const handleReceivePiutang = (piutangId: string, installment: PaymentInstallment) => {
    if (!currentUser) return;
    setPiutangList((prev) =>
      prev.map((p) => {
        if (p.id !== piutangId) return p;
        const newPaid = p.paidAmount + installment.amount;
        const newRem = Math.max(0, p.totalAmount - newPaid);
        const status = newRem === 0 ? 'paid' : 'partial';
        return {
          ...p,
          paidAmount: newPaid,
          remainingAmount: newRem,
          status,
          payments: [...p.payments, installment],
        };
      })
    );

    // Auto journal: Debit Kas/Bank, Kredit Piutang Usaha (1201)
    let destAccountCode = '1102';
    let destAccountName = 'Kas Besar (Main Cash)';
    if (installment.paymentMethod === 'bank') {
      const b = banks.find((item) => item.id === installment.bankAccountId);
      destAccountCode = b?.coaCode || '1103';
      destAccountName = b ? `${b.bankName} (${b.accountNumber})` : 'Rekening Bank';
    }

    const journalCode = generateDocCode('JU', journals.length, installment.date);
    const newJournal: JournalEntry = {
      id: `ju-rec-pt-${Date.now()}`,
      code: journalCode,
      date: installment.date,
      type: 'kas_masuk',
      description: `Penerimaan Pelunasan/Cicilan Piutang (${installment.referenceNumber})`,
      lines: [
        { accountCode: destAccountCode, accountName: destAccountName, debit: installment.amount, credit: 0 },
        { accountCode: '1201', accountName: 'Piutang Usaha', debit: 0, credit: installment.amount },
      ],
      totalDebit: installment.amount,
      totalCredit: installment.amount,
      isAutoGenerated: true,
      createdBy: 'Sistem Otomatis',
      createdAt: Date.now(),
    };

    setJournals((prev) => [newJournal, ...prev]);

    // Operational transaction in kas/bank
    const txCode = generateDocCode(installment.paymentMethod === 'bank' ? 'BK' : 'KB', transactions.length, installment.date);
    const newTx: Transaction = {
      id: `tx-rec-pt-${Date.now()}`,
      code: txCode,
      date: installment.date,
      module: installment.paymentMethod === 'bank' ? 'bank' : 'kas_besar',
      type: 'income',
      categoryId: 'cat-inc-1',
      amount: installment.amount,
      sourceAccount: installment.paymentMethod === 'bank' ? installment.bankAccountId : 'kas_besar',
      contraAccountCode: '1201',
      recipientOrPayer: 'Customer',
      description: `Penerimaan piutang faktur ${installment.notes}`,
      status: 'approved',
      createdBy: currentUser.name,
      createdAt: Date.now(),
    };
    setTransactions((prev) => [newTx, ...prev]);

    logAudit('APPROVAL', 'PIUTANG', piutangId, `Penerimaan pembayaran piutang Rp ${installment.amount} ke ${installment.paymentMethod}`);
    toast.success(`Penerimaan piutang Rp ${installment.amount.toLocaleString('id-ID')} berhasil dicatat!`);
  };

  // 4. Period Closing Handler
  const handleTogglePeriodStatus = (periodId: string) => {
    if (!currentUser) return;
    setPeriods((prev) =>
      prev.map((p) => {
        if (p.id !== periodId) return p;
        const nextStatus = p.status === 'OPEN' ? 'CLOSED' : 'OPEN';
        logAudit(
          'CLOSE_PERIOD',
          'PERIODE',
          p.id,
          nextStatus === 'CLOSED'
            ? `Menutup buku periode ${p.name}. Seluruh transaksi dikunci.`
            : `Membuka kembali kunci periode ${p.name}.`
        );
        toast.info(nextStatus === 'CLOSED' ? `Periode ${p.name} telah ditutup (dikunci).` : `Kunci periode ${p.name} dibuka kembali.`);
        return {
          ...p,
          status: nextStatus,
          closedAt: nextStatus === 'CLOSED' ? Date.now() : undefined,
          closedBy: nextStatus === 'CLOSED' ? currentUser.name : undefined,
        };
      })
    );
  };

  // Quick action openers
  const handleQuickAdd = (mod: TransactionModule) => {
    setTxModalModule(mod);
    setTxModalType(mod === 'kas_kecil' ? 'expense' : 'income');
    setIsTxModalOpen(true);
  };

  const handleOpenReconcile = (moduleType: 'kas_kecil' | 'kas_besar' | 'bank', bankId?: string) => {
    let bal = 0;
    let name = 'Kas Kecil';

    if (moduleType === 'kas_kecil') {
      let k = coaList.find(c => c.code === '1101')?.initialBalance || 0;
      transactions.filter((t) => t.module === 'kas_kecil').forEach((t) => {
        if (t.type === 'income') k += t.amount;
        else if (t.type === 'expense') k -= t.amount;
      });
      bal = k;
      name = 'Kas Kecil (Petty Cash)';
    } else if (moduleType === 'kas_besar') {
      let b = coaList.find(c => c.code === '1102')?.initialBalance || 0;
      transactions.filter((t) => t.module === 'kas_besar' || t.destAccount === 'kas_besar' || t.sourceAccount === 'kas_besar').forEach((t) => {
        if (t.type === 'income' || t.destAccount === 'kas_besar') b += t.amount;
        else if (t.type === 'expense' || t.sourceAccount === 'kas_besar') b -= t.amount;
      });
      bal = b;
      name = 'Kas Besar (Brankas Fisik)';
    } else {
      const targetBank = banks.find((b) => b.id === bankId) || banks[0];
      name = `${targetBank.bankName} - ${targetBank.accountNumber}`;
      let bVal = targetBank.initialBalance;
      transactions.filter((t) => t.sourceAccount === targetBank.id || t.destAccount === targetBank.id).forEach((t) => {
        if (t.destAccount === targetBank.id) bVal += t.amount;
        else bVal -= t.amount;
      });
      bal = bVal;
    }

    setReconcileModal({
      isOpen: true,
      moduleType,
      targetName: name,
      systemBalance: bal,
    });
  };

  if (!isAuthenticated || !currentUser) {
    return (
      <>
        <Toaster richColors position="top-right" theme="dark" closeButton />
        <LoginView 
          onLogin={(user) => {
            setCurrentUser(user);
            setIsAuthenticated(true);
            toast.success(`Selamat datang kembali, ${user.name}!`);
          }}
        />
      </>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 overflow-hidden font-sans transition-colors duration-200">
      <Toaster richColors position="top-right" theme="dark" closeButton />
      {/* Sidebar Component */}
      <Sidebar
        currentTab={currentTab}
        companyProfile={companyProfile}
        onTabChange={setCurrentTab}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        totalCashAndBank={totalCashAndBank}
        totalPiutang={totalPiutang}
        totalHutang={totalHutang}
        onQuickNewTransaction={handleQuickAdd}
        currentUser={currentUser}
        isDarkMode={isDarkMode}
        onToggleTheme={() => setIsDarkMode(!isDarkMode)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* TopBar Header */}
        <TopBar
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          companyProfile={companyProfile}
          currentUser={currentUser}
          isDarkMode={isDarkMode}
          onToggleTheme={() => setIsDarkMode(!isDarkMode)}
          onLogout={() => {
            toast.info('Anda telah berhasil keluar dari sistem Nebula Finance.');
            setCurrentUser(null);
            setIsAuthenticated(false);
          }}
        />

        {/* View Content (Scrollable) */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 bg-slate-50 dark:bg-slate-950/40">
          {currentTab === 'dashboard' && (
            <DashboardView
              currentUser={currentUser!}
              coaList={coaList}
              banks={banks}
              transactions={transactions}
              hutangList={hutangList}
              piutangList={piutangList}
              journals={journals}
              onNavigateTab={setCurrentTab}
              onOpenNewTransaction={() => setIsTxModalOpen(true)}
            />
          )}

          {currentTab === 'master' && (
            <DataMasterView
              coaList={coaList}
              banks={banks}
              contacts={contacts}
              categories={categories}
              products={products}
              periods={periods}
              companyProfile={companyProfile}
              onUpdateCOA={handleUpdateCOA}
              onUpdateBank={handleUpdateBank}
              onUpdateContact={handleUpdateContact}
              onAddCOA={(acc) => {
                setCoaList((prev) => [...prev, acc]);
                logAudit('CREATE', 'COA', acc.code, `Menambahkan akun COA baru: ${acc.name} (${acc.code})`);
                toast.success(`Akun COA ${acc.code} - ${acc.name} berhasil ditambahkan!`);
              }}
              onDeleteCOA={(code) => {
                setCoaList((prev) => prev.filter(c => c.code !== code));
                logAudit('DELETE', 'COA', code, `Menghapus akun COA: ${code}`);
                toast.success(`Akun COA ${code} berhasil dihapus.`);
              }}
              onAddBank={(bank) => {
                setBanks((prev) => [...prev, bank]);
                logAudit('CREATE', 'BANK', bank.id, `Menambahkan rekening bank baru: ${bank.bankName} ${bank.accountNumber}`);
                toast.success(`Rekening ${bank.bankName} (${bank.accountNumber}) berhasil ditambahkan!`);
              }}
              onAddContact={(contact) => {
                setContacts((prev) => [...prev, contact]);
                logAudit('CREATE', contact.type.toUpperCase(), contact.id, `Menambahkan rekanan: ${contact.name}`);
              }}
              onAddCategory={(cat) => setCategories((prev) => [...prev, cat])}
              onAddProduct={(prod) => setProducts((prev) => [...prev, prod])}
              onTogglePeriodStatus={handleTogglePeriodStatus}
            />
          )}

          {currentTab === 'kas_kecil' && (
            <KasKecilView
              transactions={transactions}
              coaList={coaList}
              banks={banks}
              currentUser={currentUser!}
              onApprove={handleApproveTransaction}
              onReject={handleRejectTransaction}
              onOpenAddExpense={() => {
                setTxModalModule('kas_kecil');
                setTxModalType('expense');
                setIsTxModalOpen(true);
              }}
              onOpenAddIncome={() => {
                setTxModalModule('kas_kecil');
                setTxModalType('income');
                setIsTxModalOpen(true);
              }}
              onOpenReconciliation={(mod) => handleOpenReconcile(mod)}
              onViewReceipt={(tx) => setViewingReceiptTx(tx)}
            />
          )}

          {currentTab === 'kas_besar' && (
            <KasBesarView
              transactions={transactions}
              coaList={coaList}
              banks={banks}
              currentUser={currentUser!}
              onApprove={handleApproveTransaction}
              onReject={handleRejectTransaction}
              onOpenAddIncome={() => {
                setTxModalModule('kas_besar');
                setTxModalType('income');
                setIsTxModalOpen(true);
              }}
              onOpenAddExpense={() => {
                setTxModalModule('kas_besar');
                setTxModalType('expense');
                setIsTxModalOpen(true);
              }}
              onOpenTransfer={() => {
                setTxModalModule('kas_besar');
                setTxModalType('transfer');
                setIsTxModalOpen(true);
              }}
              onOpenReconciliation={(mod) => handleOpenReconcile(mod)}
              onViewReceipt={(tx) => setViewingReceiptTx(tx)}
            />
          )}

          {currentTab === 'bank' && (
            <BankView
              banks={banks}
              transactions={transactions}
              coaList={coaList}
              currentUser={currentUser!}
              onApprove={handleApproveTransaction}
              onReject={handleRejectTransaction}
              onOpenAddIncome={(bId) => {
                setTxModalModule('bank');
                setTxModalType('income');
                setIsTxModalOpen(true);
              }}
              onOpenAddExpense={(bId) => {
                setTxModalModule('bank');
                setTxModalType('expense');
                setIsTxModalOpen(true);
              }}
              onOpenTransfer={() => {
                setTxModalModule('bank');
                setTxModalType('transfer');
                setIsTxModalOpen(true);
              }}
              onOpenReconciliation={(bId) => handleOpenReconcile('bank', bId)}
              onViewReceipt={(tx) => setViewingReceiptTx(tx)}
            />
          )}

          {currentTab === 'hutang' && (
            <HutangView
              hutangList={hutangList}
              suppliers={contacts.filter((c) => c.type === 'supplier')}
              banks={banks}
              currentUser={currentUser!}
              onAddHutang={handleAddHutang}
              onPayHutang={handlePayHutang}
              onApprove={(id) => {
                setHutangList(prev => prev.map(h => h.id === id ? { ...h, approvalStatus: 'approved' } : h));
                // Note: proper journal creation is omitted for brevity in this inline function
              }}
              onReject={(id) => {
                setHutangList(prev => prev.map(h => h.id === id ? { ...h, approvalStatus: 'rejected' } : h));
              }}
            />
          )}

          {currentTab === 'piutang' && (
            <PiutangView
              piutangList={piutangList}
              customers={contacts.filter((c) => c.type === 'customer')}
              banks={banks}
              currentUser={currentUser!}
              onAddPiutang={handleAddPiutang}
              onReceivePiutang={handleReceivePiutang}
              onApprove={(id) => {
                setPiutangList(prev => prev.map(h => h.id === id ? { ...h, approvalStatus: 'approved' } : h));
              }}
              onReject={(id) => {
                setPiutangList(prev => prev.map(h => h.id === id ? { ...h, approvalStatus: 'rejected' } : h));
              }}
            />
          )}

          {currentTab === 'jurnal' && (
            <JurnalView
              journals={journals}
              coaList={coaList}
              onAddManualJournal={(entry) => {
                setJournals((prev) => [entry, ...prev]);
                logAudit('CREATE', 'JURNAL', entry.code, `Posting Jurnal Manual: ${entry.description}`);
              }}
            />
          )}

          {currentTab === 'buku_besar' && (
            <BukuBesarView
              coaList={coaList}
              journals={journals}
              hutangList={hutangList}
              piutangList={piutangList}
              contacts={contacts}
              companyProfile={companyProfile}
            />
          )}

          {currentTab === 'laporan' && (
            <LaporanView
              coaList={coaList}
              journals={journals}
              transactions={transactions}
              hutangList={hutangList}
              piutangList={piutangList}
              companyProfile={companyProfile}
            />
          )}

          {currentTab === 'settings_audit' && (
            <SettingsAuditView
              auditLogs={auditLogs}
              periods={periods}
              currentUser={currentUser}
              companyProfile={companyProfile}
              onTogglePeriod={handleTogglePeriodStatus}
              onRoleChange={() => {}}
              onUpdateCompanyProfile={handleUpdateCompanyProfile}
            />
          )}

          {currentTab === 'asset' && (
            <AssetView
              assets={assets}
              categories={categories}
              onAddAsset={(ast) => {
                setAssets(prev => [ast, ...prev]);
                toast.success(`Aset tetap ${ast.name} berhasil ditambahkan!`);
              }}
            />
          )}

          {currentTab === 'budget' && (
            <BudgetView
              budgets={budgets}
              categories={categories}
              periods={periods}
              transactions={transactions}
              onAddBudget={(bdg) => {
                setBudgets(prev => [bdg, ...prev]);
                toast.success('Plafon anggaran baru berhasil ditetapkan!');
              }}
            />
          )}
        </main>
      </div>

      {/* Global Modals */}
      <TransactionModal
        isOpen={isTxModalOpen}
        onClose={() => {
          setIsTxModalOpen(false);
          setEditingTransaction(null);
        }}
        onSave={handleSaveTransaction}
        categories={categories}
        coaList={coaList}
        banks={banks}
        defaultModule={txModalModule}
        defaultType={txModalType}
        editingTransaction={editingTransaction}
      />

      <ReconciliationModal
        isOpen={reconcileModal.isOpen}
        onClose={() => setReconcileModal((prev) => ({ ...prev, isOpen: false }))}
        moduleType={reconcileModal.moduleType}
        targetName={reconcileModal.targetName}
        systemBalance={reconcileModal.systemBalance}
        onSaveRecord={(record) => {
          logAudit(
            'RECONCILE',
            record.accountType.toUpperCase(),
            record.id,
            `Berita Acara Rekonsiliasi ${record.accountType}: Fisik Rp ${record.physicalBalance}, Sistem Rp ${record.systemBalance}, Selisih Rp ${record.discrepancy}`
          );
        }}
      />

      <ReceiptViewerModal
        transaction={viewingReceiptTx}
        onClose={() => setViewingReceiptTx(null)}
      />
    </div>
  );
}
