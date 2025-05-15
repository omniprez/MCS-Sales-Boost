import React from 'react';
import { formatCurrency } from '../lib/utils';

export default function CurrencyTest() {
  const testValues = [
    100,
    1000,
    5500,
    10000,
    100000,
    1000000,
    1500000
  ];

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Currency Format Test</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold mb-4">Test Values</h2>
        
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2 text-left">Original Value</th>
              <th className="border p-2 text-left">Formatted Value</th>
            </tr>
          </thead>
          <tbody>
            {testValues.map((value, index) => (
              <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                <td className="border p-2">{value}</td>
                <td className="border p-2 font-medium">{formatCurrency(value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
