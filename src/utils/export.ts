import * as XLSX from 'xlsx';
import {
  COAAccount,
  Transaction,
  HutangRecord,
  PiutangRecord,
  JournalEntry,
  BankAccount,
  Contact,
  CompanyProfile,
} from '../types/finance';
import { formatRupiah, formatDate } from './formatters';
import {
  computeTrialBalance,
  computeProfitAndLoss,
  computeBalanceSheet,
  computeCashFlow,
} from './accountingEngine';

// Helper to auto-calculate column widths
function calculateColWidths(data: any[][]): Array<{ wch: number }> {
  const colWidths: number[] = [];
  data.forEach((row) => {
    row.forEach((cell, colIdx) => {
      const len = cell ? String(cell).length : 0;
      colWidths[colIdx] = Math.max(colWidths[colIdx] || 10, len);
    });
  });
  return colWidths.map((w) => ({ wch: Math.min(Math.max(w + 3, 12), 45) }));
}

// 1. Export Transactions (Kas Kecil, Kas Besar, Bank)
export function exportTransactionsToExcel(
  transactions: Transaction[],
  companyProfile?: CompanyProfile,
  reportTitle: string = 'LAPORAN MUTASI BUKU KAS & BANK',
  filename: string = 'Laporan_Mutasi_Kas_Bank.xlsx'
) {
  const compName = (companyProfile?.companyName || 'PT NABASTALA').toUpperCase();
  const downloadDate = new Date().toLocaleString('id-ID', {
    dateStyle: 'long',
    timeStyle: 'short',
  });

  const sheetData: any[][] = [
    [compName],
    [reportTitle.toUpperCase()],
    [`Periode Berjalan 2026 | Tanggal Unduh: ${downloadDate}`],
    ['Mata Uang: Rupiah Indonesia (IDR)'],
    [companyProfile?.letterheadNotes || 'Dokumen Keuangan Resmi'],
    [], // Empty row separator
    [
      'No',
      'Tanggal',
      'No. Dokumen',
      'Modul',
      'Tipe',
      'Pihak Terkait (Vendor/Customer)',
      'Keterangan Transaksi',
      'Akun Lawan (COA)',
      'Pemasukan / Debit (Rp)',
      'Pengeluaran / Kredit (Rp)',
      'Saldo Akumulasi (Rp)',
      'Status Otorisasi',
    ],
  ];

  let runningBalance = 0;
  let totalDebit = 0;
  let totalCredit = 0;

  transactions.forEach((t, idx) => {
    const debit = t.type === 'income' ? t.amount : 0;
    const credit = t.type === 'expense' ? t.amount : 0;
    totalDebit += debit;
    totalCredit += credit;
    runningBalance += debit - credit;

    sheetData.push([
      idx + 1,
      t.date,
      t.code,
      t.module.toUpperCase(),
      t.type === 'income' ? 'Pemasukan (Masuk)' : t.type === 'expense' ? 'Pengeluaran (Keluar)' : 'Transfer',
      t.recipientOrPayer || '-',
      t.description || '-',
      t.contraAccountCode || '-',
      debit,
      credit,
      runningBalance,
      t.status.toUpperCase(),
    ]);
  });

  // Grand Total Row
  sheetData.push([]);
  sheetData.push([
    'TOTAL REKAPITULASI',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    totalDebit,
    totalCredit,
    runningBalance,
    '',
  ]);

  const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
  worksheet['!cols'] = calculateColWidths(sheetData);

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Buku Mutasi');
  XLSX.writeFile(workbook, filename);
}

