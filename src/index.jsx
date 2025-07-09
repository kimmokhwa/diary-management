import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/global.css';
import DailyTodosPanel from './components/Calendar/DailyTodosPanel';
import MonthlyTodosPanel from './components/Calendar/MonthlyTodosPanel';
import DeadlineTasksPanel from './components/Calendar/DeadlineTasksPanel';
import CompletionsPanel from './components/Calendar/CompletionsPanel';
import DailyMemosPanel from './components/Calendar/DailyMemosPanel';

const App = () => (
  <div className="min-h-screen bg-gray-100 p-4">
    <h1 className="text-3xl font-bold text-center mb-8">Supabase 연동 업무 다이어리</h1>
    <DailyTodosPanel />
    <MonthlyTodosPanel />
    <DeadlineTasksPanel />
    <CompletionsPanel />
    <DailyMemosPanel />
  </div>
);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
); 