import { TransactionSuggestion } from '@/core/suggest';
import { Payout } from '@/klarna/endpoints/getPayouts';
import { useState, ChangeEvent } from 'react';

type Field = 'debit' | 'credit' | 'account';

export interface Props {
  payout: Payout;
  suggestion: TransactionSuggestion;
}

export function TransactionSuggestionCard({ payout, suggestion }: Props) {
  const [rows, setRows] = useState(suggestion.rows);

  const onChange =
    (index: number, field: Field) => (ev: ChangeEvent<HTMLInputElement>) => {
      const rawValue = ev.target.value;

      // Allow empty input
      if (rawValue === '') {
        setRows((items) =>
          items.map((item, i) =>
            i === index ? { ...item, [field]: null } : item
          )
        );
        return;
      }

      const numericValue = Number(rawValue);

      if (isNaN(numericValue)) {
        return;
      }

      setRows((items) =>
        items.map((item, i) =>
          i === index ? { ...item, [field]: numericValue } : item
        )
      );
    };

  const onBlur = (index: number, field: Field) => () => {
    if (field === 'account') {
      return;
    }
    setRows((items) =>
      items.map((item, i) =>
        i === index && item[field] != null
          ? {
              ...item,
              [field]: Number(item[field]!.toFixed(2)),
            }
          : item
      )
    );
  };

  const renderInput = (index: number, field: Field) => {
    return (
      <input
        type="number"
        step="0.01"
        autoComplete="off"
        inputMode="decimal"
        name="debit"
        value={rows[index][field] ?? ''}
        onChange={onChange(index, field)}
        onBlur={onBlur(index, field)}
        className="text-right outline-0 no-spin"
      />
    );
  };

  return (
    <div className="mt-8">
      <div>
        <div>Date: {suggestion.date}</div>
        <div>Voucher series: {suggestion.voucherseries}</div>
      </div>
      <div className="overflow-x-auto">
        <table className="mt-4 w-full border-collapse border border-gray-300 text-sm">
          <thead className="bg-gray-300/80 font-semibold text-black">
            <tr>
              <th className="border border-gray-300 px-3 py-2 text-left min-w-[120px]">
                Account
              </th>
              <th className="border border-gray-300 px-3 py-2 text-left min-w-[200px]">
                Description
              </th>
              <th className="border border-gray-300 px-3 py-2 text-right min-w-[100px]">
                Debit
              </th>
              <th className="border border-gray-300 px-3 py-2 text-right min-w-[100px]">
                Credit
              </th>
              <th className="border border-gray-300 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr
                key={`${row.account}-${index}`}
                className="hover:bg-gray-50/10"
              >
                <td className="border border-gray-300 px-3 py-2">
                  {row.account}
                </td>
                <td className="border border-gray-300 px-3 py-2">
                  {row.description}
                </td>
                <td
                  className="border border-gray-300 px-3 py-2 text-right"
                  onClick={(ev) => {
                    const target = ev.target as HTMLTableCellElement;
                    const input = target?.querySelector('input');

                    input?.focus();
                  }}
                >
                  <div className="flex h-full w-full justify-end">
                    {renderInput(index, 'debit')}
                    <div className="ml-4" children={payout.currency_code} />
                  </div>
                </td>
                <td className="border border-gray-300 px-3 py-2 text-right">
                  <div className="flex h-full w-full justify-end">
                    {renderInput(index, 'credit')}
                    <div className="ml-4" children={payout.currency_code} />
                  </div>
                </td>
                <td className="border border-gray-300 p-2 grid place-content-center">
                  <button
                    onClick={() => {
                      setRows((val) => val.filter((_, i) => i !== index));
                    }}
                    className=" border-0 bg-white h-6 w-6 rounded-full font-bold text-black grid place-content-center"
                    children="-"
                  />
                </td>
              </tr>
            ))}
            <tr>
              <td colSpan={4} className="border border-gray-300"></td>
              <td className="border border-gray-300  grid place-content-center p-2">
                <button
                  onClick={() => {
                    setRows((val) => [
                      ...val,
                      {
                        account: '',
                        description: '',
                        debit: null,
                        credit: null,
                      },
                    ]);
                  }}
                  className="bg-white h-6 w-6 rounded-full font-bold text-black grid place-content-center"
                  children="+"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="flex justify-end mt-4">
        <button className="bg-green-500 text-black px-8 py-2 font-bold rounded-full">
          Save
        </button>
      </div>
    </div>
  );
}
