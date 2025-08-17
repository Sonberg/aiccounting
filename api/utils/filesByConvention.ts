import dayjs from 'dayjs';

type Type = 'vouchers' | 'accounts';

function fromMonthRange(
  tenantId: number,
  source: 'fortnox',
  type: Type,
  from: dayjs.Dayjs,
  to: dayjs.Dayjs,
  format?: 'pdf'
): string[] {
  let current = from.startOf('month');
  const end = to.startOf('month');
  const files: string[] = [];

  while (current.isBefore(end) || current.isSame(end)) {
    files.push(withMonth(tenantId, source, type, current, format));
    current = current.add(1, 'month');
  }

  return files;
}

function withMonth(
  tenantId: number,
  source: 'fortnox',
  type: Type,
  date: dayjs.Dayjs,
  format?: 'pdf'
): string {
  const year = date.format('YYYY');
  const month = date.format('MM');

  return format
    ? `${tenantId}-${source}-${type}-${year}-${month}.${format}`
    : `${tenantId}-${source}-${type}-${year}-${month}`;
}

function withType(
  tenantId: number,
  source: 'fortnox',
  type: Type,
  format?: 'pdf'
): string {
  return format
    ? `${tenantId}-${source}-${type}.${format}`
    : `${tenantId}-${source}-${type}`;
}

export const fileByConvention = {
  withMonth,
  fromMonthRange,
  withType,
};
