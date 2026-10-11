-- ============================================================================
--  Sahloul IT Desk — PostgreSQL / Supabase schema
--  Run in the Supabase SQL editor (or via `supabase db push`).
--  Safe to re-run: it is written idempotently where practical.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
--  Enums (kept as text + CHECK so they are trivial to extend)
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
--  Tables
-- ---------------------------------------------------------------------------

-- Hospital departments (editable in /admin/services).
create table if not exists public.services (
  id     uuid primary key default gen_random_uuid(),
  name   text not null unique
);

-- Equipment brands, one list per equipment type (editable in /admin/brands).
create table if not exists public.brands (
  id         uuid primary key default gen_random_uuid(),
  equipment  text not null check (equipment in ('printer', 'screen', 'unit', 'qr_printer')),
  name       text not null,
  unique (equipment, name)
);

-- Ticket counters used to build SAH-YYYY-NNNN numbers without races.
create table if not exists public.ticket_counters (
  year       int primary key,
  last_value int not null default 0
);

-- The requests themselves.
create table if not exists public.requests (
  id                 uuid primary key default gen_random_uuid(),
  ticket_number      text not null unique,
  service            text not null,
  equipment          text not null check (equipment in ('printer', 'screen', 'unit', 'qr_printer')),
  brand              text not null,
  serial             text,
  description        text not null,
  urgency            text not null default 'normal' check (urgency in ('normal', 'urgent', 'critical')),
  symptoms           text[] not null default '{}',
  photo_url          text,
  declarant_name     text not null,
  declarant_function text,
  phone              text not null,
  email              text,
  location           text not null,
  availability       text,
  status             text not null default 'pending_acceptance'
                       check (status in ('pending_acceptance', 'accepted', 'received', 'in_repair', 'repaired', 'unrepairable', 'refused')),
  refusal_reason     text,
  internal_notes     text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists requests_status_idx      on public.requests (status);
create index if not exists requests_service_idx     on public.requests (service);
create index if not exists requests_created_at_idx  on public.requests (created_at desc);

-- Immutable audit trail of every status change.
create table if not exists public.request_status_history (
  id         uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.requests (id) on delete cascade,
  status     text not null,
  note       text,
  at         timestamptz not null default now(),
  by         text
);

create index if not exists history_request_idx on public.request_status_history (request_id, at);

-- Public list of scrapped ("réformé") equipment.
create table if not exists public.reformed_equipment (
  id            uuid primary key default gen_random_uuid(),
  ticket_number text not null,
  equipment     text not null check (equipment in ('printer', 'screen', 'unit', 'qr_printer')),
  brand         text not null default '',
  serial        text,
  service       text not null default '',
  fault         text not null default '',
  reformed_at   timestamptz not null default now(),
  remarks       text,
  request_id    uuid references public.requests (id) on delete set null
);

create index if not exists reformed_at_idx on public.reformed_equipment (reformed_at desc);

-- Which authenticated users are IT-department administrators.
create table if not exists public.user_roles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  role    text not null default 'admin' check (role in ('admin')),
  created_at timestamptz not null default now()
);

-- Single-row site settings (editable in /admin/settings).
create table if not exists public.site_settings (
  id        int primary key default 1 check (id = 1),
  phone     text not null default '+216 73 369 400',
  extension text not null default '4000',
  email     text not null default 'informatique@chu-sahloul.tn',
  hours     text not null default 'Lun – Ven · 08:00 – 16:30',
  address   text not null default 'Hôpital Universitaire Sahloul, Route de la Ceinture, Sousse 4054, Tunisie'
);

-- ---------------------------------------------------------------------------
--  Helpers
-- ---------------------------------------------------------------------------

-- True when the given auth user has the admin role. Never trust the client.
create or replace function public.is_admin(p_uid uuid)
returns boolean
language sql stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.user_roles where user_id = p_uid and role = 'admin');
$$;

-- Allocates the next ticket sequence number for a given year (race-free).
create or replace function public.next_ticket_number(p_year int)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v int;
begin
  insert into public.ticket_counters (year, last_value)
  values (p_year, 1)
  on conflict (year) do update set last_value = public.ticket_counters.last_value + 1
  returning last_value into v;
  return v;
end;
$$;

-- Keeps updated_at fresh.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists requests_touch_updated_at on public.requests;
create trigger requests_touch_updated_at
  before update on public.requests
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
--  Workflow: the ONLY way a status changes.
--  Mirrors src/lib/status.ts exactly — skipping acceptance is impossible.
-- ---------------------------------------------------------------------------

