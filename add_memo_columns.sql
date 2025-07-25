-- 기존 테이블에 memo 컬럼 추가
-- Supabase SQL Editor에서 실행하세요

-- 세금관리 테이블에 memo 컬럼 추가
ALTER TABLE tax_management 
ADD COLUMN IF NOT EXISTS memo TEXT;

-- 결재관리 테이블에 memo 컬럼 추가  
ALTER TABLE approval_management 
ADD COLUMN IF NOT EXISTS memo TEXT;

-- 변경사항 확인
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name IN ('tax_management', 'approval_management') 
  AND column_name = 'memo'; 