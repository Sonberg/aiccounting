import { TransactionSuggestion } from '@/core/suggest';

export interface Props {
  suggestion: TransactionSuggestion;
}

export function TransactionSuggestionCard({ suggestion }: Props) {
  return (
    <div className="mt-8">
      <div>
        <div>Date: {suggestion.date}</div>
        <div>Voucher series: {suggestion.voucherseries}</div>
      </div>
      <table className="mt-4 w-full border-collapse border border-gray-300 text-sm">
        <thead className="bg-gray-300/80 font-semibold  text-black">
          <tr>
            <th className="border border-gray-300 px-3 py-2 text-left">
              Account
            </th>
            <th className="border border-gray-300 px-3 py-2 text-left">
              Description
            </th>
            <th className="border border-gray-300 px-3 py-2 text-right">
              Debit
            </th>
            <th className="border border-gray-300 px-3 py-2 text-right">
              Credit
            </th>
          </tr>
        </thead>
        <tbody>
          {suggestion.rows.map((row, index) => (
            <tr key={`${row.account}-${index}`} className="hover:bg-gray-50/10">
              <td className="border border-gray-300 px-3 py-2">
                {row.account}
              </td>
              <td className="border border-gray-300 px-3 py-2">
                {row.description}
              </td>
              <td className="border border-gray-300 px-3 py-2 text-right">
                {row.debit}
              </td>
              <td className="border border-gray-300 px-3 py-2 text-right">
                {row.credit}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
