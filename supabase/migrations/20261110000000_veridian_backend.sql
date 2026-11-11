-- Veridian backend: accounts, study records, and bring-your-own NVIDIA keys.
-- Safe to re-run in the Supabase SQL editor.

create table if not exists public.app_records (
  id uuid primary key default gen_random_uuid(),
  entity text not null check (char_length(entity) between 1 and 80),
  owner_id uuid references auth.users (id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists app_records_entity_owner_idx
  on public.app_records (entity, owner_id);

create index if not exists app_records_entity_journey_idx
  on public.app_records (entity, (data->>'journeyId'));

create index if not exists app_records_entity_email_idx
  on public.app_records (entity, (data->>'userEmail'));

create unique index if not exists user_preferences_username_unique
  on public.app_records (lower(data->>'username'))
  where entity = 'UserPreferences'
    and coalesce(data->>'username', '') <> '';

create table if not exists public.user_api_keys (
  user_id uuid primary key references auth.users (id) on delete cascade,
  provider text not null default 'nvidia',
  ciphertext text not null,
  iv text not null,
  last4 text not null,
  updated_at timestamptz not null default now()
);

alter table public.app_records enable row level security;
alter table public.user_api_keys enable row level security;

revoke all on public.user_api_keys from anon, authenticated;

grant select on public.app_records to anon;
grant select, insert, update, delete on public.app_records to authenticated;
grant all on public.app_records to service_role;
grant all on public.user_api_keys to service_role;

create or replace function public.touch_app_record()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists app_records_touch on public.app_records;
create trigger app_records_touch
  before update on public.app_records
  for each row execute function public.touch_app_record();

-- Force ownership from the JWT. Service-role writes have no auth.uid() and keep the supplied owner.
create or replace function public.set_app_record_owner()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null then
    new.owner_id = auth.uid();
  end if;
  return new;
end;
$$;

drop trigger if exists app_records_set_owner on public.app_records;
create trigger app_records_set_owner
  before insert on public.app_records
  for each row execute function public.set_app_record_owner();

-- Admin comes from app_metadata, which users cannot edit themselves.
create or replace function public.is_admin()
returns boolean
language sql
stable
set search_path = public
as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin';
$$;

create or replace function public.journey_is_public(journey_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.app_records
    where entity = 'Journey'
      and data->>'journeyId' = journey_id
      and coalesce((data->>'isPublic')::boolean, false) = true
      and coalesce((data->>'archived')::boolean, false) = false
  );
$$;

revoke all on function public.journey_is_public(text) from public;
grant execute on function public.journey_is_public(text) to anon, authenticated;

create or replace function public.is_username_taken(candidate text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.app_records
    where entity = 'UserPreferences'
      and lower(data->>'username') = lower(trim(candidate))
  );
$$;

revoke all on function public.is_username_taken(text) from public;
grant execute on function public.is_username_taken(text) to anon, authenticated;

drop policy if exists app_records_select on public.app_records;
create policy app_records_select
  on public.app_records
  for select
  to anon, authenticated
  using (
    public.is_admin()
    or owner_id = auth.uid()
    or (
      entity = 'Journey'
      and coalesce((data->>'isPublic')::boolean, false) = true
      and coalesce((data->>'archived')::boolean, false) = false
    )
    or (
      entity in ('Module', 'Activity', 'Card')
      and public.journey_is_public(data->>'journeyId')
    )
    or (entity = 'BlogPost' and data->>'status' = 'published')
    or entity = 'BlogAsset'
  );

drop policy if exists app_records_insert on public.app_records;
create policy app_records_insert
  on public.app_records
  for insert
  to authenticated
  with check (owner_id = auth.uid() or public.is_admin());

drop policy if exists app_records_update on public.app_records;
create policy app_records_update
  on public.app_records
  for update
  to authenticated
  using (owner_id = auth.uid() or public.is_admin())
  with check (owner_id = auth.uid() or public.is_admin());

drop policy if exists app_records_delete on public.app_records;
create policy app_records_delete
  on public.app_records
  for delete
  to authenticated
  using (owner_id = auth.uid() or public.is_admin());

insert into storage.buckets (id, name, public)
values ('blog-assets', 'blog-assets', true)
on conflict (id) do nothing;

drop policy if exists blog_assets_public_read on storage.objects;
create policy blog_assets_public_read
  on storage.objects
  for select
  to public
  using (bucket_id = 'blog-assets');

-- After you sign up, promote your account once (role lives in app_metadata, not user_metadata):
-- update auth.users
-- set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
-- where email = 'you@example.com';
