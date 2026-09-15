import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, CalendarDays } from 'lucide-react';
import { useStore } from '../lib/store';
import { getItemsForDate } from '../lib/calendarItems';
import ItemDetailModal from '../components/ItemDetailModal';
import EventFormModal from '../components/EventFormModal';
import { EmptyState } from '../components/Modal';
import {
  todayStr, parseDateStr, toDateStr, addDays, getMonthGrid, getWeekStart, getWeekDates,
  getQuarterWeeks, MONTH_NAMES, DAY_ABBR, formatFriendlyDate, formatTime,
} from '../lib/dates';
import { TYPE_BADGE_CLASS } from '../lib/constants';

const VIEWS = ['Month', 'Week', 'Quarter'];

export default function CalendarPage({ goTo }) {
  const { data } = useStore();
  const [view, setView] = useState('Month');
  const [anchor, setAnchor] = useState(todayStr());
  const [selectedItem, setSelectedItem] = useState(null);
  const [addForDate, setAddForDate] = useState(null);
  const [dayDrilldown, setDayDrilldown] = useState(null);

  const anchorDate = parseDateStr(anchor);

  function shift(direction) {
    if (view === 'Month') {
      const d = new Date(anchorDate.getFullYear(), anchorDate.getMonth() + direction, 1);
      setAnchor(toDateStr(d));
    } else if (view === 'Week') {
      setAnchor(addDays(anchor, 7 * direction));
    } else {
      const d = new Date(anchorDate.getFullYear(), anchorDate.getMonth() + direction * 3, 1);
      setAnchor(toDateStr(d));
    }
  }

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">Calendar</div>
          <div className="page-subtitle">Classes, deadlines, and everything in between.</div>
        </div>
        <button className="btn btn-primary" onClick={() => setAddForDate(todayStr())}><Plus size={16} /> Add event</button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
        <div className="segmented">
          {VIEWS.map((v) => <button key={v} className={view === v ? 'active' : ''} onClick={() => setView(v)}>{v}</button>)}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button className="btn btn-ghost btn-icon" onClick={() => shift(-1)}><ChevronLeft size={17} /></button>
          <span style={{ fontSize: 14.5, fontWeight: 600, minWidth: 130, textAlign: 'center' }}>
            {view === 'Month' && `${MONTH_NAMES[anchorDate.getMonth()]} ${anchorDate.getFullYear()}`}
            {view === 'Week' && `Week of ${formatFriendlyDate(getWeekStart(anchor))}`}
            {view === 'Quarter' && (data.settings.quarterName || 'Term overview')}
          </span>
          <button className="btn btn-ghost btn-icon" onClick={() => shift(1)}><ChevronRight size={17} /></button>
          <button className="btn btn-secondary btn-sm" onClick={() => setAnchor(todayStr())}>Today</button>
        </div>
      </div>

      {view === 'Month' && (
        <MonthView anchorDate={anchorDate} data={data} onSelectItem={setSelectedItem} onDrilldown={setDayDrilldown} />
      )}
      {view === 'Week' && (
        <WeekView weekStart={getWeekStart(anchor)} data={data} onSelectItem={setSelectedItem} onAddForDate={setAddForDate} />
      )}
      {view === 'Quarter' && (
        <QuarterView data={data} onDrilldown={setDayDrilldown} />
      )}

      {selectedItem && <ItemDetailModal item={selectedItem} onClose={() => setSelectedItem(null)} onGoToClass={() => goTo && goTo('classes')} />}
      {addForDate && <EventFormModal defaultDate={addForDate} onClose={() => setAddForDate(null)} />}
      {dayDrilldown && (
        <DayDrilldownModal
          dateStr={dayDrilldown}
          data={data}
          onClose={() => setDayDrilldown(null)}
          onSelectItem={(item) => { setDayDrilldown(null); setSelectedItem(item); }}
          onAdd={() => { setAddForDate(dayDrilldown); setDayDrilldown(null); }}
        />
      )}
    </>
  );
}

