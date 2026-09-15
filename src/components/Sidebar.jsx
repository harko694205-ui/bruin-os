import React from 'react';
import {
  LayoutDashboard, CalendarDays, GraduationCap, ListChecks,
  FileUp, Timer, Link2, Sun, Moon,
} from 'lucide-react';
import { useStore } from '../lib/store';

const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'calendar', label: 'Calendar', icon: CalendarDays },
  { key: 'classes', label: 'Classes', icon: GraduationCap },
  { key: 'tasks', label: 'Tasks', icon: ListChecks },
  { key: 'syllabus', label: 'Syllabus Import', icon: FileUp },
  { key: 'focus', label: 'Focus', icon: Timer },
  { key: 'links', label: 'Links', icon: Link2 },
];

export default function Sidebar({ page, setPage }) {
  const { data, updateSettings } = useStore();
  const isDark = data.settings.theme === 'dark';

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-brand-mark">B</div>
        <div className="sidebar-brand-text">Bruin OS</div>
      </div>
      <nav className="sidebar-nav">
        {NAV_ITEMS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            className={`nav-item ${page === key ? 'active' : ''}`}
            onClick={() => setPage(key)}
          >
            <Icon size={18} strokeWidth={2} />
            {label}
          </button>
        ))}
      </nav>
      <div className="sidebar-footer">
        <button
          className="theme-toggle"
          onClick={() => updateSettings({ theme: isDark ? 'light' : 'dark' })}
        >
          {isDark ? <Sun size={17} /> : <Moon size={17} />}
          {isDark ? 'Light mode' : 'Dark mode'}
        </button>
      </div>
    </aside>
  );
}

export function BottomNav({ page, setPage }) {
  const items = NAV_ITEMS.filter((i) => ['dashboard', 'calendar', 'classes', 'tasks', 'focus'].includes(i.key));
  return (
    <nav className="bottom-nav">
      {items.map(({ key, label, icon: Icon }) => (
        <button
          key={key}
          className={`bottom-nav-item ${page === key ? 'active' : ''}`}
          onClick={() => setPage(key)}
        >
          <Icon size={20} strokeWidth={2} />
          {label}
        </button>
      ))}
    </nav>
  );
}
