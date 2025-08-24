'use client';

import { useQuery } from '@tanstack/react-query';
import { TransactionCard } from '@/components/TransactionCard';
import { useEncore } from '../contexts/Encore';

export default function Home() {
  const { getClient } = useEncore();

  const from = '2025-07';
  const all = useQuery({
    queryKey: ['get', from],
    queryFn: async () => {
      const client = await getClient();
      const { data } = await client.klarna_fortnox.get({
        from,
      });

      return data;
    },
    initialData: [],
  });

  const status = useQuery({
    queryKey: ['status', from],
    queryFn: async () => {
      const client = await getClient();
      const { data } = await client.klarna_fortnox.status({
        from,
      });

      return data;
    },
    initialData: [],
  });

  return (
    <div className="font-sans flex flex-col items-center justify-items-center min-h-screen p-8 pb-20 gap-8 sm:p-20">
      <div className="text-2xl font-semibold text-left">Transactions</div>
      {all.data.map((x) => (
        <TransactionCard
          key={x.payment_reference}
          payout={x}
          status={status.data.find(
            (y) => y.paymentReference === x.payment_reference
          )}
        />
      ))}
    </div>
  );
}
