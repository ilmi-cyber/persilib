import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Book, Transaction, User } from '../types/library';
import {
  formatDateID,
  formatRupiah,
  getEffectiveFine,
  getEffectiveTransactionStatus,
} from './libraryHelpers';

export interface ReportExportPayload {
  title: string;
  periodLabel: string;
  generatedBy: string;
  transactions: Transaction[];
  books: Book[];
  users: User[];
  summary: {
    totalTransactions: number;
    activeBorrowed: number;
    returnedCount: number;
    overdueCount: number;
    totalFine: number;
  };
}

export function exportReportToPDF(payload: ReportExportPayload): void {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });

  // Editorial header block (Dark Brown & Cream accent)
  doc.setFillColor(51, 37, 27); // #33251B
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), 78, 'F');

  doc.setTextColor(250, 247, 242);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('ILMIE LIBRARY', 40, 34);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(payload.title, 40, 52);

  doc.setFontSize(9);
  doc.text(`Periode: ${payload.periodLabel}`, doc.internal.pageSize.getWidth() - 40, 34, {
    align: 'right',
  });
  doc.text(
    `Dicetak oleh: ${payload.generatedBy} · ${formatDateID(new Date().toISOString(), true)}`,
    doc.internal.pageSize.getWidth() - 40,
    52,
    { align: 'right' }
  );

  // Summary KPI strip
  const kpis = [
    ['Total Transaksi', String(payload.summary.totalTransactions)],
    ['Sedang Dipinjam', String(payload.summary.activeBorrowed)],
    ['Dikembalikan', String(payload.summary.returnedCount)],
    ['Terlambat', String(payload.summary.overdueCount)],
    ['Total Denda', formatRupiah(payload.summary.totalFine)],
  ];

  let xPos = 40;
  const boxWidth = (doc.internal.pageSize.getWidth() - 80 - 40) / 5;
  kpis.forEach(([label, val]) => {
    doc.setFillColor(242, 236, 227);
    doc.setDrawColor(229, 221, 208);
    doc.roundedRect(xPos, 96, boxWidth, 48, 4, 4, 'FD');
    doc.setTextColor(94, 75, 60);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.text(label, xPos + 10, 114);
    doc.setTextColor(51, 37, 27);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(val, xPos + 10, 132);
    xPos += boxWidth + 10;
  });

  // Table rows
  const rows = payload.transactions.map((tx, idx) => {
    const book = payload.books.find((b) => b.id === tx.bookId);
    const member = payload.users.find((u) => u.id === tx.userId);
    const effStatus = getEffectiveTransactionStatus(tx);
    const effFine = getEffectiveFine(tx);

    return [
      String(idx + 1),
      tx.transactionCode,
      book?.title ?? 'Buku Terhapus',
      book?.category ?? '-',
      member?.name ?? 'Member',
      formatDateID(tx.borrowDate),
      formatDateID(tx.dueDate),
      tx.returnDate ? formatDateID(tx.returnDate) : '-',
      effStatus,
      effFine > 0 ? formatRupiah(effFine) : 'Rp 0',
    ];
  });

  autoTable(doc, {
    startY: 162,
    head: [
      [
        'No',
        'Kode',
        'Judul Buku',
        'Kategori',
        'Peminjam',
        'Tgl Pinjam',
        'Jatuh Tempo',
        'Tgl Kembali',
        'Status',
        'Denda',
      ],
    ],
    body: rows,
    theme: 'grid',
    styles: {
      fontSize: 8.5,
      cellPadding: 6,
      textColor: [51, 37, 27],
      lineColor: [229, 221, 208],
      lineWidth: 0.5,
    },
    headStyles: {
      fillColor: [74, 107, 83], // Sage Green #4A6B53
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [250, 247, 242],
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 26 },
      1: { cellWidth: 78 },
      9: { halign: 'right' },
    },
  });

  const safeDate = new Date().toISOString().slice(0, 10);
  doc.save(`Ilmie_Library_Laporan_${safeDate}.pdf`);
}

