// Updated Dashboard.jsx - remove useSession and activeModule references
import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  ArrowRight, 
  Bell, 
  DollarSign, 
  BarChart2, 
  Users, 
  FileText, 
  HelpCircle,
  RefreshCw,
  Download
} from 'lucide-react';
import MainLayout from '../layout/MainLayout';
import { fetchAccounts, fetchTransactions } from '../../lib/mock';

export default function Dashboard() {
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Load data from mock API
  useEffect(() => {
    async function loadData() {
      try {
        const [accountsData, transactionsData] = await Promise.all([
          fetchAccounts(),
          fetchTransactions()
        ]);
        
        setAccounts(accountsData);
        setTransactions(transactionsData);
      } catch (error) {
        console.error("Error loading dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadData();
  }, []);
    
  const quickActions = [
    { id: 1, name: 'New Member', icon: <Users size={20} /> },
    { id: 2, name: 'Process Loan', icon: <FileText size={20} /> },
    { id: 3, name: 'Cash Drawer', icon: <DollarSign size={20} /> },
    { id: 4, name: 'Reports', icon: <BarChart2 size={20} /> }
  ];

  // Header action buttons
  const actionButtons = (
    <>
      <button className="px-3 py-2 text-sm bg-white border border-slate-200 rounded-md hover:border-blue-500 flex items-center">
        <Download size={16} className="mr-1.5" />
        Export Data
      </button>
      <button className="px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center">
        <DollarSign size={16} className="mr-1.5" />
        New Transaction
      </button>
    </>
  );

  return (
    <MainLayout 
      title="Dashboard" 
      subtitle="Welcome back. Here's what's happening today."
      actions={actionButtons}
    >
      {/* System Alert */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6 flex items-center">
        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
          <Bell size={18} className="text-blue-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-medium text-blue-800">System Maintenance Scheduled</h3>
          <p className="text-sm text-blue-600">A system update is scheduled for May 5, 2025, from 2:00 AM to 4:00 AM ET.</p>
        </div>
        <button className="text-blue-600 px-3 py-1 text-sm">Dismiss</button>
      </div>
      
      {/* Quick Action Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {quickActions.map(action => (
          <button 
            key={action.id}
            className="bg-white rounded-lg p-4 border border-slate-200 hover:border-blue-500 hover:shadow-sm transition-all flex flex-col items-center justify-center h-24"
          >
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 mb-2">
              {action.icon}
            </div>
            <span className="text-sm font-medium">{action.name}</span>
          </button>
        ))}
      </div>
      
      {/* Accounts Section */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Accounts</h2>
          <div className="flex items-center space-x-3">
            <button className="px-3 py-1.5 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700">
              + New Account
            </button>
            <button className="text-blue-600 text-sm font-medium flex items-center">
              View all <ArrowRight size={16} className="ml-1" />
            </button>
          </div>
        </div>
        
        {isLoading ? (
          <div className="p-6 text-center bg-white rounded-lg border border-slate-200">
            <div className="animate-spin inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mb-2"></div>
            <div>Loading accounts...</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {accounts.map(account => (
              <div key={account.id} className="bg-white rounded-lg border border-slate-200 overflow-hidden hover:border-blue-300 hover:shadow-sm transition-all">
                <div className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center">
                      <span className={`inline-block w-3 h-3 rounded-full mr-2 ${
                        account.type === 'loan' ? 'bg-purple-500' : 
                        account.type === 'savings' ? 'bg-green-500' : 
                        'bg-blue-500'
                      }`}></span>
                      <div className="text-sm text-slate-500 capitalize">{account.type === 'loan' ? 'Loan Fund' : account.type === 'savings' ? 'Savings' : 'Checking'}</div>
                    </div>
                    <CreditCard size={18} className="text-slate-400" />
                  </div>
                  <div className="font-semibold text-xl mb-2">{account.balance}</div>
                  <div className="text-sm truncate text-slate-700">{account.name}</div>
                </div>
                <div className="flex border-t border-slate-200">
                  <button className="flex-1 text-center py-2.5 text-sm font-medium text-blue-600 hover:bg-blue-50 border-r border-slate-200">
                    Transfer
                  </button>
                  <button className="flex-1 text-center py-2.5 text-sm font-medium text-blue-600 hover:bg-blue-50">
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Recent Transactions Section */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Recent Transactions</h2>
          <button className="text-blue-600 text-sm font-medium flex items-center">
            View all <ArrowRight size={16} className="ml-1" />
          </button>
        </div>
        
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
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Date</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-slate-500">Amount</th>
                </tr>
              </thead>
              <tbody>
                {transactions.slice(0, 5).map(transaction => (
                  <tr key={transaction.id} className="border-b border-slate-200 last:border-b-0 hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <div className="font-medium">{transaction.member}</div>
                    </td>
                    <td className="py-3 px-4 text-sm">{transaction.type}</td>
                    <td className="py-3 px-4 text-sm text-slate-500">{transaction.date}</td>
                    <td className="py-3 px-4 text-right font-medium">
                      <span className={transaction.amount.startsWith('+') ? 'text-green-600' : 'text-slate-800'}>
                        {transaction.amount}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      
      {/* Footer Help Section */}
      <div className="mt-8 pt-6 border-t border-slate-200">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-8">
            <button className="flex items-center text-slate-600 hover:text-blue-600">
              <HelpCircle size={18} className="mr-2" />
              <span className="text-sm">Help Center</span>
            </button>
            <button className="flex items-center text-slate-600 hover:text-blue-600">
              <RefreshCw size={18} className="mr-2" />
              <span className="text-sm">Sync Accounts</span>
            </button>
          </div>
          <div>
            <span className="text-xs text-slate-500">Last updated: Today at 3:45 PM</span>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}