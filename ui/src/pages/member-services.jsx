// src/pages/member-services.jsx
import React from 'react';
import MainLayout from '../components/layout/MainLayout';
import { Users } from 'lucide-react';

export default function MemberServices() {
  const actionButtons = (
    <button className="px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center">
      <Users size={16} className="mr-1.5" />
      New Member
    </button>
  );

  return (
    <MainLayout 
      title="Member Services" 
      subtitle="Manage member accounts and information"
      actions={actionButtons}
    >
      <div className="bg-white rounded-lg p-6 border border-slate-200">
        <h2 className="text-lg font-semibold mb-4">Member Services Module</h2>
        <p className="text-slate-600">This module is under development. Coming soon!</p>
        
        {/* Placeholder content */}
        <div className="mt-4 p-4 bg-blue-50 text-blue-700 rounded-md">
          <p>The Member Services module will allow you to:</p>
          <ul className="list-disc ml-6 mt-2 space-y-1">
            <li>Create and manage member accounts</li>
            <li>Process member requests and inquiries</li>
            <li>Update member information and profiles</li>
            <li>Manage account settings and preferences</li>
          </ul>
        </div>
      </div>
    </MainLayout>
  );
}