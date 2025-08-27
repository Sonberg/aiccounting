import { CronJob } from 'encore.dev/cron';
import { api } from 'encore.dev/api';
import { sync } from '../encore.gen/clients';

export const syncAllTenants = api(
  { method: 'POST', path: '/scheduler/sync-tenants' },
  async () => {
    await sync.startSync({ tenantId: 1 });
  }
);

export const scheduleSync = new CronJob('sync-scheduler', {
  title: 'Schedule sync',
  every: '2h',
  endpoint: syncAllTenants,
});
