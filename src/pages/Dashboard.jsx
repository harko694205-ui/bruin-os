import React, { useMemo, useState } from 'react';
import { useStore } from '../lib/store';
import QuickAdd from '../components/QuickAdd';
import WorkOnModal from '../components/WorkOnModal';
import QuarterSetupModal from '../components/QuarterSetupModal';
import BackupModal from '../components/BackupModal';
import ItemDetailModal from '../components/ItemDetailModal';
import LinkCard from '../components/LinkCard';
import LinkFormModal from '../components/LinkFormModal';
import { EmptyState } from '../components/Modal';
import { getItemsForDate } from '../lib/calendarItems';
import {
  todayStr, formatFriendlyDate, formatTimeRange, MONTH_NAMES, DAY_NAMES,
  getQuarterWeekNumber, daysBetween, isPast,
} from '../lib/dates';
import { getUpcoming, getWorkloadSummary, getIncompleteAssignments } from '../lib/workload';
import { TYPE_BADGE_CLASS } from '../lib/constants';
import {
  Sparkles, Timer, CalendarClock, AlertCircle, Link2, Settings2, ChevronRight, DatabaseBackup,
} from 'lucide-react';

export default function Dashboard({ goTo, onStartFocus }) {
  const { data, toggleAssignmentComplete } = useStore();
  const { classes, assignments, events, links, settings } = data;
  const [showWorkOn, setShowWorkOn] = useState(false);
  const [showQuarterSetup, setShowQuarterSetup] = useState(false);
  const [showAddLink, setShowAddLink] = useState(false);
  const [showBackup, setShowBackup] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const today = todayStr();
  const todayDate = new Date();
  const dayIdx = todayDate.getDay();

  const todaysSchedule = useMemo(
    () => getItemsForDate(data, today).filter((i) => i.kind === 'class' || i.kind === 'event'),
    [data, today]
  );

  const todaysAssignments = useMemo(
    () => getIncompleteAssignments(assignments).filter((a) => a.dueDate === today),
    [assignments, today]
  );

  const upcoming = useMemo(() => getUpcoming(assignments, 10).slice(0, 6), [assignments]);

  const workload = useMemo(() => getWorkloadSummary(assignments, events), [assignments, events]);

  const nextMajor = useMemo(() => {
    const majorTypes = new Set(['exam', 'project']);
    return getIncompleteAssignments(assignments)
      .filter((a) => majorTypes.has(a.type) && !isPast(a.dueDate))
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0];
  }, [assignments]);

  const weekNum = settings.quarterStart ? getQuarterWeekNumber(settings.quarterStart, today) : null;

  const pinnedLinks = useMemo(
    () => links.filter((l) => l.pinned).sort((a, b) => a.order - b.order).slice(0, 6),
    [links]
  );

  function classOf(id) {
    return classes.find((c) => c.id === id);
  }

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">{DAY_NAMES[dayIdx]}, {MONTH_NAMES[todayDate.getMonth()]} {todayDate.getDate()}</div>
          <div className="page-subtitle">
            {settings.quarterName ? `${settings.quarterName}` : 'No term set up yet'}
            {weekNum ? ` · Week ${weekNum}` : ''}
            {' · '}
            <button
              className="btn btn-ghost btn-sm"
              style={{ padding: '2px 6px', fontSize: 13, textDecoration: 'underline' }}
              onClick={() => setShowQuarterSetup(true)}
            >
              {settings.quarterStart ? 'Edit term dates' : 'Set up term'}
            </button>
          </div>
        </div>
        <QuickAdd />
      </div>

      {workload.warning && (
        <div className="card card-pad" style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20, borderColor: 'var(--gold)', background: 'var(--gold-soft)' }}>
          <AlertCircle size={19} color="var(--gold-700)" style={{ flexShrink: 0 }} />
          <span style={{ fontSize: 14, fontWeight: 500 }}>{workload.warning}</span>
        </div>
      )}

      <div style={{ display: 'flex', gap: 12, marginBottom: 22, flexWrap: 'wrap' }}>
        <button className="btn btn-primary" style={{ padding: '13px 20px', fontSize: 15 }} onClick={() => setShowWorkOn(true)}>
          <Sparkles size={17} /> What should I work on?
        </button>
        <button className="btn btn-secondary" style={{ padding: '13px 20px', fontSize: 15 }} onClick={() => onStartFocus(null)}>
          <Timer size={17} /> Start focus session
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 16 }}>
        {/* Today's schedule */}
        <div className="card card-pad">
          <div className="card-header">
            <div className="card-title">Today's schedule</div>
          </div>
          {todaysSchedule.length === 0 ? (
            <p style={{ fontSize: 13.5, color: 'var(--text-tertiary)' }}>Nothing scheduled today.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {todaysSchedule.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left', width: '100%' }}
                >
                  <span className="dot" style={{ background: item.color || 'var(--text-tertiary)' }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.title}
                    </div>
                    <div style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>
                      {item.time ? formatTimeRange(item.time, item.endTime) : 'No time set'}
                      {item.subtitle ? ` · ${item.subtitle}` : ''}
                    </div>
                  </div>
                  {item.recurring && <span className="badge badge-gold" style={{ flexShrink: 0 }}>Weekly</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Today's assignments */}
        <div className="card card-pad">
          <div className="card-header">
            <div className="card-title">Due today</div>
          </div>
          {todaysAssignments.length === 0 ? (
            <p style={{ fontSize: 13.5, color: 'var(--text-tertiary)' }}>Nothing due today. Nice.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {todaysAssignments.map((a) => {
                const cls = classOf(a.classId);
                return (
                  <label key={a.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 9, cursor: 'pointer' }}>
                    <input type="checkbox" checked={a.completed} onChange={() => toggleAssignmentComplete(a.id)} style={{ marginTop: 3, accentColor: 'var(--accent)', width: 15, height: 15 }} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 500 }}>{a.title}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{cls ? (cls.code || cls.name) : 'No class'}</div>
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {/* Countdown to next major */}
        <div className="card card-pad">
          <div className="card-header">
            <div className="card-title"><CalendarClock size={16} /> Next major deadline</div>
          </div>
          {!nextMajor ? (
            <p style={{ fontSize: 13.5, color: 'var(--text-tertiary)' }}>No exams or projects tracked yet.</p>
          ) : (
            <div>
              <div style={{ fontSize: 30, fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--accent)' }}>
                {Math.max(0, daysBetween(today, nextMajor.dueDate))}
                <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-secondary)', marginLeft: 6 }}>
                  day{daysBetween(today, nextMajor.dueDate) === 1 ? '' : 's'} away
                </span>
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, marginTop: 6 }}>{nextMajor.title}</div>
              <div style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>{formatFriendlyDate(nextMajor.dueDate)}</div>
            </div>
          )}
        </div>
      </div>

      {/* Upcoming deadlines */}
      <div className="card card-pad" style={{ marginBottom: 16 }}>
        <div className="card-header">
          <div className="card-title">Upcoming deadlines</div>
          <button className="btn btn-ghost btn-sm" onClick={() => goTo('tasks')}>See all <ChevronRight size={14} /></button>
        </div>
        {upcoming.length === 0 ? (
          <EmptyState
            title="No deadlines yet"
            description="Add assignments manually or import a syllabus to populate your calendar."
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {upcoming.map((a) => {
              const cls = classOf(a.classId);
              return (
                <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 4px', borderBottom: '1px solid var(--border)' }}>
                  {cls && <span className="dot" style={{ background: cls.color }} />}
                  <div style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.title}</div>
                  <span className={`badge ${TYPE_BADGE_CLASS[a.type]}`}>{a.type}</span>
                  <span style={{ fontSize: 12.5, color: 'var(--text-secondary)', minWidth: 64, textAlign: 'right' }}>{formatFriendlyDate(a.dueDate)}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Important links */}
      <div className="card card-pad">
        <div className="card-header">
          <div className="card-title"><Link2 size={16} /> Important links</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => goTo('links')}>Manage <Settings2 size={13} /></button>
            <button className="btn btn-secondary btn-sm" onClick={() => setShowAddLink(true)}>+ Add</button>
          </div>
        </div>
        {pinnedLinks.length === 0 ? (
          <EmptyState
            title="No pinned links yet"
            description="Pin the websites you use every day so they're always one click away."
            action={<button className="btn btn-primary btn-sm" onClick={() => setShowAddLink(true)}>+ Add your first link</button>}
          />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
            {pinnedLinks.map((l) => <LinkCard key={l.id} link={l} compact />)}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 22 }}>
        <button
          className="btn btn-ghost btn-sm"
          style={{ color: 'var(--text-tertiary)', fontSize: 12.5 }}
          onClick={() => setShowBackup(true)}
        >
          <DatabaseBackup size={13} /> Your data lives only in this browser — back it up
        </button>
      </div>

      {showWorkOn && <WorkOnModal onClose={() => setShowWorkOn(false)} onStartFocus={onStartFocus} />}
      {showQuarterSetup && <QuarterSetupModal onClose={() => setShowQuarterSetup(false)} />}
      {showAddLink && <LinkFormModal onClose={() => setShowAddLink(false)} />}
      {showBackup && <BackupModal onClose={() => setShowBackup(false)} />}
      {selectedItem && (
        <ItemDetailModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onGoToClass={() => goTo && goTo('classes')}
        />
      )}
    </>
  );
}
