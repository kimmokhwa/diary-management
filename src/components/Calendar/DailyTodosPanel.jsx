import React, { useEffect, useState } from 'react';
import { useSupabase } from '../../hooks/useSupabase';

const userId = '샘플-유저-아이디'; // 실제 로그인 연동 시 교체 필요

const DailyTodosPanel = () => {
  const { create, read, remove } = useSupabase('daily_todos');
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState('');
  const [loading, setLoading] = useState(true);

  // 할 일 목록 불러오기
  const fetchTodos = async () => {
    setLoading(true);
    try {
      const data = await read({ user_id: userId });
      setTodos(data);
    } catch (e) {
      alert('할 일 불러오기 실패: ' + e.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTodos();
  }, []);

  // 할 일 추가
  const handleAdd = async () => {
    if (!newTodo.trim()) return;
    try {
      await create({ user_id: userId, text: newTodo, is_active: true });
      setNewTodo('');
      fetchTodos();
    } catch (e) {
      alert('추가 실패: ' + e.message);
    }
  };

  // 할 일 삭제
  const handleDelete = async (id) => {
    try {
      await remove(id);
      fetchTodos();
    } catch (e) {
      alert('삭제 실패: ' + e.message);
    }
  };

  return (
    <div className="p-4 bg-white rounded-xl shadow max-w-md mx-auto mt-8">
      <h2 className="text-xl font-bold mb-4">Daily Todos (Supabase 연동)</h2>
      <div className="flex gap-2 mb-4">
        <input
          className="flex-1 border rounded px-2 py-1"
          value={newTodo}
          onChange={e => setNewTodo(e.target.value)}
          placeholder="할 일 입력"
        />
        <button className="bg-blue-500 text-white px-3 py-1 rounded" onClick={handleAdd}>
          추가
        </button>
      </div>
      {loading ? (
        <div>로딩 중...</div>
      ) : (
        <ul className="space-y-2">
          {todos.map(todo => (
            <li key={todo.id} className="flex justify-between items-center border-b pb-1">
              <span>{todo.text}</span>
              <button className="text-red-500" onClick={() => handleDelete(todo.id)}>
                삭제
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default DailyTodosPanel; 