// src/pages/accounting.jsx
import React from 'react';
import MainLayout from '../components/layout/MainLayout';
import { BarChart2 } from 'lucide-react';

export default function Accounting() {
  const actionButtons = (
    <button className="px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center">
      <BarChart2 size={16} className="mr-1.5" />
      New Entry
    </button>
  );

  return (
    <MainLayout 
      title="Accounting" 
      subtitle="Manage general ledger and financial operations"
      actions={actionButtons}
    >
      <div className="bg-white rounded-lg p-6 border border-slate-200">
        <h2 className="text-lg font-semibold mb-4">Accounting Module</h2>
        <p className="text-slate-600">This module is under development. Coming soon!</p>
        
        {/* Placeholder content */}
        <div className="mt-4 p-4 bg-purple-50 text-purple-700 rounded-md">
          <p>The Accounting module will allow you to:</p>
          <ul className="list-disc ml-6 mt-2 space-y-1">
            <li>Manage general ledger entries</li>
            <li>Process adjustments and corrections</li>
            <li>Generate financial reports and statements</li>
            <li>Track financial performance and metrics</li>
          </ul>
        </div>
      </div>
    </MainLayout>
  );
}