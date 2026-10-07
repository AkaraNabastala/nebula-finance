import * as XLSX from 'xlsx';
import { Category, TransactionWithBalance, TrialBalanceAccount } from '../types';
import { formatDateIndo, formatRupiah } from './formatters';

export function exportTransactionsToExcel(
  transactions: TransactionWithBalance[],
  categoriesMap: Map<string, Category>,
  reportTitle = 'Buku Kas & Laporan Keuangan'
) {
  // 1. Prepare data for General Ledger (Buku Kas)
  const rows = transactions.map((t, index) => {
    const cat = categoriesMap.get(t.categoryId);
    return {
      'No': index + 1,
      'Tanggal': t.date,
      'Waktu': t.time || '-',
      'Akun': t.account === 'bank' ? 'Rekening Bank' : 'Kas Tunai',
      'Tipe': t.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
      'Kategori / Sumber': cat ? cat.name : '-',
      'Keterangan': t.description || '-',
      'Pemasukan (Rp)': t.type === 'income' ? t.amount : 0,
      'Pengeluaran (Rp)': t.type === 'expense' ? t.amount : 0,
      'Saldo Running (Rp)': t.runningBalance,
      'Ada Bukti': t.receiptUrl ? 'Ya' : 'Tidak',
    };
  });

  // Calculate totals
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
  const finalBalance = totalIncome - totalExpense;

  // Append summary row
  rows.push({
    'No': 'TOTAL' as unknown as number,
    'Tanggal': '',
    'Waktu': '',
    'Akun': '',
    'Tipe': '',
    'Kategori / Sumber': '',
    'Keterangan': 'TOTAL KESELURUHAN',
    'Pemasukan (Rp)': totalIncome,
    'Pengeluaran (Rp)': totalExpense,
    'Saldo Running (Rp)': finalBalance,
    'Ada Bukti': '',
  });

  const wb = XLSX.utils.book_new();
  const wsBukuKas = XLSX.utils.json_to_sheet(rows);

  // Set column widths
  wsBukuKas['!cols'] = [
    { wch: 6 },  // No
    { wch: 12 }, // Tanggal
    { wch: 8 },  // Waktu
    { wch: 16 }, // Akun
    { wch: 14 }, // Tipe
    { wch: 28 }, // Kategori
    { wch: 38 }, // Keterangan
    { wch: 18 }, // Pemasukan
    { wch: 18 }, // Pengeluaran
    { wch: 20 }, // Saldo
    { wch: 12 }, // Ada Bukti
  ];

  XLSX.utils.book_append_sheet(wb, wsBukuKas, 'Buku Kas (Jurnal)');

  // 2. Prepare Income sheet
  const incomeTxs = transactions.filter(t => t.type === 'income');
  const incomeRows = incomeTxs.map((t, idx) => ({
    'No': idx + 1,
    'Tanggal': t.date,
    'Akun': t.account === 'bank' ? 'Rekening Bank' : 'Kas Tunai',
    'Sumber / Kategori': categoriesMap.get(t.categoryId)?.name || '-',
    'Keterangan': t.description || '-',
    'Nominal (Rp)': t.amount,
  }));
  incomeRows.push({
    'No': 'TOTAL' as unknown as number,
    'Tanggal': '',
    'Akun': '',
    'Sumber / Kategori': '',
    'Keterangan': 'TOTAL PEMASUKAN',
    'Nominal (Rp)': totalIncome,
  });
  const wsIncome = XLSX.utils.json_to_sheet(incomeRows);
  wsIncome['!cols'] = [{ wch: 6 }, { wch: 12 }, { wch: 16 }, { wch: 28 }, { wch: 38 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, wsIncome, 'Laporan Pemasukan');

  // 3. Prepare Expense sheet
  const expenseTxs = transactions.filter(t => t.type === 'expense');
  const expenseRows = expenseTxs.map((t, idx) => ({
    'No': idx + 1,
    'Tanggal': t.date,
    'Akun': t.account === 'bank' ? 'Rekening Bank' : 'Kas Tunai',
    'Jenis / Kategori': categoriesMap.get(t.categoryId)?.name || '-',
    'Keterangan': t.description || '-',
    'Nominal (Rp)': t.amount,
  }));
  expenseRows.push({
    'No': 'TOTAL' as unknown as number,
    'Tanggal': '',
    'Akun': '',
    'Jenis / Kategori': '',
    'Keterangan': 'TOTAL PENGELUARAN',
    'Nominal (Rp)': totalExpense,
  });
  const wsExpense = XLSX.utils.json_to_sheet(expenseRows);
  wsExpense['!cols'] = [{ wch: 6 }, { wch: 12 }, { wch: 16 }, { wch: 28 }, { wch: 38 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, wsExpense, 'Laporan Pengeluaran');

  // 4. Download file
  const fileName = `${reportTitle.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

export function exportTrialBalanceToExcel(
  accounts: TrialBalanceAccount[],
  periodTitle = 'Semua Periode',
  totalDebit = 0,
  totalCredit = 0
) {
  const rows = accounts.map((acc, idx) => {
    let typeName = 'Aset / Aktiva';
    if (acc.type === 'revenue') typeName = 'Pendapatan (Pemasukan)';
    if (acc.type === 'expense') typeName = 'Beban (Pengeluaran)';
    if (acc.type === 'equity') typeName = 'Ekuitas / Modal';
    if (acc.type === 'liability') typeName = 'Kewajiban / Hutang';

    return {
      'No': idx + 1,
      'Kode Akun': acc.code,
      'Nama Akun': acc.name,
      'Klasifikasi': typeName,
      'Saldo Awal Debit (Rp)': acc.initialDebit,
      'Saldo Awal Kredit (Rp)': acc.initialCredit,
      'Mutasi Debit (Rp)': acc.movementDebit,
      'Mutasi Kredit (Rp)': acc.movementCredit,
      'Saldo Akhir Debit (Rp)': acc.endingDebit,
      'Saldo Akhir Kredit (Rp)': acc.endingCredit,
    };
  });

  // Summary Row
  rows.push({
    'No': 'TOTAL' as unknown as number,
    'Kode Akun': '',
    'Nama Akun': 'TOTAL NERACA SALDO',
    'Klasifikasi': totalDebit === totalCredit ? 'SEIMBANG (BALANCED)' : 'SELISIH',
    'Saldo Awal Debit (Rp)': 0,
    'Saldo Awal Kredit (Rp)': 0,
    'Mutasi Debit (Rp)': totalDebit,
    'Mutasi Kredit (Rp)': totalCredit,
    'Saldo Akhir Debit (Rp)': totalDebit,
    'Saldo Akhir Kredit (Rp)': totalCredit,
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = [
    { wch: 6 },  // No
    { wch: 12 }, // Kode Akun
    { wch: 32 }, // Nama Akun
    { wch: 22 }, // Klasifikasi
    { wch: 20 }, // Saldo Awal Debit
    { wch: 20 }, // Saldo Awal Kredit
    { wch: 20 }, // Mutasi Debit
    { wch: 20 }, // Mutasi Kredit
    { wch: 22 }, // Saldo Akhir Debit
    { wch: 22 }, // Saldo Akhir Kredit
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Trial Balance (Neraca Saldo)');
  const fileName = `Trial_Balance_${periodTitle.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

export interface LabaRugiCategorySummary {
  code: string;
  name: string;
  type: 'income' | 'expense';
  count: number;
  total: number;
  percentage: number;
}

export function exportLabaRugiToExcel(
  incomeItems: LabaRugiCategorySummary[],
  expenseItems: LabaRugiCategorySummary[],
  totalIncome: number,
  totalExpense: number,
  netProfit: number,
  periodTitle = 'Semua Periode'
) {
  const rows: any[] = [];

  // Header Title
  rows.push({ 'Pos Keuangan': 'LAPORAN LABA RUGI (PROFIT & LOSS STATEMENT)', 'Kode Akun': '', 'Frekuensi': '', 'Persentase': '', 'Jumlah (Rp)': '' });
  rows.push({ 'Pos Keuangan': `Periode: ${periodTitle}`, 'Kode Akun': '', 'Frekuensi': '', 'Persentase': '', 'Jumlah (Rp)': '' });
  rows.push({ 'Pos Keuangan': '', 'Kode Akun': '', 'Frekuensi': '', 'Persentase': '', 'Jumlah (Rp)': '' });

  // Section 1: Pendapatan
  rows.push({ 'Pos Keuangan': 'I. PENDAPATAN OPERASIONAL', 'Kode Akun': '', 'Frekuensi': '', 'Persentase': '', 'Jumlah (Rp)': '' });
  incomeItems.forEach((item) => {
    rows.push({
      'Pos Keuangan': item.name,
      'Kode Akun': item.code,
      'Frekuensi': `${item.count} transaksi`,
      'Persentase': `${item.percentage.toFixed(1)}%`,
      'Jumlah (Rp)': item.total,
    });
  });
  rows.push({
    'Pos Keuangan': 'TOTAL PENDAPATAN OPERASIONAL',
    'Kode Akun': '',
    'Frekuensi': '',
    'Persentase': '100%',
    'Jumlah (Rp)': totalIncome,
  });

  rows.push({ 'Pos Keuangan': '', 'Kode Akun': '', 'Frekuensi': '', 'Persentase': '', 'Jumlah (Rp)': '' });

  // Section 2: Beban
  rows.push({ 'Pos Keuangan': 'II. BEBAN OPERASIONAL', 'Kode Akun': '', 'Frekuensi': '', 'Persentase': '', 'Jumlah (Rp)': '' });
  expenseItems.forEach((item) => {
    rows.push({
      'Pos Keuangan': item.name,
      'Kode Akun': item.code,
      'Frekuensi': `${item.count} transaksi`,
      'Persentase': `${item.percentage.toFixed(1)}%`,
      'Jumlah (Rp)': item.total,
    });
  });
  rows.push({
    'Pos Keuangan': 'TOTAL BEBAN OPERASIONAL',
    'Kode Akun': '',
    'Frekuensi': '',
    'Persentase': totalIncome > 0 ? `${((totalExpense / totalIncome) * 100).toFixed(1)}%` : '-',
    'Jumlah (Rp)': totalExpense,
  });

  rows.push({ 'Pos Keuangan': '', 'Kode Akun': '', 'Frekuensi': '', 'Persentase': '', 'Jumlah (Rp)': '' });

  // Section 3: Laba / Rugi Bersih
  rows.push({
    'Pos Keuangan': netProfit >= 0 ? 'LABA BERSIH (NET PROFIT)' : 'RUGI BERSIH (NET LOSS)',
    'Kode Akun': '',
    'Frekuensi': '',
    'Persentase': totalIncome > 0 ? `${((netProfit / totalIncome) * 100).toFixed(1)}%` : '-',
    'Jumlah (Rp)': netProfit,
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);

  ws['!cols'] = [
    { wch: 38 }, // Pos Keuangan
    { wch: 14 }, // Kode Akun
    { wch: 18 }, // Frekuensi
    { wch: 14 }, // Persentase
    { wch: 22 }, // Jumlah
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Laporan Laba Rugi');
  const fileName = `Laporan_Laba_Rugi_${periodTitle.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

export function exportTransactionsToCSV(
  transactions: TransactionWithBalance[],
  categoriesMap: Map<string, Category>
) {
  const headers = ['No', 'Tanggal', 'Waktu', 'Akun', 'Tipe', 'Kategori', 'Keterangan', 'Pemasukan', 'Pengeluaran', 'Saldo'];
  
  const rows = transactions.map((t, index) => {
    const cat = categoriesMap.get(t.categoryId);
    const inc = t.type === 'income' ? t.amount : 0;
    const exp = t.type === 'expense' ? t.amount : 0;
    const acc = t.account === 'bank' ? 'Rekening Bank' : 'Kas Tunai';
    return [
      index + 1,
      `"${t.date}"`,
      `"${t.time || ''}"`,
      `"${acc}"`,
      `"${t.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}"`,
      `"${cat ? cat.name.replace(/"/g, '""') : '-'}"`,
      `"${t.description ? t.description.replace(/"/g, '""') : '-'}"`,
      inc,
      exp,
      t.runningBalance
    ].join(',');
  });

  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `buku_kas_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

