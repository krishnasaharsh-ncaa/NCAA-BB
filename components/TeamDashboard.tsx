"use client";

import React, { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { GameRow } from "@/types/basketball";

// Sub-components
import { TeamVsLeagueTrend } from './team/TeamVsLeagueTrend';
import { StyleRadar } from './team/StyleRadar';
import { VegasTracker } from './team/VegasTracker';

// Icons (Simple SVGs for cleaner look)
const SearchIcon = () => (
  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
);
const CalendarIcon = () => (
  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
);
const VsIcon = () => (
  <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
);

const AVAILABLE_SEASONS = [2025, 2024, 2023, 2022];

interface TeamOption {
  id: string;
  name: string;
}

export const TeamDashboard: React.FC = () => {
  // State
  const [selectedTeamId, setSelectedTeamId] = useState<string>("KP076");
  const [teamInput, setTeamInput] = useState("Duke");
  const [opponentId, setOpponentId] = useState<string | null>(null);
  const [opponentInput, setOpponentInput] = useState("");
  const [selectedSeason, setSelectedSeason] = useState<number>(2025);

  // Data
  const [teamMap, setTeamMap] = useState<Record<string, string>>({});
  const [allTeams, setAllTeams] = useState<TeamOption[]>([]);
  const [games, setGames] = useState<GameRow[]>([]);
  const [loadingGames, setLoadingGames] = useState(false);

  // 1. Fetch Teams
  useEffect(() => {
    const fetchTeams = async () => {
      const { data } = await supabase.from("teams").select("team_id, team_name").order("team_name");
      if (data) {
        const map: Record<string, string> = {};
        const list = data.map((t) => {
          map[t.team_id] = t.team_name;
          return { id: t.team_id, name: t.team_name };
        });
        setTeamMap(map);
        setAllTeams(list);
        if (map["KP076"]) setTeamInput(map["KP076"]);
      }
    };
    fetchTeams();
  }, []);

  // 2. H2H Stats Logic
  const h2hStats = useMemo(() => {
    if (!opponentId || games.length === 0) return null;
    let wins = 0;
    let totalDiff = 0;
    games.forEach(g => {
      if (g.winner_id === selectedTeamId) wins++;
      totalDiff += (g.team_score - g.opponent_score);
    });
    return {
      wins,
      losses: games.length - wins,
      avgDiff: (totalDiff / games.length).toFixed(1)
    };
  }, [games, opponentId, selectedTeamId]);

  // 3. Fetch Games
  useEffect(() => {
    if (!selectedTeamId) return;
    const fetchGames = async () => {
      setLoadingGames(true);
      let query = supabase.from("games").select("*");

      if (opponentId) {
        query = query.or(`and(team1_id.eq.${selectedTeamId},team2_id.eq.${opponentId}),and(team1_id.eq.${opponentId},team2_id.eq.${selectedTeamId})`);
      } else {
        query = query.eq("season", selectedSeason).or(`team1_id.eq.${selectedTeamId},team2_id.eq.${selectedTeamId}`);
      }

      const { data: raw, error } = await query.order("game_date", { ascending: false });

      if (!error && raw) {
        const processed: GameRow[] = raw.map((g: any) => {
          const isTeam1 = g.team1_id === selectedTeamId;
          const oppId = isTeam1 ? g.team2_id : g.team1_id;
          return {
            id: g.game_id,
            team_id: selectedTeamId,
            opponent_name: teamMap[oppId] || "Unknown",
            game_date: g.game_date,
            actual_score: g.actual_score,
            home_away: g.is_neutral_site ? "Neutral" : g.home_team_id === selectedTeamId ? "Home" : "Away",
            team_score: isTeam1 ? g.team_score : g.opponent_score,
            opponent_score: isTeam1 ? g.opponent_score : g.team_score,
            winner_id: g.winner_id,
            open_total: g.open_total,
            close_total: g.close_total,
            game_total: g.game_total,
            kp_total: g.kp_total,
            predicted_score: g.predicted_score,
            predicted_possessions: g.predicted_possessions,
            win_probability: g.win_probability,
          };
        });
        setGames(processed);
      }
      setLoadingGames(false);
    };
    fetchGames();
  }, [selectedTeamId, opponentId, selectedSeason, teamMap]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* 1. CONTROL BAR (Replaces Clumsy Inputs) */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-2 flex flex-col md:flex-row md:items-center gap-2">
        
        {/* Main Team Input */}
        <div className="flex-1 flex items-center bg-gray-50 rounded-xl px-4 py-3 border border-transparent focus-within:bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
          <div className="mr-3"><SearchIcon /></div>
          <div className="flex-1">
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Focus Team</label>
            <input
              list="main-team-list"
              className="w-full bg-transparent outline-none text-sm font-bold text-gray-800 placeholder-gray-400"
              value={teamInput}
              onChange={(e) => {
                setTeamInput(e.target.value);
                const match = allTeams.find(t => t.name === e.target.value);
                if (match) setSelectedTeamId(match.id);
              }}
              placeholder="Search team..."
            />
            <datalist id="main-team-list">{allTeams.map(t => <option key={t.id} value={t.name} />)}</datalist>
          </div>
        </div>

        {/* Separator (Desktop) */}
        <div className="hidden md:block w-px h-10 bg-gray-200 mx-2"></div>

        {/* Opponent Input */}
        <div className="flex-1 flex items-center bg-gray-50 rounded-xl px-4 py-3 border border-transparent focus-within:bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
          <div className="mr-3"><VsIcon /></div>
          <div className="flex-1">
            <label className="block text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-0.5">Vs Opponent (Optional)</label>
            <input
              list="opp-team-list"
              className="w-full bg-transparent outline-none text-sm font-semibold text-gray-800 placeholder-gray-400"
              value={opponentInput}
              onChange={(e) => {
                setOpponentInput(e.target.value);
                const match = allTeams.find(t => t.name === e.target.value);
                if (match) setOpponentId(match.id);
                if (e.target.value === "") setOpponentId(null);
              }}
              placeholder="Compare history..."
            />
            <datalist id="opp-team-list">{allTeams.map(t => <option key={t.id} value={t.name} />)}</datalist>
          </div>
          {opponentId && (
            <button onClick={() => { setOpponentId(null); setOpponentInput(""); }} className="text-xs text-red-500 hover:text-red-700 font-medium">
              Clear
            </button>
          )}
        </div>

        {/* Season Selector (Hidden if Comparing) */}
        {!opponentId && (
          <>
            <div className="hidden md:block w-px h-10 bg-gray-200 mx-2"></div>
            <div className="w-full md:w-48 flex items-center bg-gray-50 rounded-xl px-4 py-3 border border-transparent focus-within:bg-white focus-within:border-gray-300 transition-all">
              <div className="mr-3"><CalendarIcon /></div>
              <div className="flex-1">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Season</label>
                <select
                  className="w-full bg-transparent outline-none text-sm font-semibold text-gray-800"
                  value={selectedSeason}
                  onChange={(e) => setSelectedSeason(Number(e.target.value))}
                >
                  {AVAILABLE_SEASONS.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>
          </>
        )}
      </div>

      {/* 2. HERO TITLE & CONTEXT */}
      <div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight mb-1">
          {opponentId ? (
            <span className="flex items-center gap-3">
              <span>{teamMap[selectedTeamId]}</span>
              <span className="text-gray-300 text-2xl">vs</span>
              <span className="text-blue-700">{teamMap[opponentId]}</span>
            </span>
          ) : (
            teamMap[selectedTeamId] || "Loading..."
          )}
        </h1>
        <p className="text-gray-500 font-medium">
          {opponentId ? "Historical Matchup Analysis" : `${selectedSeason} Season Performance Report`}
        </p>
      </div>

      {/* 3. H2H SUMMARY BAR (If Opponent Selected) */}
      {opponentId && h2hStats && (
        <div className="bg-gradient-to-r from-blue-900 to-blue-800 text-white p-6 rounded-2xl shadow-lg flex justify-around items-center">
          <div className="text-center">
            <p className="text-xs uppercase opacity-60 font-bold tracking-wider">Record</p>
            <p className="text-3xl font-bold">{h2hStats.wins}-{h2hStats.losses}</p>
          </div>
          <div className="w-px h-12 bg-white/20"></div>
          <div className="text-center">
            <p className="text-xs uppercase opacity-60 font-bold tracking-wider">Win Rate</p>
            <p className="text-3xl font-bold">{((h2hStats.wins / (h2hStats.wins + h2hStats.losses)) * 100).toFixed(0)}%</p>
          </div>
          <div className="w-px h-12 bg-white/20"></div>
          <div className="text-center">
            <p className="text-xs uppercase opacity-60 font-bold tracking-wider">Avg Margin</p>
            <p className="text-3xl font-bold">{Number(h2hStats.avgDiff) > 0 ? '+' : ''}{h2hStats.avgDiff}</p>
          </div>
        </div>
      )}

      {/* 4. ANALYTICS GRID (Only if Single Team) */}
      {!opponentId && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* A. TREND CHART - Full Width on Top Row or Left Col */}
          <div className="lg:col-span-2">
            <TeamVsLeagueTrend 
              teamId={selectedTeamId} 
              teamName={teamMap[selectedTeamId] || 'Team'} 
              season={selectedSeason} 
            />
          </div>

          {/* B. RADAR CHART */}
          <div className="lg:col-span-1 h-full">
            <StyleRadar teamId={selectedTeamId} season={selectedSeason} />
          </div>

          {/* C. VEGAS TRACKER */}
          <div className="lg:col-span-1 h-full">
            <VegasTracker games={games} teamId={selectedTeamId} />
          </div>
        </div>
      )}

      {/* 5. GAMES TABLE */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h3 className="font-bold text-gray-800">Game Log</h3>
          <span className="text-xs font-medium text-gray-500 bg-white px-2 py-1 rounded border shadow-sm">{games.length} Games</span>
        </div>
        
        <div className="overflow-x-auto">
          {loadingGames ? (
            <div className="p-8 text-center text-gray-400 animate-pulse">Loading games...</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase font-bold tracking-wider text-left">
                <tr>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Opponent</th>
                  <th className="px-4 py-3 text-center">Location</th>
                  <th className="px-6 py-3 text-center">Result</th>
                  <th className="px-6 py-3 text-right">Pred</th>
                  <th className="px-6 py-3 text-right">Total</th>
                  <th className="px-6 py-3 text-center">Open</th>
                  <th className="px-6 py-3 text-right">Close</th>
                  <th className="px-6 py-3 text-right">Prob</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {games.map((g) => {
                  const isWin = selectedTeamId === g.winner_id;
                  const rowClass = isWin ? "bg-green-50" : "bg-red-50";
                  return (
                    <tr key={g.id} className={`${rowClass} hover:bg-gray-50/80 transition-colors`}>
                      <td className="px-6 py-3 text-gray-600 whitespace-nowrap">{g.game_date}</td>
                      <td className="px-6 py-3 font-semibold text-gray-900">{g.opponent_name}</td>
                      <td className="px-4 py-3 text-center text-gray-400 text-xs">{g.home_away}</td>
                      <td className="px-6 py-3 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold ${isWin ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {isWin ? 'W' : 'L'} {g.actual_score}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right text-gray-600 font-mono text-xs">{g.predicted_score || '-'}</td>
                      <td className="px-6 py-3 text-right text-gray-600 font-mono text-xs">{g.game_total}</td>
                      <td className="px-6 py-3 text-right text-gray-600 font-mono text-xs">{g.open_total}</td>
                      <td className="px-6 py-3 text-right text-gray-600 font-mono text-xs">{g.close_total}</td>
                      <td className="px-6 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                           <span className="text-xs font-bold text-gray-700">{g.win_probability}</span>
                           {/* Tiny probability bar */}
                           <div className="w-12 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                             <div className="h-full bg-blue-500" style={{ width: `${g.win_probability}` }}></div>
                           </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};