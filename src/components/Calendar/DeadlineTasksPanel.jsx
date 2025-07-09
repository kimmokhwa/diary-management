import React, { useEffect, useState } from 'react';
import { useSupabase } from '../../hooks/useSupabase';

const userId = '샘플-유저-아이디';

const DeadlineTasksPanel = () => {
  const { create, read, remove } = useSupabase('deadline_tasks');
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [deadline, setDeadline] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const data = await read({ user_id: userId });
      setTasks(data);
    } catch (e) {
      alert('마감일 업무 불러오기 실패: ' + e.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleAdd = async () => {
    if (!newTask.trim() || !deadline) return;
    try {
      await create({ user_id: userId, text: newTask, deadline_date: deadline, is_active: true });
      setNewTask('');
      setDeadline('');
      fetchTasks();
    } catch (e) {
      alert('추가 실패: ' + e.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      await remove(id);
      fetchTasks();
    } catch (e) {
      alert('삭제 실패: ' + e.message);
    }
  };

  return (
    <div className="p-4 bg-white rounded-xl shadow max-w-md mx-auto mt-8">
      <h2 className="text-xl font-bold mb-4">마감일 업무 (Supabase 연동)</h2>
      <div className="flex gap-2 mb-4 items-center">
        <input
          className="flex-1 border rounded px-2 py-1"
          value={newTask}
          onChange={e => setNewTask(e.target.value)}
          placeholder="마감일 업무 입력"
        />
        <input
          type="date"
          className="border rounded px-2 py-1"
          value={deadline}
          onChange={e => setDeadline(e.target.value)}
        />
        <button className="bg-blue-500 text-white px-3 py-1 rounded" onClick={handleAdd}>
          추가
        </button>
      </div>
      {loading ? (
        <div>로딩 중...</div>
      ) : (
        <ul className="space-y-2">
          {tasks.map(task => (
            <li key={task.id} className="flex justify-between items-center border-b pb-1">
              <span>{task.text} <span className="text-xs text-red-500">({task.deadline_date})</span></span>
              <button className="text-red-500" onClick={() => handleDelete(task.id)}>
                삭제
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default DeadlineTasksPanel; 