create table if not exists public.site_education_admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.site_education_admins enable row level security;

create table if not exists public.site_support_channels (
  id text primary key check (id in ('whatsapp', 'telegram')),
  url text not null default '',
  updated_at timestamptz not null default now(),
  constraint site_support_channels_allowed_urls check (
    case id
      when 'whatsapp' then url = '' or url ~* '^https://(wa\.me|api\.whatsapp\.com|whatsapp\.com|www\.whatsapp\.com)/[^[:space:]]+$'
      when 'telegram' then url = '' or url ~* '^https://(t\.me|telegram\.me|www\.telegram\.me)/[^[:space:]]+$'
      else false
    end
  )
);

alter table public.site_support_channels enable row level security;

insert into public.site_support_channels (id, url)
values ('whatsapp', ''), ('telegram', '')
on conflict (id) do nothing;

create or replace function public.is_education_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.site_education_admins
    where user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_education_admin() from public;
grant execute on function public.is_education_admin() to authenticated;

revoke all on public.site_education_admins from anon, authenticated;

drop policy if exists "Public can read support channels" on public.site_support_channels;
create policy "Public can read support channels"
  on public.site_support_channels
  for select
  to anon, authenticated
  using (true);

drop policy if exists "Admins can read support channels" on public.site_support_channels;
create policy "Admins can read support channels"
  on public.site_support_channels
  for select
  to authenticated
  using ((select public.is_education_admin()));

drop policy if exists "Admins can update support channels" on public.site_support_channels;
create policy "Admins can update support channels"
  on public.site_support_channels
  for update
  to authenticated
  using ((select public.is_education_admin()))
  with check ((select public.is_education_admin()));

revoke all on public.site_support_channels from anon, authenticated;
grant select on public.site_support_channels to anon, authenticated;
grant update (url, updated_at) on public.site_support_channels to authenticated;

do $$
begin
  if to_regclass('public.site_education_links') is not null then
    execute 'drop policy if exists "Public can read education links" on public.site_education_links';
    execute 'drop policy if exists "Education admins can update links" on public.site_education_links';
    execute 'revoke all on public.site_education_links from anon, authenticated';
  end if;
end;
$$;
