import { CronJob } from 'encore.dev/cron';
import { api } from 'encore.dev/api';
import { klarnaToFortnox } from '@/klarna-fortnox';

export const run = api({ method: 'POST', path: '/scheduler/run' }, async () => {
  klarnaToFortnox.publish({ tenantId: '0' });
});

export const job = new CronJob('scheduler', {
  title: 'Schedule sync',
  every: '2h',
  endpoint: run,
});
