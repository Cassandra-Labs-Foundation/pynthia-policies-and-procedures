// src/lib/context/SessionContext.jsx
import React, { createContext, useContext, useState } from 'react';
import { initialTellerDrawer } from '../mock';

// Create the context
const SessionContext = createContext(null);

// Provider component that wraps your app and makes session available to any child component
export function SessionProvider({ children }) {
  // User information state
  const [user, setUser] = useState({
    id: '001',
    name: 'Sarah Thompson',
    role: 'Teller',
    branch: 'Main Office',
    permissions: ['teller.transactions', 'members.read', 'reports.basic']
  });
  
  // Teller drawer state
  const [tellerDrawer, setTellerDrawer] = useState(initialTellerDrawer);

  // App-wide notifications
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'system',
      message: 'System maintenance scheduled for May 5, 2025',
      read: false,
      date: '2025-05-14T08:30:00Z'
    }
  ]);

  // Active module tracking
  const [activeModule, setActiveModule] = useState('home');

  // Session value to be provided to consumers
  const value = {
    // User context
    user,
    setUser,
    
    // Teller drawer context
    tellerDrawer,
    setTellerDrawer,
    
    // Notifications context
    notifications,
    setNotifications,
    
    // Navigation context
    activeModule,
    setActiveModule,
    
    // Helper functions
    hasPermission: (permission) => user.permissions.includes(permission),
    addNotification: (notification) => {
      setNotifications(prev => [
        ...prev, 
        { 
          id: Date.now(), 
          read: false,
          date: new Date().toISOString(),
          ...notification
        }
      ]);
    },
    markNotificationRead: (id) => {
      setNotifications(prev => 
        prev.map(note => 
          note.id === id ? { ...note, read: true } : note
        )
      );
    },
    clearNotifications: () => setNotifications([])
  };

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
}

// Custom hook to use the session context
export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}