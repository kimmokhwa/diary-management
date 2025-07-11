import React, { useState } from 'react';
import { supabase } from '../../services/supabase';
import { USER_ID } from '../../config/constants';

const SpecialSchedulePanel = ({ onChange }) => {
  const [scheduleText, setScheduleText] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');
  const [schedules, setSchedules] = useState([]);
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

  React.useEffect(() => {
    fetchSchedules();
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
        <ul className="space-y-2">
          {schedules.length > 0 ? (
            schedules.map(schedule => (
              <li key={schedule.id} className="flex justify-between items-center border-b pb-1">
                <span>{schedule.schedule_date} - {schedule.text}</span>
                <button className="text-red-500" onClick={() => handleDelete(schedule.id)}>
                  삭제
                </button>
              </li>
            ))
          ) : (
            <div className="text-center text-gray-400 py-4">등록된 특정업무가 없습니다.</div>
          )}
        </ul>
      )}
    </div>
  );
};

export default SpecialSchedulePanel; 