export function exportReportToExcel(payload: ReportExportPayload): void {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Ringkasan Periode
  const summarySheetData = [
    ['LAPORAN PERPUSTAKAAN DIGITAL ILMIE LIBRARY'],
    ['Judul Laporan', payload.title],
    ['Periode Transaksi', payload.periodLabel],
    ['Dibuat Oleh', payload.generatedBy],
    ['Tanggal Cetak', formatDateID(new Date().toISOString(), true)],
    [],
    ['Metrik Ringkasan', 'Nilai'],
    ['Total Transaksi', payload.summary.totalTransactions],
    ['Sedang Dipinjam', payload.summary.activeBorrowed],
    ['Sudah Dikembalikan', payload.summary.returnedCount],
    ['Terlambat', payload.summary.overdueCount],
    ['Total Akumulasi Denda (IDR)', payload.summary.totalFine],
  ];
  const wsSummary = XLSX.utils.aoa_to_sheet(summarySheetData);
  wsSummary['!cols'] = [{ wch: 30 }, { wch: 42 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan');

  // Sheet 2: Detail Transaksi
  const txRows = payload.transactions.map((tx, idx) => {
    const book = payload.books.find((b) => b.id === tx.bookId);
    const member = payload.users.find((u) => u.id === tx.userId);
    return {
      No: idx + 1,
      'Kode Transaksi': tx.transactionCode,
      'Judul Buku': book?.title ?? 'Buku Terhapus',
      ISBN: book?.isbn ?? '-',
      Kategori: book?.category ?? '-',
      'Nama Peminjam': member?.name ?? 'Member',
      'ID Anggota': member?.memberCode ?? '-',
      'Tanggal Pinjam': formatDateID(tx.borrowDate),
      'Jatuh Tempo': formatDateID(tx.dueDate),
      'Tanggal Kembali': tx.returnDate ? formatDateID(tx.returnDate) : '-',
      Status: getEffectiveTransactionStatus(tx),
      'Denda (Rp)': getEffectiveFine(tx),
      Catatan: tx.notes ?? '-',
    };
  });
  const wsTx = XLSX.utils.json_to_sheet(
    txRows.length > 0
      ? txRows
      : [
          {
            No: '-',
            'Kode Transaksi': 'Tidak ada transaksi pada periode ini',
          },
        ]
  );
  wsTx['!cols'] = [
    { wch: 5 },
    { wch: 16 },
    { wch: 34 },
    { wch: 18 },
    { wch: 22 },
    { wch: 20 },
    { wch: 16 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
    { wch: 14 },
    { wch: 14 },
    { wch: 28 },
  ];
  XLSX.utils.book_append_sheet(wb, wsTx, 'Detail Transaksi');

  // Sheet 3: Koleksi Buku
  const bookRows = payload.books.map((b, idx) => ({
    No: idx + 1,
    ISBN: b.isbn,
    Judul: b.title,
    Penulis: b.author,
    Kategori: b.category,
    Penerbit: b.publisher,
    Tahun: b.year,
    Rak: b.shelfLocation,
    'Total Stok': b.totalStock,
    'Stok Tersedia': b.availableStock,
    Status: b.status,
  }));
  const wsBooks = XLSX.utils.json_to_sheet(bookRows);
  wsBooks['!cols'] = [
    { wch: 5 },
    { wch: 18 },
    { wch: 34 },
    { wch: 22 },
    { wch: 22 },
    { wch: 20 },
    { wch: 8 },
    { wch: 10 },
    { wch: 12 },
    { wch: 14 },
    { wch: 16 },
  ];
  XLSX.utils.book_append_sheet(wb, wsBooks, 'Koleksi Buku');

  const safeDate = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `Ilmie_Library_Laporan_${safeDate}.xlsx`);
}
