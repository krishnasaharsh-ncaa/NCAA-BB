'use client';

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { GameRow } from '@/types/basketball';

interface GameTableProps {
  games: GameRow[];
}

export const GameTable: React.FC<GameTableProps> = ({ games }) => {
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900">Game Log</h2>
        <span className="text-xs font-semibold text-slate-500 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
          {games.length} Games
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-white">
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">Date</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">Opponent</th>
              <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-slate-500">Location</th>
              <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-slate-500">Result</th>
              <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-500">Open</th>
              <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-500">Close</th>
              <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-500">O/U</th>
              <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-500">Win %</th>
              <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-slate-500"></th>
            </tr>
          </thead>

          <tbody>
            {games.map((g) => {
              const isWin = g.team_score > g.opponent_score;
              const isExpanded = expandedRowId === g.id;
              const overUnderResult = g.game_total && g.close_total ? (g.game_total > g.close_total ? 'Over' : 'Under') : null;
              const overUnderDiff = g.game_total && g.close_total ? Math.abs(g.game_total - g.close_total).toFixed(1) : null;
              
              const gameDate = new Date(g.game_date);
              const dateStr = gameDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              const dayStr = gameDate.toLocaleDateString('en-US', { weekday: 'short' });

              return (
                <React.Fragment key={g.id}>
                  {/* Main Row */}
                  <tr className={`border-b border-slate-100 transition-colors ${
                    isWin ? 'bg-green-50/30 hover:bg-green-50/50' : 'bg-red-50/30 hover:bg-red-50/50'
                  }`}>
                    
                    {/* Date */}
                    <td className="px-4 py-4 font-semibold text-slate-900">
                      <div className="text-sm">{dateStr}</div>
                      <div className="text-xs text-slate-500">{dayStr}</div>
                    </td>

                    {/* Opponent */}
                    <td className="px-4 py-4 font-semibold text-slate-900">
                      {g.opponent_name}
                    </td>

                    {/* Location */}
                    <td className="px-4 py-4 text-center">
                      <span className={`inline-block text-xs font-bold px-2.5 py-1 rounded-md ${
                        g.home_away === 'Home'
                          ? 'bg-blue-100 text-blue-700'
                          : g.home_away === 'Away'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {g.home_away}
                      </span>
                    </td>

                    {/* Result */}
                    <td className="px-4 py-4 text-center">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold text-sm" style={{
                        backgroundColor: isWin ? '#dcfce7' : '#fee2e2',
                        color: isWin ? '#166534' : '#991b1b'
                      }}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{
                          backgroundColor: isWin ? '#16a34a' : '#dc2626'
                        }} />
                        {isWin ? 'W' : 'L'} {g.team_score}–{g.opponent_score}
                      </div>
                    </td>

                    {/* Open Total */}
                    <td className="px-4 py-4 text-right">
                      <div className="text-sm font-bold text-slate-900">{g.open_total || '–'}</div>
                    </td>

                    {/* Close Total */}
                    <td className="px-4 py-4 text-right">
                      <div className="text-sm font-bold text-slate-900">{g.close_total || '–'}</div>
                    </td>

                    {/* Over/Under */}
                    <td className="px-4 py-4 text-right">
                      {overUnderResult ? (
                        <span className={`inline-block text-xs font-bold px-2 py-1 rounded-md ${
                          overUnderResult === 'Over'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {overUnderResult} {overUnderDiff}
                        </span>
                      ) : (
                        <span className="text-slate-400">–</span>
                      )}
                    </td>

                    {/* Win Probability */}
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span className="font-bold text-slate-900 text-sm">{g.win_probability || '–'}</span>
                        {g.win_probability && (
                          <div className="w-12 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-blue-500 to-blue-600"
                              style={{ width: g.win_probability || '0%' }}
                            />
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Expand */}
                    <td className="px-4 py-4 text-center">
                      <button
                        onClick={() => setExpandedRowId(isExpanded ? null : g.id)}
                        className={`p-1.5 rounded-lg transition-all ${
                          isExpanded
                            ? 'bg-blue-100 text-blue-600'
                            : 'hover:bg-slate-100 text-slate-400'
                        }`}
                      >
                        <ChevronDown
                          size={16}
                          className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        />
                      </button>
                    </td>
                  </tr>

                  {/* Expanded Row - Box Score Table */}
                  {isExpanded && (
                    <tr className="bg-blue-50/30 border-b border-slate-100">
                      <td colSpan={9} className="px-6 py-6">
                        <div className="space-y-4">
                          {/* Box Score Table */}
                          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="bg-slate-50 border-b border-slate-200">
                                  <th className="px-4 py-3 text-left font-bold text-slate-900">Team</th>
                                  <th className="px-4 py-3 text-center font-bold text-slate-700">H1</th>
                                  <th className="px-4 py-3 text-center font-bold text-slate-700">H2</th>
                                  {(g.has_ot) && <th className="px-4 py-3 text-center font-bold text-slate-700">OT</th>}
                                  <th className="px-4 py-3 text-center font-bold text-slate-900">Total</th>
                                </tr>
                              </thead>
                              <tbody>
                                {/* Team Score */}
                                <tr className="border-b border-slate-100 bg-green-50/40">
                                  <td className="px-4 py-3 font-bold text-slate-900">Your Team</td>
                                  <td className="px-4 py-3 text-center font-semibold text-slate-700">{g.team_box.h1}</td>
                                  <td className="px-4 py-3 text-center font-semibold text-slate-700">{g.team_box.h2}</td>
                                  {g.has_ot && <td className="px-4 py-3 text-center font-semibold text-slate-700">{g.team_box.ot || 0}</td>}
                                  <td className="px-4 py-3 text-center font-bold text-slate-900 bg-white">{g.team_box.total}</td>
                                </tr>

                                {/* Opponent Score */}
                                <tr className="bg-red-50/40">
                                  <td className="px-4 py-3 font-bold text-slate-900">{g.opponent_name}</td>
                                  <td className="px-4 py-3 text-center font-semibold text-slate-700">{g.opp_box.h1}</td>
                                  <td className="px-4 py-3 text-center font-semibold text-slate-700">{g.opp_box.h2}</td>
                                  {g.has_ot && <td className="px-4 py-3 text-center font-semibold text-slate-700">{g.opp_box.ot || 0}</td>}
                                  <td className="px-4 py-3 text-center font-bold text-slate-900 bg-white">{g.opp_box.total}</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>

                          {/* Additional Details Grid */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-white rounded-lg border border-slate-200 p-4">
                              <p className="text-xs font-bold uppercase text-slate-500 mb-1">Pred Score</p>
                              <p className="text-xl font-black text-slate-900">{g.predicted_score || '–'}</p>
                            </div>
                            <div className="bg-white rounded-lg border border-slate-200 p-4">
                              <p className="text-xs font-bold uppercase text-slate-500 mb-1">Poss</p>
                              <p className="text-xl font-black text-slate-900">{g.predicted_possessions || '–'}</p>
                            </div>
                            <div className="bg-white rounded-lg border border-slate-200 p-4">
                              <p className="text-xs font-bold uppercase text-slate-500 mb-1">KenPom</p>
                              <p className="text-xl font-black text-slate-900">{g.kp_total || '–'}</p>
                            </div>
                            <div className="bg-white rounded-lg border border-slate-200 p-4">
                              <p className="text-xs font-bold uppercase text-slate-500 mb-1">Game Total</p>
                              <p className="text-xl font-black text-slate-900">{g.game_total || '–'}</p>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="px-6 py-3 bg-slate-50/50 border-t border-slate-100 text-xs text-slate-500 font-medium">
        {games.length} total games
      </div>
    </div>
  );
};