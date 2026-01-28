'use client';

import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { StatToggle } from './StatToggle';
import type { DailyStatKey, LeagueDailyAggregate } from '@/types/basketball';
import { RefreshCw, Calculator, Hash, Clock, Calendar, MapPin } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';

const AVAILABLE_SEASONS = [2025, 2024, 2023, 2022];

const STAT_MAP: Record<string, DailyStatKey> = {
  'three-point-pct': 'three_p_pct',
  'two-point-pct': 'two_p_pct',
  'free-throw-pct': 'ft_pct',
  'three-point-rate': 'three_point_rate',
  'free-throws-made-per-game': 'ftm_pg',
  'opponent-three-point-pct': 'opp_three_p_pct',
  'opponent-two-point-pct': 'opp_two_p_pct',
  'opponent-free-throw-pct': 'opp_ft_pct',
  'opponent-free-throws-made-per-game': 'opp_ftm_pg',
  'opponent-three-point-rate': 'opp_three_point_rate',
};

const ChevronDownIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
);

const SPORTSBOOKS = [
  'draftkings',
  'fanduel',
  'pinnacle',
  'betmgm',
  'bovada',
  'betonline',
  'bookmaker',
] as const;

const DEFAULT_SPORTSBOOK = 'betmgm';

export const LeagueOverview: React.FC = () => {
  // --- States ---
  const [selectedStat, setSelectedStat] = useState<DailyStatKey>('three_p_pct');
  const [selectedSeason, setSelectedSeason] = useState<number>(2025);
  const [showSeasonDropdown, setShowSeasonDropdown] = useState(false);
  const [data, setData] = useState<LeagueDailyAggregate[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [dbStatName, setDbStatName] = useState<string>('three-point-pct');
  
  // Schedule States
  const [todaysGames, setTodaysGames] = useState<any[]>([]);
  const [loadingGames, setLoadingGames] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [displayDate, setDisplayDate] = useState<string>('');
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  const seasonDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const now = new Date();
    setDisplayDate(now.toLocaleDateString('en-US', { 
      weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' 
    }));

    const handleClickOutside = (event: MouseEvent) => {
      if (seasonDropdownRef.current && !seasonDropdownRef.current.contains(event.target as Node)) {
        setShowSeasonDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const match = Object.keys(STAT_MAP).find(k => STAT_MAP[k] === selectedStat);
    setDbStatName(match || selectedStat);
  }, [selectedStat]);

  useEffect(() => {
    if (!dbStatName) return;
    const fetchLeagueStats = async () => {
      setLoading(true);
      try {
        const { data: raw, error } = await supabase
          .from('league_daily_trends')
          .select('stat_date, avg_value')
          .eq('season_year', selectedSeason)
          .eq('stat_name', dbStatName)
          .order('stat_date', { ascending: true });
        if (error) throw error;
        setData(raw ? raw.map(row => ({ stat_date: row.stat_date, value: Number(row.avg_value) })) : []);
      } catch (err: any) {
        setErrorMsg(err.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    };
    fetchLeagueStats();
  }, [dbStatName, selectedSeason]);

  // Fetch Schedule including Location, Predicted Score, and Possessions
  useEffect(() => {
    const fetchSchedule = async () => {
      setLoadingGames(true);
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('day_schedule')
        .select(`
          *,
          team1:team1_id (team_name),
          team2:team2_id (team_name),
          winner:predicted_winner (team_name),
          predicted_score,
          predicted_possessions,
          location,
          open_total,
          close_total,
          side_open,
          side_close
        `)
        .eq('game_date', today);

      if (!error && data) setTodaysGames(data);
      setLoadingGames(false);
    };
    fetchSchedule();
  }, []);

  const handleRetrieve = async (type: 'Totals' | 'Spreads') => {
    setIsUpdating(true);
    setTimeout(() => setIsUpdating(false), 2000);
  };

  const currentValue = data.length > 0 ? data[data.length - 1].value : undefined;

  const getRowKey = (game: any, idx: number) => (
    game?.id ? String(game.id) : `${game?.team1_id || 't1'}-${game?.team2_id || 't2'}-${idx}`
  );

  const getTotalsForBook = (game: any, sportsbook: string) => {
    if (sportsbook === DEFAULT_SPORTSBOOK) {
      return { open: game?.open_total, close: game?.close_total };
    }

    // TODO: Replace placeholder access with real per-book totals once DB columns are known.
    const placeholderTotals = {
      draftkings: { open: undefined, close: undefined },
      fanduel: { open: undefined, close: undefined },
      pinnacle: { open: undefined, close: undefined },
      betmgm: { open: undefined, close: undefined },
      bovada: { open: undefined, close: undefined },
      betonline: { open: undefined, close: undefined },
      bookmaker: { open: undefined, close: undefined },
    };

    return placeholderTotals[sportsbook as keyof typeof placeholderTotals] || { open: undefined, close: undefined };
  };

  const getSidesForBook = (game: any, sportsbook: string) => {
    if (sportsbook === DEFAULT_SPORTSBOOK) {
      return { open: game?.side_open, close: game?.side_close };
    }

    // TODO: Replace placeholder access with real per-book sides once DB columns are known.
    const placeholderSides = {
      draftkings: { open: undefined, close: undefined },
      fanduel: { open: undefined, close: undefined },
      pinnacle: { open: undefined, close: undefined },
      betmgm: { open: undefined, close: undefined },
      bovada: { open: undefined, close: undefined },
      betonline: { open: undefined, close: undefined },
      bookmaker: { open: undefined, close: undefined },
    };

    return placeholderSides[sportsbook as keyof typeof placeholderSides] || { open: undefined, close: undefined };
  };

  return (
    <div className="space-y-8">
      
      {/* SECTION 1: TREND ANALYSIS (Same as previous) */}
      <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        {/* CONTROLS ROW */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          
          {/* Stat Toggles */}
          <div className="overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
            <StatToggle selected={selectedStat} onChange={setSelectedStat} />
          </div>

          {/* Season Dropdown */}
          <div className="flex items-center gap-3 min-w-fit" ref={seasonDropdownRef}>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Season</label>
            <div className="relative">
              <button
                onClick={() => setShowSeasonDropdown(!showSeasonDropdown)}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-900 font-medium transition-all hover:bg-slate-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
              >
                <span>{selectedSeason}</span>
                <ChevronDownIcon />
              </button>

              {showSeasonDropdown && (
                <div className="absolute top-full right-0 mt-2 bg-white border border-slate-200 rounded-lg shadow-lg z-50 min-w-[120px]">
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

      {/* CHARTS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-500 uppercase mb-4 tracking-wider">Trend Analysis</h3>
          {loading ? (
            <div className="h-80 flex items-center justify-center text-slate-400">Loading trend data...</div>
          ) : errorMsg ? (
            <div className="h-80 flex items-center justify-center text-red-400">{errorMsg}</div>
          ) : data.length === 0 ? (
            <div className="h-80 flex items-center justify-center text-slate-400">No data available</div>
          ) : (
            <div style={{ width: '100%', height: '350px' }}>
              <ResponsiveContainer width="100%" height="100%" minHeight={350}>
                <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="stat_date"
                    tickFormatter={(d) => d.substring(5)}
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    tickLine={false}
                    axisLine={false}
                    minTickGap={30}
                  />
                  <YAxis 
                    tick={{ fontSize: 11, fill: '#94a3b8' }} 
                    tickLine={false}
                    axisLine={false}
                    width={35}
                    domain={['auto', 'auto']}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#2563eb"
                    strokeWidth={3}
                    dot={false}
                    activeDot={{ r: 6, fill: '#2563eb', strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* KPI Card */}
        <div className="lg:col-span-1 bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Current League Avg</p>
          <div className="text-5xl font-black text-slate-900 tracking-tight mb-4">
            {currentValue !== undefined ? currentValue.toFixed(1) : '–'}
          </div>
          <div className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-100 text-blue-700 w-fit">
            {selectedStat.replace(/_/g, ' ').toUpperCase()}
          </div>
        </div>
      </div>
      </section>

      {/* SECTION 2: TODAY'S SCHEDULE - UPDATED COLUMNS */}
      <section className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 px-2">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Calendar size={20} className="text-blue-600" />
              <h3 className="text-lg font-bold text-slate-900">Today's Matchups</h3>
              <span className="hidden md:inline ml-2 text-sm font-semibold text-slate-400">— {displayDate}</span>
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={() => handleRetrieve('Totals')} disabled={isUpdating} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg font-bold text-xs text-slate-700 hover:bg-slate-50 shadow-sm disabled:opacity-50">
              <Hash size={14} className="text-emerald-600" />
              {isUpdating ? 'Updating...' : 'Retrieve Totals'}
            </button>
            <button onClick={() => handleRetrieve('Spreads')} disabled={isUpdating} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg font-bold text-xs text-slate-700 hover:bg-slate-50 shadow-sm disabled:opacity-50">
              <Calculator size={14} className="text-blue-600" />
              {isUpdating ? 'Updating...' : 'Retrieve Spreads'}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="w-1 px-4 py-4 text-left text-xs font-bold text-slate-500 uppercase">Teams</th>
                  <th className="px-4 py-4 text-center text-xs font-bold text-slate-500 uppercase">Location</th>
                  <th className="px-4 py-4 text-center text-xs font-bold text-slate-500 uppercase">Proj. Score</th>
                  <th className="px-4 py-4 text-center text-xs font-bold text-slate-500 uppercase">Proj. Poss.</th>
                  <th className="px-4 py-4 text-center text-xs font-bold text-slate-500 uppercase">Proj. Winner</th>
                  <th className="px-4 py-4 text-center text-xs font-bold text-slate-500 uppercase">Totals (O/C)</th>
                  <th className="px-4 py-4 text-right text-xs font-bold text-slate-500 uppercase">Side (O/C)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loadingGames ? (
                  <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-400 font-medium">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 opacity-20" /> Loading...
                  </td></tr>
                ) : todaysGames.length > 0 ? (
                  todaysGames.map((game, idx) => {
                    const rowKey = getRowKey(game, idx);
                    const isExpanded = expandedRowId === rowKey;
                    const totals = getTotalsForBook(game, DEFAULT_SPORTSBOOK);
                    const sides = getSidesForBook(game, DEFAULT_SPORTSBOOK);

                    return (
                    <React.Fragment key={rowKey}>
                    <tr
                      className="hover:bg-blue-50/30 transition-colors cursor-pointer"
                      onClick={() => setExpandedRowId(isExpanded ? null : rowKey)}
                    >
                      {/* Teams Column */}
                      <td className="w-1 px-4 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-bold text-slate-900">{game.team1?.team_name}</span>
                          <span className="font-bold text-slate-900">{game.team2?.team_name}</span>
                        </div>
                      </td>

                      {/* Location Column */}
                      <td className="px-4 py-4 text-center">
                      <div className="flex flex-col items-center justify-center gap-1">
                        {/* Primary Location Badge */}
                        <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-500 bg-slate-50 px-2 py-1 rounded border border-slate-100">
                          <MapPin size={12} className="text-slate-400" />
                          {game.location || 'Neutral'}
                        </div>
                        
                        {/* Conditional Home Team Label */}
                        {game.home_team_id ? (
                          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tight">
                            Home: {game.home_team_id === game.team1_id ? game.team1?.team_name : game.team2?.team_name}
                          </span>
                        ) : (
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight italic">
                            Neutral Site
                          </span>
                        )}
                      </div>
                    </td>
                   

                      {/* Predicted Score Column */}
                      <td className="px-4 py-4 text-center font-mono font-bold text-slate-900 text-base">
                        {game.predicted_score || '--'}
                      </td>

                      {/* Possessions Column */}
                      <td className="px-4 py-4 text-center">
                        <span className="text-xs font-bold text-slate-600">{game.predicted_possessions || '--'}</span>
                      </td>

                      {/* Projected Winner Column */}
                      <td className="px-4 py-4 text-center">
                        <span className="inline-flex items-center px-2 py-1 rounded text-[10px] font-black bg-green-100 text-green-700 uppercase border border-green-200">
                          {game.winner?.team_name || 'TBD'}
                        </span>
                      </td>

                      {/* Totals Column */}
                      <td className="px-4 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="flex flex-col items-center min-w-[30px]">
                            <span className="text-[9px] text-slate-400 font-bold uppercase">O</span>
                            <span className="font-bold text-slate-700">{totals.open || '—'}</span>
                          </div>
                          <div className="h-6 w-[1px] bg-slate-200" />
                          <div className="flex flex-col items-center min-w-[30px]">
                            <span className="text-[9px] text-slate-400 font-bold uppercase">C</span>
                            <span className="font-bold text-blue-600">{totals.close || '—'}</span>
                          </div>
                        </div>
                      </td>

                      {/* Sides Column */}
                      <td className="px-4 py-4 text-right">
                        <div className="flex flex-col items-end gap-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] text-slate-400 font-bold uppercase">O</span>
                            <span className="font-mono font-bold text-slate-700 w-10 text-right">{sides.open > 0 ? `+${sides.open}` : sides.open || '—'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] text-slate-400 font-bold uppercase text-blue-600">C</span>
                            <span className="font-mono font-bold text-blue-600 w-10 text-right">{sides.close > 0 ? `+${sides.close}` : sides.close || '—'}</span>
                          </div>
                        </div>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="bg-blue-50/30 border-b border-slate-100">
                        <td colSpan={7} className="px-6 py-4">
                          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="bg-slate-50 border-b border-slate-200">
                                  <th className="px-4 py-3 text-left font-bold text-slate-900">Sportsbook</th>
                                  <th className="px-4 py-3 text-center font-bold text-slate-700">Totals (O/C)</th>
                                  <th className="px-4 py-3 text-right font-bold text-slate-700">Side (O/C)</th>
                                </tr>
                              </thead>
                              <tbody>
                                {SPORTSBOOKS.map((book) => {
                                  const bookTotals = getTotalsForBook(game, book);
                                  const bookSides = getSidesForBook(game, book);

                                  return (
                                    <tr key={book} className="border-b border-slate-100 last:border-b-0">
                                      <td className="px-4 py-3 text-left font-semibold text-slate-900 uppercase text-xs tracking-wide">
                                        {book}
                                      </td>
                                      <td className="px-4 py-3 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                          <div className="flex flex-col items-center min-w-[30px]">
                                            <span className="text-[9px] text-slate-400 font-bold uppercase">O</span>
                                            <span className="font-bold text-slate-700">{bookTotals.open || '—'}</span>
                                          </div>
                                          <div className="h-6 w-[1px] bg-slate-200" />
                                          <div className="flex flex-col items-center min-w-[30px]">
                                            <span className="text-[9px] text-slate-400 font-bold uppercase">C</span>
                                            <span className="font-bold text-blue-600">{bookTotals.close || '—'}</span>
                                          </div>
                                        </div>
                                      </td>
                                      <td className="px-4 py-3 text-right">
                                        <div className="flex flex-col items-end gap-1">
                                          <div className="flex items-center gap-2">
                                            <span className="text-[9px] text-slate-400 font-bold uppercase">O</span>
                                            <span className="font-mono font-bold text-slate-700 w-10 text-right">
                                              {bookSides.open > 0 ? `+${bookSides.open}` : bookSides.open || '—'}
                                            </span>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <span className="text-[9px] text-slate-400 font-bold uppercase text-blue-600">C</span>
                                            <span className="font-mono font-bold text-blue-600 w-10 text-right">
                                              {bookSides.close > 0 ? `+${bookSides.close}` : bookSides.close || '—'}
                                            </span>
                                          </div>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                    </React.Fragment>
                  )})
                ) : (
                  <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-400">No games found in day_schedule.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
};
