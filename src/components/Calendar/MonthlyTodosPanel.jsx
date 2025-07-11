import React, { useEffect, useState } from 'react';
import { useSupabase } from '../../hooks/useSupabase';
import { USER_ID } from '../../config/constants';

const MonthlyTodosPanel = () => {
  const { create, read, remove } = useSupabase('monthly_todos');
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState('');
  const [repeatDate, setRepeatDate] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchTodos = async () => {
    setLoading(true);
    try {
      const data = await read({ user_id: USER_ID });
      setTodos(data);
    } catch (e) {
      alert('월간 할 일 불러오기 실패: ' + e.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTodos();
  }, []);

  const handleAdd = async () => {
    if (!newTodo.trim()) return;
    try {
      await create({ user_id: USER_ID, text: newTodo, repeat_date: repeatDate, is_active: true });
      setNewTodo('');
      setRepeatDate(1);
      fetchTodos();
    } catch (e) {
      alert('추가 실패: ' + e.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      await remove(id);
      fetchTodos();
    } catch (e) {
      alert('삭제 실패: ' + e.message);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="p-0">
      <h3 className="text-lg font-semibold mb-4">월간 반복 할 일 관리</h3>
      <div className="flex gap-2 mb-4 items-center">
        <input
          className="flex-1 border rounded px-2 py-1"
          value={newTodo}
          onChange={e => setNewTodo(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="월간 반복 할 일 입력"
        />
        <select
          className="border rounded px-2 py-1"
          value={repeatDate}
          onChange={e => setRepeatDate(Number(e.target.value))}
        >
          {[...Array(31)].map((_, i) => (
            <option key={i + 1} value={i + 1}>{i + 1}일</option>
          ))}
        </select>
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
              <span>{todo.text} <span className="text-xs text-blue-500">(매월 {todo.repeat_date}일)</span></span>
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

export default MonthlyTodosPanel; 