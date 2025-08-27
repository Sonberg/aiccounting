import { Topic } from 'encore.dev/pubsub';

export interface SyncStartedParams {
  jobId: number;
  tenantId: number;
}

export const syncStarted = new Topic<SyncStartedParams>('sync-started', {
  deliveryGuarantee: 'exactly-once',
});

export interface SyncUpdatedParams {
  jobId: number;
  tenantId: number;
  updatedAt: Date | null;
}

export const syncUpdated = new Topic<SyncUpdatedParams>('sync-updated', {
  deliveryGuarantee: 'at-least-once',
});

export interface SyncCompletedParams {
  jobId: number;
  tenantId: number;
}

export const syncCompleted = new Topic<SyncCompletedParams>('sync-completed', {
  deliveryGuarantee: 'exactly-once',
});
