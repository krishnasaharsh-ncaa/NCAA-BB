// Stats that come from tr_team_daily_stats (daily stat table)
export type DailyStatKey =
  | 'three_p_pct'
  | 'two_p_pct'
  | 'ft_pct'
  | 'three_point_rate'
  | 'ftm_pg'
  | 'opp_three_p_pct'
  | 'opp_two_p_pct'
  | 'opp_ft_pct'
  | 'opp_ftm_pg'
  | 'opp_three_point_rate';

// Global stats (used elsewhere in team dashboards or regression)
export type GlobalStatKey =
  | DailyStatKey
  | 'off_eff'
  | 'def_eff'
  | 'kp_total';

// Keep StatKey if needed elsewhere
export type StatKey = GlobalStatKey;


export interface TeamDailyStat {
  team_id: string;
  team_name?: string;
  stat_date: string; // ISO date
  season: number;
  three_p_pct?: number;
  two_p_pct?: number;
  ft_pct?: number;
  off_eff?: number;
  def_eff?: number;
  kp_total?: number;
}

export interface LeagueDailyAggregate {
  stat_date: string;
  value: number;
}

export interface GameRow {
  id: string;                 // primary key or game_id
  team_id: string;            // the selected team
  team_name?: string;         // optional from join
  opponent_name: string;      
  actual_score: string;
  game_date: string;
  home_away: 'Home' | 'Away' | 'Neutral';  // computed based on home_team_id + neutral flag
  team_score: number;         // computed from winner/loser + team identity
  opponent_score: number;     
  open_total?: number;
  close_total?: number;
  game_total?: number;
  kp_total?: number;
  predicted_score?: number;
  predicted_possessions?: number;
  win_probability?: string;
  winner_id: string;
}