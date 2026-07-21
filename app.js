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
  filters: {
    search: '',
    status: 'all',
    exchange: 'all',
    sort: 'updated_desc',
  },
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
  },
  {
    id: 'mock-4',
    company_name: 'Quartz Payments',
    ticker: 'QPAY',
    exchange: 'NYSE',
    sector: 'Fintech',
    status: 'listed',
    expected_listing_date: '2026-07-10',
    expected_pricing_date: '2026-07-09',
    current_price_range_low: 27,
    current_price_range_high: 29,
    estimated_deal_size: 1300000000,
    shares_offered: 47000000,
    description: 'Cross-border embedded payments network serving marketplaces and financial institutions.',
    source_label: 'Listed',
    trust_label: 'Confirmed',
    updated_at: new Date().toISOString(),
  },
  {
    id: 'mock-5',
    company_name: 'Summit Energy Storage',
    ticker: 'SMES',
    exchange: 'NASDAQ',
    sector: 'Clean Energy',
    status: 'withdrawn',
    expected_listing_date: '2026-07-18',
    expected_pricing_date: '2026-07-17',
    current_price_range_low: 14,
    current_price_range_high: 16,
    estimated_deal_size: 260000000,
    shares_offered: 17100000,
    description: 'Grid-scale battery and software optimization business that paused its listing after market volatility.',
    source_label: 'RW filing',
    trust_label: 'Withdrawn',
    updated_at: new Date().toISOString(),
  },
];

const mockEvents = [
  { id: 'e1', event_type: 'amended', title: 'Northstar Compute widened range', detail: 'Price range moved from $20-$23 to $22-$25 ahead of pricing.', company_name: 'Northstar Compute', event_time: new Date().toISOString(), source: 'SEC amendment' },
  { id: 'e2', event_type: 'filed', title: 'Atlas BioSystems filed initial S-1', detail: 'New biotech filing entered the IPO pipeline with oncology focus.', company_name: 'Atlas BioSystems', event_time: new Date(Date.now() - 3600 * 1000 * 4).toISOString(), source: 'SEC filing' },
  { id: 'e3', event_type: 'listed', title: 'Quartz Payments started trading', detail: 'Opened above range and finished day one with strong volume.', company_name: 'Quartz Payments', event_time: new Date(Date.now() - 3600 * 1000 * 18).toISOString(), source: 'Exchange' },
  { id: 'e4', event_type: 'withdrawn', title: 'Summit Energy Storage withdrew', detail: 'Issuer postponed listing after recent sector volatility.', company_name: 'Summit Energy Storage', event_time: new Date(Date.now() - 3600 * 1000 * 28).toISOString(), source: 'SEC RW' },
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

function formatCurrency(value) {
  if (!value && value !== 0) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
}

function formatCompactCurrency(value) {
  if (!value && value !== 0) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 1 }).format(value);
}

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatRange(low, high) {
  if (low == null && high == null) return 'TBD';
  return `$${low ?? '—'} - $${high ?? '—'}`;
}

