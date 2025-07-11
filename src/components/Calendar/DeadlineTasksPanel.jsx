import React, { useEffect, useState } from 'react';
import { useSupabase } from '../../hooks/useSupabase';
import { useRealtime } from '../../hooks/useRealtime';
import { USER_ID } from '../../config/constants';

const DeadlineTasksPanel = () => {
  const { create, read, remove } = useSupabase('deadline_tasks');
  const { data: completions } = useRealtime('completions');
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [deadline, setDeadline] = useState('');
  const [loading, setLoading] = useState(true);
  const [toggleLoading, setToggleLoading] = useState(null); // 토글 중인 id

  // 마감업무 목록 불러오기
  const fetchTasks = async () => {
    setLoading(true);
    try {
      const data = await read({ user_id: USER_ID });
      setTasks(data || []);
    } catch (e) {
      alert('마감일 업무 불러오기 실패: ' + (e.message || '알 수 없는 오류'));
      setTasks([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // 마감업무 추가
  const handleAdd = async () => {
    if (!newTask.trim() || !deadline) {
      alert('업무 내용과 마감일을 모두 입력해주세요!');
      return;
    }
    try {
      await create({ user_id: USER_ID, text: newTask, deadline_date: deadline, is_active: true });
      setNewTask('');
      setDeadline('');
      fetchTasks();
      alert('마감업무가 성공적으로 추가되었습니다! 🎯');
    } catch (e) {
      alert('추가 실패: ' + (e.message || '알 수 없는 오류'));
    }
  };

  // 마감업무 삭제
  const handleDelete = async (id, taskText) => {
    if (!window.confirm(`"${taskText}" 마감업무를 삭제하시겠습니까?`)) return;
    try {
      await remove(id);
      fetchTasks();
      alert('마감업무가 성공적으로 삭제되었습니다! 🗑️');
    } catch (e) {
      alert('삭제 실패: ' + (e.message || '알 수 없는 오류'));
    }
  };

  // 완료/미완료 상태 판별
  const isCompleted = (task) => {
    if (!completions) return false;
    return completions.some(
      c => c.item_id === task.id && c.item_type === 'deadline_task'
    );
  };

  // 완료/미완료 토글
  const handleToggleCompletion = async (task) => {
    setToggleLoading(task.id);
    const supabase = (await import('../../services/supabase')).supabase;
    try {
      const completed = isCompleted(task);
      // 생성일부터 마감일까지의 모든 날짜 구하기 (복사본 사용)
      const startDate = new Date(task.created_at);
      startDate.setHours(0,0,0,0);
      const endDate = new Date(task.deadline_date);
      const dates = [];
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        dates.push(new Date(d.getTime())); // 복사본 push
      }
      if (completed) {
        // 완료 해제: 생성일부터 마감일까지 completions 삭제
        for (const d of dates) {
          const dateStr = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
          await supabase
            .from('completions')
            .delete()
            .eq('item_id', task.id)
            .eq('item_type', 'deadline_task')
            .eq('completion_date', dateStr);
        }
      } else {
        // 완료 처리: 생성일부터 마감일까지 completions upsert
        for (const d of dates) {
          const dateStr = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
          await supabase
            .from('completions')
            .upsert({
              item_id: task.id,
              item_type: 'deadline_task',
              user_id: USER_ID,
              completion_date: dateStr
            }, { onConflict: 'item_id,item_type,completion_date' });
        }
      }
    } catch (e) {
      alert('상태 변경 실패: ' + (e.message || '알 수 없는 오류'));
    }
    setToggleLoading(null);
  };

  // 완료/미완료로 분리
  const completedTasks = tasks.filter(task => isCompleted(task));
  const incompleteTasks = tasks.filter(task => !isCompleted(task));

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="p-0">
      <h3 className="text-lg font-semibold mb-4">🧡 마감 업무</h3>
      <div className="flex gap-2 mb-4 items-center">
        <input
          className="flex-1 border rounded px-2 py-1"
          value={newTask}
          onChange={e => setNewTask(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="마감 업무 입력"
        />
        <input
          type="date"
          className="border rounded px-2 py-1"
          value={deadline}
          onChange={e => setDeadline(e.target.value)}
        />
        <button
          className="bg-orange-400 text-white px-3 py-1 rounded"
          onClick={handleAdd}
          disabled={!newTask.trim() || !deadline}
        >
          추가
        </button>
      </div>
      {loading ? (
        <div>로딩 중...</div>
      ) : (
        <>
          {/* 미완료 마감업무 */}
          <ul className="space-y-2">
            {incompleteTasks.length > 0 ? (
              incompleteTasks.map(task => (
                <li key={task.id} className="flex justify-between items-center border-b pb-1">
                  <span>{task.text} <span className="text-xs text-orange-500">({task.deadline_date})</span></span>
                  <button className="text-red-500" onClick={() => handleDelete(task.id, task.text)}>
                    삭제
                  </button>
                </li>
              ))
            ) : (
              <div className="text-center text-gray-400 py-4">미완료 마감 업무가 없습니다.</div>
            )}
          </ul>

          {/* 완료된 마감업무 */}
          <div className="mt-6">
            <h4 className="text-base font-semibold mb-2 text-green-600">✅ 완료된 마감업무</h4>
            <ul className="space-y-2">
              {completedTasks.length > 0 ? (
                completedTasks.map(task => (
                  <li key={task.id} className="flex justify-between items-center border-b pb-1 opacity-60">
                    <span className="line-through">{task.text} <span className="text-xs text-orange-500">({task.deadline_date})</span></span>
                    <button className="text-red-500" onClick={() => handleDelete(task.id, task.text)}>
                      삭제
                    </button>
                  </li>
                ))
              ) : (
                <div className="text-center text-gray-400 py-2">완료된 마감 업무가 없습니다.</div>
              )}
            </ul>
          </div>
        </>
      )}
    </div>
  );
};

export default DeadlineTasksPanel; 