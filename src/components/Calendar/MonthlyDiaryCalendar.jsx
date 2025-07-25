import React, { useState, useCallback, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Plus, Calendar, AlertCircle, CheckCircle2, Circle, CalendarDays, Clock, Menu, X } from 'lucide-react';
import { useRealtime } from '../../hooks/useRealtime';
import { supabase } from '../../services/supabase';
import { USER_ID } from '../../config/constants';
import DailyTodosPanel from './DailyTodosPanel';
import MonthlyTodosPanel from './MonthlyTodosPanel';
import DeadlineTasksPanel from './DeadlineTasksPanel';
import DailyMemosPanel from './DailyMemosPanel';
import ScheduleManagementModal from '../Modal/ScheduleManagementModal';
import SpecialSchedulePanel from './SpecialSchedulePanel';
import TaxManagementPanel from './TaxManagementPanel';
import ApprovalManagementPanel from './ApprovalManagementPanel';
import WeatherWidget from '../common/WeatherWidget';
import WeatherEffects from '../common/WeatherEffects';

const MonthlyDiaryCalendar = () => {
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(today);
  const [selectedDate, setSelectedDate] = useState(today);
  const [showDayDetail, setShowDayDetail] = useState(true);
  const [showPanel, setShowPanel] = useState(false); // 모바일에서 기본적으로 닫힘
  const [activeTab, setActiveTab] = useState('daily');
  const [selectedDateMemo, setSelectedDateMemo] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(''); // 'saving', 'saved', 'error'
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  // 모바일 최적화 상태
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileTabs, setShowMobileTabs] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const calendarRef = useRef(null);

  // 실시간 데이터 구독
  const { data: memos, loading } = useRealtime('daily_memos');
  const { data: dailyTodos } = useRealtime('daily_todos');
  const { data: monthlyTodos } = useRealtime('monthly_todos');
  const { data: deadlineTasks } = useRealtime('deadline_tasks');
  const { data: completions } = useRealtime('completions');
  const { data: specificSchedules } = useRealtime('specific_schedules');
  const { data: specialSchedules, refetch: refetchSpecialSchedules } = useRealtime('special_schedules');
  const { data: taxManagement } = useRealtime('tax_management');
  const { data: approvalManagement } = useRealtime('approval_management');
  const [localCompletions, setLocalCompletions] = useState([]);
  const [weather, setWeather] = useState(null);

  // completions 데이터가 변경될 때 로컬 상태 업데이트
  useEffect(() => {
    if (completions) {
      setLocalCompletions(completions);
    }
  }, [completions]);

  // 모바일 감지 및 초기화
  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice = window.innerWidth <= 768;
      setIsMobile(isMobileDevice);
      // 데스크톱에서는 패널 기본 열림, 모바일에서는 닫힘
      if (!isMobileDevice && !showPanel) {
        setShowPanel(true);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 터치 제스처 핸들러
  const minSwipeDistance = 50;
  const handleTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };
  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };
  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    if (isLeftSwipe) {
      navigateMonth(1); // 다음 달
    }
    if (isRightSwipe) {
      navigateMonth(-1); // 이전 달
    }
  };

  // 날짜 포맷 함수 - 시간대 문제 해결
  const formatDate = useCallback((date) => {
    // 로컬 시간대를 고려한 날짜 포맷 (YYYY-MM-DD)
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  // 자동 저장 함수 (debounced)
  const autoSaveMemo = useCallback(async (memo, date) => {
    if (!date) return;

    try {
      setIsSaving(true);
      setSaveStatus('saving');

      const dateStr = formatDate(date);

      const memoData = {
        user_id: USER_ID,
        memo_date: dateStr,
        content: memo,
        updated_at: new Date().toISOString()
      };

      console.log('🔄 메모 자동 저장 중:', memoData);

      // UPSERT 방식으로 처리 (삽입 또는 업데이트)
      const { data, error } = await supabase
        .from('daily_memos')
        .upsert(memoData, {
          onConflict: 'user_id,memo_date'
        })
        .select();

      if (error) throw error;

      console.log('✅ 메모 자동 저장 성공:', data);
      setSaveStatus('saved');

      // 저장 완료 상태를 2초 후 자동으로 지움
      setTimeout(() => {
        setSaveStatus('');
      }, 2000);

    } catch (error) {
      console.error('❌ 메모 자동 저장 중 오류:', error);
      setSaveStatus('error');

      // 에러 상태를 3초 후 자동으로 지움
      setTimeout(() => {
        setSaveStatus('');
      }, 3000);
    } finally {
      setIsSaving(false);
    }
  }, [formatDate]);

  // Debounce 훅 구현
  useEffect(() => {
    if (!selectedDate) return;

    // 빈 문자열이 아닌 경우에만 자동 저장
    if (selectedDateMemo.trim() === '') return;

    // 2초 후에 자동 저장
    const timeoutId = setTimeout(() => {
      autoSaveMemo(selectedDateMemo, selectedDate);
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [selectedDateMemo, selectedDate, autoSaveMemo]);



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



  const navigateMonth = (direction) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  };

  // 날씨 변경 핸들러
  const handleWeatherChange = (weatherData) => {
    setWeather(weatherData);
  };

  // 날씨 효과 클래스 결정
  const getWeatherClass = () => {
    if (!weather) return '';

    console.log('🎨 메인 컴포넌트 날씨 클래스 결정:', weather.weather);
    const weatherLower = weather.weather.toLowerCase();
    console.log('🎨 소문자 변환:', weatherLower);

    if (weatherLower.includes('rain') || weatherLower.includes('drizzle')) {
      console.log('🌧️ 비 클래스 적용');
      return 'weather-rain';
    } else if (weatherLower.includes('snow')) {
      console.log('❄️ 눈 클래스 적용');
      return 'weather-snow';
    } else if (weatherLower.includes('cloud')) {
      console.log('☁️ 흐림 클래스 적용');
      return 'weather-cloudy';
    } else {
      console.log('☀️ 맑음 클래스 적용 (하트)');
      return 'weather-clear';
    }
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
  const getSelectedDateTodos = (dateObj) => {
    if (!dateObj) return [];
    const dateStr = formatDate(dateObj);
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
      .filter(todo => todo.repeat_date === dateObj.getDate())
      .forEach(todo => {
        dayTodos.push({
          ...todo,
          type: 'monthly_todo',
          category: '월간 업무'
        });
      });
    // 마감일 업무 (입력날짜~마감날짜 범위에만, 문자열 비교)
    deadlineTasks
      .filter(task => {
        const createdStr = formatDate(new Date(task.created_at));
        const deadlineStr = formatDate(new Date(task.deadline_date));
        return createdStr <= dateStr && dateStr <= deadlineStr;
      })
      .forEach(task => {
        dayTodos.push({
          ...task,
          type: 'deadline_task',
          category: '마감일 업무',
          isOverdue: false
        });
      });
    // 특정일 스케줄 (해당 날짜만)
    if (specificSchedules) {
      specificSchedules
        .filter(schedule => schedule.schedule_date === dateStr)
        .forEach(schedule => {
          dayTodos.push({
            ...schedule,
            type: 'specific_schedule',
            category: '특정일 스케줄'
          });
        });
    }
    return dayTodos;
  };

  // getDayInfo 함수에서 todos 배열 생성 시 각 타입별로 필요한 필드 포함
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
    // 마감일 업무 추가 (완료 여부와 관계없이 마감일까지 모두 표시)
    deadlineTasks
      .filter(task => dateStr <= task.deadline_date)
      .forEach(task => todos.push({ id: task.id, type: 'deadline_task', deadline_date: task.deadline_date }));
    // 특정일 스케줄 추가 (해당 날짜만)
    if (specificSchedules) {
      specificSchedules
        .filter(schedule => schedule.schedule_date === dateStr)
        .forEach(schedule => todos.push({ id: schedule.id, type: 'specific_schedule' }));
    }
    // 미완료 할일 수 계산 (해당 날짜 기준)
    const incompleteCount = todos.filter(todo =>
      !isCompleted(todo.id, todo.type, todo.deadline_date, dateStr)
    ).length;
    return {
      totalCount: todos.length,
      incompleteCount
    };
  };

  // isCompleted 함수에서 타입별로 올바른 판정 로직 적용 (문자열 비교)
  const isCompleted = (itemId, itemType, deadlineDate, dateStr) => {
    if (!itemId || !itemType || !Array.isArray(localCompletions)) {
      return false;
    }
    if (!dateStr) return false;
    if (itemType === 'deadline_task') {
      // 마감업무: completions에서 최초 완료일 구함
      const completionsForTask = localCompletions
        .filter(c => c.item_id === itemId && c.item_type === 'deadline_task')
        .map(c => c.completion_date)
        .sort();
      if (completionsForTask.length === 0 || !deadlineDate) return false;
      const firstCompleted = completionsForTask[0];
      const deadlineStr = formatDate(new Date(deadlineDate));
      // 최초 완료일 <= 기준날짜 <= 마감일 (모두 문자열 비교)
      return (firstCompleted <= dateStr && dateStr <= deadlineStr);
    }
    // 일일/월간/스케줄 등: 해당 날짜에 완료 기록이 있으면 완료
    return localCompletions.some(completion =>
      completion.item_id === itemId &&
      completion.item_type === itemType &&
      completion.completion_date === dateStr
    );
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
      case 'special':
        return { type: 'special', data: specialSchedules, icon: Circle, color: 'bg-purple-500' };
      case 'tax':
        return { type: 'tax', data: taxManagement, icon: Circle, color: 'bg-blue-500' };
      case 'approval':
        return { type: 'approval', data: approvalManagement, icon: Circle, color: 'bg-green-500' };
      default:
        return { type: 'daily', data: dailyTodos, icon: Calendar, color: 'bg-gray-500' };
    }
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
    const selectedDateTodos = getSelectedDateTodos(selectedDate);

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

          const isComplete = isCompleted(todo.id, todo.type, todo.deadline_date, selectedDate ? selectedDate.toISOString().split('T')[0] : null);

          return (
            <div
              key={`${todo.type}-${todo.id || index}`}
              className={`cute-card p-2 h-[32px] flex items-center transition-all duration-300 hover:scale-102 ${
                isComplete ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200' :
                todo.isOverdue ? 'bg-gradient-to-r from-red-50 to-rose-50 border-red-200' :
                'border-pink-100'
              }`}
            >
              <div className="flex items-center gap-2 w-full">
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
                  todo.type === 'daily_todo' ? 'bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-700' :
                  todo.type === 'monthly_todo' ? 'bg-gradient-to-r from-lime-100 to-green-100 text-lime-700' :
                  todo.type === 'specific_schedule' ? 'bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700' :
                  todo.isOverdue ? 'bg-gradient-to-r from-red-100 to-rose-100 text-red-700' :
                  'bg-gradient-to-r from-orange-100 to-red-100 text-orange-700'
                }`}>
                  {todo.type === 'daily_todo' ? '💛 매일' :
                   todo.type === 'monthly_todo' ? '💚 월간' :
                   todo.type === 'specific_schedule' ? '🎯 스케줄' :
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
      days.push(<div key={`empty-${i}`} className="h-24 bg-gray-50/30"></div>);
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

      // 해당 날짜의 특정일 스케줄, 마감업무, 특정업무 가져오기
      const dateStr = formatDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
      const daySchedules = specificSchedules?.filter(schedule => schedule.schedule_date === dateStr) || [];
      const dayDeadlines = deadlineTasks?.filter(task => {
        const taskDeadline = new Date(task.deadline_date);
        const cellDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        return taskDeadline.toDateString() === cellDate.toDateString();
      }) || [];
      const daySpecials = specialSchedules?.filter(s => s.schedule_date === dateStr) || [];

      // 메모가 있는지 확인
      const hasMemo = memos?.some(memo => memo.memo_date === dateStr) || false;

      // 해당 날짜의 모든 할일 가져오기 (완료 상태 확인용)
      const dayTodos = getSelectedDateTodos(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
      const allCompleted = dayTodos.length > 0 && dayTodos.every(todo =>
        isCompleted(todo.id, todo.type, todo.deadline_date, dateStr)
      );

      days.push(
        <div
          key={day}
          onClick={() => selectDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day))}
          className={`calendar-day min-h-[96px] cursor-pointer p-1 ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''} ${dayOfWeek === 0 ? 'bg-[#FFE4EC]' : ''} ${dayOfWeek === 6 ? 'bg-[#E3F2FD]' : ''} ${allCompleted ? 'all-completed' : ''}`}
        >
          <div className={`date text-sm font-medium ${dayOfWeek === 0 ? 'sunday' : ''} ${dayOfWeek === 6 ? 'saturday' : ''} ${allCompleted ? 'line-through text-green-600' : ''}`}>
            {day}
            {/* 메모가 있으면 이모티콘 표시 */}
            {hasMemo && <span className="ml-1 text-lg">✨</span>}
          </div>

          {/* 특정일 스케줄 표시 */}
          {daySchedules.length > 0 && (
            <div className="space-y-1">
              {daySchedules.slice(0, 2).map((schedule, index) => (
                <div key={schedule.id} className={`schedule-item specific ${isCompleted(schedule.id, 'specific_schedule', null, dateStr) ? 'line-through text-gray-500' : ''}`}>
                  🎯 {schedule.text}
                </div>
              ))}
              {daySchedules.length > 2 && (
                <div className="more-items schedule">
                  +{daySchedules.length - 2}개 더
                </div>
              )}
            </div>
          )}

          {/* 특정업무 표시 */}
          {daySpecials.length > 0 && (
            <div className="space-y-1">
              {daySpecials.slice(0, 5).map((special, index) => (
                <div key={special.id} className={`schedule-item special ${isCompleted(special.id, 'special_schedule', null, dateStr) ? 'line-through text-gray-500' : ''}`}>
                  💗 {special.text}
                </div>
              ))}
            </div>
          )}

          {/* 마감업무 표시 */}
          {dayDeadlines.length > 0 && (
            <div className="space-y-1">
              {dayDeadlines.slice(0, 5).map((deadline, index) => (
                <div key={deadline.id} className={`schedule-item deadline ${isCompleted(deadline.id, 'deadline_task', deadline.deadline_date, dateStr) ? 'line-through text-gray-500' : ''}`}>
                  ⚠️ {deadline.text}
                </div>
              ))}
            </div>
          )}

          {/* 할일 상태 표시 (기존 기능 유지) */}

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
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">📝</span>
              <h4 className="font-semibold text-gray-800">오늘의 메모</h4>
            </div>
            {/* 저장 상태 표시 */}
            <div className="flex items-center gap-2 text-sm">
              {saveStatus === 'saving' && (
                <div className="flex items-center gap-1 text-blue-600">
                  <div className="animate-spin w-3 h-3 border border-blue-600 border-t-transparent rounded-full"></div>
                  <span>저장 중...</span>
                </div>
              )}
              {saveStatus === 'saved' && (
                <div className="flex items-center gap-1 text-green-600">
                  <span>✅</span>
                  <span>자동 저장됨</span>
                </div>
              )}
              {saveStatus === 'error' && (
                <div className="flex items-center gap-1 text-red-600">
                  <span>❌</span>
                  <span>저장 실패</span>
                </div>
              )}
            </div>
                  </div>
          <div className="space-y-3">
            <textarea
              value={selectedDateMemo}
              onChange={handleMemoChange}
              placeholder="오늘 하루는 어땠나요? 💭 (2초 후 자동 저장됩니다)"
              className="cute-input min-h-[100px] resize-none"
            />
                              <div className="flex gap-2">
                      <button
                        onClick={saveMemo}
                        disabled={isSaving}
                        className={`cute-button-primary flex-1 ${
                          isSaving ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        {isSaving ? '💫 저장 중...' : '💾 즉시 저장'}
                      </button>
                      <button
                        onClick={deleteMemo}
                        disabled={isSaving}
                        className={`cute-button-secondary ${
                          isSaving ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        🗑️ 삭제
                      </button>
                    </div>
          </div>
        </div>
      </div>
    );
  };

  // 패널 렌더링 - 모바일 최적화
  const renderPanel = () => {
    const filteredData = getFilteredData();

    return (
      <div className={`space-y-6 ${isMobile ? 'mobile-stack' : ''}`}>
        {/* 모바일 탭 스타일 */}
        <div className={isMobile ? 'mobile-tabs' : 'flex flex-wrap gap-2 justify-center'}>
          <button
            onClick={() => setActiveTab('daily')}
            className={`${isMobile ? 'mobile-tab' : 'cute-button'} transition-all duration-300 ${
              activeTab === 'daily'
                ? isMobile
                  ? 'mobile-tab active'
                  : 'bg-gradient-to-r from-yellow-400 to-amber-400 text-white shadow-lg'
                : isMobile
                  ? 'mobile-tab'
                  : 'cute-button-secondary'
            }`}
          >
            <span className="mr-2">💛</span>
            매일 업무
          </button>

          <button
            onClick={() => setActiveTab('monthly')}
            className={`${isMobile ? 'mobile-tab' : 'cute-button'} transition-all duration-300 ${
              activeTab === 'monthly'
                ? isMobile
                  ? 'mobile-tab active'
                  : 'bg-gradient-to-r from-lime-400 to-green-400 text-white shadow-lg'
                : isMobile
                  ? 'mobile-tab'
                  : 'cute-button-secondary'
            }`}
          >
            <span className="mr-2">💚</span>
            월간 업무
          </button>

          <button
            onClick={() => setActiveTab('deadline')}
            className={`${isMobile ? 'mobile-tab' : 'cute-button'} transition-all duration-300 ${
              activeTab === 'deadline'
                ? isMobile
                  ? 'mobile-tab active'
                  : 'bg-gradient-to-r from-orange-400 to-red-400 text-white shadow-lg'
                : isMobile
                  ? 'mobile-tab'
                  : 'cute-button-secondary'
            }`}
          >
            <span className="mr-2">🧡</span>
            마감 업무
          </button>

          <button
            onClick={() => setActiveTab('special')}
            className={`${isMobile ? 'mobile-tab' : 'cute-button'} transition-all duration-300 ${
              activeTab === 'special'
                ? isMobile
                  ? 'mobile-tab active'
                  : 'bg-gradient-to-r from-pink-400 to-purple-400 text-white shadow-lg'
                : isMobile
                  ? 'mobile-tab'
                  : 'cute-button-secondary'
            }`}
          >
            <span className="mr-2">💗</span>
            특정업무
          </button>

          <button
            onClick={() => setActiveTab('tax')}
            className={`${isMobile ? 'mobile-tab' : 'cute-button'} transition-all duration-300 ${
              activeTab === 'tax'
                ? isMobile
                  ? 'mobile-tab active'
                  : 'bg-gradient-to-r from-blue-400 to-indigo-400 text-white shadow-lg'
                : isMobile
                  ? 'mobile-tab'
                  : 'cute-button-secondary'
            }`}
          >
            <span className="mr-2">💰</span>
            세금관리
          </button>

          <button
            onClick={() => setActiveTab('approval')}
            className={`${isMobile ? 'mobile-tab' : 'cute-button'} transition-all duration-300 ${
              activeTab === 'approval'
                ? isMobile
                  ? 'mobile-tab active'
                  : 'bg-gradient-to-r from-emerald-400 to-teal-400 text-white shadow-lg'
                : isMobile
                  ? 'mobile-tab'
                  : 'cute-button-secondary'
            }`}
          >
            <span className="mr-2">📋</span>
            결재관리
          </button>

        </div>

        {/* 컴포넌트 렌더링 - 모바일 최적화 */}
        <div className={isMobile ? 'space-y-4' : 'grid grid-cols-1 md:grid-cols-2 gap-6'}>
          {/* 입력 폼 */}
          <div className={`${isMobile ? 'mobile-panel' : 'cute-card p-6'}`}>
            <h3 className={`${isMobile ? 'text-base-mobile' : 'text-lg'} font-bold mb-4 flex items-center gap-2`}>
              <span className="text-2xl">
                {activeTab === 'daily' ? '💛' :
                 activeTab === 'monthly' ? '💚' :
                 activeTab === 'deadline' ? '🧡' :
                 activeTab === 'special' ? '💗' :
                 activeTab === 'tax' ? '💰' :
                 activeTab === 'approval' ? '📋' : ''}
              </span>
              새로운 {activeTab === 'daily' ? '매일' :
                     activeTab === 'monthly' ? '월간' :
                     activeTab === 'deadline' ? '마감' :
                     activeTab === 'special' ? '특정' :
                     activeTab === 'tax' ? '세금' :
                     activeTab === 'approval' ? '결재' : ''} 업무
            </h3>

            {activeTab === 'daily' && <DailyTodosPanel />}

            {activeTab === 'monthly' && <MonthlyTodosPanel />}

            {activeTab === 'deadline' && <DeadlineTasksPanel />}

            {activeTab === 'special' && <SpecialSchedulePanel onChange={refetchSpecialSchedules} />}

            {activeTab === 'tax' && <TaxManagementPanel />}

            {activeTab === 'approval' && <ApprovalManagementPanel />}

          </div>

          {/* 기존 항목 목록 */}
          <div className={`${isMobile ? 'mobile-panel' : 'cute-card p-6'}`}>
            <h3 className={`${isMobile ? 'text-base-mobile' : 'text-lg'} font-bold mb-4 flex items-center gap-2`}>
              <span className="text-2xl">📋</span>
              등록된 업무 목록
            </h3>

            <div className={`space-y-2 ${isMobile ? 'max-h-[300px]' : 'max-h-[500px]'} overflow-y-auto`}>
              {filteredData.data?.length > 0 ? (
                filteredData.data.map((item, index) => (
                  <div
                    key={item.id || index}
                    className={`${isMobile ? 'mobile-todo-item' : 'cute-card p-2 border border-gray-100'}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">
                          {activeTab === 'daily' ? '💛' :
                           activeTab === 'monthly' ? '💚' :
                           activeTab === 'deadline' ? '🧡' :
                           activeTab === 'special' ? '💗' :
                           activeTab === 'tax' ? '💰' :
                           activeTab === 'approval' ? '📋' : ''}
                        </span>
                        <span className={`font-medium text-gray-800 ${isMobile ? 'text-sm-mobile' : 'text-sm'}`}>
                          {activeTab === 'tax' ? item.tax_type :
                           activeTab === 'approval' ? item.client_name :
                           item.text}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        {activeTab === 'monthly' && (
                          <span className={`bg-lime-100 text-lime-700 px-1.5 py-0.5 rounded-full ${isMobile ? 'text-xs-mobile' : 'text-xs'}`}>
                            매월 {item.repeat_date}일
                          </span>
                        )}
                        {activeTab === 'deadline' && (
                          <span className={`bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full ${isMobile ? 'text-xs-mobile' : 'text-xs'}`}>
                            {item.deadline_date}
                          </span>
                        )}
                        {activeTab === 'special' && (
                          <span className={`bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full ${isMobile ? 'text-xs-mobile' : 'text-xs'}`}>
                            특정일 {item.schedule_date}
                          </span>
                        )}
                        {activeTab === 'tax' && (
                          <span className={`bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full ${isMobile ? 'text-xs-mobile' : 'text-xs'}`}>
                            {item.tax_amount?.toLocaleString()}원
                          </span>
                        )}
                        {activeTab === 'approval' && (
                          <span className={`bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full ${isMobile ? 'text-xs-mobile' : 'text-xs'}`}>
                            {item.transaction_amount?.toLocaleString()}원
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <div className="text-3xl mb-2">🌸</div>
                  <p className={`${isMobile ? 'text-sm-mobile' : 'text-sm'}`}>등록된 업무가 없어요!</p>
                  <p className={`${isMobile ? 'text-xs-mobile' : 'text-xs'} text-gray-400 mt-1`}>새로운 업무를 추가해보세요 ✨</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 ${isMobile ? 'p-2' : 'p-4'} ${getWeatherClass()}`}>
      {/* 날씨 효과 */}
      <WeatherEffects weather={weather} />

      {/* 날씨 위젯 */}
      <WeatherWidget onWeatherChange={handleWeatherChange} />

      <div className={`${isMobile ? 'w-full' : 'max-w-7xl mx-auto'}`}>
        {/* 헤더 - 모바일 최적화 */}
        <div className={`cute-card mb-6 ${isMobile ? 'p-4' : 'p-6'} slide-up`}>
          <div className={`flex items-center ${isMobile ? 'flex-col gap-3' : 'justify-between'}`}>
            <div className="flex items-center gap-3">
              <div className={`${isMobile ? 'w-10 h-10' : 'w-12 h-12'} bg-gradient-to-r from-pink-400 to-purple-400 rounded-full flex items-center justify-center text-white ${isMobile ? 'text-xl' : 'text-2xl'} pulse-cute`}>
                🗓️
              </div>
              <div>
                <h1 className={`${isMobile ? 'text-lg-mobile' : 'text-2xl'} font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent`}>
                  🎀 업무 다이어리
                </h1>
                <p className={`text-gray-600 ${isMobile ? 'text-xs-mobile' : 'text-sm'}`}>오늘도 화이팅! ✨</p>
              </div>
            </div>
            <div className={`flex items-center gap-2 ${isMobile ? 'w-full justify-center' : ''}`}>
              {isMobile ? (
                // 모바일 햄버거 메뉴
                <button
                  onClick={() => setShowPanel(!showPanel)}
                  className="cute-button-primary flex items-center gap-2 min-h-touch"
                >
                  {showPanel ? <X size={20} /> : <Menu size={20} />}
                  <span>{showPanel ? '닫기' : '메뉴'}</span>
                </button>
              ) : (
                // 데스크톱 버튼들
                <>
                  <button
                    onClick={() => setShowPanel(!showPanel)}
                    className="cute-button-secondary"
                  >
                    {showPanel ? '📝 패널 닫기' : '📝 할일 관리'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className={`${isMobile ? 'landscape-mobile space-y-4' : 'space-y-6'}`}>
          {/* 달력 - 모바일 최적화 */}
          <div
            className={`cute-card ${isMobile ? 'mobile-calendar-container' : 'p-6'} slide-up`}
            ref={calendarRef}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* 달력 네비게이션 - 모바일 최적화 */}
            <div className={`flex items-center justify-between ${isMobile ? 'mb-4' : 'mb-6'}`}>
              <button
                onClick={() => navigateMonth(-1)}
                className={`cute-button-secondary ${isMobile ? 'w-touch h-touch' : 'w-10 h-10'} rounded-full flex items-center justify-center`}
              >
                {'<'}
              </button>
              <h2 className={`${isMobile ? 'text-base-mobile' : 'text-xl'} font-bold text-gray-800`}>
                {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월 💕
              </h2>
              <button
                onClick={() => navigateMonth(1)}
                className={`cute-button-secondary ${isMobile ? 'w-touch h-touch' : 'w-10 h-10'} rounded-full flex items-center justify-center`}
              >
                {'>'}
              </button>
            </div>

            {/* 달력 그리드 - 터치 제스처 지원 */}
            <div className="calendar-grid">
              {renderCalendarDays()}
            </div>

            {/* 모바일에서만 스와이프 안내 */}
            {isMobile && (
              <div className="text-center mt-3 text-gray-400 text-xs-mobile">
                <span>← 좌우 스와이프로 월 이동 →</span>
              </div>
            )}
          </div>

          {/* 하단 고정 패널 - 오늘의 할일 & 메모 (모바일 최적화) */}
          {Boolean(showDayDetail) && (
            <div className={`cute-card ${isMobile ? 'mobile-panel' : 'p-6'} slide-up`}>
              <div className={`flex items-center gap-2 ${isMobile ? 'mb-4' : 'mb-6'}`}>
                <span className={`${isMobile ? 'text-xl' : 'text-2xl'}`}>📅</span>
                <h3 className={`${isMobile ? 'text-base-mobile' : 'text-xl'} font-bold text-gray-800`}>
                  {selectedDate?.toLocaleDateString('ko-KR', {
                    month: 'long',
                    day: 'numeric',
                    weekday: 'long'
                  })}
                </h3>
              </div>

              <div className={`${isMobile ? 'space-y-4' : 'grid grid-cols-1 lg:grid-cols-2 gap-6'}`}>
                {/* 왼쪽: 오늘의 할일 */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <span className={`${isMobile ? 'text-base' : 'text-lg'}`}>✨</span>
                    <h4 className={`${isMobile ? 'text-base-mobile' : 'text-lg'} font-semibold text-gray-800`}>오늘의 할일</h4>
                  </div>
                  <div className={`${isMobile ? 'max-h-64' : 'max-h-96'} overflow-y-auto`}>
                    {renderTodoList()}
                  </div>
                </div>

                {/* 오른쪽: 메모 섹션 */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className={`${isMobile ? 'text-base' : 'text-lg'}`}>📝</span>
                      <h4 className={`${isMobile ? 'text-base-mobile' : 'text-lg'} font-semibold text-gray-800`}>오늘의 메모</h4>
                    </div>
                    {/* 저장 상태 표시 */}
                    <div className={`flex items-center gap-2 ${isMobile ? 'text-xs-mobile' : 'text-sm'}`}>
                      {saveStatus === 'saving' && (
                        <div className="flex items-center gap-1 text-blue-600">
                          <div className="animate-spin w-3 h-3 border border-blue-600 border-t-transparent rounded-full"></div>
                          <span>저장 중...</span>
                        </div>
                      )}
                      {saveStatus === 'saved' && (
                        <div className="flex items-center gap-1 text-green-600">
                          <span>✅</span>
                          <span>자동 저장됨</span>
                        </div>
                      )}
                      {saveStatus === 'error' && (
                        <div className="flex items-center gap-1 text-red-600">
                          <span>❌</span>
                          <span>저장 실패</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <textarea
                      value={selectedDateMemo}
                      onChange={handleMemoChange}
                      placeholder="오늘 하루는 어땠나요? 💭 (2초 후 자동 저장됩니다)"
                      className={`cute-input ${isMobile ? 'min-h-[200px] text-base-mobile' : 'min-h-[300px]'} resize-none`}
                    />
                    <div className={`flex ${isMobile ? 'flex-col' : ''} gap-2`}>
                      <button
                        onClick={saveMemo}
                        className={`cute-button-primary ${isMobile ? 'w-full min-h-touch' : 'flex-1'}`}
                      >
                        💾 저장하기
                      </button>
                      <button
                        onClick={deleteMemo}
                        className={`cute-button-secondary ${isMobile ? 'w-full min-h-touch' : ''}`}
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

        {/* 하단 관리 패널 - 모바일 최적화 */}
        {Boolean(showPanel) && (
          <div className={`${isMobile ? 'mt-4' : 'mt-6'} ${isMobile ? 'mobile-panel' : 'cute-card p-6'} slide-up`}>
            <div className="flex items-center gap-2 mb-4">
              <span className={`${isMobile ? 'text-xl' : 'text-2xl'}`}>✨</span>
              <h3 className={`${isMobile ? 'text-base-mobile' : 'text-lg'} font-bold text-gray-800`}>할일 관리</h3>
            </div>
            {renderPanel()}
          </div>
        )}

        {/* 스케줄 관리 모달 */}
        <ScheduleManagementModal
          isOpen={showScheduleModal}
          onClose={() => setShowScheduleModal(false)}
        />
      </div>
    </div>
  );
};

export default MonthlyDiaryCalendar; 