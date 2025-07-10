import React, { useEffect, useState } from 'react';
import { useSupabase } from '../../hooks/useSupabase';
import { USER_ID } from '../../config/constants';

const CompletionsPanel = () => {
  const { create, read, remove } = useSupabase('completions');
  const [completions, setCompletions] = useState([]);
  const [itemId, setItemId] = useState('');
  const [itemType, setItemType] = useState('daily_todo');
  const [completionDate, setCompletionDate] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchCompletions = async () => {
    setLoading(true);
    try {
      const data = await read({ user_id: USER_ID });
      setCompletions(data);
    } catch (e) {
      alert('완료 기록 불러오기 실패: ' + e.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCompletions();
  }, []);

  const handleAdd = async () => {
    if (!itemId.trim() || !completionDate) return;
    try {
      await create({ user_id: USER_ID, item_id: itemId, item_type: itemType, completion_date: completionDate });
      setItemId('');
      setCompletionDate('');
      fetchCompletions();
    } catch (e) {
      alert('추가 실패: ' + e.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      await remove(id);
      fetchCompletions();
    } catch (e) {
      alert('삭제 실패: ' + e.message);
    }
  };

  return (
    <div className="p-4 bg-white rounded-xl shadow max-w-md mx-auto mt-8">
      <h2 className="text-xl font-bold mb-4">완료 기록 (Supabase 연동)</h2>
      <div className="flex gap-2 mb-4 items-center">
        <input
          className="flex-1 border rounded px-2 py-1"
          value={itemId}
          onChange={e => setItemId(e.target.value)}
          placeholder="item_id 입력"
        />
        <select
          className="border rounded px-2 py-1"
          value={itemType}
          onChange={e => setItemType(e.target.value)}
        >
          <option value="daily_todo">daily_todo</option>
          <option value="monthly_todo">monthly_todo</option>
          <option value="deadline_task">deadline_task</option>
        </select>
        <input
          type="date"
          className="border rounded px-2 py-1"
          value={completionDate}
          onChange={e => setCompletionDate(e.target.value)}
        />
        <button className="bg-blue-500 text-white px-3 py-1 rounded" onClick={handleAdd}>
          추가
        </button>
      </div>
      {loading ? (
        <div>로딩 중...</div>
      ) : (
        <ul className="space-y-2">
          {completions.map(c => (
            <li key={c.id} className="flex justify-between items-center border-b pb-1">
              <span>{c.item_type} ({c.item_id}) <span className="text-xs text-green-500">{c.completion_date}</span></span>
              <button className="text-red-500" onClick={() => handleDelete(c.id)}>
                삭제
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CompletionsPanel; 