import { CronJob } from 'encore.dev/cron';
import { api } from 'encore.dev/api';
import { iam, sync } from '~encore/clients';

export const syncAllTenants = api(
  { method: 'POST', path: '/scheduler/sync-tenants' },
  async () => {
    const tenants = await iam.getTenants({});
    for (const tenant of tenants.data) {
      await sync.startSync({ tenantId: tenant.id });
    }
  }
);

export const scheduleSync = new CronJob('sync-scheduler', {
  title: 'Schedule sync',
  every: '2h',
  endpoint: syncAllTenants,
});
