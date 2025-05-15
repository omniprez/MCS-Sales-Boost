import React from 'react';
import { formatCurrency } from '../lib/currency';

export default function TestCurrency() {
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
    <div className="p-4 border rounded">
      <h2 className="text-lg font-bold mb-4">Currency Format Test</h2>
      <div className="space-y-2">
        {testValues.map((value, index) => (
          <div key={index} className="flex justify-between">
            <span>Original: {value}</span>
            <span>Formatted: {formatCurrency(value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
