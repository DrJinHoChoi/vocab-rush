-- DataPD 계정 데이터 스키마 (Supabase)
-- 실제 로그인(Supabase Auth)을 켠 뒤, Supabase → SQL Editor에 붙여넣고 Run 하세요.
-- 모든 테이블은 RLS로 "본인 데이터만" 접근하도록 잠급니다.

-- ── 1. 프로필: auth 사용자당 1행, 가입 시 자동 생성 ─────────────────
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  name       text,
  created_at timestamptz default now()
);
alter table public.profiles enable row level security;
drop policy if exists "profiles self" on public.profiles;
create policy "profiles self" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name',
                           new.raw_user_meta_data->>'full_name',
                           split_part(coalesce(new.email,''), '@', 1)))
  on conflict (id) do nothing;
  return new;
end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users for each row execute function public.handle_new_user();

-- ── 2. 신청: 입점(invite) / 가맹(franchise) 공용 ───────────────────
create table if not exists public.applications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  kind       text not null check (kind in ('invite','franchise')),
  brand      text,           -- 입점: 브랜드명 / 가맹: 신청자명
  category   text,           -- 입점: 카테고리 / 가맹: 유형
  zone       text,           -- 입점: 존 / 가맹: 희망지역
  month      text,
  slot       text,
  budget     numeric,
  note       text,
  fit_tier   text,
  status     text default '접수됨',
  local_ts   timestamptz,    -- 원본(로컬 폼) 제출 시각 — 기기 간 중복 방지 키
  created_at timestamptz default now(),
  unique (user_id, kind, local_ts)   -- 같은 신청이 여러 기기에서 중복 업로드되지 않도록
);
alter table public.applications enable row level security;
drop policy if exists "applications self" on public.applications;
create policy "applications self" on public.applications
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── 3. 학습 통계: STUDY RUSH, 사용자당 1행 ────────────────────────
create table if not exists public.learning_stats (
  user_id       uuid primary key references auth.users(id) on delete cascade,
  total_correct int default 0,
  total_games   int default 0,
  best_streak   int default 0,
  total_score   int default 0,
  achievements  int default 0,
  streak_days   int default 0,
  updated_at    timestamptz default now()
);
alter table public.learning_stats enable row level security;
drop policy if exists "learning_stats self" on public.learning_stats;
create policy "learning_stats self" on public.learning_stats
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
