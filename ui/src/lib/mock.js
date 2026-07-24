// src/lib/mock.js

// Mock latency for simulating API calls
export const MOCK_LATENCY_MS = 800;

// Mock accounts data
export const mockAccounts = [
  { id: 1, name: 'Main Credit Union Account', balance: '$58,239.45', type: 'checking' },
  { id: 2, name: 'Business Savings', balance: '$125,873.21', type: 'savings' },
  { id: 3, name: 'Member Loan Fund', balance: '$432,950.00', type: 'loan' }
];

// Mock transactions data
export const mockTransactions = [
  { id: 1, member: 'James Wilson', type: 'Deposit', amount: '+$1,250.00', date: 'Today, 2:34 PM', status: 'completed', category: 'Deposit' },
  { id: 2, member: 'Sarah Johnson', type: 'Withdrawal', amount: '-$350.00', date: 'Today, 11:15 AM', status: 'completed', category: 'Member Service' },
  { id: 3, member: 'Mountain View LLC', type: 'Loan Payment', amount: '-$2,430.15', date: 'Yesterday', status: 'completed', category: 'Loan' },
  { id: 4, member: 'Robert Chen', type: 'Transfer', amount: '-$500.00', date: 'Yesterday', status: 'pending', category: 'Transfer' },
  { id: 5, member: 'Emma Garcia', type: 'Fee', amount: '-$25.00', date: 'Apr 28, 2025', status: 'completed', category: 'Fee' },
  { id: 6, member: 'Northwest Credit Union', type: 'ACH Transfer', amount: '-$756.33', date: 'Apr 27, 2025', status: 'completed', category: 'Shared Branch' }
];

// Mock members data
export const mockMembers = [
  { 
    id: '001', 
    name: 'James Wilson', 
    email: 'jwilson@example.com',
    phone: '(555) 123-4567',
    joinDate: '2023-03-15',
    accounts: [1],
    status: 'active'
  },
  { 
    id: '002', 
    name: 'Sarah Johnson', 
    email: 'sjohnson@example.com',
    phone: '(555) 987-6543',
    joinDate: '2020-11-22',
    accounts: [4, 5],
    status: 'active'
  },
  { 
    id: '003', 
    name: 'Mountain View LLC', 
    email: 'contact@mountainview.example',
    phone: '(555) 765-4321',
    joinDate: '2021-06-30',
    accounts: [6, 7, 8],
    status: 'active',
    type: 'business'
  },
  { 
    id: '004', 
    name: 'Robert Chen', 
    email: 'rchen@example.com',
    phone: '(555) 234-5678',
    joinDate: '2019-09-14',
    accounts: [9],
    status: 'active'
  },
  { 
    id: '005', 
    name: 'Emma Garcia', 
    email: 'egarcia@example.com',
    phone: '(555) 876-5432',
    joinDate: '2022-01-07',
    accounts: [10, 11],
    status: 'active'
  }
];

// Mock API functions - simulates backend calls with Promise delays

// Fetch all accounts
export async function fetchAccounts() {
  await new Promise(resolve => setTimeout(resolve, MOCK_LATENCY_MS));
  return [...mockAccounts];
}

// Fetch specific account
export async function fetchAccount(accountId) {
  await new Promise(resolve => setTimeout(resolve, MOCK_LATENCY_MS));
  const account = mockAccounts.find(acc => acc.id === accountId);
  return account ? { ...account } : null;
}

// Fetch all transactions
export async function fetchTransactions() {
  await new Promise(resolve => setTimeout(resolve, MOCK_LATENCY_MS));
  return [...mockTransactions];
}

// Fetch transactions for a specific account
export async function fetchAccountTransactions(accountId) {
  await new Promise(resolve => setTimeout(resolve, MOCK_LATENCY_MS));
  // In a real app we'd filter by account ID
  return [...mockTransactions.slice(0, 3)];
}

// Fetch all members
export async function fetchMembers() {
  await new Promise(resolve => setTimeout(resolve, MOCK_LATENCY_MS));
  return [...mockMembers];
}

// Fetch specific member
export async function fetchMember(memberId) {
  await new Promise(resolve => setTimeout(resolve, MOCK_LATENCY_MS));
  const member = mockMembers.find(mem => mem.id === memberId);
  return member ? { ...member } : null;
}

// Create a new transaction
export async function createTransaction(transaction) {
  await new Promise(resolve => setTimeout(resolve, MOCK_LATENCY_MS));
  // In a real app we'd save this to the database
  return {
    id: Math.floor(Math.random() * 10000),
    date: 'Today, ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    status: 'completed',
    ...transaction
  };
}

// Create initial teller drawer state
export const initialTellerDrawer = {
  isOpen: true,
  balance: 5000.00,
  lastBalanced: '2025-05-14T09:00:00Z',
  cashBreakdown: {
    pennies: 500,
    nickels: 200,
    dimes: 300,
    quarters: 500,
    ones: 1000,
    fives: 1000,
    tens: 1000,
    twenties: 2000,
    fifties: 0,
    hundreds: 0
  }
};