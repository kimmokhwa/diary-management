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

  // 더 이상 기능 없음. 빈 div만 렌더링
  return <div />;
};

export default SpecificDateSchedulePanel; 