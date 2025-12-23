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
    <div className="w-64 bg-white border-r border-slate-200 flex flex-col h-screen fixed left-0 top-0 z-50">
      
      {/* Brand Area */}
      <div className="h-16 flex items-center px-6 border-b border-slate-200">
        <div className="font-bold text-lg tracking-tight flex items-center gap-3 text-slate-900">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
            <span className="font-black text-white text-sm">HI</span>
          </div>
          <span>HoopsIntel</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 px-3 space-y-1">
        <p className="px-3 text-[10px] font-bold uppercase text-slate-500 mb-4 tracking-wider">Analytics</p>
        
        {NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;
          
          return (
            <button
              key={item.id}
              onClick={() => onChange(item.id)}
              className={`w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 gap-3 ${
                isActive 
                  ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer / User Profile */}
      <div className="p-4 border-t border-slate-200">
        <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
          <div className="w-8 h-8 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center">
            <User className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-900">Admin User</p>
            <p className="text-[10px] text-slate-500">Pro License</p>
          </div>
        </div>
      </div>
    </div>
  );
};