function MonthView({ anchorDate, data, onSelectItem, onDrilldown }) {
  const weeks = getMonthGrid(anchorDate.getFullYear(), anchorDate.getMonth());
  const currentMonth = anchorDate.getMonth();
  const today = todayStr();

  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid var(--border)' }}>
        {DAY_ABBR.map((d) => (
          <div key={d} style={{ padding: '10px 8px', fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)', textAlign: 'center' }}>{d}</div>
        ))}
      </div>
      {weeks.map((week, wi) => (
        <div key={wi} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: wi < weeks.length - 1 ? '1px solid var(--border)' : 'none' }}>
          {week.map((dateStr) => {
            const d = parseDateStr(dateStr);
            const inMonth = d.getMonth() === currentMonth;
            const items = getItemsForDate(data, dateStr);
            const isToday = dateStr === today;
            return (
              <div
                key={dateStr}
                onClick={() => items.length > 0 && onDrilldown(dateStr)}
                style={{
                  minHeight: 92, padding: '8px 6px', borderRight: '1px solid var(--border)',
                  opacity: inMonth ? 1 : 0.4, cursor: items.length > 0 ? 'pointer' : 'default',
                  display: 'flex', flexDirection: 'column', gap: 4,
                }}
              >
                <span style={{
                  fontSize: 12.5, fontWeight: isToday ? 700 : 500,
                  color: isToday ? '#fff' : 'var(--text-secondary)',
                  background: isToday ? 'var(--accent)' : 'transparent',
                  width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {d.getDate()}
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {items.slice(0, 3).map((item) => (
                    <div
                      key={item.id}
                      onClick={(e) => { e.stopPropagation(); onSelectItem(item); }}
                      title={item.title}
                      style={{
                        fontSize: 10.5, fontWeight: 600, padding: '2px 5px', borderRadius: 5,
                        background: item.color ? `${item.color}22` : 'var(--surface-2)',
                        color: item.color || 'var(--text-secondary)',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        textDecoration: item.completed ? 'line-through' : 'none',
                      }}
                    >
                      {item.title}
                    </div>
                  ))}
                  {items.length > 3 && (
                    <div style={{ fontSize: 10, color: 'var(--text-tertiary)', paddingLeft: 5 }}>+{items.length - 3} more</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function WeekView({ weekStart, data, onSelectItem, onAddForDate }) {
  const dates = getWeekDates(weekStart);
  const today = todayStr();
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 10 }}>
      {dates.map((dateStr) => {
        const d = parseDateStr(dateStr);
        const items = getItemsForDate(data, dateStr);
        const isToday = dateStr === today;
        return (
          <div key={dateStr} className="card card-pad" style={{ borderColor: isToday ? 'var(--accent)' : 'var(--border)', minHeight: 200 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)' }}>{DAY_ABBR[d.getDay()]}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: isToday ? 'var(--accent)' : 'var(--text-primary)' }}>{d.getDate()}</div>
              </div>
              <button className="btn btn-ghost btn-icon" style={{ width: 26, height: 26 }} onClick={() => onAddForDate(dateStr)}>
                <Plus size={13} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {items.length === 0 && <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>—</span>}
              {items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onSelectItem(item)}
                  style={{
                    textAlign: 'left', fontSize: 11.5, fontWeight: 600, padding: '5px 7px', borderRadius: 6,
                    background: item.color ? `${item.color}1c` : 'var(--surface-2)',
                    color: item.color || 'var(--text-secondary)',
                    textDecoration: item.completed ? 'line-through' : 'none',
                  }}
                >
                  {item.time && <span style={{ opacity: 0.7 }}>{formatTime(item.time)} · </span>}
                  {item.title}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function QuarterView({ data, onDrilldown }) {
  const { quarterStart, quarterEnd } = data.settings;
  if (!quarterStart || !quarterEnd) {
    return (
      <div className="card">
        <EmptyState
          icon={<CalendarDays size={32} />}
          title="Set up your term to see the quarter view"
          description="Add your term start and end dates from the Dashboard to see busy weeks at a glance."
        />
      </div>
    );
  }
  const weeks = getQuarterWeeks(quarterStart, quarterEnd);
  const today = todayStr();

  const weekCounts = weeks.map((w) => {
    const count = w.dates.reduce((sum, d) => sum + getItemsForDate(data, d).filter((i) => i.kind !== 'class').length, 0);
    return { ...w, count };
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {weekCounts.map((w) => {
        const includesToday = w.dates.includes(today);
        return (
          <div key={w.weekNum} className="card card-pad" style={{ display: 'flex', alignItems: 'center', gap: 14, borderColor: includesToday ? 'var(--accent)' : 'var(--border)' }}>
            <div style={{ width: 68, flexShrink: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-tertiary)' }}>WEEK {w.weekNum}</div>
              <div style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>{formatFriendlyDate(w.start)}</div>
            </div>
            <div style={{ flex: 1, display: 'flex', gap: 3 }}>
              {w.dates.map((dateStr) => {
                const count = getItemsForDate(data, dateStr).length;
                const dayIntensity = Math.min(1, count / 4);
                return (
                  <button
                    key={dateStr}
                    onClick={() => count > 0 && onDrilldown(dateStr)}
                    title={`${count} item${count !== 1 ? 's' : ''}`}
                    style={{
                      flex: 1, height: 30, borderRadius: 6, cursor: count > 0 ? 'pointer' : 'default',
                      background: count === 0 ? 'var(--surface-2)' : `rgba(29, 78, 125, ${0.15 + dayIntensity * 0.65})`,
                      border: dateStr === today ? '2px solid var(--gold)' : '1px solid transparent',
                    }}
                  />
                );
              })}
            </div>
            <div style={{ width: 90, textAlign: 'right', flexShrink: 0 }}>
              {w.count >= 4 ? (
                <span className="badge badge-red">Busy · {w.count}</span>
              ) : w.count > 0 ? (
                <span className="badge badge-neutral">{w.count} due</span>
              ) : (
                <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Light</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DayDrilldownModal({ dateStr, data, onClose, onSelectItem, onAdd }) {
  const items = getItemsForDate(data, dateStr);
  return (
    <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">{formatFriendlyDate(dateStr, { withYear: true })}</div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {items.length === 0 ? (
            <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Nothing scheduled.</p>
          ) : (
            items.map((item) => (
              <button
                key={item.id}
                onClick={() => onSelectItem(item)}
                className="card card-pad"
                style={{ display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left', width: '100%' }}
              >
                {item.color && <span className="dot" style={{ background: item.color }} />}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{item.title}</div>
                  {item.subtitle && <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{item.subtitle}</div>}
                </div>
                {item.time && <span style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>{formatTime(item.time)}</span>}
                {item.type && <span className={`badge ${TYPE_BADGE_CLASS[item.type]}`}>{item.type}</span>}
              </button>
            ))
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-primary btn-block" onClick={onAdd}><Plus size={15} /> Add event on this day</button>
        </div>
      </div>
    </div>
  );
}
