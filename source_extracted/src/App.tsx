import React, { useState, useEffect, useMemo } from 'react';
import { Category, MainTabType, PeriodFilter, Transaction, TransactionType, TransactionWithBalance } from './types';
import {
  loadCategories,
  loadTransactions,
  saveCategories,
  saveTransactions,
} from './utils/storage';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { BukuKasView } from './components/BukuKasView';
import { RekapDashboardView } from './components/RekapDashboardView';
import { RincianKasView } from './components/RincianKasView';
import { TrialBalanceView } from './components/TrialBalanceView';
import { LabaRugiView } from './components/LabaRugiView';
import { LaporanView } from './components/LaporanView';
import { TransactionModal } from './components/TransactionModal';
import { CategoryManagerModal } from './components/CategoryManagerModal';
import { ReceiptViewerModal } from './components/ReceiptViewerModal';
import { SettingsModal } from './components/SettingsModal';
import { getTodayString } from './utils/formatters';

export default function App() {
  // Main State
  const [transactions, setTransactions] = useState<Transaction[]>(() => loadTransactions());
  const [categories, setCategories] = useState<Category[]>(() => loadCategories());
  const [currentTab, setCurrentTab] = useState<MainTabType>('bukukas');

  // Period filter state for Rekap & Laporan
  const [period, setPeriod] = useState<PeriodFilter>('this_month');
  const [customRange, setCustomRange] = useState<{ startDate: string; endDate: string }>({
    startDate: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-01`,
    endDate: getTodayString(),
  });

  // Modals state
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [modalTransactionType, setModalTransactionType] = useState<TransactionType>('income');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [viewingReceiptTransaction, setViewingReceiptTransaction] = useState<Transaction | null>(null);

  // Synchronize to LocalStorage
  useEffect(() => {
    saveTransactions(transactions);
  }, [transactions]);

  useEffect(() => {
    saveCategories(categories);
  }, [categories]);

  // Compute Chronological Running Balance for General Ledger (Buku Kas)
  const transactionsWithBalance = useMemo<TransactionWithBalance[]>(() => {
    // Clone and sort strictly in chronological order (Oldest first)
    const sorted = [...transactions].sort((a, b) => {
      const dateComparison = a.date.localeCompare(b.date);
      if (dateComparison !== 0) return dateComparison;
      const timeA = a.time || '00:00';
      const timeB = b.time || '00:00';
      const timeComparison = timeA.localeCompare(timeB);
      if (timeComparison !== 0) return timeComparison;
      return a.createdAt - b.createdAt;
    });

    let currentBalance = 0;
    let currentCash = 0;
    let currentBank = 0;

    const withBalance: TransactionWithBalance[] = sorted.map((t) => {
      const isBank = t.account === 'bank';
      if (t.type === 'income') {
        currentBalance += t.amount;
        if (isBank) currentBank += t.amount;
        else currentCash += t.amount;
      } else {
        currentBalance -= t.amount;
        if (isBank) currentBank -= t.amount;
        else currentCash -= t.amount;
      }
      return {
        ...t,
        account: t.account || 'cash',
        runningBalance: currentBalance,
        cashRunningBalance: currentCash,
        bankRunningBalance: currentBank,
      };
    });

    return withBalance;
  }, [transactions]);

  // Global Totals: Overall, Cash on Hand, and Bank
  const { totalIncome, totalExpense, totalBalance, cashBalance, bankBalance } = useMemo(() => {
    let inc = 0;
    let exp = 0;
    let cashInc = 0;
    let cashExp = 0;
    let bankInc = 0;
    let bankExp = 0;

    for (const t of transactions) {
      const isBank = t.account === 'bank';
      if (t.type === 'income') {
        inc += t.amount;
        if (isBank) bankInc += t.amount;
        else cashInc += t.amount;
      } else {
        exp += t.amount;
        if (isBank) bankExp += t.amount;
        else cashExp += t.amount;
      }
    }

    return {
      totalIncome: inc,
      totalExpense: exp,
      totalBalance: inc - exp,
      cashBalance: cashInc - cashExp,
      bankBalance: bankInc - bankExp,
    };
  }, [transactions]);

  // Handlers for Transactions
  const handleOpenAddTransaction = (type: TransactionType) => {
    setModalTransactionType(type);
    setEditingTransaction(null);
    setIsTransactionModalOpen(true);
  };

  const handleOpenEditTransaction = (tx: Transaction) => {
    setEditingTransaction(tx);
    setModalTransactionType(tx.type);
    setIsTransactionModalOpen(true);
  };

  const handleSaveTransaction = (
    txData: Omit<Transaction, 'id' | 'createdAt'> & { id?: string }
  ) => {
    if (txData.id) {
      // Update existing
      setTransactions((prev) =>
        prev.map((t) =>
          t.id === txData.id
            ? {
                ...t,
                ...txData,
                account: txData.account || 'cash',
                updatedAt: Date.now(),
              }
            : t
        )
      );
    } else {
      // Add new
      const newTx: Transaction = {
        id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        date: txData.date,
        time: txData.time,
        type: txData.type,
        account: txData.account || 'cash',
        categoryId: txData.categoryId,
        amount: txData.amount,
        description: txData.description,
        receiptUrl: txData.receiptUrl,
        receiptName: txData.receiptName,
        createdAt: Date.now(),
      };
      setTransactions((prev) => [newTx, ...prev]);
    }
  };

  const handleDeleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  // Handlers for Categories
  const handleSaveCategory = (cat: Category) => {
    setCategories((prev) => {
      const exists = prev.some((c) => c.id === cat.id);
      if (exists) {
        return prev.map((c) => (c.id === cat.id ? cat : c));
      }
      return [...prev, cat];
    });
  };

  const handleDeleteCategory = (catId: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== catId));
  };

  // Handlers for Data Restored
  const handleDataRestored = (newTx: Transaction[], newCat: Category[]) => {
    setTransactions(newTx);
    setCategories(newCat);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900 flex font-sans antialiased selection:bg-indigo-600 selection:text-white">
      {/* Vertical Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        totalBalance={totalBalance}
        cashBalance={cashBalance}
        bankBalance={bankBalance}
        onAddTransaction={handleOpenAddTransaction}
        onOpenCategories={() => setIsCategoryModalOpen(true)}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
      />

      {/* Main Workspace Column */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Workspace TopBar */}
        <TopBar
          currentTab={currentTab}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          totalBalance={totalBalance}
          cashBalance={cashBalance}
          bankBalance={bankBalance}
          onAddTransaction={handleOpenAddTransaction}
          onOpenCategories={() => setIsCategoryModalOpen(true)}
          onOpenSettings={() => setIsSettingsModalOpen(true)}
        />

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-7 max-w-(--breakpoint-2xl) w-full mx-auto">
          {currentTab === 'bukukas' && (
            <BukuKasView
              transactionsWithBalance={transactionsWithBalance}
              categories={categories}
              onAddTransaction={handleOpenAddTransaction}
              onEditTransaction={handleOpenEditTransaction}
              onDeleteTransaction={handleDeleteTransaction}
              onViewReceipt={(tx) => setViewingReceiptTransaction(tx)}
            />
          )}

          {currentTab === 'rekap' && (
            <RekapDashboardView
              transactions={transactions}
              categories={categories}
              period={period}
              setPeriod={setPeriod}
              customRange={customRange}
              setCustomRange={setCustomRange}
              onAddTransaction={handleOpenAddTransaction}
            />
          )}

          {currentTab === 'rincian' && (
            <RincianKasView
              transactions={transactions}
              categories={categories}
              onViewReceipt={(tx) => setViewingReceiptTransaction(tx)}
            />
          )}

          {currentTab === 'trial_balance' && (
            <TrialBalanceView
              transactions={transactions}
              categories={categories}
            />
          )}

          {currentTab === 'laba_rugi' && (
            <LabaRugiView
              transactions={transactions}
              categories={categories}
            />
          )}

          {currentTab === 'laporan' && (
            <LaporanView
              transactionsWithBalance={transactionsWithBalance}
              categories={categories}
              period={period}
              setPeriod={setPeriod}
              customRange={customRange}
              setCustomRange={setCustomRange}
            />
          )}
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200/80 py-4 px-4 sm:px-6 lg:px-8 text-center text-xs text-gray-500 print:hidden mt-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 max-w-(--breakpoint-2xl) mx-auto">
            <p>Sistem Keuangan Kas &amp; Bank &bull; Data tersimpan aman di peramban lokal.</p>
            <div className="flex items-center gap-3 text-gray-400 font-medium text-[11px]">
              <span>Kas &amp; Bank</span>
              <span>&bull;</span>
              <span>Neraca Saldo</span>
              <span>&bull;</span>
              <span>Laba Rugi</span>
              <span>&bull;</span>
              <span>Ekspor Excel &amp; Cetak PDF</span>
            </div>
          </div>
        </footer>
      </div>

      {/* Modals */}
      <TransactionModal
        isOpen={isTransactionModalOpen}
        onClose={() => {
          setIsTransactionModalOpen(false);
          setEditingTransaction(null);
        }}
        onSave={handleSaveTransaction}
        initialType={modalTransactionType}
        editingTransaction={editingTransaction}
        categories={categories}
        onOpenCategoryManager={() => setIsCategoryModalOpen(true)}
      />

      <CategoryManagerModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        categories={categories}
        transactions={transactions}
        onSaveCategory={handleSaveCategory}
        onDeleteCategory={handleDeleteCategory}
      />

      <ReceiptViewerModal
        transaction={viewingReceiptTransaction}
        onClose={() => setViewingReceiptTransaction(null)}
        categoryName={
          viewingReceiptTransaction
            ? categories.find((c) => c.id === viewingReceiptTransaction.categoryId)?.name
            : undefined
        }
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        transactions={transactions}
        categories={categories}
        onDataRestored={handleDataRestored}
      />
    </div>
  );
}
