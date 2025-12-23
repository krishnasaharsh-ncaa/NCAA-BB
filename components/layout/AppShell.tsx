'use client';

import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { LeagueOverview } from '@/components/LeagueOverview';
import { TeamDashboard } from '@/components/TeamDashboard';
import { Cone } from 'lucide-react';

export const AppShell: React.FC = () => {
  const [activeTab, setActiveTab] = useState('team');

  return (
    // ✅ Change 1: Use bg-slate-50 for a cleaner, "SaaS" grey background
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      
      {/* Sidebar (Fixed position) */}
      <Sidebar activeTab={activeTab} onChange={setActiveTab} />

      {/* ✅ Change 2: Add ml-64 to push content to the right of the sidebar */}
      <main className="ml-64 min-h-screen">
        <div className="max-w-7xl mx-auto px-8 py-8">
          
          {/* Header */}
          <header className="mb-8">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {activeTab === 'league' && 'League Overview'}
              {activeTab === 'team' && 'Team Analysis'}
              {activeTab === 'regression' && 'Regression Sandbox'}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {activeTab === 'league' && 'Macro-level trends and daily league averages.'}
              {activeTab === 'team' && 'Deep dive into team performance, rosters, and betting trends.'}
              {activeTab === 'regression' && 'Test and refine your predictive models.'}
            </p>
          </header>

          {/* Content Area */}
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            {activeTab === 'league' && <LeagueOverview />}
            {activeTab === 'team' && <TeamDashboard />}
            
            {activeTab === 'regression' && (
              <div className="h-96 flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-xl bg-slate-100/50">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
                  <Cone className="h-8 w-8 text-orange-500" />
                </div>
                <h3 className="text-lg font-medium text-slate-900">Under Construction</h3>
                <p className="text-slate-500 text-sm mt-1">Check back later for regression tools.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};