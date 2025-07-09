import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';

export const useRealtime = (table, filter = {}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();

    // Supabase 실시간 구독
    const subscription = supabase
      .channel(`${table}_changes`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table },
        handleRealTimeUpdate
      )
      .subscribe();

    // MCP 메시지 리스너 (옵션)
    const mcpHandler = (e) => {
      // e.detail에 동기화 데이터가 담겨있다고 가정
      if (e.detail && e.detail.table === table) {
        loadData(); // MCP에서 변경 알림 오면 데이터 새로고침
      }
    };
    window.addEventListener('mcp-message', mcpHandler);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('mcp-message', mcpHandler);
    };
  }, [table]);

  const loadData = async () => {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .eq('user_id', filter.user_id);
    if (!error) setData(data);
    setLoading(false);
  };

  const handleRealTimeUpdate = (payload) => {
    switch (payload.eventType) {
      case 'INSERT':
        setData(prev => [...prev, payload.new]);
        break;
      case 'UPDATE':
        setData(prev => prev.map(item =>
          item.id === payload.new.id ? payload.new : item
        ));
        break;
      case 'DELETE':
        setData(prev => prev.filter(item =>
          item.id !== payload.old.id
        ));
        break;
    }
  };

  return { data, loading, refetch: loadData };
}; 