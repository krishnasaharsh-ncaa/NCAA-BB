'use client';

import React, { useState } from 'react';
import { Tabs } from '@/components/ui/Tabs';
import { LeagueOverview } from '@/components/LeagueOverview';
import { DateTeamLookup } from '@/components/DateTeamLookup';
import { TeamDashboard } from '@/components/TeamDashboard';
// Import your Regression/Sandbox component here if you have it
// import { RegressionSandbox } from '@/components/RegressionSandbox';

export const DashboardShell: React.FC = () => {
  const [activeTab, setActiveTab] = useState('league');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* 1. Header Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
          College Basketball Analytics
        </h1>
        <p className="mt-2 text-gray-500">
          Advanced metrics, league trends, and predictive modeling.
        </p>
      </div>

      {/* 2. Navigation Tabs */}
      <Tabs 
        activeTab={activeTab} 
        onChange={setActiveTab}
        tabs={[
          { id: 'league', label: 'League Overview' },
          { id: 'team', label: 'Team Analysis' },
          { id: 'regression', label: 'Regression Sandbox' },
        ]} 
      />

      {/* 3. Content Area */}
      <div className="animate-in fade-in duration-500 slide-in-from-bottom-2">
        
        {/* VIEW: LEAGUE */}
        {activeTab === 'league' && (
          <div className="space-y-8">
            <LeagueOverview />
            <DateTeamLookup />
          </div>
        )}

        {/* VIEW: TEAM */}
        {activeTab === 'team' && (
          <div>
            <TeamDashboard />
          </div>
        )}

        {/* VIEW: REGRESSION */}
        {activeTab === 'regression' && (
          <div className="p-12 text-center border-2 border-dashed border-gray-300 rounded-lg text-gray-400">
            {/* Replace this with your Regression Component */}
            <p>Regression Sandbox Component goes here.</p>
          </div>
        )}

      </div>
    </div>
  );
};