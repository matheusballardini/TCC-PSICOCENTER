-- Schema mínimo para o fluxo do site de psicólogos

create table if not exists public.profiles (
  id uuid primary key,
  full_name text,
  email text,
  role text,
  created_at timestamptz default now()
);

create table if not exists public.psicologos (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
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
  name text not null,
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
  start text,
  end text,
  created_at timestamptz default now()
);

-- Dados básicos de exemplo para testar a busca
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
  ('Trauma')
on conflict do nothing;

-- Exemplo de perfil e psicólogo para testar a listagem
-- ajuste os IDs para IDs reais de auth.users se já tiver cadastro
-- insert into public.profiles (id, full_name, email, role)
-- values ('00000000-0000-0000-0000-000000000001', 'Dra. Ana Silva', 'ana@exemplo.com', 'psicologo');
--
-- insert into public.psicologos (id, full_name, email, cpf, crp, phone, specialties, modalities, address, price_min, price_max, bio)
-- values (
--   '00000000-0000-0000-0000-000000000001',
--   'Dra. Ana Silva',
--   'ana@exemplo.com',
--   '12345678900',
--   '06/123456',
--   '11999999999',
--   '[]'::jsonb,
--   '{"online": true, "presencial": true}'::jsonb,
--   '{"city": "São Paulo", "state": "SP", "address": "Rua A, 123"}'::jsonb,
--   150,
--   250,
--   'Psicóloga com foco em ansiedade e relacionamento.'
-- );
