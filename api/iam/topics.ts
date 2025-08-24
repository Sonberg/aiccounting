import { Attribute, Topic } from 'encore.dev/pubsub';

export interface SyncTenantParams {
  tenantId: Attribute<number>;
  jobId: number;
}

export const syncTenant = new Topic<SyncTenantParams>('sync-tenant', {
  orderingAttribute: 'tenantId',
  deliveryGuarantee: 'exactly-once',
});
