// src/pages/reports.jsx
import React from 'react';
import MainLayout from '../components/layout/MainLayout';
import { Download } from 'lucide-react';

export default function Reports() {
  const actionButtons = (
    <button className="px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center">
      <Download size={16} className="mr-1.5" />
      Export Reports
    </button>
  );

  return (
    <MainLayout 
      title="Reports" 
      subtitle="Generate and view regulatory and operational reports"
      actions={actionButtons}
    >
      <div className="bg-white rounded-lg p-6 border border-slate-200">
        <h2 className="text-lg font-semibold mb-4">Reports Module</h2>
        <p className="text-slate-600">This module is under development. Coming soon!</p>
        
        {/* Placeholder content */}
        <div className="mt-4 p-4 bg-amber-50 text-amber-700 rounded-md">
          <p>The Reports module will allow you to:</p>
          <ul className="list-disc ml-6 mt-2 space-y-1">
            <li>Generate regulatory reports (5300, BSA, etc.)</li>
            <li>Create operational dashboards and analytics</li>
            <li>Export data for compliance and auditing</li>
            <li>Schedule automated report generation</li>
          </ul>
        </div>
      </div>
    </MainLayout>
  );
}