// 2. Export Hutang Supplier
export function exportHutangToExcel(
  hutangList: HutangRecord[],
  contacts: Contact[] = [],
  companyProfile?: CompanyProfile,
  filename: string = 'Daftar_Hutang_Supplier.xlsx'
) {
  const compName = (companyProfile?.companyName || 'PT NABASTALA').toUpperCase();
  const downloadDate = new Date().toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' });

  const sheetData: any[][] = [
    [compName],
    ['KARTU PENGAWASAN HUTANG USAHA & SUPPLIER'],
    [`Tanggal Cetak: ${downloadDate} | Mata Uang: Rupiah Indonesia (IDR)`],
    [companyProfile?.letterheadNotes || 'Pengendalian Kewajiban & Pembayaran Supplier'],
    [],
    [
      'No',
      'Kode Hutang',
      'No. Faktur / Invoice',
      'Nama Supplier / Vendor',
      'Perusahaan Supplier',
      'Tanggal Pembelian',
      'Tanggal Jatuh Tempo',
      'Total Nilai Faktur (Rp)',
      'Sudah Dibayar (Rp)',
      'Sisa Hutang (Rp)',
      'Status Pelunasan',
      'Status Persetujuan',
    ],
  ];

  let totalInvoice = 0;
  let totalPaid = 0;
  let totalRemaining = 0;

  hutangList.forEach((h, idx) => {
    const supp = contacts.find((c) => c.id === h.supplierId);
    totalInvoice += h.totalAmount;
    totalPaid += h.paidAmount;
    totalRemaining += h.remainingAmount;

    sheetData.push([
      idx + 1,
      h.code,
      h.invoiceNumber,
      supp?.name || 'Supplier',
      supp?.company || '-',
      h.date,
      h.dueDate,
      h.totalAmount,
      h.paidAmount,
      h.remainingAmount,
      h.status === 'paid' ? 'LUNAS' : h.status === 'partial' ? 'SEBAGIAN' : 'BELUM DIBAYAR',
      h.approvalStatus?.toUpperCase() || 'APPROVED',
    ]);
  });

  sheetData.push([]);
  sheetData.push([
    'TOTAL KEWAJIBAN HUTANG',
    '',
    '',
    '',
    '',
    '',
    '',
    totalInvoice,
    totalPaid,
    totalRemaining,
    '',
    '',
  ]);

  const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
  worksheet['!cols'] = calculateColWidths(sheetData);

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Hutang Usaha');
  XLSX.writeFile(workbook, filename);
}

// 3. Export Piutang Customer
export function exportPiutangToExcel(
  piutangList: PiutangRecord[],
  contacts: Contact[] = [],
  companyProfile?: CompanyProfile,
  filename: string = 'Daftar_Piutang_Customer.xlsx'
) {
  const compName = (companyProfile?.companyName || 'PT NABASTALA').toUpperCase();
  const downloadDate = new Date().toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' });

  const sheetData: any[][] = [
    [compName],
    ['KARTU PENGAWASAN PIUTANG USAHA CUSTOMER'],
    [`Tanggal Cetak: ${downloadDate} | Mata Uang: Rupiah Indonesia (IDR)`],
    [companyProfile?.letterheadNotes || 'Pengendalian Tagihan & Penerimaan Kas Customer'],
    [],
    [
      'No',
      'Kode Piutang',
      'No. Faktur / Tagihan',
      'Nama Customer',
      'Perusahaan Customer',
      'Tanggal Tagihan',
      'Tanggal Jatuh Tempo',
      'Total Nilai Tagihan (Rp)',
      'Sudah Diterima (Rp)',
      'Sisa Piutang (Rp)',
      'Status Pelunasan',
      'Status Persetujuan',
    ],
  ];

  let totalInvoice = 0;
  let totalPaid = 0;
  let totalRemaining = 0;

  piutangList.forEach((p, idx) => {
    const cust = contacts.find((c) => c.id === p.customerId);
    totalInvoice += p.totalAmount;
    totalPaid += p.paidAmount;
    totalRemaining += p.remainingAmount;

    sheetData.push([
      idx + 1,
      p.code,
      p.invoiceNumber,
      cust?.name || 'Customer',
      cust?.company || '-',
      p.date,
      p.dueDate,
      p.totalAmount,
      p.paidAmount,
      p.remainingAmount,
      p.status === 'paid' ? 'LUNAS' : p.status === 'partial' ? 'SEBAGIAN' : 'BELUM DIBAYAR',
      p.approvalStatus?.toUpperCase() || 'APPROVED',
    ]);
  });

  sheetData.push([]);
  sheetData.push([
    'TOTAL TAGIHAN PIUTANG',
    '',
    '',
    '',
    '',
    '',
    '',
    totalInvoice,
    totalPaid,
    totalRemaining,
    '',
    '',
  ]);

  const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
  worksheet['!cols'] = calculateColWidths(sheetData);

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Piutang Usaha');
  XLSX.writeFile(workbook, filename);
}

// 4. Export Bagan Akun (Chart of Accounts / COA)
export function exportCOAToExcel(
  coaList: COAAccount[],
  companyProfile?: CompanyProfile,
  filename: string = 'Bagan_Akun_Standar_COA.xlsx'
) {
  const compName = (companyProfile?.companyName || 'PT NABASTALA').toUpperCase();
  const downloadDate = new Date().toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' });

  const sheetData: any[][] = [
    [compName],
    ['BAGAN AKUN STANDAR (CHART OF ACCOUNTS / COA)'],
    [`Tanggal Cetak: ${downloadDate} | Klasifikasi Akuntansi PSAK Standar`],
    [],
    [
      'Kode Akun',
      'Nama Akun Akuntansi',
      'Klasifikasi Akun',
      'Posisi Normal',
      'Tipe Akun (Header/Detail)',
      'Saldo Awal (Rp)',
    ],
  ];

  let totalInitialBalance = 0;

  coaList.forEach((acc) => {
    const isH = acc.isHeader ? 'HEADER GOLONGAN' : 'AKUN DETAIL';
    const initBal = acc.initialBalance || 0;
    if (!acc.isHeader) totalInitialBalance += initBal;

    sheetData.push([
      acc.code,
      acc.name,
      acc.group.replace('_', ' ').toUpperCase(),
      acc.normalPosition.toUpperCase(),
      isH,
      acc.isHeader ? '-' : initBal,
    ]);
  });

  sheetData.push([]);
  sheetData.push(['TOTAL SALDO AWAL AKUN', '', '', '', '', totalInitialBalance]);

  const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
  worksheet['!cols'] = calculateColWidths(sheetData);

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'COA Master');
  XLSX.writeFile(workbook, filename);
}

