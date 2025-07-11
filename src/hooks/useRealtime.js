import { useEffect, useCallback, useState } from 'react';
import { supabase } from '../services/supabase';
import { USER_ID } from '../config/constants';

export const useRealtime = (tableName) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // 데이터 로딩 함수 분리
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const { data: result, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('user_id', USER_ID);
      if (error) throw error;
      setData(result || []);
    } catch (error) {
      console.error(`${tableName} 데이터 로딩 중 오류:`, error);
    } finally {
      setLoading(false);
    }
  }, [tableName]);

  // 초기 데이터 로딩
  useEffect(() => {
    loadData();
  }, [loadData]);

  // 실시간 업데이트 처리
  useEffect(() => {
    const channel = supabase
      .channel(`public:${tableName}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: tableName
        },
        (payload) => {
          const { eventType, new: newRecord, old: oldRecord } = payload;

          switch (eventType) {
            case 'INSERT':
              setData(prev => [...prev, newRecord]);
              break;
            case 'UPDATE':
              setData(prev =>
                prev.map(item => item.id === newRecord.id ? newRecord : item)
              );
              break;
            case 'DELETE':
              setData(prev =>
                prev.filter(item => item.id !== oldRecord.id)
              );
              break;
            default:
              break;
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tableName]);

  return { data, loading, refetch: loadData };
}; 