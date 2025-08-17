import { syncTenant } from '@/iam/topics';
import { log } from 'console';
import { Subscription } from 'encore.dev/pubsub';

export const _ = new Subscription(syncTenant, 'klarna-settlements', {
  handler: async (params) => {
    log('Sync Klarna settlements', params.tenantId);
  },
});
