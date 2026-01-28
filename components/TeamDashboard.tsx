"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { GameRow } from "@/types/basketball";

// Sub-components
import { TeamVsLeagueTrend } from './team/TeamVsLeagueTrend';
import { StyleRadar } from './team/StyleRadar';
import { VegasTracker } from './team/VegasTracker';
import { GameTable } from './GameTable';

// Icons
const SearchIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
);
const ChevronDownIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
);

const AVAILABLE_SEASONS = [2026, 2025, 2024, 2023, 2022];

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
  const [selectedSeason, setSelectedSeason] = useState<number>(2026);

  // Dropdown states
  const [showTeamDropdown, setShowTeamDropdown] = useState(false);
  const [showOpponentDropdown, setShowOpponentDropdown] = useState(false);
  const [showSeasonDropdown, setShowSeasonDropdown] = useState(false);
  const [teamSearchInput, setTeamSearchInput] = useState("");
  const [opponentSearchInput, setOpponentSearchInput] = useState("");

  // Data
  const [teamMap, setTeamMap] = useState<Record<string, string>>({});
  const [allTeams, setAllTeams] = useState<TeamOption[]>([]);
  const [games, setGames] = useState<GameRow[]>([]);
  const [loadingGames, setLoadingGames] = useState(false);

  // Refs for closing dropdowns on outside click
  const teamDropdownRef = useRef<HTMLDivElement>(null);
  const opponentDropdownRef = useRef<HTMLDivElement>(null);
  const seasonDropdownRef = useRef<HTMLDivElement>(null);

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

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (teamDropdownRef.current && !teamDropdownRef.current.contains(event.target as Node)) {
        setShowTeamDropdown(false);
      }
      if (opponentDropdownRef.current && !opponentDropdownRef.current.contains(event.target as Node)) {
        setShowOpponentDropdown(false);
      }
      if (seasonDropdownRef.current && !seasonDropdownRef.current.contains(event.target as Node)) {
        setShowSeasonDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter teams based on search
  const filteredTeams = allTeams.filter(t => 
    t.name.toLowerCase().includes(teamSearchInput.toLowerCase())
  );

  const filteredOpponents = allTeams.filter(t => 
    t.name.toLowerCase().includes(opponentSearchInput.toLowerCase())
  );

  // Handle team selection
  const handleTeamSelect = (team: TeamOption) => {
    setTeamInput(team.name);
    setSelectedTeamId(team.id);
    setShowTeamDropdown(false);
    setTeamSearchInput("");
  };

  // Handle opponent selection
  const handleOpponentSelect = (team: TeamOption) => {
    setOpponentInput(team.name);
    setOpponentId(team.id);
    setShowOpponentDropdown(false);
    setOpponentSearchInput("");
  };

  // 2. H2H Stats Logic
  const h2hStats = useMemo(() => {
    if (!opponentId || games.length === 0) return null;
    let wins = 0;
    let totalDiff = 0;
    
    games.forEach(g => {
      const isWin = g.team_score > g.opponent_score;
      if (isWin) wins++;
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
          
          // Determine team score and opponent score based on winner_id
          let teamScore: number;
          let oppScore: number;
          
          if (g.winner_id === selectedTeamId) {
            teamScore = g.winner_score || 0;
            oppScore = g.loser_score || 0;
          } else {
            teamScore = g.loser_score || 0;
            oppScore = g.winner_score || 0;
          }

          // Build box scores
          // If team is team1, use H1_T1, H2_T1, OT_T1
          // If team is team2, use H1_T2, H2_T2, OT_T2
          const team_h1 = isTeam1 ? (g["H1_T1 Score"] || 0) : (g["H1_T2 Score"] || 0);
          const team_h2 = isTeam1 ? (g["H2_T1 Score"] || 0) : (g["H2_T2 Score"] || 0);
          const team_ot = isTeam1 ? (g["OT_T1 Score"] || 0) : (g["OT_T2 Score"] || 0);

          const opp_h1 = isTeam1 ? (g["H1_T2 Score"] || 0) : (g["H1_T1 Score"] || 0);
          const opp_h2 = isTeam1 ? (g["H2_T2 Score"] || 0) : (g["H2_T1 Score"] || 0);
          const opp_ot = isTeam1 ? (g["OT_T2 Score"] || 0) : (g["OT_T1 Score"] || 0);

          const hasOT = g.ot || false;
          
          return {
            id: g.game_id,
            team_id: selectedTeamId,
            opponent_name: teamMap[oppId] || "Unknown",
            game_date: g.game_date,
            actual_score: g.actual_score || `${teamScore}-${oppScore}`,
            home_away: g.is_neutral_site ? "Neutral" : g.home_team_id === selectedTeamId ? "Home" : "Away",
            team_score: teamScore,
            opponent_score: oppScore,
            team_box: {
              h1: team_h1,
              h2: team_h2,
              ot: hasOT ? team_ot : undefined,
              total: teamScore,
            },
            opp_box: {
              h1: opp_h1,
              h2: opp_h2,
              ot: hasOT ? opp_ot : undefined,
              total: oppScore,
            },
            has_ot: hasOT,
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
    <div className="space-y-8">
      
      {/* ============================================
          CONTROL BAR - Clean Grid Layout with Dropdowns
          ============================================ */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
          
          {/* Team Selection with Dropdown */}
          <div className="space-y-2" ref={teamDropdownRef}>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
              Team
            </label>
            <div className="relative">
              <button
                onClick={() => {
                  setShowTeamDropdown(!showTeamDropdown);
                  setTeamSearchInput("");
                }}
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-900 font-medium transition-all text-left flex items-center justify-between hover:bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
              >
                <span className={showTeamDropdown ? "text-slate-400" : "text-slate-900"}>
                  {showTeamDropdown ? "Search teams..." : teamInput}
                </span>
                <ChevronDownIcon />
              </button>

              {/* Team Dropdown */}
              {showTeamDropdown && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-lg shadow-lg z-50">
                  {/* Search Input */}
                  <div className="p-3 border-b border-slate-100">
                    <input
                      type="text"
                      placeholder="Search teams..."
                      autoFocus
                      value={teamSearchInput}
                      onChange={(e) => setTeamSearchInput(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  {/* Team List */}
                  <div className="max-h-64 overflow-y-auto">
                    {filteredTeams.length > 0 ? (
                      filteredTeams.map((team) => (
                        <button
                          key={team.id}
                          onClick={() => handleTeamSelect(team)}
                          className={`w-full px-4 py-3 text-left text-sm transition-colors border-b border-slate-50 hover:bg-blue-50 ${
                            selectedTeamId === team.id ? 'bg-blue-100 text-blue-700 font-semibold' : 'text-slate-900'
                          }`}
                        >
                          {team.name}
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-8 text-center text-slate-400 text-sm">
                        No teams found
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Opponent Selection with Dropdown */}
          <div className="space-y-2" ref={opponentDropdownRef}>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
              Opponent
            </label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <button
                  onClick={() => {
                    setShowOpponentDropdown(!showOpponentDropdown);
                    setOpponentSearchInput("");
                  }}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-900 font-medium transition-all text-left flex items-center justify-between hover:bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                >
                  <span className={showOpponentDropdown ? "text-slate-400" : opponentInput ? "text-slate-900" : "text-slate-400"}>
                    {showOpponentDropdown ? "Search teams..." : opponentInput || "Optional..."}
                  </span>
                  <ChevronDownIcon />
                </button>

                {/* Opponent Dropdown */}
                {showOpponentDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-lg shadow-lg z-50">
                    {/* Search Input */}
                    <div className="p-3 border-b border-slate-100">
                      <input
                        type="text"
                        placeholder="Search teams..."
                        autoFocus
                        value={opponentSearchInput}
                        onChange={(e) => setOpponentSearchInput(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>

                    {/* Team List */}
                    <div className="max-h-64 overflow-y-auto">
                      {filteredOpponents.length > 0 ? (
                        filteredOpponents.map((team) => (
                          <button
                            key={team.id}
                            onClick={() => handleOpponentSelect(team)}
                            className={`w-full px-4 py-3 text-left text-sm transition-colors border-b border-slate-50 hover:bg-blue-50 ${
                              opponentId === team.id ? 'bg-blue-100 text-blue-700 font-semibold' : 'text-slate-900'
                            }`}
                          >
                            {team.name}
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-8 text-center text-slate-400 text-sm">
                          No teams found
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {opponentId && (
                <button 
                  onClick={() => { 
                    setOpponentId(null); 
                    setOpponentInput(""); 
                    setShowOpponentDropdown(false);
                  }} 
                  className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Season Selector - Always Show */}
          <div className="space-y-2" ref={seasonDropdownRef}>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
              {opponentId ? "Filter by Season" : "Season"}
            </label>
            <div className="relative">
              <button
                onClick={() => setShowSeasonDropdown(!showSeasonDropdown)}
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-900 font-medium transition-all text-left flex items-center justify-between hover:bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
              >
                <span>{selectedSeason}</span>
                <ChevronDownIcon />
              </button>
              
              {showSeasonDropdown && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-lg shadow-lg z-50">
                  {AVAILABLE_SEASONS.map((year) => (
                    <button
                      key={year}
                      onClick={() => {
                        setSelectedSeason(year);
                        setShowSeasonDropdown(false);
                      }}
                      className={`w-full px-4 py-3 text-left text-sm transition-colors border-b border-slate-50 hover:bg-blue-50 ${
                        selectedSeason === year ? 'bg-blue-100 text-blue-700 font-semibold' : 'text-slate-900'
                      }`}
                    >
                      {year}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ============================================
          HERO TITLE & CONTEXT
          ============================================ */}
      <div className="space-y-2">
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
          {opponentId ? (
            <span className="flex items-center gap-3 flex-wrap">
              <span>{teamMap[selectedTeamId]}</span>
              <span className="text-slate-300">vs</span>
              <span className="text-blue-600">{teamMap[opponentId]}</span>
            </span>
          ) : (
            teamMap[selectedTeamId] || "Loading..."
          )}
        </h1>
        <p className="text-slate-600 font-medium text-lg">
          {opponentId ? "Historical Matchup Analysis" : `${selectedSeason} Season Performance`}
        </p>
      </div>

      {/* ============================================
          H2H SUMMARY BAR (If Opponent Selected)
          ============================================ */}
      {opponentId && h2hStats && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8">
          <div className="grid grid-cols-3 gap-8">
            <div className="text-center">
              <p className="text-xs uppercase tracking-widest font-bold text-slate-500 mb-2">Record</p>
              <p className="text-4xl font-black text-slate-900">{h2hStats.wins}–{h2hStats.losses}</p>
              <p className="text-sm text-slate-600 mt-2">
                {h2hStats.wins + h2hStats.losses > 0 ? ((h2hStats.wins / (h2hStats.wins + h2hStats.losses)) * 100).toFixed(0) : 0}% Win Rate
              </p>
            </div>
            <div className="border-l border-r border-slate-200"></div>
            <div className="text-center">
              <p className="text-xs uppercase tracking-widest font-bold text-slate-500 mb-2">Avg Margin</p>
              <p className={`text-4xl font-black ${Number(h2hStats.avgDiff) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {Number(h2hStats.avgDiff) > 0 ? '+' : ''}{h2hStats.avgDiff}
              </p>
              <p className="text-sm text-slate-600 mt-2">Points per Game</p>
            </div>
          </div>
        </div>
      )}

      {/* ============================================
          ANALYTICS GRID (Only if Single Team)
          ============================================ */}
      {!opponentId && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* A. TREND CHART - Full Width */}
          <div className="lg:col-span-2">
            <TeamVsLeagueTrend 
              teamId={selectedTeamId} 
              teamName={teamMap[selectedTeamId] || 'Team'} 
              season={selectedSeason - 1} 
            />
          </div>

          {/* B. RADAR CHART */}
          <div>
            <StyleRadar teamId={selectedTeamId} season={selectedSeason - 1} />
          </div>

          {/* C. VEGAS TRACKER */}
          <div>
            <VegasTracker games={games} teamId={selectedTeamId} />
          </div>
        </div>
      )}

      {/* ============================================
          GAMES TABLE
          ============================================ */}
      {loadingGames ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400">
          Loading games...
        </div>
      ) : games.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400">
          No games found for this selection.
        </div>
      ) : (
        <GameTable games={games} />
      )}
    </div>
  );
};