'use client';

import React from 'react';
import type { GameRow } from '@/types/basketball';

interface GameTableProps {
  games: GameRow[];
}

export const GameTable: React.FC<GameTableProps> = ({ games }) => {
  return (
    <div className="bg-white rounded-lg shadow overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-3 py-2 text-left">Date</th>
            <th className="px-3 py-2 text-left">Opponent</th>
            <th className="px-3 py-2 text-left">H/A/N</th>
            <th className="px-3 py-2 text-right">Score</th>
            <th className="px-3 py-2 text-right">Open Total</th>
            <th className="px-3 py-2 text-right">Close Total</th>
            <th className="px-3 py-2 text-right">Game Total</th>
            <th className="px-3 py-2 text-right">KP Total</th>
            <th className="px-3 py-2 text-right">Pred Score</th>
            <th className="px-3 py-2 text-right">Pred Poss</th>
            <th className="px-3 py-2 text-right">Win Prob</th>
          </tr>
        </thead>
        <tbody>
          {games.map((g) => {
            const isWin = g.team_score > g.opponent_score;
            const rowClass = isWin ? 'bg-green-50' : 'bg-red-50';
            return (
              <tr key={g.id} className={`${isWin ? 'bg-green-200' : 'bg-red-200'} border-b`}>
                <td className="px-3 py-2 font-semibold text-gray-900">{g.game_date}</td>
                <td className="px-3 py-2 text-gray-900">{g.opponent_name}</td>
                <td className="px-3 py-2 text-gray-900">{g.home_away}</td>
                <td className="px-3 py-2 text-gray-900">
                    {g.team_score}–{g.opponent_score}
                </td>
                <td className="px-3 py-2 text-gray-900">{g.open_total}</td>
                <td className="px-3 py-2 text-gray-900">{g.close_total}</td>
                <td className="px-3 py-2 text-gray-900">{g.game_total}</td>
                <td className="px-3 py-2 text-gray-900">{g.kp_total}</td>
                <td className="px-3 py-2 text-gray-900">{g.predicted_score}</td>
                <td className="px-3 py-2 text-gray-900">{g.predicted_possessions}</td>
                <td className="px-3 py-2 text-gray-900">{g.win_probability}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
