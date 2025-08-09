import { Attribute, Subscription, Topic } from 'encore.dev/pubsub';
import { fortnox, klarna } from '~encore/clients';
import dayjs from 'dayjs';

export interface KlarnaToFortnoxEvent {
  tenantId: Attribute<string>;
}

export const klarnaToFortnox = new Topic<KlarnaToFortnoxEvent>(
  'klarna-fortnox',
  {
    deliveryGuarantee: 'exactly-once',
    orderingAttribute: 'tenantId',
  }
);

const _ = new Subscription(klarnaToFortnox, 'process', {
  handler: async () => {
    var payouts = await klarna.getPayouts({
      from: dayjs().add(-2, 'M').toISOString(),
    });

    const vouchers = await fortnox.getVouchers({});

    console.log('Payouts from Klarna:', payouts.data);
    console.log('Vouchers from Fortnox:', vouchers.data);
  },
});
