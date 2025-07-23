import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { USER_ID } from '../../config/constants';

const SpecialSchedulePanel = ({ onChange }) => {
  const [scheduleText, setScheduleText] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');
  const [schedules, setSchedules] = useState([]);
  const [completions, setCompletions] = useState([]);
  const [loading, setLoading] = useState(false);

  // 스케줄 목록 불러오기
  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('special_schedules')
        .select('*')
        .eq('user_id', USER_ID)
        .order('schedule_date', { ascending: true });
      if (error) throw error;
      setSchedules(data || []);
      if (onChange) onChange(); // 데이터 변경 시 부모에 알림
    } catch (e) {
      alert('특정업무 불러오기 실패: ' + (e.message || '알 수 없는 오류'));
      setSchedules([]);
    }
    setLoading(false);
  };

  // 완료 상태 불러오기
  const fetchCompletions = async () => {
    try {
      const { data, error } = await supabase
        .from('completions')
        .select('*')
        .eq('user_id', USER_ID)
        .eq('item_type', 'special_schedule');
      if (error) throw error;
      setCompletions(data || []);
    } catch (e) {
      console.error('완료 상태 불러오기 실패:', e);
      setCompletions([]);
    }
  };

  // 완료 상태 확인
  const isCompleted = (scheduleId, scheduleDate) => {
    return completions.some(completion => 
      completion.item_id === scheduleId && 
      completion.completion_date === scheduleDate
    );
  };

  // 완료 상태 토글
  const toggleCompletion = async (schedule) => {
    try {
      const isCurrentlyCompleted = isCompleted(schedule.id, schedule.schedule_date);
      
      if (isCurrentlyCompleted) {
        // 완료 상태 해제
        const { error } = await supabase
          .from('completions')
          .delete()
          .eq('item_id', schedule.id)
          .eq('item_type', 'special_schedule')
          .eq('completion_date', schedule.schedule_date);
        if (error) throw error;
      } else {
        // 완료 상태 추가
        const { error } = await supabase
          .from('completions')
          .insert({
            user_id: USER_ID,
            item_id: schedule.id,
            item_type: 'special_schedule',
            completion_date: schedule.schedule_date
          });
        if (error) throw error;
      }
      
      // 완료 상태 다시 불러오기
      await fetchCompletions();
      if (onChange) onChange();
    } catch (e) {
      alert('완료 상태 변경 실패: ' + (e.message || '알 수 없는 오류'));
    }
  };

  useEffect(() => {
    fetchSchedules();
    fetchCompletions();
  }, []);

  const handleAdd = async () => {
    if (!scheduleText.trim() || !scheduleDate) return;
    try {
      setLoading(true);
      const { error } = await supabase
        .from('special_schedules')
        .insert({ user_id: USER_ID, text: scheduleText.trim(), schedule_date: scheduleDate });
      if (error) throw error;
      setScheduleText('');
      setScheduleDate('');
      fetchSchedules();
      if (onChange) onChange();
    } catch (e) {
      alert('추가 실패: ' + (e.message || '알 수 없는 오류'));
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('special_schedules')
        .delete()
        .eq('id', id);
      if (error) throw error;
      fetchSchedules();
      if (onChange) onChange();
    } catch (e) {
      alert('삭제 실패: ' + (e.message || '알 수 없는 오류'));
    }
    setLoading(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAdd();
    }
  };

  // 완료/미완료로 분리
  const completedSchedules = schedules.filter(schedule => isCompleted(schedule.id, schedule.schedule_date));
  const incompleteSchedules = schedules.filter(schedule => !isCompleted(schedule.id, schedule.schedule_date));

  return (
    <div className="p-0">
      <h3 className="text-lg font-semibold mb-4">💗 특정업무</h3>
      <div className="flex gap-2 mb-4 items-center">
        <input
          type="date"
          className="border rounded px-2 py-1"
          value={scheduleDate}
          onChange={e => setScheduleDate(e.target.value)}
        />
        <input
          className="flex-1 border rounded px-2 py-1"
          value={scheduleText}
          onChange={e => setScheduleText(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="특정일 업무 입력"
        />
        <button
          className="bg-pink-400 text-white px-3 py-1 rounded"
          onClick={handleAdd}
          disabled={!scheduleText.trim() || !scheduleDate}
        >
          추가
        </button>
      </div>
      {loading ? (
        <div>로딩 중...</div>
      ) : (
        <>
          {/* 미완료 특별 스케줄 */}
          <ul className="space-y-2">
            {incompleteSchedules.length > 0 ? (
              incompleteSchedules.map(schedule => (
                <li key={schedule.id} className="flex justify-between items-center border-b pb-1">
                  <div className="flex items-center gap-2 flex-1">
                    <button
                      type="button"
                      onClick={() => toggleCompletion(schedule)}
                      className="flex-shrink-0 transition-transform hover:scale-110"
                    >
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                        isCompleted(schedule.id, schedule.schedule_date)
                          ? 'bg-gradient-to-r from-green-400 to-emerald-400 border-green-400 text-white' 
                          : 'border-pink-300 hover:border-pink-400 bg-white'
                      }`}>
                        {isCompleted(schedule.id, schedule.schedule_date) ? '✓' : ''}
                      </div>
                    </button>
                    <span className="text-gray-800">
                      {schedule.schedule_date} - {schedule.text}
                    </span>
                  </div>
                  <button className="text-red-500" onClick={() => handleDelete(schedule.id)}>
                    삭제
                  </button>
                </li>
              ))
            ) : (
              <div className="text-center text-gray-400 py-4">미완료 특정업무가 없습니다.</div>
            )}
          </ul>

          {/* 완료된 특별 스케줄 */}
          <div className="mt-6">
            <h4 className="text-base font-semibold mb-2 text-green-600">✅ 완료된 특정업무</h4>
            <ul className="space-y-2">
              {completedSchedules.length > 0 ? (
                completedSchedules.map(schedule => (
                  <li key={schedule.id} className="flex justify-between items-center border-b pb-1 opacity-60">
                    <div className="flex items-center gap-2 flex-1">
                      <button
                        type="button"
                        onClick={() => toggleCompletion(schedule)}
                        className="flex-shrink-0 transition-transform hover:scale-110"
                      >
                        <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all duration-300 bg-gradient-to-r from-green-400 to-emerald-400 border-green-400 text-white">
                          ✓
                        </div>
                      </button>
                      <span className="line-through text-gray-500">
                        {schedule.schedule_date} - {schedule.text}
                      </span>
                      <span className="text-sm">🎉</span>
                    </div>
                    <button className="text-red-500" onClick={() => handleDelete(schedule.id)}>
                      삭제
                    </button>
                  </li>
                ))
              ) : (
                <div className="text-center text-gray-400 py-2">완료된 특정업무가 없습니다.</div>
              )}
            </ul>
          </div>
        </>
      )}
    </div>
  );
};

export default SpecialSchedulePanel; 