// app.js
import { APP_CONFIG } from './config.js';

const { createClient } = window.supabase;
const supabase = createClient(APP_CONFIG.supabaseUrl, APP_CONFIG.supabaseAnonKey, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  realtime: { params: { eventsPerSecond: 4 } },
});

const state = {
  activeView: 'dashboard',
  companies: [],
  events: [],
  selectedCompanyId: null,
  filters: { search: '', status: 'all', exchange: 'all', sort: 'updated_desc' },
  usingFallback: false,
};

const mockCompanies = [
  {
    id: 'mock-1',
    company_name: 'Northstar Compute',
    ticker: 'NSTC',
    exchange: 'NASDAQ',
    sector: 'AI Infrastructure',
    status: 'pricing',
    expected_listing_date: '2026-07-24',
    expected_pricing_date: '2026-07-23',
    current_price_range_low: 22,
    current_price_range_high: 25,
    estimated_deal_size: 920000000,
    shares_offered: 36800000,
    description: 'GPU cloud infrastructure provider with hyperscaler and enterprise demand tailwinds.',
    source_label: 'Official SEC + desk intelligence',
    trust_label: 'Estimated pricing window',
    updated_at: new Date().toISOString(),
  },
  {
    id: 'mock-2',
    company_name: 'Helio Robotics',
    ticker: 'HLRO',
    exchange: 'NYSE',
    sector: 'Industrial Automation',
    status: 'marketing',
    expected_listing_date: '2026-07-31',
    expected_pricing_date: '2026-07-30',
    current_price_range_low: 16,
    current_price_range_high: 19,
    estimated_deal_size: 410000000,
    shares_offered: 22100000,
    description: 'Warehouse robotics and fulfillment software operator expanding across North America and Europe.',
    source_label: 'SEC filing data',
    trust_label: 'Filed and marketing',
    updated_at: new Date().toISOString(),
  },
  {
    id: 'mock-3',
    company_name: 'Atlas BioSystems',
    ticker: 'ATLB',
    exchange: 'NASDAQ',
    sector: 'Biotech',
    status: 'filed',
    expected_listing_date: '2026-08-12',
    expected_pricing_date: '2026-08-11',
    current_price_range_low: null,
    current_price_range_high: null,
    estimated_deal_size: 185000000,
    shares_offered: 12300000,
    description: 'Precision oncology platform advancing next-generation diagnostics and companion therapies.',
    source_label: 'Initial S-1',
    trust_label: 'Early stage',
    updated_at: new Date().toISOString(),
  }
];

const mockEvents = [
  { id: 'e1', event_type: 'amended', title: 'Northstar Compute widened range', detail: 'Price range moved from $20-$23 to $22-$25 ahead of pricing.', company_name: 'Northstar Compute', event_time: new Date().toISOString(), source: 'SEC amendment' },
  { id: 'e2', event_type: 'filed', title: 'Atlas BioSystems filed initial S-1', detail: 'New biotech filing entered the IPO pipeline with oncology focus.', company_name: 'Atlas BioSystems', event_time: new Date(Date.now() - 3600 * 1000 * 4).toISOString(), source: 'SEC filing' }
];

const els = {
  pageTitle: document.getElementById('page-title'),
  companyGrid: document.getElementById('company-grid'),
  calendarList: document.getElementById('calendar-list'),
  pipelineBody: document.getElementById('pipeline-body'),
  eventFeed: document.getElementById('event-feed'),
  detailName: document.getElementById('detail-name'),
  detailCard: document.getElementById('detail-card'),
  statsGrid: document.getElementById('stats-grid'),
  radarCount: document.getElementById('radar-count'),
  sourceGrid: document.getElementById('source-grid'),
  searchInput: document.getElementById('search-input'),
  statusFilter: document.getElementById('status-filter'),
  exchangeFilter: document.getElementById('exchange-filter'),
  sortFilter: document.getElementById('sort-filter'),
  navLinks: [...document.querySelectorAll('.nav-link')],
  views: {
    dashboard: document.getElementById('view-dashboard'),
    calendar: document.getElementById('view-calendar'),
    pipeline: document.getElementById('view-pipeline'),
    watchlist: document.getElementById('view-watchlist'),
    sources: document.getElementById('view-sources'),
  },
  watchlistGrid: document.getElementById('watchlist-grid'),
  watchlistToggle: document.getElementById('watchlist-toggle'),
  authBtn: document.getElementById('auth-btn'),
  refreshBtn: document.getElementById('refresh-btn'),
  heroRefresh: document.getElementById('hero-live-refresh'),
  heroDemo: document.getElementById('hero-demo-fill'),
  trackedCount: document.getElementById('tracked-count'),
  lastSync: document.getElementById('last-sync'),
  dataMode: document.getElementById('data-mode'),
  realtimeStatus: document.getElementById('realtime-status'),
  connectionState: document.getElementById('connection-state'),
  toast: document.getElementById('toast'),
};

