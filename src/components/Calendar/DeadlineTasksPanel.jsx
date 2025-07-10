import React, { useEffect, useState } from 'react';
import { useSupabase } from '../../hooks/useSupabase';
import { USER_ID } from '../../config/constants';

const DeadlineTasksPanel = () => {
  const { create, read, remove } = useSupabase('deadline_tasks');
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [deadline, setDeadline] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      console.log('🔄 마감업무 목록 불러오기 시도...');
      const data = await read({ user_id: USER_ID });
      console.log('✅ 마감업무 목록 불러오기 성공:', data);
      setTasks(data || []);
    } catch (e) {
      console.error('❌ 마감업무 목록 불러오기 실패:', e);
      alert('마감일 업무 불러오기 실패: ' + (e.message || '알 수 없는 오류'));
      setTasks([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleAdd = async () => {
    if (!newTask.trim() || !deadline) {
      alert('업무 내용과 마감일을 모두 입력해주세요!');
      return;
    }
    
    try {
      console.log('🔄 마감업무 추가 시도:', {
        user_id: USER_ID,
        text: newTask,
        deadline_date: deadline,
        is_active: true
      });
      
      const result = await create({ 
        user_id: USER_ID, 
        text: newTask, 
        deadline_date: deadline, 
        is_active: true 
      });
      
      console.log('✅ 마감업무 추가 성공:', result);
      
      setNewTask('');
      setDeadline('');
      fetchTasks();
      
      alert('마감업무가 성공적으로 추가되었습니다! 🎯');
      
    } catch (e) {
      console.error('❌ 마감업무 추가 실패:', e);
      console.error('❌ 에러 상세:', {
        message: e.message,
        code: e.code,
        details: e.details,
        hint: e.hint
      });
      alert('추가 실패: ' + (e.message || '알 수 없는 오류'));
    }
  };

  const handleDelete = async (id, taskText) => {
    if (!window.confirm(`"${taskText}" 마감업무를 삭제하시겠습니까?`)) {
      return;
    }
    
    try {
      console.log('🔄 마감업무 삭제 시도:', { id, taskText });
      await remove(id);
      console.log('✅ 마감업무 삭제 성공');
      fetchTasks();
      alert('마감업무가 성공적으로 삭제되었습니다! 🗑️');
    } catch (e) {
      console.error('❌ 마감업무 삭제 실패:', e);
      alert('삭제 실패: ' + (e.message || '알 수 없는 오류'));
    }
  };

  return (
    <div className="p-0">
      <div className="space-y-4">
        {/* 입력 폼 */}
        <div className="space-y-3">
          <input
            className="cute-input w-full"
            value={newTask}
            onChange={e => setNewTask(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            placeholder="마감일 업무를 입력하세요... 📅"
          />
          <input
            type="date"
            className="cute-input w-full"
            value={deadline}
            onChange={e => setDeadline(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
          />
          <button 
            className="cute-button-primary w-full"
            onClick={handleAdd}
          >
            🎯 마감업무 추가하기
          </button>
        </div>

        {/* 업무 목록 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <span>📋</span>
              등록된 마감업무 ({tasks.length}개)
            </h4>
            <button 
              className="cute-button-secondary text-xs"
              onClick={fetchTasks}
              disabled={loading}
            >
              {loading ? '⏳' : '🔄'} 새로고침
            </button>
          </div>
          
          {loading ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-2xl mb-2">⏳</div>
              <p>로딩 중...</p>
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">📝</div>
              <p>등록된 마감업무가 없어요!</p>
              <p className="text-xs text-gray-400 mt-1">새로운 마감업무를 추가해보세요 ✨</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {tasks.map(task => (
                <div key={task.id} className="cute-card p-3 border border-orange-100">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-gray-800">{task.text}</div>
                      <div className="text-sm text-orange-600 mt-1">
                        📅 {task.deadline_date}
                      </div>
                    </div>
                    <button 
                      className="text-red-500 hover:text-red-700 transition-colors p-1"
                      onClick={() => handleDelete(task.id, task.text)}
                      title="삭제"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeadlineTasksPanel; 