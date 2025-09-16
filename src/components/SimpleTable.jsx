import React from 'react';

export default function SimpleTable({ data = [] }) {
  if (!data || data.length === 0) return null;
  const columns = Object.keys(data[0]);
  
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-gray-50">
            {columns.map((c) => (
              <th
                key={c}
                className="text-left p-2 text-xs text-gray-500 border-b"
              >
                {c.replace(/_/g, " ")}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="odd:bg-white even:bg-gray-50 hover:bg-gray-100">
              {columns.map((c) => (
                <td key={c} className="p-2 text-xs border-b">
                  {String(row[c])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}