create or replace function public.apply_status_transition(
  p_request_id uuid,
  p_to         text,
  p_note       text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_from    text;
  v_allowed boolean;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'not_authorized';
  end if;

  select status into v_from from public.requests where id = p_request_id for update;
  if v_from is null then
    raise exception 'request_not_found';
  end if;

  v_allowed := (v_from, p_to) in (
    ('pending_acceptance', 'accepted'),
    ('pending_acceptance', 'refused'),
    ('accepted',           'received'),
    ('received',           'in_repair'),
    ('in_repair',          'repaired'),
    ('in_repair',          'unrepairable')
  );

  if not v_allowed then
    raise exception 'illegal_transition: % -> %', v_from, p_to;
  end if;

  update public.requests
     set status = p_to,
         refusal_reason = case when p_to = 'refused' then p_note else refusal_reason end,
         updated_at = now()
   where id = p_request_id;

  insert into public.request_status_history (request_id, status, note, by)
  values (p_request_id, p_to, p_note, auth.uid()::text);

  -- Non-repairable equipment is automatically added to the public list.
  if p_to = 'unrepairable' then
    insert into public.reformed_equipment
      (ticket_number, equipment, brand, serial, service, fault, reformed_at, remarks, request_id)
    select r.ticket_number, r.equipment, r.brand, r.serial, r.service,
           coalesce(p_note, r.description), now(), null, r.id
      from public.requests r
     where r.id = p_request_id;
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
--  Public lookup: a ticket number acts as a capability.
--  Returns the request plus its history as one jsonb document.
-- ---------------------------------------------------------------------------

create or replace function public.get_request_by_ticket(p_ticket text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select to_jsonb(r) || jsonb_build_object(
    'request_status_history',
    coalesce(
      (select jsonb_agg(h order by h.at)
         from public.request_status_history h
        where h.request_id = r.id),
      '[]'::jsonb
    )
  )
  from public.requests r
  where r.ticket_number = upper(trim(p_ticket))
  limit 1;
$$;

-- ---------------------------------------------------------------------------
--  Row Level Security
-- ---------------------------------------------------------------------------

alter table public.services               enable row level security;
alter table public.brands                 enable row level security;
alter table public.requests               enable row level security;
alter table public.request_status_history enable row level security;
alter table public.reformed_equipment     enable row level security;
alter table public.user_roles             enable row level security;
alter table public.site_settings          enable row level security;
alter table public.ticket_counters        enable row level security;

-- services: everyone may read, only admins may write.
drop policy if exists services_read on public.services;
create policy services_read on public.services for select using (true);
drop policy if exists services_admin_write on public.services;
create policy services_admin_write on public.services for all
  using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- brands: everyone may read, only admins may write.
drop policy if exists brands_read on public.brands;
create policy brands_read on public.brands for select using (true);
drop policy if exists brands_admin_write on public.brands;
create policy brands_admin_write on public.brands for all
  using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- requests: anyone may create (public form) but only in the initial status;
-- reading the full table is admin-only (the public uses get_request_by_ticket).
drop policy if exists requests_public_insert on public.requests;
create policy requests_public_insert on public.requests for insert
  with check (status = 'pending_acceptance');
drop policy if exists requests_admin_select on public.requests;
create policy requests_admin_select on public.requests for select
  using (public.is_admin(auth.uid()));
drop policy if exists requests_admin_update on public.requests;
create policy requests_admin_update on public.requests for update
  using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
drop policy if exists requests_admin_delete on public.requests;
create policy requests_admin_delete on public.requests for delete
  using (public.is_admin(auth.uid()));

-- request_status_history: admins only (writes go through the RPC above).
drop policy if exists history_admin_all on public.request_status_history;
create policy history_admin_all on public.request_status_history for all
  using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- reformed_equipment: public read-only inventory; admins may write.
drop policy if exists reformed_read on public.reformed_equipment;
create policy reformed_read on public.reformed_equipment for select using (true);
drop policy if exists reformed_admin_write on public.reformed_equipment;
create policy reformed_admin_write on public.reformed_equipment for all
  using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- site_settings: public read, admin write.
drop policy if exists settings_read on public.site_settings;
create policy settings_read on public.site_settings for select using (true);
drop policy if exists settings_admin_write on public.site_settings;
create policy settings_admin_write on public.site_settings for all
  using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- user_roles: a user may read their own role; admins manage roles.
drop policy if exists roles_self_read on public.user_roles;
create policy roles_self_read on public.user_roles for select
  using (user_id = auth.uid());
drop policy if exists roles_admin_write on public.user_roles;
create policy roles_admin_write on public.user_roles for all
  using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- ticket_counters has no policies (accessed only via SECURITY DEFINER fn).

-- ---------------------------------------------------------------------------
--  Grants for the API roles
-- ---------------------------------------------------------------------------

grant usage on schema public to anon, authenticated;

grant select                       on public.services             to anon, authenticated;
grant select                       on public.brands               to anon, authenticated;
grant select                       on public.reformed_equipment   to anon, authenticated;
grant select                       on public.site_settings        to anon, authenticated;
grant insert                       on public.requests             to anon, authenticated;
grant select, insert, update, delete on public.requests             to authenticated;
grant select, insert, update, delete on public.request_status_history to authenticated;
grant all                          on public.services, public.brands, public.reformed_equipment,
                                      public.site_settings, public.user_roles to authenticated;

grant execute on function public.next_ticket_number(int)                 to anon, authenticated;
grant execute on function public.get_request_by_ticket(text)             to anon, authenticated;
grant execute on function public.apply_status_transition(uuid, text, text) to authenticated;
grant execute on function public.is_admin(uuid)                          to anon, authenticated;

-- ---------------------------------------------------------------------------
--  Storage: bucket for request photos (public read, open upload from the form)
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('request-photos', 'request-photos', true)
on conflict (id) do nothing;

drop policy if exists photos_public_read on storage.objects;
create policy photos_public_read on storage.objects for select
  using (bucket_id = 'request-photos');

drop policy if exists photos_public_upload on storage.objects;
create policy photos_public_upload on storage.objects for insert
  with check (bucket_id = 'request-photos');

-- ---------------------------------------------------------------------------
--  Seed data (mirrors src/lib/constants.ts)
-- ---------------------------------------------------------------------------

insert into public.site_settings (id) values (1)
on conflict (id) do nothing;

insert into public.services (name) values
  ('Urgences'), ('Réanimation médicale'), ('Réanimation chirurgicale'),
  ('Réanimation néonatale'), ('Cardiologie'), ('Chirurgie cardiovasculaire'),
  ('Pneumologie'), ('Gastro-entérologie'), ('Néphrologie / Hémodialyse'),
  ('Neurologie'), ('Neurochirurgie'), ('Endocrinologie'), ('Médecine interne'),
  ('Hématologie'), ('Oncologie / Cancérologie'), ('Radiothérapie'),
  ('Rhumatologie'), ('Dermatologie'), ('Maladies infectieuses'),
  ('Médecine physique et réadaptation'), ('Médecine du travail'),
  ('Médecine légale'), ('Pédiatrie'), ('Néonatologie'),
  ('Gynécologie-Obstétrique'), ('Maternité'), ('Chirurgie générale'),
  ('Chirurgie orthopédique et traumatologique'), ('Chirurgie plastique'),
  ('Urologie'), ('ORL'), ('Ophtalmologie'), ('Stomatologie / Médecine dentaire'),
  ('Anesthésie'), ('Bloc opératoire'), ('Radiologie / Imagerie médicale'),
  ('Médecine nucléaire'), ('Laboratoire de biologie médicale'),
  ('Anatomie pathologique'), ('Microbiologie'), ('Pharmacie'),
  ('Banque de sang / Centre de transfusion'), ('Stérilisation centrale'),
  ('Psychiatrie'), ('Pédopsychiatrie'), ('Bureau des entrées'), ('Admission'),
  ('Archives médicales'), ('Direction'), ('Secrétariat général'),
  ('Ressources humaines'), ('Service financier / Économat'),
  ('Service technique / Maintenance'), ('Hygiène hospitalière'),
  ('Consultations externes'), ('Autre')
on conflict (name) do nothing;

insert into public.brands (equipment, name) values
  ('printer','HP'), ('printer','Canon'), ('printer','Epson'), ('printer','Brother'),
  ('printer','Samsung'), ('printer','Xerox'), ('printer','Lexmark'), ('printer','Kyocera'),
  ('printer','Ricoh'),
  ('screen','Dell'), ('screen','HP'), ('screen','Samsung'), ('screen','LG'),
  ('screen','Lenovo'), ('screen','Acer'), ('screen','Asus'), ('screen','AOC'),
  ('screen','Philips'),
  ('unit','Dell'), ('unit','HP'), ('unit','Lenovo'), ('unit','Acer'), ('unit','Asus'),
  ('unit','Fujitsu'), ('unit','Packard Bell'), ('unit','Assemblé / Clone'),
  ('qr_printer','Zebra'), ('qr_printer','TSC'), ('qr_printer','Brother'),
  ('qr_printer','Datamax'), ('qr_printer','Godex'), ('qr_printer','Honeywell'),
  ('qr_printer','Argox')
on conflict (equipment, name) do nothing;

-- ---------------------------------------------------------------------------
--  Make the first admin
--  1. Create the user in Authentication → Users.
--  2. Run:  insert into public.user_roles (user_id)
--           values ('<AUTH-USER-UUID>');
-- ---------------------------------------------------------------------------
