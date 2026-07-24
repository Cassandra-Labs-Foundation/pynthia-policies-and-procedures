// src/components/teller/TellerDrawer.jsx
import React, { useState } from 'react';
import { DollarSign, ArrowUpCircle, ArrowDownCircle, RotateCcw } from 'lucide-react';
import { useSession } from '../../lib/context/SessionContext';

export default function TellerDrawer() {
  const { tellerDrawer, setTellerDrawer } = useSession();
  const [showBuySellModal, setShowBuySellModal] = useState(false);
  const [transactionType, setTransactionType] = useState('');
  const [amount, setAmount] = useState('');

  const handleTransaction = (type) => {
    setTransactionType(type);
    setAmount('');
    setShowBuySellModal(true);
  };

  const handleSubmitTransaction = () => {
    const numAmount = parseFloat(amount);
    
    if (isNaN(numAmount) || numAmount <= 0) {
      return; // Simple validation
    }
    
    let newBalance = tellerDrawer.balance;
    
    if (transactionType === 'buy') {
      newBalance += numAmount;
    } else if (transactionType === 'sell') {
      // Prevent selling more than available
      if (numAmount > tellerDrawer.balance) {
        return;
      }
      newBalance -= numAmount;
    }
    
    setTellerDrawer({
      ...tellerDrawer,
      balance: newBalance,
      lastTransaction: {
        type: transactionType,
        amount: numAmount,
        timestamp: new Date().toISOString()
      }
    });
    
    setShowBuySellModal(false);
  };

  return (
    <>
      <div className="bg-white rounded-lg p-4 border border-slate-200 mb-6">
        <div className="flex items-center mb-3">
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 mr-3">
            <DollarSign size={20} />
          </div>
          <h2 className="text-lg font-semibold">Teller Drawer</h2>
        </div>
        
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-sm text-slate-500">Current Balance</div>
            <div className="text-2xl font-bold text-slate-800">${tellerDrawer.balance.toFixed(2)}</div>
          </div>
          <div className="flex items-center">
            <div className="text-xs text-slate-500 mr-2">
              Last balanced: {new Date(tellerDrawer.lastBalanced).toLocaleString()}
            </div>
            <div className={`w-2 h-2 rounded-full ${
              tellerDrawer.isOpen ? 'bg-green-500' : 'bg-red-500'
            }`}></div>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <button 
            onClick={() => handleTransaction('buy')}
            className="flex-1 px-3 py-2 bg-green-50 text-green-700 rounded-md text-sm font-medium hover:bg-green-100 flex items-center justify-center"
          >
            <ArrowDownCircle size={16} className="mr-1.5" />
            Buy Cash
          </button>
          <button 
            onClick={() => handleTransaction('sell')}
            className="flex-1 px-3 py-2 bg-blue-50 text-blue-700 rounded-md text-sm font-medium hover:bg-blue-100 flex items-center justify-center"
          >
            <ArrowUpCircle size={16} className="mr-1.5" />
            Sell Cash
          </button>
          <button 
            className="flex-1 px-3 py-2 bg-purple-50 text-purple-700 rounded-md text-sm font-medium hover:bg-purple-100 flex items-center justify-center"
          >
            <RotateCcw size={16} className="mr-1.5" />
            Balance Drawer
          </button>
        </div>
      </div>
      
      {/* Simple Modal for Buy/Sell Cash */}
      {showBuySellModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              {transactionType === 'buy' ? 'Buy Cash from Vault' : 'Sell Cash to Vault'}
            </h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">Amount</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-slate-500">$</span>
                </div>
                <input
                  type="text"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-7 w-full border border-slate-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowBuySellModal(false)}
                className="flex-1 px-3 py-2 border border-slate-300 text-slate-700 rounded-md text-sm font-medium hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitTransaction}
                className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}