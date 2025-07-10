import React, { useState, useCallback, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Calendar, AlertCircle, CheckCircle2, Circle, CalendarDays, Clock } from 'lucide-react';
import { useRealtime } from '../../hooks/useRealtime';
import { supabase } from '../../services/supabase';
import { USER_ID } from '../../config/constants';
import DailyTodosPanel from './DailyTodosPanel';
import MonthlyTodosPanel from './MonthlyTodosPanel';
import DeadlineTasksPanel from './DeadlineTasksPanel';
import DailyMemosPanel from './DailyMemosPanel';

const MonthlyDiaryCalendar = () => {
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(today);
  const [selectedDate, setSelectedDate] = useState(today);
  const [showDayDetail, setShowDayDetail] = useState(true);
  const [showPanel, setShowPanel] = useState(false);
  const [activeTab, setActiveTab] = useState('daily');
  const [selectedDateMemo, setSelectedDateMemo] = useState('');

  // 실시간 데이터 구독
  const { data: memos, loading } = useRealtime('daily_memos');
  const { data: dailyTodos } = useRealtime('daily_todos');
  const { data: monthlyTodos } = useRealtime('monthly_todos');
  const { data: deadlineTasks } = useRealtime('deadline_tasks');
  const { data: completions } = useRealtime('completions');
  const [localCompletions, setLocalCompletions] = useState([]);

  // completions 데이터가 변경될 때 로컬 상태 업데이트
  useEffect(() => {
    if (completions) {
      setLocalCompletions(completions);
    }
  }, [completions]);

  // 날짜 포맷 함수
  const formatDate = useCallback((date) => {
    return date.toISOString().split('T')[0];
  }, []);



  // 메모 변경 핸들러
  const handleMemoChange = (e) => {
    setSelectedDateMemo(e.target.value);
  };

  // 달력 유틸리티 함수들
  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const formatDateForSupabase = (date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const navigateMonth = (direction) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  };

  // 날짜 선택 시 해당 날짜의 메모 로드
  const selectDate = (date) => {
    setSelectedDate(date);
    setShowDayDetail(true);
    
    const dateStr = formatDate(date);
    const memo = memos.find(memo => memo.memo_date === dateStr);
    setSelectedDateMemo(memo?.content || '');
  };

  // 선택된 날짜의 할일 데이터 가져오기
  const getSelectedDateTodos = () => {
    if (!selectedDate) return [];
    
    const dateStr = formatDate(selectedDate);
    const dayTodos = [];
    
    // 일일 업무 (모든 날짜에 적용)
    dailyTodos.forEach(todo => {
      dayTodos.push({
        ...todo,
        type: 'daily_todo',
        category: '매일'
      });
    });
    
    // 월간 업무 (해당 날짜만)
    monthlyTodos
      .filter(todo => todo.repeat_date === selectedDate.getDate())
      .forEach(todo => {
        dayTodos.push({
          ...todo,
          type: 'monthly_todo',
          category: '월간 업무'
        });
      });
    
    // 마감일 업무 (완료되지 않은 모든 마감업무를 표시)
    deadlineTasks
      .filter(task => {
        // 해당 날짜에 완료되지 않은 마감업무만 표시
        const isCompletedToday = localCompletions.some(completion => 
          completion.item_id === task.id && 
          completion.item_type === 'deadline_task' &&
          completion.completion_date === dateStr
        );
        
        // 완료되지 않은 업무만 표시
        return !isCompletedToday;
      })
      .forEach(task => {
        const taskDeadline = new Date(task.deadline_date);
        const today = new Date(dateStr);
        const isOverdue = taskDeadline < today;
        
        dayTodos.push({
          ...task,
          type: 'deadline_task',
          category: '마감일 업무',
          isOverdue: isOverdue // 마감일이 지났는지 표시
        });
      });

    return dayTodos;
  };

  const getDayInfo = (day) => {
    const dateStr = formatDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
    
    // 해당 날짜의 모든 할일 수집
    const todos = [];
    
    // 일일 업무 추가
    dailyTodos.forEach(todo => todos.push({ id: todo.id, type: 'daily_todo' }));
    
    // 월간 업무 추가 (해당 날짜만)
    monthlyTodos
      .filter(todo => todo.repeat_date === day)
      .forEach(todo => todos.push({ id: todo.id, type: 'monthly_todo' }));
    
    // 마감일 업무 추가 (완료되지 않은 모든 마감업무)
    deadlineTasks
      .filter(task => {
        // 해당 날짜에 완료되지 않은 마감업무만 표시
        const isCompletedToday = localCompletions.some(completion => 
          completion.item_id === task.id && 
          completion.item_type === 'deadline_task' &&
          completion.completion_date === dateStr
        );
        
        return !isCompletedToday;
      })
      .forEach(task => todos.push({ id: task.id, type: 'deadline_task' }));
    
    // 완료된 할일 수 계산 (해당 날짜 기준)
    const completedCount = todos.filter(todo => 
      localCompletions.some(completion => 
        completion.item_id === todo.id && 
        completion.item_type === todo.type &&
        completion.completion_date === dateStr
      )
    ).length;
    
    return {
      totalCount: todos.length,
      completedCount
    };
  };

  // 탭별 필터링된 데이터 가져오기
  const getFilteredData = () => {
    switch (activeTab) {
      case 'daily':
        return { type: 'daily', data: dailyTodos, icon: Calendar, color: 'bg-gray-500' };
      case 'monthly':
        return { type: 'monthly', data: monthlyTodos, icon: CalendarDays, color: 'bg-blue-500' };
      case 'deadline':
        // 완료되지 않은 마감업무만 표시
        const incompleteDeadlineTasks = deadlineTasks.filter(task => {
          // 이 마감업무에 대한 완료 기록이 있는지 확인
          const hasAnyCompletion = localCompletions.some(completion => 
            completion.item_id === task.id && 
            completion.item_type === 'deadline_task'
          );
          
          // 완료 기록이 없는 업무만 표시
          return !hasAnyCompletion;
        });
        
        return { type: 'deadline', data: incompleteDeadlineTasks, icon: AlertCircle, color: 'bg-red-500' };
      default:
        return { type: 'daily', data: dailyTodos, icon: Calendar, color: 'bg-gray-500' };
    }
  };

  // 완료 여부 확인 (선택된 날짜 기준)
  const isCompleted = (itemId, itemType) => {
    if (!itemId || !itemType || !Array.isArray(localCompletions)) {
      return false;
    }

    const selectedDateStr = selectedDate ? selectedDate.toISOString().split('T')[0] : null;
    
    const result = localCompletions.some(completion => 
      completion.item_id === itemId && 
      completion.item_type === itemType &&
      completion.completion_date === selectedDateStr
    );
    
    return result;
  };

  // 할일 완료 상태 토글 (조용한 방식)
  const toggleCompletion = async (todo) => {
    
          if (!todo?.id || !todo?.type) {
        console.error('❌ 잘못된 todo 데이터:', todo);
        return;
      }

      const selectedDateStr = selectedDate ? selectedDate.toISOString().split('T')[0] : null;
      if (!selectedDateStr) {
        return;
      }

    try {
      // 데이터베이스에서 직접 현재 상태 확인
      const { data: currentCompletions, error: selectError } = await supabase
        .from('completions')
        .select('*')
        .eq('item_id', todo.id)
        .eq('item_type', todo.type)
        .eq('completion_date', selectedDateStr);

      if (selectError) {
        console.error('❌ 상태 확인 오류:', selectError);
        throw selectError;
      }

      const isCurrentlyCompleted = currentCompletions && currentCompletions.length > 0;

      if (isCurrentlyCompleted) {
        // 완료 상태 해제
        const { data, error } = await supabase
          .from('completions')
          .delete()
          .eq('item_id', todo.id)
          .eq('item_type', todo.type)
          .eq('completion_date', selectedDateStr)
          .select();

        if (error) throw error;
        
        // 로컬 상태에서 즉시 제거
        setLocalCompletions(prev => prev.filter(completion => 
          !(completion.item_id === todo.id && 
            completion.item_type === todo.type && 
            completion.completion_date === selectedDateStr)
        ));
      } else {
        // 완료 상태 추가
        const newCompletion = {
          item_id: todo.id,
          item_type: todo.type,
          user_id: USER_ID,
          completion_date: selectedDateStr
        };
        
        const { data, error } = await supabase
          .from('completions')
          .upsert(newCompletion, {
            onConflict: 'item_id,item_type,completion_date'
          })
          .select();

        if (error) throw error;
        
        // 로컬 상태에 즉시 추가
        setLocalCompletions(prev => [...prev, data[0]]);
      }

      // 실시간 업데이트는 useRealtime 훅에서 자동으로 처리됩니다

    } catch (error) {
      console.error('💥 완료 상태 토글 중 오류:', error);
      // 에러 발생 시 로컬 상태 복원
      setLocalCompletions(completions || []);
    }
  };

  // 할일 목록 렌더링
  const renderTodoList = () => {
    const selectedDateTodos = getSelectedDateTodos();
    
    if (!Array.isArray(selectedDateTodos) || selectedDateTodos.length === 0) {
      return (
        <div className="text-center text-gray-500 py-8">
          <div className="text-4xl mb-2">🌸</div>
          <p className="text-sm">이 날짜에 등록된 할 일이 없어요!</p>
          <p className="text-xs text-gray-400 mt-1">새로운 할일을 추가해보세요 ✨</p>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {selectedDateTodos.map((todo, index) => {
          if (!todo?.id) {
            console.error('잘못된 todo 데이터:', todo);
            return null;
          }

          const isComplete = isCompleted(todo.id, todo.type);
          
          return (
            <div 
              key={`${todo.type}-${todo.id || index}`} 
              className={`cute-card p-2 transition-all duration-300 hover:scale-102 ${
                isComplete ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200' : 
                todo.isOverdue ? 'bg-gradient-to-r from-red-50 to-rose-50 border-red-200' :
                'border-pink-100'
              }`}
            >
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleCompletion(todo);
                  }}
                  className="flex-shrink-0 transition-transform hover:scale-110"
                >
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                    isComplete 
                      ? 'bg-gradient-to-r from-green-400 to-emerald-400 border-green-400 text-white' 
                      : 'border-pink-300 hover:border-pink-400 bg-white'
                  }`}>
                    {isComplete ? '✓' : ''}
                  </div>
                </button>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className={`block transition-all duration-300 text-sm ${
                      isComplete ? 'line-through text-gray-500' : 'text-gray-800 font-medium'
                    }`}>
                      {todo.text || '할일'}
                    </span>
                    {Boolean(isComplete) && <span className="text-sm">🎉</span>}
                  </div>
                  {todo.type === 'deadline_task' && (
                    <div className={`text-xs mt-0.5 ${
                      todo.isOverdue ? 'text-red-600 font-medium' : 'text-gray-500'
                    }`}>
                      📅 {todo.deadline_date} 
                      {todo.isOverdue && ' (마감일 지남)'}
                    </div>
                  )}
                </div>
                
                <div className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  todo.type === 'daily_todo' ? 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700' :
                  todo.type === 'monthly_todo' ? 'bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700' :
                  todo.isOverdue ? 'bg-gradient-to-r from-red-100 to-rose-100 text-red-700' :
                  'bg-gradient-to-r from-orange-100 to-red-100 text-orange-700'
                }`}>
                  {todo.type === 'daily_todo' ? '💜 매일' :
                   todo.type === 'monthly_todo' ? '💙 월간' : 
                   todo.isOverdue ? '🚨 마감' : '🧡 마감'}
                </div>
              </div>
            </div>
          );
        }).filter(Boolean)}
      </div>
    );
  };

  // 달력 그리드 생성
  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    // 요일 헤더 추가
    const weekDays = ['일', '월', '화', '수', '목', '금', '토'];
    weekDays.forEach((day, index) => {
      days.push(
        <div key={`header-${day}`} className={`h-8 flex items-center justify-center font-semibold text-sm
          ${index === 0 ? 'text-red-500' : ''}
          ${index === 6 ? 'text-blue-500' : ''}
        `}>
          {day}
        </div>
      );
    });

    // 빈 셀 추가 (이전 달)
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-16 bg-gray-50/30"></div>);
    }

    // 현재 달의 날짜들
    for (let day = 1; day <= daysInMonth; day++) {
      const dayInfo = getDayInfo(day);
      const isToday = new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();
      const isSelected = selectedDate && selectedDate.getDate() === day && 
                        selectedDate.getMonth() === currentDate.getMonth() && 
                        selectedDate.getFullYear() === currentDate.getFullYear();
      const dayOfWeek = new Date(currentDate.getFullYear(), currentDate.getMonth(), day).getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      days.push(
        <div
          key={day}
          onClick={() => selectDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day))}
          className={`calendar-day ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}`}
        >
          <div className={`date ${dayOfWeek === 0 ? 'sunday' : ''} ${dayOfWeek === 6 ? 'saturday' : ''}`}>
            {day}
          </div>
          {Boolean(dayInfo.totalCount > 0) && (
            <div className="mt-1 flex items-center justify-center">
              {dayInfo.completedCount === dayInfo.totalCount ? (
                <div className="todo-status flex items-center gap-1">
                  <span>✨</span>
                  <span>{dayInfo.completedCount}/{dayInfo.totalCount}</span>
                </div>
              ) : dayInfo.completedCount > 0 ? (
                <div className="todo-status partial flex items-center gap-1">
                  <span>🌟</span>
                  <span>{dayInfo.completedCount}/{dayInfo.totalCount}</span>
                </div>
              ) : (
                <div className="todo-status none flex items-center gap-1">
                  <span>📝</span>
                  <span>{dayInfo.totalCount}</span>
                </div>
              )}
            </div>
          )}
        </div>
      );
    }

    return days;
  };

  // 메모 저장 함수
  const saveMemo = async () => {
    if (!selectedDate) return;

    try {
      const dateStr = formatDate(selectedDate);
      
      const memoData = {
        user_id: USER_ID,
        memo_date: dateStr,
        content: selectedDateMemo,
        updated_at: new Date().toISOString()
      };
      
      console.log('📝 메모 저장 시도:', memoData);
      
      // UPSERT 방식으로 처리 (삽입 또는 업데이트)
      const { data, error } = await supabase
        .from('daily_memos')
        .upsert(memoData, {
          onConflict: 'user_id,memo_date'
        })
        .select();

      if (error) throw error;
      
      console.log('✅ 메모 저장 성공:', data);
      alert('메모가 성공적으로 저장되었습니다! 💾');
      
    } catch (error) {
      console.error('❌ 메모 저장 중 오류:', error);
      console.error('❌ 오류 상세:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        selectedDate: selectedDate,
        dateStr: formatDate(selectedDate),
        memoContent: selectedDateMemo
      });
      alert(`메모 저장 중 오류가 발생했습니다:\n${error.message || '알 수 없는 오류'}`);
    }
  };

  // 메모 삭제 함수  
  const deleteMemo = async () => {
    if (!selectedDate) return;

    try {
      const dateStr = formatDate(selectedDate);
      const existingMemo = memos.find(memo => memo.memo_date === dateStr);
      
      if (existingMemo) {
        const { error } = await supabase
          .from('daily_memos')
          .delete()
          .eq('id', existingMemo.id);

        if (error) throw error;
        
        setSelectedDateMemo('');
      }
    } catch (error) {
      console.error('❌ 메모 삭제 중 오류:', error);
      console.error('❌ 오류 상세:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        selectedDate: selectedDate,
        dateStr: formatDate(selectedDate)
      });
      alert(`메모 삭제 중 오류가 발생했습니다:\n${error.message || '알 수 없는 오류'}`);
    }
  };

  // 선택된 날짜 상세 정보 렌더링
  const renderDayDetail = () => {
    if (!selectedDate) return null;

    return (
      <div className="space-y-4">
        {/* 오늘의 할일 */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">✨</span>
            <h4 className="font-semibold text-gray-800">오늘의 할일</h4>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {renderTodoList()}
          </div>
            </div>

        {/* 메모 섹션 */}
        <div className="border-t border-pink-100 pt-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">📝</span>
            <h4 className="font-semibold text-gray-800">오늘의 메모</h4>
                  </div>
          <div className="space-y-3">
            <textarea
              value={selectedDateMemo}
              onChange={handleMemoChange}
              placeholder="오늘 하루는 어땠나요? 💭"
              className="cute-input min-h-[100px] resize-none"
            />
          <div className="flex gap-2">
              <button
                onClick={saveMemo}
                className="cute-button-primary flex-1"
              >
                💾 저장하기
            </button>
            <button 
                onClick={deleteMemo}
                className="cute-button-secondary"
            >
                🗑️ 삭제
            </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 패널 렌더링
  const renderPanel = () => {
    const filteredData = getFilteredData();

  return (
      <div className="space-y-6">
        {/* 탭 버튼들 */}
        <div className="flex flex-wrap gap-2 justify-center">
        <button
          onClick={() => setActiveTab('daily')}
            className={`cute-button transition-all duration-300 ${
            activeTab === 'daily' 
                ? 'bg-gradient-to-r from-purple-400 to-pink-400 text-white shadow-lg' 
                : 'cute-button-secondary'
          }`}
        >
            <span className="mr-2">💜</span>
          매일 업무
        </button>
        
        <button
          onClick={() => setActiveTab('monthly')}
            className={`cute-button transition-all duration-300 ${
            activeTab === 'monthly' 
                ? 'bg-gradient-to-r from-blue-400 to-cyan-400 text-white shadow-lg' 
                : 'cute-button-secondary'
          }`}
        >
            <span className="mr-2">💙</span>
            월간 업무
        </button>
        
        <button
          onClick={() => setActiveTab('deadline')}
            className={`cute-button transition-all duration-300 ${
            activeTab === 'deadline' 
                ? 'bg-gradient-to-r from-orange-400 to-red-400 text-white shadow-lg' 
                : 'cute-button-secondary'
          }`}
        >
            <span className="mr-2">🧡</span>
            마감 업무
        </button>
      </div>

        {/* 컴포넌트 렌더링 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 입력 폼 */}
          <div className="cute-card p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span className="text-2xl">
                {activeTab === 'daily' ? '💜' : activeTab === 'monthly' ? '💙' : '🧡'}
              </span>
              새로운 {activeTab === 'daily' ? '매일' : activeTab === 'monthly' ? '월간' : '마감'} 업무
            </h3>
            
            {activeTab === 'daily' && <DailyTodosPanel />}
            
            {activeTab === 'monthly' && <MonthlyTodosPanel />}
            
            {activeTab === 'deadline' && <DeadlineTasksPanel />}
          </div>

          {/* 기존 항목 목록 */}
          <div className="cute-card p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span className="text-2xl">📋</span>
              등록된 업무 목록
            </h3>
            
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {filteredData.data?.length > 0 ? (
                filteredData.data.map((item, index) => (
                  <div key={item.id || index} className="cute-card p-2 border border-gray-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">
                          {activeTab === 'daily' ? '💜' : activeTab === 'monthly' ? '💙' : '🧡'}
                        </span>
                        <span className="font-medium text-gray-800 text-sm">{item.text}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        {activeTab === 'monthly' && (
                          <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full text-xs">
                            매월 {item.repeat_date}일
                          </span>
                        )}
                        {activeTab === 'deadline' && (
                          <span className="bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full text-xs">
                            {item.deadline_date}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <div className="text-3xl mb-2">🌸</div>
                  <p className="text-sm">등록된 업무가 없어요!</p>
                  <p className="text-xs text-gray-400 mt-1">새로운 업무를 추가해보세요 ✨</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="cute-card mb-6 p-6 slide-up">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full flex items-center justify-center text-white text-2xl pulse-cute">
                🗓️
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                  나의 귀여운 다이어리
                </h1>
                <p className="text-gray-600 text-sm">오늘도 화이팅! ✨</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowPanel(!showPanel)}
                className="cute-button-secondary"
              >
                {showPanel ? '📝 패널 닫기' : '📝 할일 관리'}
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* 달력 - 전체 너비 */}
          <div className="cute-card p-6 slide-up">
            {/* 달력 네비게이션 */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => navigateMonth(-1)}
                className="cute-button-secondary w-10 h-10 rounded-full flex items-center justify-center"
              >
                🌸
              </button>
              <h2 className="text-xl font-bold text-gray-800">
                {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월 💕
              </h2>
              <button
                onClick={() => navigateMonth(1)}
                className="cute-button-secondary w-10 h-10 rounded-full flex items-center justify-center"
              >
                🌺
              </button>
      </div>

      {/* 달력 그리드 */}
            <div className="calendar-grid">
        {renderCalendarDays()}
            </div>
          </div>

          {/* 하단 고정 패널 - 오늘의 할일 & 메모 */}
          {Boolean(showDayDetail) && (
            <div className="cute-card p-6 slide-up">
              <div className="flex items-center gap-2 mb-6">
                <span className="text-2xl">📅</span>
                <h3 className="text-xl font-bold text-gray-800">
                  {selectedDate?.toLocaleDateString('ko-KR', {
                    month: 'long',
                    day: 'numeric',
                    weekday: 'long'
                  })}
                </h3>
      </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 왼쪽: 오늘의 할일 */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-lg">✨</span>
                    <h4 className="text-lg font-semibold text-gray-800">오늘의 할일</h4>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {renderTodoList()}
                  </div>
                </div>

                {/* 오른쪽: 메모 섹션 */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-lg">📝</span>
                    <h4 className="text-lg font-semibold text-gray-800">오늘의 메모</h4>
                  </div>
                  <div className="space-y-3">
                    <textarea
                      value={selectedDateMemo}
                      onChange={handleMemoChange}
                      placeholder="오늘 하루는 어땠나요? 💭"
                      className="cute-input min-h-[300px] resize-none"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={saveMemo}
                        className="cute-button-primary flex-1"
                      >
                        💾 저장하기
                      </button>
                      <button
                        onClick={deleteMemo}
                        className="cute-button-secondary"
                      >
                        🗑️ 삭제
      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 하단 관리 패널 */}
        {Boolean(showPanel) && (
          <div className="mt-6 cute-card p-6 slide-up">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">✨</span>
              <h3 className="text-lg font-bold text-gray-800">할일 관리</h3>
            </div>
            {renderPanel()}
          </div>
        )}
      </div>
    </div>
  );
};

export default MonthlyDiaryCalendar; 