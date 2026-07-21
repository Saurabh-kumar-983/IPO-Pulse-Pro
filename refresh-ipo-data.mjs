import { readFile } from 'node:fs/promises';
import { createClient } from '@supabase/supabase-js';

const required = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing environment variable: ${key}`);
  }
}

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const file = new URL('../data/manual-ipos.json', import.meta.url);
const raw = await readFile(file, 'utf8').catch(() => '[]');
const records = JSON.parse(raw);

if (!Array.isArray(records)) {
  throw new Error('data/manual-ipos.json must be an array');
}

if (!records.length) {
  console.log('No manual IPO records found. Nothing to sync.');
  process.exit(0);
}

const companies = records.map((item) => ({
  company_name: item.company_name,
  ticker: item.ticker ?? null,
  exchange: item.exchange ?? null,
  sector: item.sector ?? null,
  status: item.status ?? 'filed',
  expected_pricing_date: item.expected_pricing_date ?? null,
  expected_listing_date: item.expected_listing_date ?? null,
  current_price_range_low: item.current_price_range_low ?? null,
  current_price_range_high: item.current_price_range_high ?? null,
  estimated_deal_size: item.estimated_deal_size ?? null,
  shares_offered: item.shares_offered ?? null,
  description: item.description ?? null,
  last_source: item.last_source ?? 'manual-json',
  source_label: item.source_label ?? 'manual sync',
  trust_label: item.trust_label ?? 'reviewed',
}));

const { error } = await supabase.from('ipo_companies').upsert(companies, { onConflict: 'company_name' });
if (error) throw error;

console.log(`Synced ${companies.length} IPO company records.`);
