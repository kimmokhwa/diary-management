import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import './styles/global.css';
import MonthlyDiaryCalendar from './components/Calendar/MonthlyDiaryCalendar';
import SupabaseTest from './components/common/SupabaseTest';
import { Calendar, Database } from 'lucide-react';

const App = () => {
  const [activeView, setActiveView] = useState('calendar');

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 임시 네비게이션 바 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveView('calendar')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                activeView === 'calendar' 
                  ? 'bg-blue-500 text-white' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Calendar className="w-4 h-4" />
              달력
            </button>
            <button
              onClick={() => setActiveView('test')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                activeView === 'test' 
                  ? 'bg-blue-500 text-white' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Database className="w-4 h-4" />
              Supabase 테스트
            </button>
          </div>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      {activeView === 'calendar' ? <MonthlyDiaryCalendar /> : <SupabaseTest />}
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
); 