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
    let beatPrediction = 0;
    let totalGames = 0;

    games.forEach((g) => {
      // Logic for Over/Under/Push
      if (g.close_total && g.close_total > 0) {
        totalGames++;
        if (g.game_total && g.game_total > g.close_total) {
          overs++;
        } else if (g.game_total && g.game_total < g.close_total) {
          unders++;
        } else if (g.game_total === g.close_total) {
          pushes++;
        }
      }

      // Logic for "Beating the Model"
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

  // If no games, show placeholder
  if (games.length === 0) {
    return (
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-full flex flex-col items-center justify-center">
        <Banknote className="w-12 h-12 text-slate-300 mb-3" />
        <h3 className="text-lg font-bold text-slate-900 mb-1">Vegas Tracker</h3>
        <p className="text-sm text-slate-500 text-center">No games available yet</p>
      </div>
    );
  }

  if (stats.totalGames === 0) {
    return (
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-full flex flex-col items-center justify-center">
        <Banknote className="w-12 h-12 text-slate-300 mb-3" />
        <h3 className="text-lg font-bold text-slate-900 mb-1">Vegas Tracker</h3>
        <p className="text-sm text-slate-500 text-center">No betting data available</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-full">
      <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
        <Banknote className="w-5 h-5 text-green-600" />
        Vegas Tracker
      </h3>

      {/* 1. OVER/UNDER/PUSH METER */}
      <div className="mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="font-semibold text-slate-700">Over / Under / Push</span>
          <span className="font-bold text-slate-900">
            {stats.overs} - {stats.unders} - {stats.pushes}
          </span>
        </div>
        
        {/* Visual Bar */}
        <div className="w-full bg-slate-200 rounded-full h-4 overflow-hidden flex">
          <div 
            className="bg-emerald-400 h-full transition-all duration-500" 
            style={{ width: `${stats.overPct}%` }} 
          />
          <div 
            className="bg-amber-300 h-full transition-all duration-500" 
            style={{ width: `${(100 - Number(stats.overPct) - (stats.pushes / stats.totalGames * 100)).toFixed(1)}%` }} 
          />
          <div 
            className="bg-slate-300 h-full transition-all duration-500" 
            style={{ width: `${(stats.pushes / stats.totalGames * 100).toFixed(1)}%` }} 
          />
        </div>
        <div className="flex justify-between text-xs text-slate-500 mt-2">
          <span>Over {stats.overPct}%</span>
          <span>Push {((stats.pushes / stats.totalGames) * 100).toFixed(0)}%</span>
          <span>Under {(100 - Number(stats.overPct) - (stats.pushes / stats.totalGames * 100)).toFixed(1)}%</span>
        </div>
      </div>

      {/* 2. TREND BADGES */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-center">
          <p className="text-xs text-slate-500 uppercase font-semibold">Beating Prediction</p>
          <p className="text-2xl font-black text-blue-600 mt-1">
            {((stats.beatPrediction / games.length) * 100).toFixed(0)}%
          </p>
          <p className="text-[10px] text-slate-500 mt-1">of games</p>
        </div>
        
        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-center">
          <p className="text-xs text-slate-500 uppercase font-semibold">Betting Trend</p>
          <p className={`text-2xl font-black mt-1 ${
            Number(stats.overPct) > 55 ? 'text-emerald-600' : 
            Number(stats.overPct) < 45 ? 'text-amber-600' : 
            'text-slate-600'
          }`}>
            {Number(stats.overPct) > 55 ? '↑ Over' : 
             Number(stats.overPct) < 45 ? '↓ Under' : 
             '→ Balanced'}
          </p>
          <p className="text-[10px] text-slate-500 mt-1">Signal</p>
        </div>
      </div>
    </div>
  );
};