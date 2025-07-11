import React, { useState, useEffect, memo } from 'react';
import { X, Calendar, Trash2, Edit3 } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { USER_ID } from '../../config/constants';

const ScheduleManagementModal = (props) => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [editDate, setEditDate] = useState('');

  // 스케줄 목록 불러오기
  const fetchSchedules = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('specific_schedules')
        .select('*')
        .eq('user_id', USER_ID)
        .order('schedule_date', { ascending: true });

      if (error) throw error;
      
      setSchedules(data || []);
      
    } catch (error) {
      console.error('❌ 스케줄 목록 불러오기 오류:', error);
      alert('스케줄 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 모달이 열릴 때 스케줄 목록 불러오기
  useEffect(() => {
    if (props.isOpen) {
      fetchSchedules();
    }
  }, [props.isOpen]);

  // 스케줄 삭제
  const deleteSchedule = async (id) => {
    if (!confirm('이 스케줄을 삭제하시겠습니까? 🗑️')) return;

    try {
      const { error } = await supabase
        .from('specific_schedules')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setSchedules(prev => prev.filter(schedule => schedule.id !== id));
      alert('스케줄이 삭제되었습니다! ✅');
      
    } catch (error) {
      console.error('❌ 스케줄 삭제 오류:', error);
      alert('스케줄 삭제 중 오류가 발생했습니다.');
    }
  };

  // 수정 모드 시작
  const startEdit = (schedule) => {
    setEditingId(schedule.id);
    setEditText(schedule.text);
    setEditDate(schedule.schedule_date);
  };

  // 수정 취소
  const cancelEdit = () => {
    setEditingId(null);
    setEditText('');
    setEditDate('');
  };

  // 수정 저장
  const saveEdit = async () => {
    if (!editText.trim() || !editDate) {
      alert('내용과 날짜를 모두 입력해주세요!');
      return;
    }

    try {
      const { error } = await supabase
        .from('specific_schedules')
        .update({
          text: editText.trim(),
          schedule_date: editDate,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingId);

      if (error) throw error;
      
      // 로컬 상태 업데이트
      setSchedules(prev => prev.map(schedule => 
        schedule.id === editingId 
          ? { ...schedule, text: editText.trim(), schedule_date: editDate }
          : schedule
      ));
      
      cancelEdit();
      alert('스케줄이 수정되었습니다! ✅');
      
    } catch (error) {
      console.error('❌ 스케줄 수정 오류:', error);
      alert('스케줄 수정 중 오류가 발생했습니다.');
    }
  };

  // 날짜 포맷팅
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short'
    });
  };

  if (!props.isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden shadow-2xl">
        {/* 헤더 */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calendar size={24} />
            <h2 className="text-xl font-bold">📅 특정일 스케줄 관리</h2>
          </div>
          <button
            onClick={props.onClose}
            className="hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* 내용 */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600">스케줄을 불러오는 중...</p>
            </div>
          ) : schedules.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📅</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">등록된 스케줄이 없어요!</h3>
              <p className="text-gray-600">새로운 특정일 스케줄을 추가해보세요 ✨</p>
            </div>
          ) : (
            <div className="space-y-3">
              {schedules.map((schedule) => (
                <div key={schedule.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-all">
                  {editingId === schedule.id ? (
                    // 수정 모드
                    <div className="space-y-3">
                      <input
                        type="date"
                        value={editDate}
                        onChange={(e) => setEditDate(e.target.value)}
                        className="cute-input"
                      />
                      <input
                        type="text"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="cute-input"
                        placeholder="스케줄 내용"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={saveEdit}
                          className="cute-button-primary text-sm px-3 py-1"
                        >
                          ✅ 저장
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="cute-button-secondary text-sm px-3 py-1"
                        >
                          ❌ 취소
                        </button>
                      </div>
                    </div>
                  ) : (
                    // 일반 모드
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">🎯</span>
                          <span className="font-medium text-gray-800">{schedule.text}</span>
                        </div>
                        <div className="text-sm text-gray-600 ml-6">
                          📅 {formatDate(schedule.schedule_date)}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEdit(schedule)}
                          className="text-blue-600 hover:bg-blue-50 p-2 rounded-full transition-all"
                          title="수정"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          onClick={() => deleteSchedule(schedule.id)}
                          className="text-red-600 hover:bg-red-50 p-2 rounded-full transition-all"
                          title="삭제"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <div className="flex justify-between items-center text-sm text-gray-600">
            <span>총 {schedules.length}개의 스케줄</span>
            <button
              onClick={props.onClose}
              className="cute-button-secondary"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(ScheduleManagementModal); 