import { log } from 'console';
import dayjs from 'dayjs';

export function monthsBetween(
  from: string | dayjs.Dayjs,
  to: string | dayjs.Dayjs
) {
  const fromParsed = dayjs(from);
  const toParsed = dayjs(to);

  const result = [];
  let current = fromParsed.startOf('month');

  while (current.isBefore(toParsed) || current.isSame(toParsed, 'month')) {
    result.push(current.format('YYYY-MM'));
    current = current.add(1, 'month');
  }

  log(result);

  return result;
}
