begin;

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.app_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.user_entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_code text not null,
  status text not null default 'inactive' check (status in ('active', 'inactive', 'refunded', 'expired')),
  source text not null default 'manual' check (source in ('manual', 'scalev', 'beta')),
  order_reference text,
  activated_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, product_code)
);

create table if not exists public.purchase_orders (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'scalev',
  provider_order_id text not null unique,
  purchaser_email text not null,
  product_code text not null,
  payment_status text not null,
  paid_at timestamptz,
  refunded_at timestamptz,
  raw_event jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists user_entitlements_user_id_idx on public.user_entitlements(user_id);
create index if not exists purchase_orders_email_idx on public.purchase_orders(lower(purchaser_email));

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name')
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

create or replace function public.is_app_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.app_admins where user_id = auth.uid()
  );
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists entitlements_set_updated_at on public.user_entitlements;
create trigger entitlements_set_updated_at
before update on public.user_entitlements
for each row execute function public.set_updated_at();

drop trigger if exists purchase_orders_set_updated_at on public.purchase_orders;
create trigger purchase_orders_set_updated_at
before update on public.purchase_orders
for each row execute function public.set_updated_at();

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.app_admins enable row level security;
alter table public.user_entitlements enable row level security;
alter table public.purchase_orders enable row level security;

create policy "profiles_select_own"
on public.profiles for select
to authenticated
using (auth.uid() = user_id or public.is_app_admin());

create policy "profiles_insert_own"
on public.profiles for insert
to authenticated
with check (auth.uid() = user_id);

create policy "profiles_update_own"
on public.profiles for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "admins_select_own_membership"
on public.app_admins for select
to authenticated
using (auth.uid() = user_id);

create policy "entitlements_select_own_or_admin"
on public.user_entitlements for select
to authenticated
using (auth.uid() = user_id or public.is_app_admin());

create policy "orders_admin_read"
on public.purchase_orders for select
to authenticated
using (public.is_app_admin());

grant execute on function public.is_app_admin() to authenticated;

commit;
