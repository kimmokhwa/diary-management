import React, { useEffect, useState } from 'react';
import { useSupabase } from '../../hooks/useSupabase';
import { USER_ID } from '../../config/constants';

const DailyTodosPanel = () => {
  const { create, read, remove } = useSupabase('daily_todos');
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState('');
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // 모바일 감지
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 할 일 목록 불러오기
  const fetchTodos = async () => {
    setLoading(true);
    try {
      const data = await read({ user_id: USER_ID });
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
      await create({ user_id: USER_ID, text: newTodo, is_active: true });
      setNewTodo('');
      fetchTodos();
    } catch (e) {
      alert('추가 실패: ' + e.message);
    }
  };

  // Enter 키 처리
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAdd();
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
    <div className="p-0">
      <h3 className="text-lg font-semibold mb-4">💛 매일 업무</h3>
      <div className="flex gap-2 mb-4 items-center">
        <input
          className="flex-1 border rounded px-2 py-1"
          value={newTodo}
          onChange={e => setNewTodo(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="매일 할 일 입력"
        />
        <button
          className="bg-yellow-400 text-white px-3 py-1 rounded"
          onClick={handleAdd}
          disabled={!newTodo.trim()}
        >
          추가
        </button>
      </div>
      {loading ? (
        <div>로딩 중...</div>
      ) : (
        <ul className="space-y-2">
          {todos.length > 0 ? (
            todos.map(todo => (
              <li key={todo.id} className="flex justify-between items-center border-b pb-1">
                <span>{todo.text}</span>
                <button className="text-red-500" onClick={() => handleDelete(todo.id)}>
                  삭제
                </button>
              </li>
            ))
          ) : (
            <div className="text-center text-gray-400 py-4">등록된 할 일이 없습니다.</div>
          )}
        </ul>
      )}
    </div>
  );
};

export default DailyTodosPanel; 