// 5. Export Jurnal Umum (General Journal)
export function exportJournalsToExcel(
  journals: JournalEntry[],
  companyProfile?: CompanyProfile,
  filename: string = 'Laporan_Jurnal_Umum.xlsx'
) {
  const compName = (companyProfile?.companyName || 'PT NABASTALA').toUpperCase();
  const downloadDate = new Date().toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' });

  const sheetData: any[][] = [
    [compName],
    ['JURNAL UMUM & PENYESUAIAN TRANSAKSI (GENERAL JOURNAL)'],
    [`Tanggal Cetak: ${downloadDate} | Mata Uang: Rupiah Indonesia (IDR)`],
    ['Metode Pembukuan: Berpasangan (Double-Entry Bookkeeping)'],
    [],
    [
      'No. Jurnal',
      'Tanggal',
      'Tipe Jurnal',
      'No. Referensi / Bukti',
      'Kode Akun',
      'Nama Akun Akuntansi',
      'Debit (Rp)',
      'Kredit (Rp)',
      'Keterangan Transaksi',
      'Dibuat Oleh',
    ],
  ];

  let grandDebit = 0;
  let grandCredit = 0;

  journals.forEach((j) => {
    j.lines.forEach((line) => {
      grandDebit += line.debit;
      grandCredit += line.credit;
      sheetData.push([
        j.code,
        j.date,
        j.type.toUpperCase(),
        j.referenceCode || '-',
        line.accountCode,
        line.accountName,
        line.debit,
        line.credit,
        j.description,
        j.createdBy || 'Sistem',
      ]);
    });
  });

  sheetData.push([]);
  sheetData.push([
    'TOTAL KESEIMBANGAN JURNAL',
    '',
    '',
    '',
    '',
    '',
    grandDebit,
    grandCredit,
    grandDebit === grandCredit ? 'SEIMBANG (BALANCED)' : 'TIDAK SEIMBANG',
    '',
  ]);

  const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
  worksheet['!cols'] = calculateColWidths(sheetData);

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Jurnal Umum');
  XLSX.writeFile(workbook, filename);
}