function relativeTime(value) {
  if (!value) return '—';
  const seconds = Math.floor((Date.now() - new Date(value).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function normalizeStatus(status = '') {
  return String(status).toLowerCase();
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.remove('hidden');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => els.toast.classList.add('hidden'), 2600);
}

function watchlistIds() {
  return JSON.parse(localStorage.getItem(APP_CONFIG.watchlistStorageKey) || '[]');
}

function setWatchlistIds(ids) {
  localStorage.setItem(APP_CONFIG.watchlistStorageKey, JSON.stringify(ids));
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

function matchesFilters(company) {
  const search = state.filters.search.trim().toLowerCase();
  const status = normalizeStatus(company.status);
  const exchange = (company.exchange || '').toUpperCase();
  const bySearch = !search || [company.company_name, company.ticker, company.sector, company.description].filter(Boolean).join(' ').toLowerCase().includes(search);
  const byStatus = state.filters.status === 'all' || status === state.filters.status;
  const byExchange = state.filters.exchange === 'all' || exchange === state.filters.exchange;
  return bySearch && byStatus && byExchange;
}

function sortCompanies(companies) {
  const items = [...companies];
  switch (state.filters.sort) {
    case 'date_asc':
      return items.sort((a, b) => new Date(a.expected_listing_date || 0) - new Date(b.expected_listing_date || 0));
    case 'deal_desc':
      return items.sort((a, b) => (b.estimated_deal_size || 0) - (a.estimated_deal_size || 0));
    case 'name_asc':
      return items.sort((a, b) => String(a.company_name).localeCompare(String(b.company_name)));
    default:
      return items.sort((a, b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0));
  }
}

function filteredCompanies() {
  return sortCompanies(state.companies.filter(matchesFilters));
}

function metric(label, value, note) {
  return `<article class="metric-card glass"><span>${label}</span><strong>${value}</strong><small>${note}</small></article>`;
}

function statusClass(status) {
  const key = normalizeStatus(status);
  if (['filed', 'amended', 'marketing'].includes(key)) return 'status-filed';
  if (key === 'pricing') return 'status-pricing';
  if (key === 'listed') return 'status-listed';
  if (key === 'withdrawn') return 'status-withdrawn';
  return 'status-filed';
}

function renderMetrics() {
  const companies = filteredCompanies();
  const pricingSoon = companies.filter((c) => normalizeStatus(c.status) === 'pricing').length;
  const listed = companies.filter((c) => normalizeStatus(c.status) === 'listed').length;
  const alerts = state.events.length;
  els.statsGrid.innerHTML = [
    metric('Total tracked', companies.length, 'matching current filters'),
    metric('Pricing in 7 days', pricingSoon, 'most actionable deals'),
    metric('Live this month', listed, 'already listed names'),
    metric('Change alerts', alerts, 'recent pipeline events'),
  ].join('');
  els.trackedCount.textContent = String(companies.length);
  els.radarCount.textContent = `${companies.length} issuers`;
}

function renderCompanyCards() {
  const companies = filteredCompanies();
  if (!companies.length) {
    els.companyGrid.innerHTML = '<div class="empty-box">No IPOs match the current filters.</div>';
    return;
  }
  els.companyGrid.innerHTML = companies.map((company) => `
    <article class="company-card" data-company-id="${company.id}">
      <header>
        <div>
          <h4>${company.company_name}</h4>
          <div class="card-meta">${company.ticker || 'TBD'} • ${company.exchange || 'Unassigned'} • ${company.sector || 'Sector TBD'}</div>
        </div>
        <span class="status-badge ${statusClass(company.status)}">${company.status}</span>
      </header>
      <p class="card-copy">${company.description || 'No company description yet. Add filing summary enrichment for this issuer.'}</p>
      <div class="card-foot">
        <div class="meta-block"><span class="mini-label">Expected listing</span><strong>${formatDate(company.expected_listing_date)}</strong></div>
        <div class="meta-block"><span class="mini-label">Estimated deal</span><strong>${formatCompactCurrency(company.estimated_deal_size)}</strong></div>
        <div class="meta-block"><span class="mini-label">Price range</span><strong>${formatRange(company.current_price_range_low, company.current_price_range_high)}</strong></div>
        <div class="meta-block"><span class="mini-label">Source label</span><strong>${company.source_label || company.last_source || 'Live data'}</strong></div>
      </div>
    </article>`).join('');

  [...els.companyGrid.querySelectorAll('[data-company-id]')].forEach((card) => {
    card.addEventListener('click', () => {
      state.selectedCompanyId = card.dataset.companyId;
      renderDetail();
    });
  });
}

function renderCalendar() {
  const companies = filteredCompanies().filter((c) => c.expected_listing_date || c.expected_pricing_date);
  if (!companies.length) {
    els.calendarList.innerHTML = '<div class="empty-box">No dated IPO events available.</div>';
    return;
  }
  els.calendarList.innerHTML = companies.map((company) => `
    <article class="calendar-card">
      <header>
        <div>
          <h4>${company.company_name}</h4>
          <div class="card-meta">${company.ticker || 'TBD'} • ${company.exchange || 'Unassigned'}</div>
        </div>
        <span class="status-badge ${statusClass(company.status)}">${company.status}</span>
      </header>
      <div class="calendar-meta">
        <div class="meta-block"><span class="mini-label">Pricing date</span><strong>${formatDate(company.expected_pricing_date)}</strong></div>
        <div class="meta-block"><span class="mini-label">Listing date</span><strong>${formatDate(company.expected_listing_date)}</strong></div>
      </div>
    </article>`).join('');
}

function renderPipeline() {
  const companies = filteredCompanies();
  if (!companies.length) {
    els.pipelineBody.innerHTML = '<tr><td colspan="7">No issuers match current filters.</td></tr>';
    return;
  }
  els.pipelineBody.innerHTML = companies.map((company) => `
    <tr>
      <td><strong>${company.company_name}</strong><br/><span class="detail-note">${company.ticker || 'TBD'}</span></td>
      <td><span class="status-badge ${statusClass(company.status)}">${company.status}</span></td>
      <td>${company.exchange || '—'}</td>
      <td>${formatDate(company.expected_listing_date || company.expected_pricing_date)}</td>
      <td>${formatRange(company.current_price_range_low, company.current_price_range_high)}</td>
      <td>${formatCompactCurrency(company.estimated_deal_size)}</td>
      <td><button class="btn btn-secondary small row-detail" data-company-id="${company.id}">View</button></td>
    </tr>`).join('');
  [...document.querySelectorAll('.row-detail')].forEach((btn) => btn.addEventListener('click', () => {
    state.selectedCompanyId = btn.dataset.companyId;
    renderDetail();
    showToast('Issuer details opened');
  }));
}

function renderEvents() {
  if (!state.events.length) {
    els.eventFeed.innerHTML = '<div class="empty-box">No event feed yet. Connect the refresh workflow or insert IPO events in Supabase.</div>';
    return;
  }
  els.eventFeed.innerHTML = state.events.map((event) => `
    <article class="event-item">
      <header>
        <span class="status-badge ${statusClass(event.event_type === 'amended' ? 'filed' : event.event_type)}">${event.event_type || 'update'}</span>
        <time>${relativeTime(event.event_time)}</time>
      </header>
      <strong>${event.title}</strong>
      <p>${event.detail || 'New pipeline event recorded.'}</p>
      <div class="detail-note">${event.company_name || 'IPO issuer'} • ${event.source || 'Source unknown'}</div>
    </article>`).join('');
}

function renderDetail() {
  const company = state.companies.find((item) => item.id === state.selectedCompanyId) || filteredCompanies()[0];
  if (!company) return;
  state.selectedCompanyId = company.id;
  els.detailName.textContent = company.company_name;
  const saved = watchlistIds().includes(company.id);
  els.watchlistToggle.textContent = saved ? '★ Saved' : '☆ Save';
  els.detailCard.classList.remove('empty-state');
  els.detailCard.innerHTML = `
    <div class="detail-topline">
      <div>
        <h4>${company.company_name}</h4>
        <div class="detail-note">${company.ticker || 'TBD'} • ${company.exchange || 'Unassigned'} • ${company.sector || 'Sector TBD'}</div>
      </div>
      <span class="status-badge ${statusClass(company.status)}">${company.status}</span>
    </div>
    <p class="detail-copy">${company.description || 'Add a generated filing summary here so users understand the issuer quickly.'}</p>
    <div class="kv-grid">
      <div class="meta-block"><span class="mini-label">Expected pricing</span><strong>${formatDate(company.expected_pricing_date)}</strong></div>
      <div class="meta-block"><span class="mini-label">Expected listing</span><strong>${formatDate(company.expected_listing_date)}</strong></div>
      <div class="meta-block"><span class="mini-label">Price range</span><strong>${formatRange(company.current_price_range_low, company.current_price_range_high)}</strong></div>
      <div class="meta-block"><span class="mini-label">Shares offered</span><strong>${company.shares_offered ? new Intl.NumberFormat('en-US').format(company.shares_offered) : '—'}</strong></div>
      <div class="meta-block"><span class="mini-label">Estimated deal</span><strong>${formatCurrency(company.estimated_deal_size)}</strong></div>
      <div class="meta-block"><span class="mini-label">Trust label</span><strong>${company.trust_label || company.source_label || 'Live data'}</strong></div>
    </div>
    <div class="detail-note">Updated ${relativeTime(company.updated_at)}</div>`;
}

function renderWatchlist() {
  const ids = watchlistIds();
  const companies = state.companies.filter((c) => ids.includes(c.id));
  if (!companies.length) {
    els.watchlistGrid.innerHTML = '<div class="empty-box">Save issuers from the detail panel to build a personal watchlist.</div>';
    return;
  }
  els.watchlistGrid.innerHTML = companies.map((company) => `
    <article class="company-card" data-company-id="${company.id}">
      <header>
        <div>
          <h4>${company.company_name}</h4>
          <div class="card-meta">${company.ticker || 'TBD'} • ${company.exchange || 'Unassigned'}</div>
        </div>
        <span class="status-badge ${statusClass(company.status)}">${company.status}</span>
      </header>
      <p class="card-copy">${company.description || 'No summary yet.'}</p>
    </article>`).join('');
  [...els.watchlistGrid.querySelectorAll('[data-company-id]')].forEach((card) => card.addEventListener('click', () => {
    state.selectedCompanyId = card.dataset.companyId;
    renderDetail();
  }));
}

function renderSources() {
  const cards = [
    { name: 'SEC EDGAR', health: 'Healthy', note: 'Primary source for filings and amendments. Use server-side ingestion for no-CORS access.' },
    { name: 'Nasdaq IPO page', health: 'Secondary', note: 'Useful market-facing listing layer. Tag expected dates as estimated when not confirmed.' },
    { name: 'NYSE IPO Center', health: 'Healthy', note: 'Good source for filed, amended, and withdrawn deal signals.' },
    { name: 'Vendor enrichment', health: 'Optional', note: 'Use for quotes, news, sector tags, and post-listing market performance.' },
  ];
  els.sourceGrid.innerHTML = cards.map((item) => `
    <article class="source-card">
      <span>${item.health}</span>
      <h4>${item.name}</h4>
      <p class="card-copy">${item.note}</p>
    </article>`).join('');
}

function renderAll() {
  renderMetrics();
  renderCompanyCards();
  renderCalendar();
  renderPipeline();
  renderEvents();
  renderWatchlist();
  renderSources();
  renderDetail();
  els.dataMode.textContent = state.usingFallback ? 'Demo fallback' : 'Supabase live';
  els.lastSync.textContent = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function setView(view) {
  state.activeView = view;
  els.pageTitle.textContent = ({ dashboard: 'Executive Dashboard', calendar: 'IPO Calendar', pipeline: 'Pipeline Control', watchlist: 'Personal Watchlist', sources: 'Source Health' })[view];
  Object.entries(els.views).forEach(([key, el]) => el.classList.toggle('hidden', key !== view));
  els.navLinks.forEach((btn) => btn.classList.toggle('active', btn.dataset.view === view));
}

async function loadSession() {
  const { data } = await supabase.auth.getSession();
  const email = data.session?.user?.email;
  els.authBtn.textContent = email ? `Signed in: ${email}` : 'Sign in for Watchlist';
}

async function signInFlow() {
  const email = window.prompt('Enter your email for Supabase magic-link sign in:');
  if (!email) return;
  const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.href } });
  if (error) {
    showToast(error.message);
    return;
  }
  showToast('Magic link sent. Finish sign-in from your inbox.');
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

function applyFilters() {
  state.filters.search = els.searchInput.value;
  state.filters.status = els.statusFilter.value;
  state.filters.exchange = els.exchangeFilter.value;
  state.filters.sort = els.sortFilter.value;
  renderAll();
}

function attachRealtime() {
  const dot = document.querySelector('.live-dot');
  supabase.channel('ipo-live-dashboard')
    .on('postgres_changes', { event: '*', schema: 'public', table: APP_CONFIG.companyTable }, () => fetchLiveData())
    .on('postgres_changes', { event: '*', schema: 'public', table: APP_CONFIG.eventTable }, () => fetchLiveData())
    .subscribe((status) => {
      const connected = status === 'SUBSCRIBED';
      dot.classList.toggle('connected', connected);
      els.connectionState.textContent = connected ? 'Connected' : status;
      els.realtimeStatus.textContent = connected ? 'Active' : 'Inactive';
    });
}

function bindEvents() {
  els.navLinks.forEach((btn) => btn.addEventListener('click', () => setView(btn.dataset.view)));
  [els.searchInput, els.statusFilter, els.exchangeFilter, els.sortFilter].forEach((el) => el.addEventListener('input', applyFilters));
  els.refreshBtn.addEventListener('click', fetchLiveData);
  els.heroRefresh.addEventListener('click', fetchLiveData);
  els.heroDemo.addEventListener('click', () => {
    state.companies = mockCompanies;
    state.events = mockEvents;
    state.usingFallback = true;
    renderAll();
    showToast('Demo data loaded');
  });
  els.authBtn.addEventListener('click', signInFlow);
  els.watchlistToggle.addEventListener('click', () => state.selectedCompanyId && toggleWatchlist(state.selectedCompanyId));
}

async function init() {
  bindEvents();
  await loadSession();
  await fetchLiveData();
  attachRealtime();
  supabase.auth.onAuthStateChange(() => loadSession());
}

init();
