'use client';

import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { StatToggle } from './StatToggle';
import type { DailyStatKey, LeagueDailyAggregate } from '@/types/basketball';
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

export const LeagueOverview: React.FC = () => {
  const [selectedStat, setSelectedStat] = useState<DailyStatKey>('three_p_pct');
  const [selectedSeason, setSelectedSeason] = useState<number>(2025);
  const [showSeasonDropdown, setShowSeasonDropdown] = useState(false);
  const [data, setData] = useState<LeagueDailyAggregate[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [dbStatName, setDbStatName] = useState<string>('three-point-pct');

  const seasonDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (seasonDropdownRef.current && !seasonDropdownRef.current.contains(event.target as Node)) {
        setShowSeasonDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 1. Resolve DB Stat Name
  useEffect(() => {
    const match = Object.keys(STAT_MAP).find(k => STAT_MAP[k] === selectedStat);
    setDbStatName(match || selectedStat);
  }, [selectedStat]);

  // 2. Fetch Data
  useEffect(() => {
    if (!dbStatName) return;

    const fetchLeagueStats = async () => {
      setLoading(true);
      setErrorMsg(null);

      try {
        const { data: raw, error } = await supabase
          .from('league_daily_trends')
          .select('stat_date, avg_value')
          .eq('season_year', selectedSeason)
          .eq('stat_name', dbStatName)
          .order('stat_date', { ascending: true });

        if (error) throw error;

        if (!raw || raw.length === 0) {
          setData([]);
          return;
        }

        const formatted: LeagueDailyAggregate[] = raw.map(row => ({
          stat_date: row.stat_date,
          value: Number(row.avg_value)
        }));

        setData(formatted);

      } catch (err: any) {
        console.error("Fetch error:", err);
        setErrorMsg(err.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchLeagueStats();
  }, [dbStatName, selectedSeason]);

  const currentValue = data.length > 0 ? data[data.length - 1].value : undefined;

  return (
    <div className="space-y-6">
      
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
    </div>
  );
};