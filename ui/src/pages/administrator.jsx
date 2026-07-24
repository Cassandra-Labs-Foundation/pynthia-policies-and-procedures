// src/pages/administrator.jsx
import React from 'react';
import MainLayout from '../components/layout/MainLayout';
import { Shield } from 'lucide-react';

export default function Administrator() {
  const actionButtons = (
    <button className="px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center">
      <Shield size={16} className="mr-1.5" />
      Add User
    </button>
  );

  return (
    <MainLayout 
      title="Administrator" 
      subtitle="Manage system settings, users, and permissions"
      actions={actionButtons}
    >
      <div className="bg-white rounded-lg p-6 border border-slate-200">
        <h2 className="text-lg font-semibold mb-4">Administrator Module</h2>
        <p className="text-slate-600">This module is under development. Coming soon!</p>
        
        {/* Placeholder content */}
        <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-md">
          <p>The Administrator module will allow you to:</p>
          <ul className="list-disc ml-6 mt-2 space-y-1">
            <li>Manage users and roles</li>
            <li>Configure system settings and preferences</li>
            <li>Monitor system activity and logs</li>
            <li>Manage security and access controls</li>
          </ul>
        </div>
      </div>
    </MainLayout>
  );
}