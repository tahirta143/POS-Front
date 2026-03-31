import React from 'react';

const Table = ({ columns, data, onEdit, onDelete }) => {
  return (
    <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 rounded-lg border border-gray-200">
      <table className="min-w-full divide-y divide-gray-300">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((col, idx) => (
              <th
                key={idx}
                scope="col"
                className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
              >
                {col.header}
              </th>
            ))}
            {(onEdit || onDelete) && (
              <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6 whitespace-nowrap w-24">
                <span className="sr-only">Actions</span>
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {data.length > 0 ? (
            data.map((row, idx) => (
              <tr key={idx} className="hover:bg-gray-50 transition-colors">
                {columns.map((col, colIdx) => (
                  <td key={colIdx} className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                    {row[col.accessor]}
                  </td>
                ))}
                {(onEdit || onDelete) && (
                  <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                    <div className="flex justify-end gap-2">
                      {onEdit && (
                        <button
                          onClick={() => onEdit(row)}
                          className="text-teal-600 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 px-2 py-1 rounded-md transition-colors"
                        >
                          Edit
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={() => onDelete(row)}
                          className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-2 py-1 rounded-md transition-colors"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length + (onEdit || onDelete ? 1 : 0)} className="py-8 text-center text-sm text-gray-500">
                No records found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
