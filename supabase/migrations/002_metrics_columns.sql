alter table metrics
  add column if not exists novelty float8,
  add column if not exists coherence float8,
  add column if not exists composite float8,
  add column if not exists composite_ema float8;
