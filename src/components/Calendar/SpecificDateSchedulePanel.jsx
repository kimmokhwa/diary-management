import React, { useState } from 'react';
import { supabase } from '../../services/supabase';
import { USER_ID } from '../../config/constants';
import ScheduleManagementModal from '../Modal/ScheduleManagementModal';

const SpecificDateSchedulePanel = () => {
  const [scheduleText, setScheduleText] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isManagementModalOpen, setIsManagementModalOpen] = useState(false);

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

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            📅 날짜 선택
          </label>
          <input
            type="date"
            value={scheduleDate}
            onChange={(e) => setScheduleDate(e.target.value)}
            min={today}
            className="cute-input"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            📝 스케줄 내용
          </label>
          <input
            type="text"
            value={scheduleText}
            onChange={(e) => setScheduleText(e.target.value)}
            placeholder="예: 병원 방문, 회의 참석, 친구 만나기..."
            className="cute-input"
            maxLength={100}
            required
          />
        </div>
        
        <button
          type="submit"
          disabled={isLoading}
          className={`cute-button-primary w-full ${
            isLoading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isLoading ? '📅 추가 중...' : '🎯 특정일 스케줄 추가'}
        </button>
      </form>

      {/* 스케줄 관리 버튼 */}
      <div className="pt-4 border-t border-gray-200">
        <button
          onClick={() => setIsManagementModalOpen(true)}
          className="cute-button-secondary w-full"
        >
          📋 기존 스케줄 관리 (수정/삭제)
        </button>
      </div>

      {/* 스케줄 관리 모달 */}
      <ScheduleManagementModal
        isOpen={isManagementModalOpen}
        onClose={() => setIsManagementModalOpen(false)}
      />
    </div>
  );
};

export default SpecificDateSchedulePanel; 