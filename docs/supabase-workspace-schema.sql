create table if not exists public.workspace_states (
  id text primary key,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.workspace_states enable row level security;

drop policy if exists "workspace_states_read_for_mvp" on public.workspace_states;
create policy "workspace_states_read_for_mvp"
on public.workspace_states
for select
to anon
using (true);

drop policy if exists "workspace_states_insert_for_mvp" on public.workspace_states;
create policy "workspace_states_insert_for_mvp"
on public.workspace_states
for insert
to anon
with check (true);

drop policy if exists "workspace_states_update_for_mvp" on public.workspace_states;
create policy "workspace_states_update_for_mvp"
on public.workspace_states
for update
to anon
using (true)
with check (true);
