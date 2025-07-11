-- 업무 다이어리 데이터베이스 스키마
-- PRD.md 기반으로 테이블 생성

-- 일일 할 일
CREATE TABLE daily_todos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  text text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

-- 월간 할 일
CREATE TABLE monthly_todos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  text text NOT NULL,
  repeat_date integer CHECK (repeat_date >= 1 AND repeat_date <= 31),
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

-- 마감일 업무
CREATE TABLE deadline_tasks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  text text NOT NULL,
  deadline_date date NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

-- 완료 기록
CREATE TABLE completions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  item_id uuid NOT NULL,
  item_type text CHECK (item_type IN ('daily_todo', 'monthly_todo', 'deadline_task')),
  completion_date date NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- 일별 메모
CREATE TABLE daily_memos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  memo_date date NOT NULL,
  content text NOT NULL,
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, memo_date)
);

-- Row Level Security 활성화 (개인용 앱을 위한 설정)
ALTER TABLE daily_todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE deadline_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_memos ENABLE ROW LEVEL SECURITY;

-- ✅ 개인용 앱을 위한 RLS 정책 (인증 없이 사용 가능)
-- 특정 USER_ID로 제한하여 안전하게 사용

-- daily_todos 정책
CREATE POLICY "개인용 daily_todos 접근" ON daily_todos
  FOR ALL USING (user_id = '00000000-0000-0000-0000-000000000001'::uuid);

-- monthly_todos 정책  
CREATE POLICY "개인용 monthly_todos 접근" ON monthly_todos
  FOR ALL USING (user_id = '00000000-0000-0000-0000-000000000001'::uuid);

-- deadline_tasks 정책
CREATE POLICY "개인용 deadline_tasks 접근" ON deadline_tasks
  FOR ALL USING (user_id = '00000000-0000-0000-0000-000000000001'::uuid);

-- completions 정책
CREATE POLICY "개인용 completions 접근" ON completions
  FOR ALL USING (user_id = '00000000-0000-0000-0000-000000000001'::uuid);

-- daily_memos 정책
CREATE POLICY "개인용 daily_memos 접근" ON daily_memos
  FOR ALL USING (user_id = '00000000-0000-0000-0000-000000000001'::uuid);

-- 🔍 기존 정책이 있다면 제거하고 새로 생성
-- DROP POLICY IF EXISTS "사용자별 daily_todos 접근" ON daily_todos;
-- DROP POLICY IF EXISTS "사용자별 monthly_todos 접근" ON monthly_todos;
-- DROP POLICY IF EXISTS "사용자별 deadline_tasks 접근" ON deadline_tasks;
-- DROP POLICY IF EXISTS "사용자별 completions 접근" ON completions;
-- DROP POLICY IF EXISTS "사용자별 daily_memos 접근" ON daily_memos; 