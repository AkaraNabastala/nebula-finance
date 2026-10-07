export function formatRupiah(amount: number, withSymbol: boolean = true): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return withSymbol ? 'Rp 0' : '0';
  }
  const isNegative = amount < 0;
  const abs = Math.abs(Math.round(amount));
  const formatted = abs.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  
  if (isNegative) {
    return withSymbol ? `-Rp ${formatted}` : `-${formatted}`;
  }
  return withSymbol ? `Rp ${formatted}` : formatted;
}

export function formatDate(dateString?: string): string {
  if (!dateString) return '-';
  try {
    const [year, month, day] = dateString.split('-');
    if (!year || !month || !day) return dateString;
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    const monthName = months[parseInt(month, 10) - 1] || month;
    return `${parseInt(day, 10)} ${monthName} ${year}`;
  } catch {
    return dateString;
  }
}

export function formatDateShort(dateString?: string): string {
  if (!dateString) return '-';
  try {
    const [year, month, day] = dateString.split('-');
    if (!year || !month || !day) return dateString;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const monthName = months[parseInt(month, 10) - 1] || month;
    return `${day} ${monthName} ${year.slice(2)}`;
  } catch {
    return dateString;
  }
}

export function formatDateTime(timestamp?: number): string {
  if (!timestamp) return '-';
  const date = new Date(timestamp);
  return date.toLocaleString('id-ID', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getTodayString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function generateDocCode(prefix: string, count: number, dateStr?: string): string {
  const year = dateStr ? dateStr.substring(0, 4) : new Date().getFullYear().toString();
  const seq = String(count + 1).padStart(4, '0');
  return `${prefix}-${year}-${seq}`;
}
