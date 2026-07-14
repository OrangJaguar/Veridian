import { invokeAdminFunction } from '@/api/admin/invokeAdminFunction';

export async function exportAdminCsv(exportKey) {
  const { csv, filename } = await invokeAdminFunction('exportAdminData', { exportKey });
  if (!csv) throw new Error('Empty export');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename ?? `${exportKey}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
