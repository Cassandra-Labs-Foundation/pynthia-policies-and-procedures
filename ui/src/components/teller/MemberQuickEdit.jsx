// src/components/teller/MemberQuickEdit.jsx
import React, { useState } from 'react';
import { Search, X, CreditCard, DollarSign, User, AlertCircle } from 'lucide-react';
import { fetchAccounts, searchMembers } from '../../lib/api';

export default function MemberQuickEdit() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [member, setMember] = useState(null);
  const [memberAccounts, setMemberAccounts] = useState([]);
  const [error, setError] = useState('');
  const [selectedTab, setSelectedTab] = useState('info');
  const [transactionType, setTransactionType] = useState('deposit');
  const [transactionAmount, setTransactionAmount] = useState('');

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;

    setIsLoading(true);
    setError('');

    try {
      const matches = await searchMembers(searchTerm);

      if (matches.length === 0) {
        setError('No member found matching your search');
        return;
      }

      const found = matches[0];
      setMember(found);
      setIsOpen(true);

      // The member -> accounts walk, which is what GET /accounts?entity_id=
      // exists for. Its own failure must not clear the member we just found,
      // so the accounts list empties and the rest of the panel stands.
      try {
        setMemberAccounts(await fetchAccounts({ entityId: found.id }));
      } catch (accountsError) {
        console.error('Error loading member accounts:', accountsError);
        setMemberAccounts([]);
      }
    } catch (searchError) {
      setError(searchError.message || 'Error searching for member');
      console.error(searchError);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleTransaction = () => {
    // Reads are wired to the core; writes are not. The proxy in
    // pages/api/core/ is read-only by design, so this form has nowhere to post
    // yet — and now that the panel around it shows REAL member and account
    // records, a "processed successfully" alert would be a false confirmation
    // sitting next to true data. It says what actually happened instead.
    alert(
      `Not submitted. The ${transactionType} form is not wired to POST /transfers yet — ` +
      `this panel is read-only.`
    );
    setTransactionAmount('');
  };

  return (
    <div>
      {/* Member Search */}
      <div className="bg-white rounded-lg p-4 border border-slate-200 mb-6">
        <h2 className="text-lg font-semibold mb-3">Quick Member Lookup</h2>
        <div className="flex items-center">
          <div className="relative flex-grow mr-3">
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter member name, ID, or account number..." 
              className="pl-10 pr-4 py-2 border border-slate-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          <button 
            onClick={handleSearch}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'Searching...' : 'Find'}
          </button>
        </div>
        {error && (
          <div className="mt-2 text-sm text-red-600 flex items-center">
            <AlertCircle size={14} className="mr-1" />
            {error}
          </div>
        )}
      </div>
      
      {/* Member Quick Edit Modal */}
      {isOpen && member && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-3xl overflow-hidden">
            {/* Modal Header */}
            <div className="bg-blue-600 text-white px-6 py-4 flex justify-between items-center">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-white text-blue-600 flex items-center justify-center mr-3">
                  <User size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{member.name}</h3>
                  <div className="text-sm text-blue-100">Member ID: {member.id} • Since {new Date(member.joinDate).toLocaleDateString()}</div>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-white hover:text-blue-200"
              >
                <X size={24} />
              </button>
            </div>
            
            {/* Modal Tabs */}
            <div className="bg-slate-100 px-6 border-b border-slate-200">
              <div className="flex">
                <button 
                  onClick={() => setSelectedTab('info')}
                  className={`py-3 px-4 text-sm font-medium ${
                    selectedTab === 'info' 
                      ? 'text-blue-600 border-b-2 border-blue-600' 
                      : 'text-slate-600 hover:text-blue-600'
                  }`}
                >
                  Account Info
                </button>
                <button 
                  onClick={() => setSelectedTab('transaction')}
                  className={`py-3 px-4 text-sm font-medium ${
                    selectedTab === 'transaction' 
                      ? 'text-blue-600 border-b-2 border-blue-600' 
                      : 'text-slate-600 hover:text-blue-600'
                  }`}
                >
                  Quick Transaction
                </button>
                <button 
                  onClick={() => setSelectedTab('history')}
                  className={`py-3 px-4 text-sm font-medium ${
                    selectedTab === 'history' 
                      ? 'text-blue-600 border-b-2 border-blue-600' 
                      : 'text-slate-600 hover:text-blue-600'
                  }`}
                >
                  Transaction History
                </button>
              </div>
            </div>
            
            {/* Modal Content */}
            <div className="p-6">
              {/* Account Info Tab */}
              {selectedTab === 'info' && (
                <div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <h4 className="text-sm font-medium text-slate-500 mb-2">Contact Information</h4>
                      <div className="bg-slate-50 p-3 rounded-md border border-slate-200">
                        <div className="mb-2">
                          <div className="text-xs text-slate-500">Email</div>
                          <div className="text-sm">{member.email}</div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-500">Phone</div>
                          {/* core.entity holds no phone number — see lib/api.js */}
                          <div className="text-sm">{member.phone || 'Not on file'}</div>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-slate-500 mb-2">Member Status</h4>
                      <div className="bg-slate-50 p-3 rounded-md border border-slate-200">
                        <div className="flex items-center">
                          <div className={`w-2 h-2 rounded-full mr-2 ${
                            member.status === 'active' ? 'bg-green-500' : 'bg-red-500'
                          }`}></div>
                          <span className="text-sm capitalize">{member.status}</span>
                        </div>
                        <div className="text-xs text-slate-500 mt-2 capitalize">
                          {member.type}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <h4 className="text-sm font-medium text-slate-500 mb-2">Accounts</h4>
                  <div className="bg-slate-50 rounded-md border border-slate-200 overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-200">
                          <th className="text-left py-2 px-3 text-xs font-medium text-slate-500">Account</th>
                          {/* the issued routing/account-number pair lives behind
                              GET /accounts/{id}/numbers — a per-row call this
                              panel does not make, so the id stands in for it */}
                          <th className="text-left py-2 px-3 text-xs font-medium text-slate-500">Status</th>
                          <th className="text-left py-2 px-3 text-xs font-medium text-slate-500">Type</th>
                          <th className="text-right py-2 px-3 text-xs font-medium text-slate-500">Balance</th>
                          <th className="text-right py-2 px-3 text-xs font-medium text-slate-500">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {memberAccounts.length === 0 && (
                          <tr>
                            <td colSpan={5} className="py-3 px-3 text-sm text-slate-500 text-center">
                              No accounts for this member.
                            </td>
                          </tr>
                        )}
                        {memberAccounts.map(account => (
                          <tr key={account.id} className="border-b border-slate-200 last:border-b-0">
                            <td className="py-2 px-3 text-sm font-mono text-xs">{account.id}</td>
                            <td className="py-2 px-3 text-sm capitalize">{account.status}</td>
                            <td className="py-2 px-3 text-sm capitalize">{account.type}</td>
                            <td className="py-2 px-3 text-sm text-right">{account.balance}</td>
                            <td className="py-2 px-3 text-right">
                              <button className="text-blue-600 text-xs font-medium">Details</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              
              {/* Quick Transaction Tab */}
              {selectedTab === 'transaction' && (
                <div>
                  <h4 className="text-sm font-medium text-slate-500 mb-4">Process a Transaction</h4>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Transaction Type</label>
                    <div className="flex space-x-2">
                      <label className="relative flex items-center">
                        <input
                          type="radio"
                          name="transactionType"
                          value="deposit"
                          checked={transactionType === 'deposit'}
                          onChange={() => setTransactionType('deposit')}
                          className="sr-only"
                        />
                        <div className={`px-4 py-2 rounded-md text-sm cursor-pointer ${
                          transactionType === 'deposit' 
                            ? 'bg-green-100 text-green-800 border border-green-300' 
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          Deposit
                        </div>
                      </label>
                      <label className="relative flex items-center">
                        <input
                          type="radio"
                          name="transactionType"
                          value="withdrawal"
                          checked={transactionType === 'withdrawal'}
                          onChange={() => setTransactionType('withdrawal')}
                          className="sr-only"
                        />
                        <div className={`px-4 py-2 rounded-md text-sm cursor-pointer ${
                          transactionType === 'withdrawal' 
                            ? 'bg-blue-100 text-blue-800 border border-blue-300' 
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          Withdrawal
                        </div>
                      </label>
                      <label className="relative flex items-center">
                        <input
                          type="radio"
                          name="transactionType"
                          value="transfer"
                          checked={transactionType === 'transfer'}
                          onChange={() => setTransactionType('transfer')}
                          className="sr-only"
                        />
                        <div className={`px-4 py-2 rounded-md text-sm cursor-pointer ${
                          transactionType === 'transfer' 
                            ? 'bg-purple-100 text-purple-800 border border-purple-300' 
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          Transfer
                        </div>
                      </label>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Account</label>
                    <select className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                      {memberAccounts.map(account => (
                        <option key={account.id} value={account.id}>
                          {account.id} ({account.type}) - {account.balance}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Amount</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-slate-500">$</span>
                      </div>
                      <input
                        type="text"
                        value={transactionAmount}
                        onChange={(e) => setTransactionAmount(e.target.value)}
                        className="pl-7 w-full border border-slate-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <button
                      onClick={handleTransaction}
                      disabled={!transactionAmount}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                    >
                      Process Transaction
                    </button>
                  </div>
                </div>
              )}
              
              {/* Transaction History Tab */}
              {selectedTab === 'history' && (
                <div>
                  <h4 className="text-sm font-medium text-slate-500 mb-4">Recent Transactions</h4>
                  
                  <div className="bg-slate-50 rounded-md border border-slate-200 overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-200">
                          <th className="text-left py-2 px-3 text-xs font-medium text-slate-500">Date</th>
                          <th className="text-left py-2 px-3 text-xs font-medium text-slate-500">Description</th>
                          <th className="text-left py-2 px-3 text-xs font-medium text-slate-500">Account</th>
                          <th className="text-right py-2 px-3 text-xs font-medium text-slate-500">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-slate-200">
                          <td className="py-2 px-3 text-sm">Today, 10:45 AM</td>
                          <td className="py-2 px-3 text-sm">Deposit</td>
                          <td className="py-2 px-3 text-sm">Primary Checking</td>
                          <td className="py-2 px-3 text-sm text-green-600 text-right">+$350.00</td>
                        </tr>
                        <tr className="border-b border-slate-200">
                          <td className="py-2 px-3 text-sm">Yesterday</td>
                          <td className="py-2 px-3 text-sm">ATM Withdrawal</td>
                          <td className="py-2 px-3 text-sm">Primary Checking</td>
                          <td className="py-2 px-3 text-sm text-slate-800 text-right">-$80.00</td>
                        </tr>
                        <tr className="border-b border-slate-200">
                          <td className="py-2 px-3 text-sm">May 12, 2025</td>
                          <td className="py-2 px-3 text-sm">Loan Payment</td>
                          <td className="py-2 px-3 text-sm">Auto Loan</td>
                          <td className="py-2 px-3 text-sm text-slate-800 text-right">-$325.50</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3 text-sm">May 10, 2025</td>
                          <td className="py-2 px-3 text-sm">Transfer to Savings</td>
                          <td className="py-2 px-3 text-sm">Primary Checking</td>
                          <td className="py-2 px-3 text-sm text-slate-800 text-right">-$500.00</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="mt-4 text-right">
                    <button className="text-blue-600 text-sm font-medium">View Full History</button>
                  </div>
                </div>
              )}
            </div>
            
            {/* Modal Footer */}
            <div className="bg-slate-100 px-6 py-4 border-t border-slate-200 flex justify-between">
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-md text-sm font-medium hover:bg-slate-200"
              >
                Close
              </button>
              <div className="space-x-2">
                <button className="px-4 py-2 border border-slate-300 text-slate-700 rounded-md text-sm font-medium hover:bg-slate-200">
                  Edit Member
                </button>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700">
                  View Full Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}