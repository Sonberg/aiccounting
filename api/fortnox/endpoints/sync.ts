// import { fileByConvention } from '@/utils/filesByConvention';
// import { log } from 'console';
// import dayjs from 'dayjs';
// import { api } from 'encore.dev/api';
// import { Attribute, Subscription, Topic } from 'encore.dev/pubsub';
// import { core, fortnox } from '~encore/clients';
// import { getToken } from '../database';

// interface Params {
//   tenantId: number;
//   from: {
//     year: number;
//     month: number;
//   };
//   to: {
//     year: number;
//     month: number;
//   };
// }

// export const sync = api<Params>(
//   {
//     method: 'POST',
//     path: '/fortnox/sync',
//   },
//   async (params) => {
//     await getToken(params.tenantId);
//     await syncFortnox.publish({
//       tenantId: params.tenantId,
//       vouchers: {
//         to: params.to,
//         from: params.from,
//       },
//     });

//     await uploadVouchers({
//       tenantId: params.tenantId,
//       vouchers: {
//         to: params.to,
//         from: params.from,
//       },
//     });
//   }
// );

// interface SyncFortnoxParams {
//   tenantId: Attribute<number>;
//   vouchers: {
//     from: {
//       year: number;
//       month: number;
//     };
//     to: {
//       year: number;
//       month: number;
//     };
//   };
// }

// const syncFortnox = new Topic<SyncFortnoxParams>('sync-fortnox', {
//   deliveryGuarantee: 'exactly-once',
//   orderingAttribute: 'tenantId',
// });

// new Subscription(syncFortnox, 'upload-accounts', {
//   handler: async (params) => {
//     const accounts = await fortnox.getAccounts({ tenantId: params.tenantId });

//     await core.upload({
//       fileName: fileByConvention.withType(
//         params.tenantId,
//         'fortnox',
//         'accounts'
//       ),
//       content: JSON.stringify(accounts.data.filter((x) => x.Active)),
//     });
//   },
// });

// const uploadVouchers = async ({ tenantId, vouchers }: SyncFortnoxParams) => {
//   const process = async (month: dayjs.Dayjs) => {
//     const vouchers = await fortnox.getVouchers({
//       // from: month.startOf('month').format('YYYY-MM-DD'),
//       // to: month.endOf('month').format('YYYY-MM-DD'),
//       includeRows: true,
//       voucherSeries: 'O',
//     });

//     await core.upload({
//       fileName: fileByConvention.withMonth(
//         tenantId,
//         'fortnox',
//         'vouchers',
//         month
//       ),
//       content: JSON.stringify(vouchers),
//     });
//   };

//   const end = dayjs(`${vouchers.to.year}-${vouchers.to.month}-01`).endOf(
//     'month'
//   );

//   let current = dayjs(
//     `${vouchers.from.year}-${vouchers.from.month}-01`
//   ).startOf('month');

//   while (true) {
//     if (current.isAfter(end)) {
//       log('isAfter');
//       break;
//     }

//     try {
//       log('Start', current.format('YYYY-MM-DD'));
//       await process(current);
//       // await new Promise<void>((res) => setTimeout(() => res(), 500));
//       log('Done', current.format('YYYY-MM-DD'));
//     } catch (err) {
//       log(err);
//     }

//     current = current.add(1, 'month').startOf('month');
//   }
// };
