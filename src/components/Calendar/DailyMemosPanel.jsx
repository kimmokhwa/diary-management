import React, { useEffect, useState } from 'react';
import { useSupabase } from '../../hooks/useSupabase';

const userId = '샘플-유저-아이디'; // 실제 로그인 연동 시 교체 필요

const DailyMemosPanel = () => {
  const { create, read, update, remove } = useSupabase('daily_memos');
  const [memos, setMemos] = useState([]);
  const [memoDate, setMemoDate] = useState('');
  const [content, setContent] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMemos = async () => {
    setLoading(true);
    try {
      const data = await read({ user_id: userId });
      setMemos(data);
    } catch (e) {
      alert('메모 불러오기 실패: ' + e.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMemos();
  }, []);

  const handleAdd = async () => {
    if (!memoDate || !content.trim()) return;
    try {
      await create({ user_id: userId, memo_date: memoDate, content });
      setMemoDate('');
      setContent('');
      fetchMemos();
    } catch (e) {
      alert('추가 실패: ' + e.message);
    }
  };

  const handleUpdate = async (id) => {
    try {
      await update(id, { content });
      setEditingId(null);
      setContent('');
      fetchMemos();
    } catch (e) {
      alert('수정 실패: ' + e.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      await remove(id);
      fetchMemos();
    } catch (e) {
      alert('삭제 실패: ' + e.message);
    }
  };

  return (
    <div className="p-4 bg-white rounded-xl shadow max-w-md mx-auto mt-8">
      <h2 className="text-xl font-bold mb-4">일별 메모 (Supabase 연동)</h2>
      <div className="flex gap-2 mb-4 items-center">
        <input
          type="date"
          className="border rounded px-2 py-1"
          value={memoDate}
          onChange={e => setMemoDate(e.target.value)}
        />
        <input
          className="flex-1 border rounded px-2 py-1"
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="메모 내용 입력"
        />
        <button className="bg-blue-500 text-white px-3 py-1 rounded" onClick={handleAdd}>
          추가
        </button>
      </div>
      {loading ? (
        <div>로딩 중...</div>
      ) : (
        <ul className="space-y-2">
          {memos.map(memo => (
            <li key={memo.id} className="flex flex-col border-b pb-2">
              <div className="flex justify-between items-center">
                <span>{memo.memo_date}</span>
                <div>
                  <button className="text-blue-500 mr-2" onClick={() => { setEditingId(memo.id); setContent(memo.content); }}>
                    수정
                  </button>
                  <button className="text-red-500" onClick={() => handleDelete(memo.id)}>
                    삭제
                  </button>
                </div>
              </div>
              {editingId === memo.id ? (
                <div className="flex gap-2 mt-1">
                  <input
                    className="flex-1 border rounded px-2 py-1"
                    value={content}
                    onChange={e => setContent(e.target.value)}
                  />
                  <button className="bg-green-500 text-white px-3 py-1 rounded" onClick={() => handleUpdate(memo.id)}>
                    저장
                  </button>
                </div>
              ) : (
                <div className="text-gray-700 mt-1">{memo.content}</div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default DailyMemosPanel; 