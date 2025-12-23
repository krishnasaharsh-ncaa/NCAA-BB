'use client';

import React from 'react';
import { LayoutDashboard, LineChart, BrainCircuit, User } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onChange: (id: string) => void;
}

const NAV_ITEMS = [
  { id: 'league', label: 'League Trends', icon: LineChart },
  { id: 'team',   label: 'Team Analysis', icon: LayoutDashboard },
  { id: 'regression', label: 'Regression Model', icon: BrainCircuit },
];

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onChange }) => {
  return (
    <div className="w-64 bg-slate-900 text-slate-300 flex flex-col h-screen fixed left-0 top-0 border-r border-slate-800 z-50">
      {/* Brand Area */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
        <div className="font-bold text-lg tracking-tight flex items-center gap-2 text-white">
          <div className="w-6 h-6 bg-blue-600 rounded-md flex items-center justify-center">
            <span className="font-bold text-xs text-white">HI</span>
          </div>
          <span>HoopsIntel</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 px-3 space-y-1">
        <p className="px-3 text-[10px] font-bold uppercase text-slate-500 mb-2 tracking-wider">Analytics</p>
        {NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;
          
          return (
            <button
              key={item.id}
              onClick={() => onChange(item.id)}
              className={`
                w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 group
                ${isActive 
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'}
              `}
            >
              <Icon 
                className={`mr-3 h-4 w-4 transition-colors ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-white'}`} 
              />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Footer / User Profile */}
      <div className="p-4 border-t border-slate-800 bg-slate-900/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400">
            <User className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs font-medium text-white">Admin User</p>
            <p className="text-[10px] text-slate-500">Pro License</p>
          </div>
        </div>
      </div>
    </div>
  );
};