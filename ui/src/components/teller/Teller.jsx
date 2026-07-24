// Updated Teller.jsx - remove useSession and activeModule references
import React, { useState, useEffect } from 'react';
import { DollarSign, Filter, Download, Calendar, Clock, ArrowRight } from 'lucide-react';
import MainLayout from '../layout/MainLayout';
import TellerDrawer from './TellerDrawer';
import MemberQuickEdit from './MemberQuickEdit';
import { fetchTransactions } from '../../lib/mock';


export default function Teller() {
  const [showFilters, setShowFilters] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Load transactions from mock API
  useEffect(() => {
    async function loadData() {
      try {
        const data = await fetchTransactions();
        setTransactions(data);
      } catch (error) {
        console.error("Error loading transactions:", error);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadData();
  }, []);
    
  const categories = [
    'All Categories',
    'Deposit',
    'Withdrawal',
    'Loan',
    'Transfer',
    'Fee',
    'Member Service',
    'Shared Branch',
    'Uncategorized'
  ];

  const actionButtons = (
    <>
      <button className="px-3 py-2 text-sm bg-white border border-slate-200 rounded-md hover:border-blue-500 flex items-center">
        <Download size={16} className="mr-1.5" />
        Export Journal
      </button>
      <button className="px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center">
        <DollarSign size={16} className="mr-1.5" />
        New Transaction
      </button>
    </>
  );

  return (
    <MainLayout 
      title="Teller Console" 
      subtitle="Handle transactions for walk-in members"
      actions={actionButtons}
    >
      {/* Teller Drawer Component */}
      <TellerDrawer />
      
      {/* Member Quick Edit Component */}
      <MemberQuickEdit />
      
      {/* Transaction Journal */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Transaction Journal</h2>
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center text-slate-600 bg-white border border-slate-200 rounded-md px-3 py-1.5 text-sm hover:border-blue-500"
            >
              <Filter size={16} className="mr-1.5" />
              Filter
            </button>
            <button className="text-blue-600 text-sm font-medium flex items-center ml-2">
              View all <ArrowRight size={16} className="ml-1" />
            </button>
          </div>
        </div>
        
        {showFilters && (
          <div className="bg-white rounded-lg border border-slate-200 p-4 mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
              <select className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                {categories.map((category, index) => (
                  <option key={index} value={category}>{category}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Date Range</label>
              <div className="flex items-center border border-slate-300 rounded-md overflow-hidden">
                <div className="px-3 py-2 bg-slate-50 text-slate-500">
                  <Calendar size={16} />
                </div>
                <select className="w-full border-0 focus:outline-none focus:ring-0 text-sm py-2">
                  <option value="today">Today</option>
                  <option value="yesterday">Yesterday</option>
                  <option value="this_week">This Week</option>
                  <option value="last_week">Last Week</option>
                  <option value="this_month">This Month</option>
                  <option value="last_month">Last Month</option>
                  <option value="custom">Custom Range</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
              <select className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                <option value="all">All Statuses</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>
        )}
        
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          {isLoading ? (
            <div className="p-6 text-center">
              <div className="animate-spin inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mb-2"></div>
              <div>Loading transactions...</div>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Member</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Type</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Category</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Date</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-slate-500">Amount</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(transaction => (
                  <tr key={transaction.id} className="border-b border-slate-200 last:border-b-0 hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <div className="font-medium">{transaction.member}</div>
                    </td>
                    <td className="py-3 px-4 text-sm">{transaction.type}</td>
                    <td className="py-3 px-4 text-sm">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-800">
                        {transaction.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-500 whitespace-nowrap">
                      <div className="flex items-center">
                        <Clock size={14} className="mr-1.5 text-slate-400" />
                        {transaction.date}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-medium whitespace-nowrap">
                      <span className={transaction.amount.startsWith('+') ? 'text-green-600' : 'text-slate-800'}>
                        {transaction.amount}
                      </span>
                      {transaction.status === 'pending' && (
                        <span className="ml-2 text-xs font-medium bg-yellow-100 text-yellow-800 py-0.5 px-1.5 rounded">Pending</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button className="text-blue-600 text-sm font-medium hover:text-blue-800">Details</button>
                      {transaction.date.includes('Today') && (
                        <button className="text-red-600 text-sm font-medium hover:text-red-800 ml-3">Reverse</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <div className="bg-slate-50 px-4 py-3 border-t border-slate-200 flex items-center justify-between">
            <div className="text-sm text-slate-500">Showing {transactions.length} of 243 transactions</div>
            <div className="flex space-x-1">
              <button className="px-3 py-1 border border-slate-300 rounded-md text-sm bg-white">Previous</button>
              <button className="px-3 py-1 border border-blue-500 bg-blue-500 text-white rounded-md text-sm">Next</button>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}