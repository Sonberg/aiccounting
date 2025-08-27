import { log } from 'console';
import { Subscription } from 'encore.dev/pubsub';
import { sync } from '../../encore.gen/clients';
import { syncStarted } from '../../sync/topics';

new Subscription(syncStarted, 'sync-accounts', {
  handler: async (params) => {
    const item = await sync.startSyncItem({
      jobId: params.jobId,
      source: 'fortnox',
      sourceType: 'account',
      sourceId: null,
    });

    log('Sync Fortnox account', params.tenantId);

    await sync.stopSyncItem({
      jobId: params.jobId,
      jobItemId: item.jobItemId,
      status: 'success',
    });
  },
});
