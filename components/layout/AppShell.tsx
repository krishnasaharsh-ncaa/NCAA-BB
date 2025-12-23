'use client';

import React, { useState } from 'react';
import { LeagueOverview } from '@/components/LeagueOverview';
import { TeamDashboard } from '@/components/TeamDashboard';
import { Cone } from 'lucide-react';

export const AppShell: React.FC = () => {
  const [activeTab, setActiveTab] = useState('team');

  const tabs = [
    { id: 'league', label: 'League Trends' },
    { id: 'team', label: 'Team Analysis' },
    { id: 'regression', label: 'Regression Model' },
  ];

  return (
    <div className="min-h-screen bg-white">
      
      {/* ============================================
          TOP NAVIGATION BAR
          ============================================ */}
      <div className="border-b border-slate-200 bg-white sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6">
          
          {/* Brand Row */}
          <div className="h-16 flex items-center border-b border-slate-200">
            <div className="font-bold text-lg tracking-tight flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                <span className="font-black text-white text-sm">HI</span>
              </div>
              <span className="text-slate-900">HoopsIntel</span>
            </div>
          </div>

          {/* Tabs Row */}
          <div className="flex items-center gap-1">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-3 text-sm font-medium transition-all duration-200 border-b-2 ${
                    isActive
                      ? 'text-blue-600 border-blue-600'
                      : 'text-slate-600 border-transparent hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ============================================
          MAIN CONTENT
          ============================================ */}
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
        <div className="max-w-7xl mx-auto px-6 py-8">
          
          {/* Header */}
          <header className="mb-8">
            <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">
              {activeTab === 'league' && 'League Trends'}
              {activeTab === 'team' && 'Team Analysis'}
              {activeTab === 'regression' && 'Regression Model'}
            </h1>
            <p className="text-slate-600 font-medium">
              {activeTab === 'league' && 'Macro-level trends and daily league averages.'}
              {activeTab === 'team' && 'Deep dive into team performance, rosters, and betting trends.'}
              {activeTab === 'regression' && 'Test and refine your predictive models.'}
            </p>
          </header>

          {/* Content */}
          <div className="fade-in">
            {activeTab === 'league' && <LeagueOverview />}
            {activeTab === 'team' && <TeamDashboard />}
            
            {activeTab === 'regression' && (
              <div className="h-96 flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-xl bg-slate-100/50">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
                  <Cone className="h-8 w-8 text-orange-500" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Under Construction</h3>
                <p className="text-slate-600 text-sm mt-1">Check back later for regression tools.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};