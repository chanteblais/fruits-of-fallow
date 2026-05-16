-- ─── Global cards (78 rows, seeded once, shared across all users) ─────────────
create table if not exists cards (
  id text primary key
);

insert into cards (id) values
  ('M00'),('M01'),('M02'),('M03'),('M04'),('M05'),('M06'),('M07'),
  ('M08'),('M09'),('M10'),('M11'),('M12'),('M13'),('M14'),('M15'),
  ('M16'),('M17'),('M18'),('M19'),('M20'),('M21'),
  ('W01'),('W02'),('W03'),('W04'),('W05'),('W06'),('W07'),('W08'),('W09'),('W10'),
  ('WPa'),('WKn'),('WQu'),('WKi'),
  ('C01'),('C02'),('C03'),('C04'),('C05'),('C06'),('C07'),('C08'),('C09'),('C10'),
  ('CPa'),('CKn'),('CQu'),('CKi'),
  ('S01'),('S02'),('S03'),('S04'),('S05'),('S06'),('S07'),('S08'),('S09'),('S10'),
  ('SPa'),('SKn'),('SQu'),('SKi'),
  ('P01'),('P02'),('P03'),('P04'),('P05'),('P06'),('P07'),('P08'),('P09'),('P10'),
  ('PPa'),('PKn'),('PQu'),('PKi')
on conflict (id) do nothing;

-- ─── Per-user card customizations ─────────────────────────────────────────────
create table if not exists card_customizations (
  id uuid default gen_random_uuid() primary key,
  user_id text not null,
  card_id text not null references cards(id),
  personal_meanings jsonb default '[]',
  symbolism jsonb default '[]',
  archetype_notes jsonb default '[]',
  visual_notes text default '',
  associated_symbols jsonb default '[]',
  guidebook_drafts jsonb default '[]',
  last_updated timestamptz,
  unique(user_id, card_id)
);

-- ─── Journal entries ──────────────────────────────────────────────────────────
create table if not exists entries (
  id text primary key,
  user_id text not null,
  date text not null,
  card_id text not null,
  card_name text default '',
  suit text default '',
  orientation text default 'upright',
  primary_themes text default '',
  traditional_meaning text default '',
  personal_reflection text default '',
  how_appeared text default '',
  quotes_insights text default '',
  emerging_symbols jsonb default '[]',
  visual_direction text default '',
  psychological_themes jsonb default '[]',
  guidebook_notes text default '',
  created_at timestamptz not null,
  updated_at timestamptz not null
);

-- ─── Symbols ──────────────────────────────────────────────────────────────────
create table if not exists symbols (
  id text not null,
  user_id text not null,
  name text not null,
  meaning text default '',
  poetic_essence text default '',
  voice text default '',
  elemental_quality text default '',
  season text default '',
  recurring_contexts text default '',
  emotional_associations jsonb default '[]',
  connected_cards jsonb default '[]',
  appearances jsonb default '[]',
  evolution jsonb default '[]',
  field_notes jsonb default '[]',
  related_symbols jsonb default '[]',
  journal_backlinks jsonb default '[]',
  primary key (id, user_id)
);

-- ─── Themes ───────────────────────────────────────────────────────────────────
create table if not exists themes (
  id text not null,
  user_id text not null,
  name text not null,
  description text default '',
  related_cards jsonb default '[]',
  occurrences jsonb default '[]',
  emotional_patterns jsonb default '[]',
  evolved_meanings jsonb default '[]',
  primary key (id, user_id)
);

-- ─── Images ───────────────────────────────────────────────────────────────────
create table if not exists images (
  id text primary key,
  user_id text not null,
  storage_path text not null,
  url text not null,
  ref_type text not null,
  ref_id text not null,
  caption text default '',
  iteration text default '',
  date timestamptz not null
);

-- ─── Entry analysis ───────────────────────────────────────────────────────────
create table if not exists entry_analysis (
  id text primary key,
  user_id text not null,
  entry_id text not null,
  card_id text not null,
  living_arcana_json jsonb default '{}',
  weaving_json jsonb default '{}',
  cross_links_json jsonb default '{}',
  not_archived_json jsonb default '[]',
  created_at timestamptz not null,
  unique(entry_id, user_id)
);

-- ─── Weaving threads ──────────────────────────────────────────────────────────
create table if not exists weaving_threads (
  id text primary key,
  user_id text not null,
  title text not null,
  focus text default '',
  body text not null,
  threads_json jsonb default '[]',
  entry_ids jsonb default '[]',
  cards_observed jsonb default '[]',
  symbols_observed jsonb default '[]',
  entry_count integer default 0,
  created_at timestamptz not null
);

-- ─── Style bible ──────────────────────────────────────────────────────────────
create table if not exists style_bible (
  user_id text primary key,
  palette jsonb default '[{"hex":"#0a0a16","label":"Deep Void"},{"hex":"#c9a84c","label":"Ink Gold"},{"hex":"#e2d9c8","label":"Vellum Cream"}]',
  textures text default '',
  lighting text default '',
  composition text default '',
  typography text default '',
  borders text default '',
  placement text default '',
  art_refs jsonb default '[]',
  motifs jsonb default '[]',
  drift_notes jsonb default '[]'
);
