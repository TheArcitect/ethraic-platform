-- sessions: one per browser run or explicit new session
create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  user_id text,
  started_at timestamptz not null default now()
);

-- messages: user and assistant turns
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(id) on delete cascade,
  role text not null check (role in ('user','assistant')),
  content text not null,
  created_at timestamptz not null default now()
);
create index if not exists messages_session_created_idx on messages(session_id, created_at);

-- metrics: per assistant turn
create table if not exists metrics (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(id) on delete cascade,
  message_id uuid not null references messages(id) on delete cascade,
  clarity int,
  depth int,
  entropy float8,
  phase text,
  created_at timestamptz not null default now()
);
create index if not exists metrics_session_created_idx on metrics(session_id, created_at);

-- voice telemetry (cue on/off, tts played, etc.)
create table if not exists voice_events (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(id) on delete cascade,
  kind text not null,                -- e.g., 'tts_play', 'mic_toggle'
  payload jsonb,                     -- optional details
  created_at timestamptz not null default now()
);
create index if not exists voice_events_session_created_idx on voice_events(session_id, created_at);
