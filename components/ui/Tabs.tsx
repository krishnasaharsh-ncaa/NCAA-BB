'use client';

import React from 'react';

interface TabsProps {
  tabs: { id: string; label: string }[];
  activeTab: string;
  onChange: (id: string) => void;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onChange }) => {
  return (
    <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg inline-flex mb-6 border border-gray-200">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`
              px-4 py-2 text-sm font-medium rounded-md transition-all duration-200
              ${isActive 
                ? 'bg-white text-blue-700 shadow-sm border border-gray-200' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'}
            `}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};