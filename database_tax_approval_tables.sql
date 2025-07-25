-- 세금관리 테이블 생성
CREATE TABLE IF NOT EXISTS tax_management (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  tax_type TEXT NOT NULL,
  tax_amount DECIMAL(15,2) NOT NULL,
  memo TEXT,
  is_paid BOOLEAN DEFAULT FALSE,
  due_date DATE,
  paid_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 결재관리 테이블 생성
CREATE TABLE IF NOT EXISTS approval_management (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  client_name TEXT NOT NULL,
  transaction_amount DECIMAL(15,2) NOT NULL,
  memo TEXT,
  transaction_date DATE NOT NULL,
  tax_invoice_issued BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS 정책 설정 (세금관리)
ALTER TABLE tax_management ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own tax records" ON tax_management
  FOR SELECT USING (user_id = auth.uid()::text);

CREATE POLICY "Users can insert their own tax records" ON tax_management
  FOR INSERT WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can update their own tax records" ON tax_management
  FOR UPDATE USING (user_id = auth.uid()::text);

CREATE POLICY "Users can delete their own tax records" ON tax_management
  FOR DELETE USING (user_id = auth.uid()::text);

-- RLS 정책 설정 (결재관리)
ALTER TABLE approval_management ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own approval records" ON approval_management
  FOR SELECT USING (user_id = auth.uid()::text);

CREATE POLICY "Users can insert their own approval records" ON approval_management
  FOR INSERT WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can update their own approval records" ON approval_management
  FOR UPDATE USING (user_id = auth.uid()::text);

CREATE POLICY "Users can delete their own approval records" ON approval_management
  FOR DELETE USING (user_id = auth.uid()::text);

-- 인덱스 생성 (성능 향상)
CREATE INDEX IF NOT EXISTS idx_tax_management_user_id ON tax_management(user_id);
CREATE INDEX IF NOT EXISTS idx_tax_management_due_date ON tax_management(due_date);
CREATE INDEX IF NOT EXISTS idx_tax_management_is_paid ON tax_management(is_paid);

CREATE INDEX IF NOT EXISTS idx_approval_management_user_id ON approval_management(user_id);
CREATE INDEX IF NOT EXISTS idx_approval_management_transaction_date ON approval_management(transaction_date);
CREATE INDEX IF NOT EXISTS idx_approval_management_tax_invoice_issued ON approval_management(tax_invoice_issued); 