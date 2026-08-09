-- StarVote: Supabase 初始化脚本
-- 在 Supabase 控制台的 SQL Editor 中执行一次即可

create table if not exists public.rating_counts (
  id text primary key,
  s1 integer not null default 0,
  s2 integer not null default 0,
  s3 integer not null default 0,
  s4 integer not null default 0,
  s5 integer not null default 0
);

create table if not exists public.vote_counts (
  id text primary key,
  up integer not null default 0,
  down integer not null default 0
);

-- 原子自增评分计数（INSERT ... ON CONFLICT），避免并发丢计数
create or replace function public.increment_rating(p_id text, p_score integer)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.rating_counts (id, s1, s2, s3, s4, s5)
  values (
    p_id,
    case when p_score = 1 then 1 else 0 end,
    case when p_score = 2 then 1 else 0 end,
    case when p_score = 3 then 1 else 0 end,
    case when p_score = 4 then 1 else 0 end,
    case when p_score = 5 then 1 else 0 end
  )
  on conflict (id) do update set
    s1 = public.rating_counts.s1 + case when p_score = 1 then 1 else 0 end,
    s2 = public.rating_counts.s2 + case when p_score = 2 then 1 else 0 end,
    s3 = public.rating_counts.s3 + case when p_score = 3 then 1 else 0 end,
    s4 = public.rating_counts.s4 + case when p_score = 4 then 1 else 0 end,
    s5 = public.rating_counts.s5 + case when p_score = 5 then 1 else 0 end
$$;

-- 原子自增投票计数
create or replace function public.increment_vote(p_id text, p_vote text)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.vote_counts (id, up, down)
  values (
    p_id,
    case when p_vote = 'up' then 1 else 0 end,
    case when p_vote = 'down' then 1 else 0 end
  )
  on conflict (id) do update set
    up = public.vote_counts.up + case when p_vote = 'up' then 1 else 0 end,
    down = public.vote_counts.down + case when p_vote = 'down' then 1 else 0 end
$$;
