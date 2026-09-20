-- Run once in Supabase → SQL Editor → New query.
-- Service role (server) bypasses RLS. Anon/authenticated cannot read or write.

create table if not exists meta (
  key text primary key,
  value text
);

create table if not exists users (
  handle text primary key, -- stored lowercase; X handles are case-insensitive
  name text,
  avatar text,
  followers integer default 0,
  account_created_at timestamptz,
  verified boolean default false,
  wallet text,
  linked_at timestamptz
);

create table if not exists tweets (
  id text primary key,
  handle text not null references users(handle),
  text text not null,
  url text,
  posted_at timestamptz,
  first_seen timestamptz,
  source text,
  likes integer default 0,
  replies integer default 0,
  retweets integer default 0,
  quotes integer default 0,
  impressions integer default 0,
  verdict_override text
);

create table if not exists scores (
  tweet_id text primary key references tweets(id),
  verdict text,
  score integer,
  weight double precision,
  reasons jsonb,
  factors jsonb,
  scored_at timestamptz
);

create table if not exists payouts (
  id text primary key,
  tweet_id text unique references tweets(id),
  handle text,
  wallet text,
  amount_usd double precision default 0,
  status text,
  reason text,
  created_at timestamptz,
  sent_at timestamptz,
  tx text
);

create index if not exists tweets_posted_at_idx on tweets (posted_at desc);
create index if not exists payouts_status_idx on payouts (status);
create index if not exists payouts_handle_idx on payouts (handle);

alter table meta enable row level security;
alter table users enable row level security;
alter table scores enable row level security;
alter table tweets enable row level security;
alter table payouts enable row level security;

revoke all on table meta, users, tweets, scores, payouts from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
