import dayjs from 'dayjs';

export function filesByConvention(
  tenantId: number,
  source: 'fortnox',
  type: 'vouchers',
  from: dayjs.Dayjs,
  to: dayjs.Dayjs,
  format?: 'pdf'
): string[] {
  let current = from.startOf('month');
  const end = to.startOf('month');
  const files: string[] = [];

  while (current.isBefore(end) || current.isSame(end)) {
    files.push(fileByConvention(tenantId, source, type, current, format));
    current = current.add(1, 'month');
  }

  return files;
}

export function fileByConvention(
  tenantId: number,
  source: 'fortnox',
  type: 'vouchers',
  date: dayjs.Dayjs,
  format?: 'pdf'
): string {
  const year = date.format('YYYY');
  const month = date.format('MM');

  return format
    ? `${tenantId}-${source}-${type}-${year}-${month}.${format}`
    : `${tenantId}-${source}-${type}-${year}-${month}`;
}