// 6. Export Selected Rows to Excel (Checklist batch export)
export function exportSelectedRowsToExcel(
  headers: string[],
  rows: any[][],
  reportTitle: string = 'DATA TERPILIH',
  companyProfile?: CompanyProfile,
  filename: string = 'Data_Terpilih.xlsx'
) {
  const compName = (companyProfile?.companyName || 'PT NABASTALA').toUpperCase();
  const downloadDate = new Date().toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' });

  const sheetData: any[][] = [
    [compName],
    [reportTitle.toUpperCase()],
    [`Tanggal Unduh: ${downloadDate} | Data Terpilih via Checklist`],
    ['Mata Uang: Rupiah Indonesia (IDR)'],
    [],
    headers,
    ...rows,
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
  worksheet['!cols'] = calculateColWidths(sheetData);

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Terpilih');
  XLSX.writeFile(workbook, filename);
}

// 7. Comprehensive Financial Report (Neraca, Laba Rugi, dsb.)
export function exportComprehensiveFinancialReportToExcel(
  coaList: COAAccount[],
  journals: JournalEntry[],
  transactions: Transaction[],
  hutangList: HutangRecord[],
  piutangList: PiutangRecord[],
  companyProfileOrFilename?: CompanyProfile | string,
  filename?: string
) {
  let companyProfile: CompanyProfile | undefined;
  let finalFilename = 'Laporan_Keuangan_Lengkap.xlsx';

  if (typeof companyProfileOrFilename === 'string') {
    finalFilename = companyProfileOrFilename;
  } else if (companyProfileOrFilename) {
    companyProfile = companyProfileOrFilename;
    if (filename) finalFilename = filename;
  }

  const workbook = XLSX.utils.book_new();
  const compName = (companyProfile?.companyName || 'PT NABASTALA').toUpperCase();
  const downloadDate = new Date().toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' });

  // 1. Neraca Saldo (Trial Balance)
  const tb = computeTrialBalance(coaList, journals);
  const tbRows: any[][] = [
    [compName],
    ['NERACA SALDO (TRIAL BALANCE)'],
    [`Tanggal Cetak: ${downloadDate} | Mata Uang: Rupiah Indonesia (IDR)`],
    [],
    ['Kode Akun', 'Nama Akun', 'Klasifikasi', 'Debit (Rp)', 'Kredit (Rp)'],
  ];
  tb.rows.forEach((r) => {
    tbRows.push([r.code, r.name, r.group.toUpperCase(), r.debit, r.credit]);
  });
  tbRows.push([]);
  tbRows.push(['TOTAL KESEIMBANGAN', '', '', tb.totalDebit, tb.totalCredit]);
  const wsTB = XLSX.utils.aoa_to_sheet(tbRows);
  wsTB['!cols'] = calculateColWidths(tbRows);
  XLSX.utils.book_append_sheet(workbook, wsTB, 'Neraca Saldo');

  // 2. Laba Rugi (P&L)
  const pnl = computeProfitAndLoss(coaList, journals);
  const pnlRows: any[][] = [
    [compName],
    ['LAPORAN LABA / RUGI KOMPREHENSIF'],
    [`Tanggal Cetak: ${downloadDate} | Mata Uang: Rupiah Indonesia (IDR)`],
    [],
    ['Kategori', 'Kode Akun', 'Nama Akun', 'Nominal (Rp)'],
    ['--- PENDAPATAN USAHA ---', '', '', ''],
  ];
  pnl.revenueRows.forEach((r) => {
    pnlRows.push(['Pendapatan', r.code, r.name, r.amount]);
  });
  pnlRows.push(['TOTAL PENDAPATAN', '', '', pnl.totalRevenue]);
  pnlRows.push([]);
  pnlRows.push(['--- BEBAN OPERASIONAL ---', '', '', '']);
  pnl.expenseRows.forEach((r) => {
    pnlRows.push(['Beban Operasional', r.code, r.name, r.amount]);
  });
  pnlRows.push(['TOTAL BEBAN OPERASIONAL', '', '', pnl.totalExpense]);
  pnlRows.push([]);
  pnlRows.push(['LABA / (RUGI) BERSIH TAHUN BERJALAN', '', '', pnl.netProfit]);
  const wsPnl = XLSX.utils.aoa_to_sheet(pnlRows);
  wsPnl['!cols'] = calculateColWidths(pnlRows);
  XLSX.utils.book_append_sheet(workbook, wsPnl, 'Laba Rugi');

  // 3. Neraca (Balance Sheet)
  const bs = computeBalanceSheet(coaList, journals);
  const bsRows: any[][] = [
    [compName],
    ['LAPORAN POSISI KEUANGAN (NERACA)'],
    [`Tanggal Cetak: ${downloadDate} | Mata Uang: Rupiah Indonesia (IDR)`],
    [],
    ['Klasifikasi Aset & Kewajiban', 'Nama Akun', 'Nilai Buku (Rp)'],
    ['--- ASET LANCAR ---', '', ''],
  ];
  bs.currentAssetRows.forEach((r) => bsRows.push(['Aset Lancar', r.name, r.amount]));
  bsRows.push(['TOTAL ASET LANCAR', '', bs.totalCurrentAssets]);
  bsRows.push([]);
  bsRows.push(['--- ASET TETAP ---', '', '']);
  bs.fixedAssetRows.forEach((r) => bsRows.push(['Aset Tetap', r.name, r.amount]));
  bsRows.push(['TOTAL ASET TETAP', '', bs.totalFixedAssets]);
  bsRows.push(['TOTAL KESELURUHAN ASET', '', bs.totalAssets]);
  bsRows.push([]);
  bsRows.push(['--- KEWAJIBAN / HUTANG ---', '', '']);
  bs.liabilityRows.forEach((r) => bsRows.push(['Kewajiban', r.name, r.amount]));
  bsRows.push(['TOTAL KEWAJIBAN', '', bs.totalLiabilities]);
  bsRows.push([]);
  bsRows.push(['--- MODAL & EKUITAS ---', '', '']);
  bs.equityRows.forEach((r) => bsRows.push(['Modal & Ekuitas', r.name, r.amount]));
  bsRows.push(['TOTAL MODAL & EKUITAS', '', bs.totalEquity]);
  bsRows.push(['TOTAL KEWAJIBAN & EKUITAS', '', bs.totalLiabilitiesAndEquity]);
  const wsBS = XLSX.utils.aoa_to_sheet(bsRows);
  wsBS['!cols'] = calculateColWidths(bsRows);
  XLSX.utils.book_append_sheet(workbook, wsBS, 'Neraca');

  XLSX.writeFile(workbook, finalFilename);
}
