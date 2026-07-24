// src/pages/lending.jsx
import React from 'react';
import MainLayout from '../components/layout/MainLayout';
import { FileText } from 'lucide-react';

export default function Lending() {
  const actionButtons = (
    <button className="px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center">
      <FileText size={16} className="mr-1.5" />
      New Loan
    </button>
  );

  return (
    <MainLayout 
      title="Lending" 
      subtitle="Process and manage loans and credit applications"
      actions={actionButtons}
    >
      <div className="bg-white rounded-lg p-6 border border-slate-200">
        <h2 className="text-lg font-semibold mb-4">Lending Module</h2>
        <p className="text-slate-600">This module is under development. Coming soon!</p>
        
        {/* Placeholder content */}
        <div className="mt-4 p-4 bg-green-50 text-green-700 rounded-md">
          <p>The Lending module will allow you to:</p>
          <ul className="list-disc ml-6 mt-2 space-y-1">
            <li>Create and process new loan applications</li>
            <li>Manage existing loans and credit lines</li>
            <li>Handle loan approvals and underwriting</li>
            <li>Process payments and adjustments</li>
          </ul>
        </div>
      </div>
    </MainLayout>
  );
}