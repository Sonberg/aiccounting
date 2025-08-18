import { useMutation } from '@tanstack/react-query';
import classNames from 'classnames';
import dayjs from 'dayjs';
import { useState } from 'react';
import { TransactionSuggestionCard } from './TransactionSuggestionCard';
import { core, klarna } from '../lib/client';
import { useEncore } from '../contexts/Encore';

interface TransactionCardProps {
  payout: klarna.Payout;
  status: core.TransactionStatus | undefined;
}

export function TransactionCard({ payout, status }: TransactionCardProps) {
  const [suggestion, setSuggestion] =
    useState<core.TransactionSuggestion | null>(null);

  const { client } = useEncore();

  const { mutateAsync, isPending } = useMutation({
    mutationKey: ['suggest', payout.payment_reference],
    mutationFn: async () => {
      const { data } = await client.klarna_fortnox.suggest({
        paymentReference: payout.payment_reference,
      });

      setSuggestion(data);
    },
  });
  return (
    <div key={payout.payment_reference} className="bg-white/8 p-6 w-full">
      <div className="flex justify-between">
        <div children={payout.payment_reference} className="font-bold" />
        <div className="rounded-full px-4 py-1 font-semibold text-sm text-black bg-white">
          {dayjs(payout.payout_date).format('DD/MM/YYYY')}
        </div>
      </div>

      <hr className="mt-6" />

      <div className="flex gap-4 mt-8 items-center">
        <div
          className={classNames([
            'h-4 w-4 rounded-full ',
            {
              'bg-gray-600': status === undefined,
              'bg-green-500': status?.alreadyBooked === true,
              'bg-amber-300': status?.alreadyBooked === false,
            },
          ])}
        />
        <div className={classNames({ 'text-gray-400': !status })}>
          {status === undefined
            ? 'Loading...'
            : status.alreadyBooked
            ? 'Done'
            : 'New'}{' '}
          {status?.confidence ? `(${status.confidence})` : null}
        </div>
      </div>

      <div className={classNames(['mt-6'])}>{status?.reason}</div>

      <div className="flex justify-end">
        {status?.alreadyBooked == false ? (
          <button
            className={classNames([
              'text-white font-bold px-4 py-2 rounded-full mt-6',
              {
                ' bg-blue-600': !isPending,
                ' bg-blue-950': isPending,
                'cursor-pointer': !isPending,
              },
            ])}
            disabled={isPending}
            onClick={() => mutateAsync()}
          >
            {!isPending && suggestion ? 'Try again' : 'Suggest'}
          </button>
        ) : null}
      </div>

      {!isPending && suggestion ? (
        <TransactionSuggestionCard payout={payout} suggestion={suggestion} />
      ) : null}
    </div>
  );
}
