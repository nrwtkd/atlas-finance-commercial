-- Alerantara Finance: personal license activation on up to two devices.
-- Apply this migration in the Supabase SQL editor before enabling
-- VITE_DEVICE_LIMIT_ENABLED=true in Cloudflare Pages.

create table if not exists public.device_activations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  installation_id text not null,
  device_name text not null,
  platform text,
  browser text,
  first_activated_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  constraint device_activations_installation_id_length
    check (char_length(installation_id) between 8 and 200),
  constraint device_activations_user_installation_unique
    unique (user_id, installation_id)
);

create index if not exists device_activations_active_user_idx
  on public.device_activations (user_id, last_seen_at desc)
  where revoked_at is null;

alter table public.device_activations enable row level security;

revoke insert, update, delete on public.device_activations from anon, authenticated;
grant select on public.device_activations to authenticated;

create policy "Users can read their own device activations"
  on public.device_activations
  for select
  to authenticated
  using (auth.uid() = user_id);

create or replace function public.activate_alerantara_device(
  p_installation_id text,
  p_device_name text,
  p_platform text default null,
  p_browser text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_active_count integer := 0;
  v_existing boolean := false;
  v_existing_revoked_at timestamptz;
  v_last_revoked_at timestamptz;
  v_retry_at timestamptz;
  v_entitled boolean := false;
begin
  if v_user_id is null then
    return jsonb_build_object(
      'status', 'unavailable',
      'message', 'Sesi pengguna tidak tersedia.',
      'max_devices', 2,
      'active_count', 0
    );
  end if;

  if p_installation_id is null or char_length(trim(p_installation_id)) < 8 then
    return jsonb_build_object(
      'status', 'unavailable',
      'message', 'Identitas instalasi tidak valid.',
      'max_devices', 2,
      'active_count', 0
    );
  end if;

  -- Serialize activation changes per account to prevent simultaneous devices
  -- from both claiming the final available slot.
  perform pg_advisory_xact_lock(hashtextextended(v_user_id::text, 0));

  select exists (
    select 1
    from public.user_entitlements entitlement
    where entitlement.user_id = v_user_id
      and entitlement.product_code = 'atlas-finance'
      and entitlement.status = 'active'
  ) into v_entitled;

  if not v_entitled then
    return jsonb_build_object(
      'status', 'inactive_license',
      'message', 'Lisensi Alerantara Finance belum aktif.',
      'max_devices', 2,
      'active_count', 0
    );
  end if;

  select true, activation.revoked_at
    into v_existing, v_existing_revoked_at
  from public.device_activations activation
  where activation.user_id = v_user_id
    and activation.installation_id = trim(p_installation_id)
  for update;

  if coalesce(v_existing, false) and v_existing_revoked_at is null then
    update public.device_activations
    set device_name = left(coalesce(nullif(trim(p_device_name), ''), 'Perangkat pribadi'), 120),
        platform = left(nullif(trim(p_platform), ''), 80),
        browser = left(nullif(trim(p_browser), ''), 80),
        last_seen_at = now()
    where user_id = v_user_id
      and installation_id = trim(p_installation_id);

    select count(*) into v_active_count
    from public.device_activations
    where user_id = v_user_id
      and revoked_at is null;

    return jsonb_build_object(
      'status', 'active',
      'message', 'Perangkat ini sudah terdaftar.',
      'max_devices', 2,
      'active_count', v_active_count
    );
  end if;

  select max(revoked_at) into v_last_revoked_at
  from public.device_activations
  where user_id = v_user_id
    and revoked_at is not null;

  if v_last_revoked_at is not null and v_last_revoked_at > now() - interval '24 hours' then
    v_retry_at := v_last_revoked_at + interval '24 hours';
    select count(*) into v_active_count
    from public.device_activations
    where user_id = v_user_id
      and revoked_at is null;

    return jsonb_build_object(
      'status', 'cooldown',
      'message', 'Perangkat baru dapat diaktifkan 24 jam setelah pelepasan perangkat terakhir.',
      'retry_at', v_retry_at,
      'max_devices', 2,
      'active_count', v_active_count
    );
  end if;

  select count(*) into v_active_count
  from public.device_activations
  where user_id = v_user_id
    and revoked_at is null;

  if v_active_count >= 2 then
    return jsonb_build_object(
      'status', 'limit_reached',
      'message', 'Lisensi ini sudah aktif di dua perangkat.',
      'max_devices', 2,
      'active_count', v_active_count
    );
  end if;

  insert into public.device_activations (
    user_id,
    installation_id,
    device_name,
    platform,
    browser,
    first_activated_at,
    last_seen_at,
    revoked_at
  ) values (
    v_user_id,
    trim(p_installation_id),
    left(coalesce(nullif(trim(p_device_name), ''), 'Perangkat pribadi'), 120),
    left(nullif(trim(p_platform), ''), 80),
    left(nullif(trim(p_browser), ''), 80),
    now(),
    now(),
    null
  )
  on conflict (user_id, installation_id)
  do update set
    device_name = excluded.device_name,
    platform = excluded.platform,
    browser = excluded.browser,
    first_activated_at = now(),
    last_seen_at = now(),
    revoked_at = null;

  v_active_count := v_active_count + 1;

  return jsonb_build_object(
    'status', 'active',
    'message', 'Perangkat ini berhasil diaktifkan.',
    'max_devices', 2,
    'active_count', v_active_count
  );
end;
$$;

create or replace function public.list_alerantara_devices()
returns jsonb
language sql
security definer
set search_path = public, pg_temp
as $$
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'installation_id', activation.installation_id,
        'device_name', activation.device_name,
        'platform', activation.platform,
        'browser', activation.browser,
        'first_activated_at', activation.first_activated_at,
        'last_seen_at', activation.last_seen_at,
        'revoked_at', activation.revoked_at
      )
      order by (activation.revoked_at is null) desc, activation.last_seen_at desc
    ),
    '[]'::jsonb
  )
  from public.device_activations activation
  where activation.user_id = auth.uid();
$$;

create or replace function public.revoke_alerantara_device(
  p_installation_id text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_changed integer := 0;
begin
  if v_user_id is null then
    return jsonb_build_object('status', 'unavailable', 'message', 'Sesi pengguna tidak tersedia.');
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_user_id::text, 0));

  update public.device_activations
  set revoked_at = now(),
      last_seen_at = now()
  where user_id = v_user_id
    and installation_id = trim(p_installation_id)
    and revoked_at is null;

  get diagnostics v_changed = row_count;

  if v_changed = 0 then
    return jsonb_build_object('status', 'not_found', 'message', 'Perangkat aktif tidak ditemukan.');
  end if;

  return jsonb_build_object(
    'status', 'revoked',
    'message', 'Perangkat telah dilepaskan. Perangkat baru dapat diaktifkan setelah 24 jam.',
    'retry_at', now() + interval '24 hours'
  );
end;
$$;

revoke all on function public.activate_alerantara_device(text, text, text, text) from public;
revoke all on function public.list_alerantara_devices() from public;
revoke all on function public.revoke_alerantara_device(text) from public;

grant execute on function public.activate_alerantara_device(text, text, text, text) to authenticated;
grant execute on function public.list_alerantara_devices() to authenticated;
grant execute on function public.revoke_alerantara_device(text) to authenticated;
