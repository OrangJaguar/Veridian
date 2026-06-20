import { base44 } from '@/api/base44Client';

export async function exportAdminCsv(exportKey) {
  const res = await base44.functions.invoke('exportAdminData', { exportKey });
  const { csv, filename } = res?.data ?? res;
  if (!csv) throw new Error('Empty export');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename ?? `${exportKey}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
