// src/components/layout/MainLayout.jsx
import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { 
  Search, 
  Bell, 
  Settings, 
  User, 
  DollarSign, 
  BarChart2, 
  Users, 
  FileText, 
  Shield, 
  Grid, 
  Book, 
  Link as LinkIcon
} from 'lucide-react';
import { useSession } from '../../lib/context/SessionContext';

export default function MainLayout({ children, title, subtitle, actions }) {
  const { user } = useSession();
  const router = useRouter();
  
  // Determine active route from current path
  const currentPath = router.pathname;

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 overflow-hidden">
      {/* Left Sidebar */}
      <div className="w-16 md:w-64 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-4 border-b border-slate-200">
          <div className="font-bold text-xl hidden md:block">Pynthia Banking</div>
          <div className="md:hidden flex justify-center">
            <Shield size={24} className="text-blue-600" />
          </div>
        </div>
        
        <nav className="flex-1 py-6">
          <ul>
            <NavItem 
              href="/"
              icon={<Grid size={20} />} 
              label="Home" 
              active={currentPath === '/'} 
            />
            <NavItem 
              href="/teller"
              icon={<DollarSign size={20} />} 
              label="Teller" 
              active={currentPath === '/teller'} 
            />
            <NavItem 
              href="/member-services"
              icon={<Users size={20} />} 
              label="Member Services" 
              active={currentPath === '/member-services'} 
            />
            <NavItem 
              href="/lending"
              icon={<FileText size={20} />} 
              label="Lending" 
              active={currentPath === '/lending'} 
            />
            <NavItem 
              href="/accounting"
              icon={<BarChart2 size={20} />} 
              label="Accounting" 
              active={currentPath === '/accounting'} 
            />
            <NavItem 
              href="/reports"
              icon={<Book size={20} />} 
              label="Reports" 
              active={currentPath === '/reports'} 
            />
            <NavItem 
              href="/administrator"
              icon={<Shield size={20} />} 
              label="Admin" 
              active={currentPath === '/administrator'} 
            />
          </ul>
        </nav>
        
        <div className="p-4 border-t border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white">
              <User size={16} />
            </div>
            <div className="hidden md:block">
              <div className="font-semibold text-sm">{user.name}</div>
              <div className="text-xs text-slate-500">{user.role}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6">
          <div className="flex items-center space-x-3 w-1/3">
            <div className="relative flex-grow">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search members, accounts, or type / for commands..." 
                className="pl-10 pr-4 py-2 bg-slate-100 rounded-md w-full max-w-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          </div>
          
          <div className="hidden md:flex items-center space-x-1">
            <button className="px-3 py-1.5 text-sm rounded-md hover:bg-slate-100">Accounting</button>
            <button className="px-3 py-1.5 text-sm rounded-md hover:bg-slate-100">Treasury</button>
            <button className="px-3 py-1.5 text-sm rounded-md hover:bg-slate-100">Cards</button>
            <button className="px-3 py-1.5 text-sm rounded-md hover:bg-slate-100">API</button>
          </div>
          
          <div className="flex items-center space-x-4">
            <button className="text-slate-600 hover:text-slate-900 relative">
              <Bell size={20} />
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <button className="text-slate-600 hover:text-slate-900">
              <Settings size={20} />
            </button>
          </div>
        </header>
        
        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6">
          {/* Header Section */}
          <div className="mb-6 flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-semibold mb-2">{title}</h1>
              <p className="text-slate-500">{subtitle}</p>
            </div>
            <div className="flex items-center space-x-3">
              {actions}
            </div>
          </div>
          
          {/* Main Content */}
          {children}
        </main>
      </div>
    </div>
  );
}

// Navigation Item Component
function NavItem({ href, icon, label, active }) {
  return (
    <li className="mb-1">
      <Link href={href} passHref>
        <div
          className={`flex items-center w-full py-2.5 px-4 rounded-md cursor-pointer ${
            active 
              ? 'bg-blue-50 text-blue-600' 
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span className="mr-3">{icon}</span>
          <span className="hidden md:block font-medium text-sm">{label}</span>
        </div>
      </Link>
    </li>
  );
}