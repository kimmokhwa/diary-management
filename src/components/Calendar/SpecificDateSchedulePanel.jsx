import React, { useState, memo } from 'react';
import { supabase } from '../../services/supabase';
import { USER_ID } from '../../config/constants';
import ScheduleManagementModal from '../Modal/ScheduleManagementModal';
import { useRealtime } from '../../hooks/useRealtime';

const SpecificDateSchedulePanel = () => {
  const [scheduleText, setScheduleText] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isManagementModalOpen, setIsManagementModalOpen] = useState(false);
  const [completions, setCompletions] = useState([]);

  // 실시간 스케줄 목록
  const { data: schedules, loading: schedulesLoading } = useRealtime('specific_schedules');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!scheduleText.trim() || !scheduleDate) {
      alert('스케줄 내용과 날짜를 모두 입력해주세요! 📅');
      return;
    }

    try {
      setIsLoading(true);
      
      const scheduleData = {
        user_id: USER_ID,
        text: scheduleText.trim(),
        schedule_date: scheduleDate,
        created_at: new Date().toISOString()
      };
      
      console.log('📅 특정일 스케줄 추가 시도:', scheduleData);
      
      const { data, error } = await supabase
        .from('specific_schedules')
        .insert([scheduleData])
        .select();

      if (error) throw error;
      
      console.log('✅ 특정일 스케줄 추가 성공:', data);
      
      // 입력 필드 초기화
      setScheduleText('');
      setScheduleDate('');
      
      alert('특정일 스케줄이 성공적으로 추가되었습니다! 🎯');
      
    } catch (error) {
      console.error('❌ 특정일 스케줄 추가 중 오류:', error);
      alert(`특정일 스케줄 추가 중 오류가 발생했습니다:\n${error.message || '알 수 없는 오류'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 완료 상태 불러오기
  const fetchCompletions = async () => {
    try {
      const { data, error } = await supabase
        .from('completions')
        .select('*')
        .eq('user_id', USER_ID)
        .eq('item_type', 'specific_schedule');
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
          .eq('item_type', 'specific_schedule')
          .eq('completion_date', schedule.schedule_date);
        if (error) throw error;
      } else {
        // 완료 상태 추가
        const { error } = await supabase
          .from('completions')
          .insert({
            user_id: USER_ID,
            item_id: schedule.id,
            item_type: 'specific_schedule',
            completion_date: schedule.schedule_date
          });
        if (error) throw error;
      }
      
      // 완료 상태 다시 불러오기
      await fetchCompletions();
    } catch (e) {
      alert('완료 상태 변경 실패: ' + (e.message || '알 수 없는 오류'));
    }
  };

  // 로컬 시간대 기준 날짜 포맷 함수
  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // 오늘 날짜를 기본값으로 설정 (시간대 문제 해결)
  const today = formatDate(new Date());

  // ScheduleManagementModal을 memo로 감싸기
  const MemoizedScheduleManagementModal = memo(ScheduleManagementModal);

  // 완료/미완료로 분리
  const completedSchedules = schedules?.filter(schedule => isCompleted(schedule.id, schedule.schedule_date)) || [];
  const incompleteSchedules = schedules?.filter(schedule => !isCompleted(schedule.id, schedule.schedule_date)) || [];

  // 컴포넌트 마운트 시 완료 상태 불러오기
  React.useEffect(() => {
    fetchCompletions();
  }, []);

  return (
    <div className="p-0">
      <h3 className="text-lg font-semibold mb-4">🎯 특정일 스케줄</h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex gap-2 items-center">
          <input
            type="date"
            className="border rounded px-2 py-1"
            value={scheduleDate}
            onChange={e => setScheduleDate(e.target.value)}
            required
          />
          <input
            className="flex-1 border rounded px-2 py-1"
            value={scheduleText}
            onChange={e => setScheduleText(e.target.value)}
            placeholder="특정일 스케줄 입력"
            required
          />
          <button
            type="submit"
            className="bg-indigo-400 text-white px-3 py-1 rounded"
            disabled={!scheduleText.trim() || !scheduleDate || isLoading}
          >
            {isLoading ? '추가 중...' : '추가'}
          </button>
        </div>
      </form>
      
      {schedulesLoading ? (
        <div className="text-center py-4">로딩 중...</div>
      ) : (
        <>
          {/* 미완료 특정일 스케줄 */}
          <ul className="space-y-2 mt-4">
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
                          : 'border-indigo-300 hover:border-indigo-400 bg-white'
                      }`}>
                        {isCompleted(schedule.id, schedule.schedule_date) ? '✓' : ''}
                      </div>
                    </button>
                    <span className="text-gray-800">
                      {schedule.schedule_date} - {schedule.text}
                    </span>
                  </div>
                  <button 
                    className="text-red-500" 
                    onClick={async () => {
                      try {
                        const { error } = await supabase
                          .from('specific_schedules')
                          .delete()
                          .eq('id', schedule.id);
                        if (error) throw error;
                      } catch (e) {
                        alert('삭제 실패: ' + (e.message || '알 수 없는 오류'));
                      }
                    }}
                  >
                    삭제
                  </button>
                </li>
              ))
            ) : (
              <div className="text-center text-gray-400 py-4">미완료 특정일 스케줄이 없습니다.</div>
            )}
          </ul>

          {/* 완료된 특정일 스케줄 */}
          <div className="mt-6">
            <h4 className="text-base font-semibold mb-2 text-green-600">✅ 완료된 특정일 스케줄</h4>
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
                    <button 
                      className="text-red-500" 
                      onClick={async () => {
                        try {
                          const { error } = await supabase
                            .from('specific_schedules')
                            .delete()
                            .eq('id', schedule.id);
                          if (error) throw error;
                        } catch (e) {
                          alert('삭제 실패: ' + (e.message || '알 수 없는 오류'));
                        }
                      }}
                    >
                      삭제
                    </button>
                  </li>
                ))
              ) : (
                <div className="text-center text-gray-400 py-2">완료된 특정일 스케줄이 없습니다.</div>
              )}
            </ul>
          </div>
        </>
      )}
    </div>
  );
};

export default SpecificDateSchedulePanel; 