function showToast(message) {
  if (!els.toast) return;
  els.toast.textContent = message;
  els.toast.classList.remove('hidden');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => els.toast.classList.add('hidden'), 2600);
}

function watchlistIds() {
  try {
    const raw = localStorage.getItem(APP_CONFIG.watchlistStorageKey || 'ipo-watchlist');
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function setWatchlistIds(ids) {
  localStorage.setItem(APP_CONFIG.watchlistStorageKey || 'ipo-watchlist', JSON.stringify(ids));
}

function toggleWatchlist(id) {
  const ids = new Set(watchlistIds());
  if (ids.has(id)) {
    ids.delete(id);
    showToast('Removed from watchlist');
  } else {
    ids.add(id);
    showToast('Saved to watchlist');
  }
  setWatchlistIds([...ids]);
  renderWatchlist();
  renderDetail();
}

async function fetchLiveData() {
  try {
    const [{ data: companies, error: companyError }, { data: events, error: eventError }] = await Promise.all([
      supabase.from(APP_CONFIG.companyTable).select('*').order('updated_at', { ascending: false }).limit(50),
      supabase.from(APP_CONFIG.eventTable).select('*').order('event_time', { ascending: false }).limit(20),
    ]);

    if (companyError || eventError || !companies?.length) throw companyError || eventError || new Error('No live rows yet');

    state.companies = companies.map((item) => ({ ...item, source_label: item.last_source || item.source_label }));
    state.events = events || [];
    state.usingFallback = false;
    showToast('Live IPO data loaded');
  } catch (error) {
    state.companies = mockCompanies;
    state.events = mockEvents;
    state.usingFallback = true;
    showToast('Using demo fallback until Supabase tables are populated');
  }
  renderAll();
}

function setView(view) {
  state.activeView = view;
  if (els.pageTitle) {
    els.pageTitle.textContent = {
      dashboard: 'Executive Dashboard',
      calendar: 'IPO Calendar',
      pipeline: 'Pipeline Control',
      watchlist: 'Personal Watchlist',
      sources: 'Source Health'
    }[view] || 'Dashboard';
  }

  Object.entries(els.views).forEach(([key, el]) => {
    if (el) el.classList.toggle('hidden', key !== view);
  });

  els.navLinks.forEach((btn) => btn.classList.toggle('active', btn.dataset.view === view));
}

// Function bindings & initialization
function bindEvents() {
  els.navLinks.forEach((btn) => btn.addEventListener('click', () => setView(btn.dataset.view)));
  [els.searchInput, els.statusFilter, els.exchangeFilter, els.sortFilter].forEach((el) => el && el.addEventListener('input', applyFilters));
  if (els.refreshBtn) els.refreshBtn.addEventListener('click', fetchLiveData);
  if (els.heroRefresh) els.heroRefresh.addEventListener('click', fetchLiveData);
  if (els.heroDemo) els.heroDemo.addEventListener('click', () => {
    state.companies = mockCompanies;
    state.events = mockEvents;
    state.usingFallback = true;
    renderAll();
    showToast('Demo data loaded');
  });
  if (els.authBtn) els.authBtn.addEventListener('click', signInFlow);
  if (els.watchlistToggle) els.watchlistToggle.addEventListener('click', () => state.selectedCompanyId && toggleWatchlist(state.selectedCompanyId));
}

async function init() {
  bindEvents();
  await loadSession();
  await fetchLiveData();
  attachRealtime();
  supabase.auth.onAuthStateChange(() => loadSession());
}

init();
