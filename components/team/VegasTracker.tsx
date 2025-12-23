'use client';

import React, { useMemo } from 'react';
import type { GameRow } from '@/types/basketball';
import { Banknote } from 'lucide-react';

interface VegasTrackerProps {
  games: GameRow[];
  teamId: string;
}

export const VegasTracker: React.FC<VegasTrackerProps> = ({ games, teamId }) => {
  // 1. Calculate Betting Stats
  const stats = useMemo(() => {
    let overs = 0;
    let unders = 0;
    let pushes = 0;
    let beatPrediction = 0; // "Covered" the model's spread
    let totalGames = 0;

    games.forEach((g) => {
      // Logic for Over/Under
      if (g.close_total && g.close_total > 0) {
        totalGames++;
        if (g.game_total > g.close_total) overs++;
        else if (g.game_total < g.close_total) unders++;
        else pushes++;
      }

      // Logic for "Beating the Model" (Proxy for ATS)
      // If we are the Winner and actual margin > predicted margin, we "covered"
      // Or simple logic: Did we score more than predicted?
      // Better Logic: Did we outperform the predicted spread?
      const actualMargin = g.team_score - g.opponent_score;
      // If predicted_score is our score, we need opp predicted score (estimated)
      // For now, let's track: Did the team score exceed their predicted score?
      if (g.predicted_score && g.team_score > g.predicted_score) {
        beatPrediction++;
      }
    });

    return {
      overs,
      unders,
      pushes,
      beatPrediction,
      totalGames,
      overPct: totalGames > 0 ? ((overs / totalGames) * 100).toFixed(1) : '0.0',
    };
  }, [games]);

  if (stats.totalGames === 0) return null;

  return (
    <div className="bg-white p-6 rounded-lg shadow border border-gray-200 h-full">
      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
        <Banknote className="w-5 h-5 text-green-600" />
        Vegas Tracker
      </h3>

      {/* 1. OVER/UNDER METER */}
      <div className="mb-6">
        <div className="flex justify-between text-sm mb-1">
          <span className="font-semibold text-gray-600">Over / Under Record</span>
          <span className="font-bold text-gray-900">{stats.overs} - {stats.unders} - {stats.pushes}</span>
        </div>
        
        {/* Visual Bar */}
        <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden flex">
          <div 
            className="bg-green-500 h-full transition-all duration-500" 
            style={{ width: `${stats.overPct}%` }} 
          />
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>Over {stats.overPct}%</span>
          <span>Under {(100 - Number(stats.overPct)).toFixed(1)}%</span>
        </div>
      </div>

      {/* 2. TREND BADGES */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-50 p-3 rounded border border-gray-100 text-center">
          <p className="text-xs text-gray-500 uppercase">Beating Prediction</p>
          <p className="text-xl font-bold text-blue-600">
            {((stats.beatPrediction / games.length) * 100).toFixed(0)}%
          </p>
          <p className="text-[10px] text-gray-400">of games</p>
        </div>
        
        <div className="bg-gray-50 p-3 rounded border border-gray-100 text-center">
          <p className="text-xs text-gray-500 uppercase">Total Trend</p>
          <p className={`text-xl font-bold ${Number(stats.overPct) > 55 ? 'text-green-600' : Number(stats.overPct) < 45 ? 'text-red-600' : 'text-gray-600'}`}>
            {Number(stats.overPct) > 55 ? 'High Overs' : Number(stats.overPct) < 45 ? 'High Unders' : 'Neutral'}
          </p>
          <p className="text-[10px] text-gray-400">Betting signal</p>
        </div>
      </div>
    </div>
  );
};