import React, { useState } from 'react';
import { Modal } from './Modal';
import { useStore } from '../lib/store';
import { useToast } from '../lib/toast';
import { recommendTasks } from '../lib/workload';
import { formatFriendlyDate } from '../lib/dates';
import { TYPE_BADGE_CLASS } from '../lib/constants';
import { CheckCircle2, Play, Sparkles } from 'lucide-react';

const TIME_OPTIONS = [
  { label: '30 minutes', minutes: 30 },
  { label: '1 hour', minutes: 60 },
  { label: '2 hours', minutes: 120 },
  { label: '3+ hours', minutes: 200 },
];

export default function WorkOnModal({ onClose, onStartFocus }) {
  const { data, toggleAssignmentComplete } = useStore();
  const showToast = useToast();
  const [minutes, setMinutes] = useState(null);

  const recs = minutes ? recommendTasks(data.assignments, minutes) : [];

  function classFor(item) {
    return data.classes.find((c) => c.id === item.classId);
  }

  return (
    <Modal title="What should I work on?" onClose={onClose} wide={!!minutes}>
      {!minutes && (
        <>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>How much time do you have?</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {TIME_OPTIONS.map((t) => (
              <button key={t.minutes} className="btn btn-secondary" style={{ padding: '16px 12px' }} onClick={() => setMinutes(t.minutes)}>
                {t.label}
              </button>
            ))}
          </div>
        </>
      )}

      {minutes && recs.length === 0 && (
        <div className="empty-state" style={{ padding: '24px 12px' }}>
          <Sparkles size={30} />
          <div className="empty-state-title">Nothing on your plate</div>
          <div className="empty-state-desc">No incomplete assignments are tracked yet. Add some from Tasks or Quick Add.</div>
        </div>
      )}

      {minutes && recs.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {recs.map((item) => {
            const cls = classFor(item);
            return (
              <div key={item.id} className="card card-pad" style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                {cls && <span className="dot" style={{ background: cls.color, marginTop: 5 }} />}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 600, fontSize: 14.5 }}>{item.title}</span>
                    <span className={`badge ${TYPE_BADGE_CLASS[item.type]}`}>{item.type}</span>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 3 }}>
                    Due {formatFriendlyDate(item.dueDate)} · ~{item._est} min · {item._reason}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button
                    className="btn btn-ghost btn-icon"
                    title="Mark complete"
                    onClick={() => { toggleAssignmentComplete(item.id); showToast('Marked complete', 'success'); }}
                  >
                    <CheckCircle2 size={17} />
                  </button>
                  <button
                    className="btn btn-primary btn-icon"
                    title="Start focus session"
                    onClick={() => { onStartFocus(item); onClose(); }}
                  >
                    <Play size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Modal>
  );
}
