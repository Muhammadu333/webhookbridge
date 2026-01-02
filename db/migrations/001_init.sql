create extension if not exists "uuid-ossp";

create type event_status as enum ('pending', 'processing', 'processed', 'dead');

create table if not exists events (
  id uuid primary key default uuid_generate_v4(),
  provider text not null,
  idempotency_key text not null,
  signature_valid boolean not null,
  status event_status not null default 'pending',
  attempts int not null default 0,
  last_error text,
  payload jsonb not null,
  received_at timestamptz not null default now(),
  processed_at timestamptz
);

create unique index if not exists events_provider_idempotency_key_uq
  on events (provider, idempotency_key);

