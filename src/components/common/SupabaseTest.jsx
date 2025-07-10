import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { USER_ID } from '../../config/constants';
import { CheckCircle2, XCircle, AlertCircle, Database, Wifi, WifiOff } from 'lucide-react';

const SupabaseTest = () => {
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [tableTests, setTableTests] = useState({});
  const [envCheck, setEnvCheck] = useState({});
  const [testData, setTestData] = useState(null);

  useEffect(() => {
    checkEnvironmentVariables();
    testSupabaseConnection();
    testDatabaseTables();
  }, []);

  // 환경 변수 확인
  const checkEnvironmentVariables = () => {
    const envUrl = import.meta.env.VITE_SUPABASE_URL;
    const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    // 실제 사용되는 값 (fallback 포함)
    const actualUrl = envUrl || 'https://shokmfqbsxiihqljmssw.supabase.co';
    const actualKey = envKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNob2ttZnFic3hpaWhxbGptc3N3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwNjkxNjksImV4cCI6MjA2NzY0NTE2OX0.WbiJph1F4pGgG6mZlDz6P1y9xp-LcjKoI-M_IsklAZ8';
    
    setEnvCheck({
      url: {
        exists: !!actualUrl,
        value: envUrl ? `${envUrl} (환경변수)` : `${actualUrl} (기본값)`,
        valid: actualUrl && actualUrl.includes('supabase.co')
      },
      key: {
        exists: !!actualKey,
        value: envKey ? `${envKey.substring(0, 20)}... (환경변수)` : `${actualKey.substring(0, 20)}... (기본값)`,
        valid: actualKey && actualKey.length > 50
      }
    });
  };

  // Supabase 연결 테스트
  const testSupabaseConnection = async () => {
    try {
      const { data, error } = await supabase.from('daily_todos').select('count', { count: 'exact', head: true });
      
      if (error) {
        setConnectionStatus('error');
        console.error('Supabase 연결 오류:', error);
      } else {
        setConnectionStatus('connected');
      }
    } catch (err) {
      setConnectionStatus('error');
      console.error('연결 테스트 실패:', err);
    }
  };

  // 데이터베이스 테이블 확인
  const testDatabaseTables = async () => {
    const tables = ['daily_todos', 'monthly_todos', 'deadline_tasks', 'completions', 'daily_memos'];
    const results = {};

    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('count', { count: 'exact', head: true });
        
        results[table] = {
          exists: !error,
          error: error?.message || null,
          count: data || 0
        };
      } catch (err) {
        results[table] = {
          exists: false,
          error: err.message,
          count: 0
        };
      }
    }

    setTableTests(results);
  };

  // 테스트 데이터 추가/조회
  const testCRUDOperations = async () => {
    try {
      // 테스트 데이터 추가
      const { data: insertData, error: insertError } = await supabase
        .from('daily_todos')
        .insert({
          user_id: USER_ID,
          text: '테스트 할 일',
          is_active: true
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // 데이터 조회
      const { data: selectData, error: selectError } = await supabase
        .from('daily_todos')
        .select('*')
        .eq('user_id', USER_ID)
        .limit(5);

      if (selectError) throw selectError;

      setTestData({
        success: true,
        inserted: insertData,
        list: selectData
      });

      // 테스트 데이터 삭제
      await supabase
        .from('daily_todos')
        .delete()
        .eq('id', insertData.id);

    } catch (err) {
      setTestData({
        success: false,
        error: err.message
      });
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'connected':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Database className="w-6 h-6" />
          Supabase 연동 테스트
        </h2>

        {/* 환경 변수 확인 */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">🔧 환경 변수 확인</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                {envCheck.url?.valid ? 
                  <CheckCircle2 className="w-4 h-4 text-green-500" /> : 
                  <XCircle className="w-4 h-4 text-red-500" />
                }
                <span className="font-medium">VITE_SUPABASE_URL</span>
              </div>
              <p className="text-sm text-gray-600 break-all">{envCheck.url?.value}</p>
            </div>
            
            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                {envCheck.key?.valid ? 
                  <CheckCircle2 className="w-4 h-4 text-green-500" /> : 
                  <XCircle className="w-4 h-4 text-red-500" />
                }
                <span className="font-medium">VITE_SUPABASE_ANON_KEY</span>
              </div>
              <p className="text-sm text-gray-600">{envCheck.key?.value}</p>
            </div>
          </div>
        </div>

        {/* 연결 상태 */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">🔗 연결 상태</h3>
          <div className="flex items-center gap-3 p-4 border rounded-lg">
            {connectionStatus === 'connected' ? <Wifi className="w-5 h-5 text-green-500" /> : <WifiOff className="w-5 h-5 text-red-500" />}
            {getStatusIcon(connectionStatus)}
            <span className="font-medium">
              {connectionStatus === 'connected' ? 'Supabase 연결 성공' : 
               connectionStatus === 'error' ? 'Supabase 연결 실패' : '연결 확인 중...'}
            </span>
          </div>
        </div>

        {/* 테이블 상태 */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">📊 데이터베이스 테이블</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(tableTests).map(([tableName, result]) => (
              <div key={tableName} className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  {result.exists ? 
                    <CheckCircle2 className="w-4 h-4 text-green-500" /> : 
                    <XCircle className="w-4 h-4 text-red-500" />
                  }
                  <span className="font-medium text-sm">{tableName}</span>
                </div>
                {result.exists ? (
                  <p className="text-xs text-green-600">테이블 존재</p>
                ) : (
                  <p className="text-xs text-red-600">테이블 없음</p>
                )}
                {result.error && (
                  <p className="text-xs text-red-500 mt-1">{result.error}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* CRUD 테스트 */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">🧪 CRUD 작업 테스트</h3>
          <button
            onClick={testCRUDOperations}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors mb-4"
          >
            테스트 실행
          </button>
          
          {testData && (
            <div className="border rounded-lg p-4">
              {testData.success ? (
                <div>
                  <p className="text-green-600 font-medium mb-2">✅ CRUD 테스트 성공</p>
                  <p className="text-sm text-gray-600">데이터 추가/조회/삭제가 정상적으로 작동합니다.</p>
                </div>
              ) : (
                <div>
                  <p className="text-red-600 font-medium mb-2">❌ CRUD 테스트 실패</p>
                  <p className="text-sm text-red-500">{testData.error}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 설정 가이드 */}
        {(!envCheck.url?.valid || !envCheck.key?.valid) && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-800 mb-2">⚠️ 설정이 필요합니다</h4>
            <div className="text-sm text-yellow-700 space-y-2">
              <p>1. Supabase 프로젝트를 생성하세요: <a href="https://supabase.com" className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">https://supabase.com</a></p>
              <p>2. 프로젝트 루트에 .env 파일을 생성하고 다음을 추가하세요:</p>
              <pre className="bg-gray-100 p-2 rounded text-xs mt-2">
{`VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_public_anon_key`}
              </pre>
              <p>3. database_schema.sql 파일의 내용을 Supabase SQL 에디터에서 실행하세요.</p>
              <p>4. 개발서버를 재시작하세요: npm run dev</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SupabaseTest; 