-- Kept · Supabase schema
-- Run once per project: Dashboard → SQL Editor → New query → paste → Run.
--
-- The app stores the whole local state as one JSONB document per user.
-- Writes go through push_kept_state(), which is atomic and revision-checked.

create table if not exists public.kept_state (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  state      jsonb not null,
  revision   bigint not null default 1,
  client_id  text,
  updated_at timestamptz not null default now()
);

alter table public.kept_state enable row level security;

-- RLS policies do nothing without table grants. Without these, signed-in
-- clients get "permission denied for table kept_state" (42501).
grant usage on schema public to authenticated;
grant select, insert, update, delete on table public.kept_state to authenticated;

drop policy if exists kept_state_select_own on public.kept_state;
drop policy if exists kept_state_insert_own on public.kept_state;
drop policy if exists kept_state_update_own on public.kept_state;
drop policy if exists kept_state_delete_own on public.kept_state;

create policy kept_state_select_own on public.kept_state
  for select using (auth.uid() = user_id);

create policy kept_state_insert_own on public.kept_state
  for insert with check (auth.uid() = user_id);

create policy kept_state_update_own on public.kept_state
  for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy kept_state_delete_own on public.kept_state
  for delete using (auth.uid() = user_id);

-- Compare-and-set push. A stale p_base_revision raises SQLSTATE 40001,
-- which the client reports as "Cloud data changed on another device."
create or replace function public.push_kept_state(
  p_state jsonb,
  p_base_revision bigint,
  p_client_id text default null
)
returns bigint
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_rev bigint;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  select revision into v_rev
    from public.kept_state
   where user_id = auth.uid()
   for update;

  if not found then
    insert into public.kept_state (user_id, state, revision, client_id)
    values (auth.uid(), p_state, 1, p_client_id)
    returning revision into v_rev;
    return v_rev;
  end if;

  if p_base_revision is distinct from v_rev then
    raise exception 'revision_conflict' using errcode = '40001';
  end if;

  update public.kept_state
     set state = p_state,
         revision = v_rev + 1,
         updated_at = now(),
         client_id = p_client_id
   where user_id = auth.uid()
   returning revision into v_rev;

  return v_rev;
end;
$$;

revoke all on function public.push_kept_state(jsonb, bigint, text) from public;
revoke all on function public.push_kept_state(jsonb, bigint, text) from anon;
grant execute on function public.push_kept_state(jsonb, bigint, text) to authenticated;

-- Read-only views. The JSONB row stays the single source of truth; these
-- exist so you can query the ledger from the dashboard or any SQL client.
-- security_invoker makes the caller's RLS apply to the view.

create or replace view public.kept_sessions
with (security_invoker = true) as
select
  k.user_id,
  k.updated_at,
  s->>'id' as id,
  nullif(s->>'date', '')::date as date,
  s->>'dayName' as day_name,
  nullif(s->>'week', '')::int as week,
  s->>'phase' as phase,
  nullif(s->>'totalVolume', '')::numeric as total_volume,
  s as raw
from public.kept_state k
cross join lateral jsonb_array_elements(
  coalesce(k.state->'sessions', '[]'::jsonb)
) s;

create or replace view public.kept_body_logs
with (security_invoker = true) as
select
  k.user_id,
  k.updated_at,
  nullif(s->>'date', '')::date as date,
  nullif(s->>'weightKg', '')::numeric as weight_kg,
  nullif(s->>'waistCm', '')::numeric as waist_cm,
  s as raw
from public.kept_state k
cross join lateral jsonb_array_elements(
  coalesce(k.state->'bodyLogs', '[]'::jsonb)
) s;

create or replace view public.kept_study_sessions
with (security_invoker = true) as
select
  k.user_id,
  k.updated_at,
  nullif(s->>'date', '')::date as date,
  nullif(s->>'minutes', '')::int as minutes,
  s->>'source' as source,
  coalesce(s->>'tag', '#focus') as tag,
  s as raw
from public.kept_state k
cross join lateral jsonb_array_elements(
  coalesce(k.state->'studySessions', '[]'::jsonb)
) s;

create or replace view public.kept_clean_log
with (security_invoker = true) as
select
  k.user_id,
  k.updated_at,
  nullif(s->>'date', '')::date as date,
  s->>'status' as status,
  s as raw
from public.kept_state k
cross join lateral jsonb_array_elements(
  coalesce(k.state->'cleanLog', '[]'::jsonb)
) s;

create or replace view public.kept_runs
with (security_invoker = true) as
select
  k.user_id,
  k.updated_at,
  nullif(s->>'date', '')::date as date,
  nullif(s->>'km', '')::numeric as km,
  nullif(s->>'minutes', '')::numeric as minutes,
  s as raw
from public.kept_state k
cross join lateral jsonb_array_elements(
  coalesce(k.state->'runs', '[]'::jsonb)
) s;

create or replace view public.kept_fees
with (security_invoker = true) as
select
  k.user_id,
  k.updated_at,
  nullif(s->>'date', '')::date as date,
  s->>'name' as name,
  nullif(s->>'amount', '')::numeric as amount,
  s as raw
from public.kept_state k
cross join lateral jsonb_array_elements(
  coalesce(k.state->'fees', '[]'::jsonb)
) s;

grant select on public.kept_sessions to authenticated;
grant select on public.kept_body_logs to authenticated;
grant select on public.kept_study_sessions to authenticated;
grant select on public.kept_clean_log to authenticated;
grant select on public.kept_runs to authenticated;
grant select on public.kept_fees to authenticated;

-- Shared phone-to-phone ledger (no sign-in). One JSON document for the whole site.
create table if not exists public.kept_ledger (
  id         text primary key default 'kept',
  state      jsonb not null,
  revision   bigint not null default 1,
  client_id  text,
  updated_at timestamptz not null default now()
);

alter table public.kept_ledger enable row level security;

drop policy if exists kept_ledger_public on public.kept_ledger;
create policy kept_ledger_public on public.kept_ledger
  for all using (true) with check (true);

grant select, insert, update on table public.kept_ledger to anon, authenticated;

create or replace function public.push_kept_ledger(
  p_id text,
  p_state jsonb,
  p_base_revision bigint,
  p_client_id text default null
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rev bigint;
begin
  select revision into v_rev
    from public.kept_ledger
   where id = p_id
   for update;

  if not found then
    begin
      insert into public.kept_ledger (id, state, revision, client_id)
      values (p_id, p_state, 1, p_client_id)
      returning revision into v_rev;
      return v_rev;
    exception when unique_violation then
      select revision into v_rev
        from public.kept_ledger
       where id = p_id
       for update;
    end;
  end if;

  if p_base_revision is distinct from v_rev then
    raise exception 'revision_conflict' using errcode = '40001';
  end if;

  update public.kept_ledger
     set state = p_state,
         revision = v_rev + 1,
         updated_at = now(),
         client_id = p_client_id
   where id = p_id
   returning revision into v_rev;

  return v_rev;
end;
$$;

revoke all on function public.push_kept_ledger(text, jsonb, bigint, text) from public;
grant execute on function public.push_kept_ledger(text, jsonb, bigint, text) to anon, authenticated;
