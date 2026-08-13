-- =====================================================================
-- SQL para preparar o Supabase com o schema correto
-- Cole tudo isso no SQL Editor do Supabase e execute
-- =====================================================================


alter table public.profiles
add column if not exists full_name text,
add column if not exists role text,
add column if not exists email text;


create table if not exists public.psicologos (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null,
  cpf text,
  birth_date date,
  phone text,
  crp text,
  crp_state text,
  education text,
  institution text,
  years_experience integer,
  bio text,
  specialties jsonb default '[]'::jsonb,
  modalities jsonb default '{}'::jsonb,
  address jsonb default '{}'::jsonb,
  price_min numeric,
  price_max numeric,
  availability jsonb default '[]'::jsonb,
  photo text,
  created_at timestamptz default now()
);


create table if not exists public.especialidades (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz default now()
);


create table if not exists public.psicologo_especialidades (
  id uuid primary key default gen_random_uuid(),
  psicologo_id uuid not null references public.psicologos(id) on delete cascade,
  especialidade_id uuid not null references public.especialidades(id) on delete cascade,
  created_at timestamptz default now(),
  unique (psicologo_id, especialidade_id)
);


create table if not exists public.psychologist_ratings (
  id uuid primary key default gen_random_uuid(),
  psychologist_id uuid not null references public.psicologos(id) on delete cascade,
  rater_id uuid,
  rating numeric not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz default now()
);


create table if not exists public.psychologist_availability (
  id uuid primary key default gen_random_uuid(),
  psychologist_id uuid not null references public.psicologos(id) on delete cascade,
  day text,
  start_time text,
  end_time text,
  created_at timestamptz default now()
);


insert into public.especialidades (name)
values
  ('Ansiedade'),
  ('Depressão'),
  ('Relacionamentos'),
  ('Autoestima'),
  ('Luto'),
  ('Terapia de Casal'),
  ('Terapia Infantil'),
  ('Burnout'),
  ('Trauma'),
  ('Família'),
  ('Desenvolvimento'),
  ('Outros')
on conflict (name) do nothing;

