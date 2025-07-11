import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/global.css';
import MonthlyDiaryCalendar from './components/Calendar/MonthlyDiaryCalendar';

const App = () => {

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 메인 컨텐츠 */}
      <MonthlyDiaryCalendar />
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
); 