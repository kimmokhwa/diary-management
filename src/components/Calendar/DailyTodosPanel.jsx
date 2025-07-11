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
      <h3 className={`${isMobile ? 'text-base-mobile' : 'text-lg'} font-semibold mb-4 flex items-center gap-2`}>
        <span>💛</span>
        일일 할 일 관리
      </h3>
      
      {/* 입력 영역 - 모바일 최적화 */}
      <div className={`${isMobile ? 'space-y-3' : 'flex gap-2'} mb-4`}>
        <input
          className={`cute-input ${isMobile ? 'w-full text-base-mobile min-h-touch' : 'flex-1'}`}
          value={newTodo}
          onChange={e => setNewTodo(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="새로운 할 일을 입력하세요 ✨"
        />
        <button 
          className={`cute-button-primary ${isMobile ? 'w-full min-h-touch' : ''}`}
          onClick={handleAdd}
          disabled={!newTodo.trim()}
        >
          <span className="mr-2">➕</span>
          추가하기
        </button>
      </div>
      
      {/* 할 일 목록 */}
      {loading ? (
        <div className={`text-center py-6 ${isMobile ? 'text-sm-mobile' : 'text-sm'} text-gray-500`}>
          <div className="animate-spin w-6 h-6 border-2 border-pink-400 border-t-transparent rounded-full mx-auto mb-2"></div>
          로딩 중...
        </div>
      ) : (
        <ul className="space-y-2">
          {todos.length > 0 ? (
            todos.map(todo => (
              <li 
                key={todo.id} 
                className={`${isMobile ? 'mobile-todo-item' : 'cute-card p-3 border border-gray-100'} transition-all duration-300`}
              >
                <div className="flex justify-between items-center">
                  <span className={`${isMobile ? 'text-sm-mobile' : 'text-sm'} font-medium text-gray-800 flex-1 mr-3`}>
                    {todo.text}
                  </span>
                  <button 
                    className={`${isMobile ? 'min-h-touch min-w-touch' : ''} text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded-lg transition-all duration-300`}
                    onClick={() => handleDelete(todo.id)}
                  >
                    🗑️
                  </button>
                </div>
              </li>
            ))
          ) : (
            <div className="text-center py-6 text-gray-500">
              <div className="text-3xl mb-2">🌸</div>
              <p className={`${isMobile ? 'text-sm-mobile' : 'text-sm'}`}>아직 등록된 할 일이 없어요!</p>
              <p className={`${isMobile ? 'text-xs-mobile' : 'text-xs'} text-gray-400 mt-1`}>첫 번째 할 일을 추가해보세요 💪</p>
            </div>
          )}
        </ul>
      )}
    </div>
  );
};

export default DailyTodosPanel; 