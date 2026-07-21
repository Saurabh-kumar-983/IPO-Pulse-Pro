export const APP_CONFIG = {
  appName: "IPO Pulse Pro",
  supabaseUrl: "https://iizpmjortvijdwyydtec.supabase.co",
  supabaseAnonKey:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlpenBtam9ydHZpamR3eXlkdGVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyOTEwMTcsImV4cCI6MjA5Nzg2NzAxN30.41CO6OSasC1b6m6uoNzURgNQGymOciABNpr1-FVO-8w",
  companyTable: "ipo_companies",
  eventTable: "ipo_events",
  publicSourceTable: "ipo_source_health",
  fallbackMode: true,
  watchlistStorageKey: "ipo-pulse-pro-watchlist",
  filters: {
    statuses: ["filed", "marketing", "pricing", "listed", "withdrawn"],
    exchanges: ["NASDAQ", "NYSE", "BATS"],
  },
};
