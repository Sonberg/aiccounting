import { Attribute, Topic } from 'encore.dev/pubsub';
import { FortnoxVoucher } from './types';

export interface SyncVoucherParams {
  tenantId: Attribute<number>;
  jobId: number;
  voucher: FortnoxVoucher;
}

export const syncVoucher = new Topic<SyncVoucherParams>('sync-voucher', {
  orderingAttribute: 'tenantId',
  deliveryGuarantee: 'at-least-once',
});
