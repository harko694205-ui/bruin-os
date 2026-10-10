import React, { useState } from 'react';
import { StoreProvider } from './lib/store';
import { ToastProvider } from './lib/toast';
import Sidebar, { BottomNav } from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import CalendarPage from './pages/Calendar';
import Classes from './pages/Classes';
import Tasks from './pages/Tasks';
import SyllabusImport from './pages/SyllabusImport';
import Focus from './pages/Focus';
import Links from './pages/Links';

function AppShell() {
  const [page, setPage] = useState('dashboard');
  const [focusTask, setFocusTask] = useState(null);

  function goTo(p) {
    setPage(p);
  }

  function startFocus(task) {
    setFocusTask(task);
    setPage('focus');
  }

  return (
    <div className="app-shell">
      <Sidebar page={page} setPage={setPage} />
      <main className="main-content">
        {page === 'dashboard' && <Dashboard goTo={goTo} onStartFocus={startFocus} />}
        {page === 'calendar' && <CalendarPage goTo={goTo} />}
        {page === 'classes' && <Classes />}
        {page === 'tasks' && <Tasks />}
        {page === 'syllabus' && <SyllabusImport goTo={goTo} />}
        {page === 'focus' && <Focus task={focusTask} clearTask={() => setFocusTask(null)} />}
        {page === 'links' && <Links />}
      </main>
      <BottomNav page={page} setPage={setPage} />
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <ToastProvider>
        <AppShell />
      </ToastProvider>
    </StoreProvider>
  );
}
