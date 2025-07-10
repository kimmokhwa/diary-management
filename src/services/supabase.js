import { createClient } from '@supabase/supabase-js';

// 🚨 임시 해결책: 환경 변수 대신 직접 값 사용
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://shokmfqbsxiihqljmssw.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNob2ttZnFic3hpaWhxbGptc3N3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwNjkxNjksImV4cCI6MjA2NzY0NTE2OX0.WbiJph1F4pGgG6mZlDz6P1y9xp-LcjKoI-M_IsklAZ8';

// 🔍 디버깅: 환경 변수 확인
console.log('🔍 Supabase 설정 확인:');
console.log('supabaseUrl:', supabaseUrl);
console.log('supabaseKey 길이:', supabaseKey ? supabaseKey.length : 'undefined');
console.log('환경 변수에서 로드됨:', !!import.meta.env.VITE_SUPABASE_URL);

// ✅ 값이 제대로 설정되었는지 확인
if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 설정이 올바르지 않습니다!');
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
}); 