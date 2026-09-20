import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, X, Timer as TimerIcon, Flame } from 'lucide-react';
import { useStore } from '../lib/store';
import { useToast } from '../lib/toast';
import { todayStr } from '../lib/dates';

const PRESETS = [
  { label: '25 min · Pomodoro', minutes: 25 },
  { label: '50 min · Deep focus', minutes: 50 },
];

function formatClock(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function Focus({ task, clearTask }) {
  const { data, addFocusSession } = useStore();
  const showToast = useToast();
  const [durationMinutes, setDurationMinutes] = useState(25);
  const [customMinutes, setCustomMinutes] = useState(45);
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [usingCustom, setUsingCustom] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft((s) => {
          if (s <= 1) {
            clearInterval(intervalRef.current);
            setRunning(false);
            handleComplete(durationMinutes);
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  function handleComplete(minutes) {
    addFocusSession({ minutes, taskId: task?.id || null, taskTitle: task?.title || null });
    showToast('Focus session complete — nice work.', 'success');
  }

  function selectPreset(minutes) {
    setDurationMinutes(minutes);
    setSecondsLeft(minutes * 60);
    setRunning(false);
    setUsingCustom(false);
  }

  function applyCustom() {
    const m = Math.max(1, customMinutes || 1);
    setDurationMinutes(m);
    setSecondsLeft(m * 60);
    setRunning(false);
    setUsingCustom(true);
  }

  function reset() {
    setSecondsLeft(durationMinutes * 60);
    setRunning(false);
  }

  function stopEarly() {
    if (secondsLeft < durationMinutes * 60) {
      const elapsedMinutes = Math.round((durationMinutes * 60 - secondsLeft) / 60);
      if (elapsedMinutes >= 1) addFocusSession({ minutes: elapsedMinutes, taskId: task?.id || null, taskTitle: task?.title || null, partial: true });
    }
    setRunning(false);
    setSecondsLeft(durationMinutes * 60);
  }

  const todaysSessions = data.focusSessions.filter((s) => s.completedAt?.startsWith(todayStr()));
  const totalMinutesToday = todaysSessions.reduce((sum, s) => sum + (s.minutes || 0), 0);
  const progress = 1 - secondsLeft / (durationMinutes * 60);

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">Focus</div>
          <div className="page-subtitle">{todaysSessions.length} session{todaysSessions.length !== 1 ? 's' : ''} today · {totalMinutesToday} min focused</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 280px', gap: 20 }} className="focus-grid">
        <div className="card card-pad" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22, padding: '40px 20px' }}>
          {task && (
            <div className="badge badge-blue" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <TimerIcon size={12} /> Working on: {task.title}
              <button onClick={clearTask} style={{ marginLeft: 4, display: 'flex' }}><X size={12} /></button>
            </div>
          )}

          <TimerRing progress={progress} running={running}>
            <div style={{ fontSize: 52, fontWeight: 700, fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>
              {formatClock(secondsLeft)}
            </div>
          </TimerRing>

          <div style={{ display: 'flex', gap: 10 }}>
            {!running ? (
              <button className="btn btn-primary" style={{ padding: '11px 26px', fontSize: 15 }} onClick={() => setRunning(true)} disabled={secondsLeft === 0}>
                <Play size={16} /> Start
              </button>
            ) : (
              <button className="btn btn-secondary" style={{ padding: '11px 26px', fontSize: 15 }} onClick={() => setRunning(false)}>
                <Pause size={16} /> Pause
              </button>
            )}
            <button className="btn btn-ghost btn-icon" onClick={reset}><RotateCcw size={17} /></button>
            {(running || secondsLeft < durationMinutes * 60) && (
              <button className="btn btn-ghost" onClick={stopEarly}>End session</button>
            )}
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
            {PRESETS.map((p) => (
              <button
                key={p.minutes}
                className={`btn btn-secondary btn-sm ${!usingCustom && durationMinutes === p.minutes ? 'active' : ''}`}
                style={!usingCustom && durationMinutes === p.minutes ? { background: 'var(--accent-soft)', color: 'var(--accent-strong)', borderColor: 'var(--accent)' } : {}}
                onClick={() => selectPreset(p.minutes)}
              >
                {p.label}
              </button>
            ))}
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <input
                type="number"
                min="1"
                className="input"
                style={{ width: 64, padding: '6px 8px' }}
                value={customMinutes}
                onChange={(e) => setCustomMinutes(parseInt(e.target.value, 10) || 0)}
              />
              <button className="btn btn-secondary btn-sm" onClick={applyCustom}>Custom</button>
            </div>
          </div>
        </div>

        <div className="card card-pad">
          <div className="card-header"><div className="card-title"><Flame size={15} /> Today's sessions</div></div>
          {todaysSessions.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>No sessions yet today. Start your first one.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {todaysSessions.slice().reverse().map((s) => (
                <div key={s.id} style={{ fontSize: 13, display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 6 }}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 150 }}>{s.taskTitle || 'Untitled session'}</span>
                  <span style={{ color: 'var(--text-secondary)', flexShrink: 0 }}>{s.minutes} min{s.partial ? ' (partial)' : ''}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 800px) {
          .focus-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </>
  );
}

function TimerRing({ progress, running, children }) {
  const size = 220;
  const stroke = 8;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - progress);
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--surface-2)" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          stroke={running ? 'var(--accent)' : 'var(--gold)'}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s linear' }}
        />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {children}
      </div>
    </div>
  );
}
