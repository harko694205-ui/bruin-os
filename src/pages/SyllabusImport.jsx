import React, { useState } from 'react';
import { FileUp, Sparkles, ArrowLeft, Trash2, CheckSquare, Square } from 'lucide-react';
import { useStore, uid } from '../lib/store';
import { useToast } from '../lib/toast';
import { parseSyllabus } from '../lib/syllabusParser';
import { EmptyState } from '../components/Modal';
import { EVENT_TYPES } from '../lib/constants';

export default function SyllabusImport({ goTo }) {
  const { data, addAssignments } = useStore();
  const showToast = useToast();
  const [classId, setClassId] = useState(data.classes[0]?.id || '');
  const [text, setText] = useState('');
  const [proposed, setProposed] = useState(null); // null = not analyzed yet

  function handleAnalyze() {
    if (!text.trim()) return;
    const results = parseSyllabus(text, {
      termStart: data.settings.quarterStart,
      referenceYear: new Date().getFullYear(),
    });
    setProposed(results);
  }

  function updateProposed(tempId, patch) {
    setProposed((prev) => prev.map((p) => (p.tempId === tempId ? { ...p, ...patch } : p)));
  }

  function removeProposed(tempId) {
    setProposed((prev) => prev.filter((p) => p.tempId !== tempId));
  }

  function toggleAll(value) {
    setProposed((prev) => prev.map((p) => ({ ...p, include: value })));
  }

  function handleImport() {
    const selected = proposed.filter((p) => p.include && p.date);
    if (selected.length === 0) {
      showToast('Select at least one event to import', 'warning');
      return;
    }
    const newItems = selected.map((p) => ({
      id: uid('asn'),
      title: p.title,
      type: p.type,
      classId: classId || null,
      dueDate: p.date,
      estimatedMinutes: 60,
      completed: false,
      notes: '',
      source: 'syllabus',
    }));
    addAssignments(newItems);
    showToast(`${newItems.length} event${newItems.length !== 1 ? 's' : ''} added to your calendar`, 'success');
    setProposed(null);
    setText('');
  }

  const includedCount = proposed ? proposed.filter((p) => p.include).length : 0;
  const unresolvedWeeks = proposed ? proposed.filter((p) => !p.date).length : 0;

  if (proposed) {
    return (
      <>
        <button className="btn btn-ghost btn-sm" style={{ marginBottom: 14 }} onClick={() => setProposed(null)}>
          <ArrowLeft size={14} /> Back to paste
        </button>
        <div className="page-header">
          <div>
            <div className="page-title">{proposed.length} event{proposed.length !== 1 ? 's' : ''} found</div>
            <div className="page-subtitle">Review, edit, and choose what to add to your calendar.</div>
          </div>
        </div>

        {unresolvedWeeks > 0 && (
          <div className="card card-pad" style={{ marginBottom: 16, background: 'var(--gold-soft)', borderColor: 'var(--gold)' }}>
            <span style={{ fontSize: 13.5 }}>
              {unresolvedWeeks} item{unresolvedWeeks !== 1 ? 's' : ''} reference a week number but no term start date is set — set your term up from the Dashboard, or edit the date manually below.
            </span>
          </div>
        )}

        {proposed.length === 0 ? (
          <div className="card">
            <EmptyState title="No dates detected" description="Try pasting the section of the syllabus that lists assignment or exam dates." />
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-secondary btn-sm" onClick={() => toggleAll(true)}>Select all</button>
                <button className="btn btn-secondary btn-sm" onClick={() => toggleAll(false)}>Deselect all</button>
              </div>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{includedCount} selected</span>
            </div>

            <div className="card" style={{ marginBottom: 20 }}>
              {proposed.map((p, i) => (
                <div
                  key={p.tempId}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px',
                    borderBottom: i < proposed.length - 1 ? '1px solid var(--border)' : 'none',
                    opacity: p.include ? 1 : 0.5,
                  }}
                >
                  <button className="btn btn-ghost btn-icon" style={{ width: 26, height: 26, flexShrink: 0 }} onClick={() => updateProposed(p.tempId, { include: !p.include })}>
                    {p.include ? <CheckSquare size={18} color="var(--accent)" /> : <Square size={18} color="var(--text-tertiary)" />}
                  </button>
                  <input
                    type="date"
                    className="input"
                    style={{ width: 150, flexShrink: 0 }}
                    value={p.date || ''}
                    onChange={(e) => updateProposed(p.tempId, { date: e.target.value })}
                  />
                  <input
                    className="input"
                    style={{ flex: 1, minWidth: 140 }}
                    value={p.title}
                    onChange={(e) => updateProposed(p.tempId, { title: e.target.value })}
                  />
                  <select
                    className="select"
                    style={{ width: 140, flexShrink: 0 }}
                    value={p.type}
                    onChange={(e) => updateProposed(p.tempId, { type: e.target.value })}
                  >
                    {EVENT_TYPES.filter((t) => t.value !== 'personal').map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                  <button className="btn btn-ghost btn-icon" style={{ width: 30, height: 30, flexShrink: 0 }} onClick={() => removeProposed(p.tempId)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>

            <button className="btn btn-primary" style={{ padding: '12px 22px', fontSize: 15 }} onClick={handleImport}>
              Add selected events to calendar ({includedCount})
            </button>
          </>
        )}
      </>
    );
  }

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title"><FileUp size={22} style={{ verticalAlign: 'text-bottom', marginRight: 8, color: 'var(--accent)' }} />Import syllabus</div>
          <div className="page-subtitle">Paste your syllabus text and Bruin OS will find the dates for you.</div>
        </div>
      </div>

      {data.classes.length === 0 && (
        <div className="card card-pad" style={{ marginBottom: 18, background: 'var(--accent-soft)' }}>
          <span style={{ fontSize: 13.5 }}>
            You haven't added any classes yet. You can still import without one, or{' '}
            <button className="btn btn-ghost btn-sm" style={{ padding: 0, textDecoration: 'underline', fontSize: 13.5 }} onClick={() => goTo('classes')}>add a class first</button>.
          </span>
        </div>
      )}

      <div className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="field">
          <label>Which class is this syllabus for?</label>
          <select className="select" value={classId} onChange={(e) => setClassId(e.target.value)}>
            <option value="">No specific class</option>
            {data.classes.map((c) => <option key={c.id} value={c.id}>{c.code || c.name}</option>)}
          </select>
        </div>
        <div className="field">
          <label>Paste syllabus text</label>
          <textarea
            className="textarea"
            rows={14}
            placeholder={`Paste the schedule or assignments section here, e.g.\n\nSeptember 24 — Problem Set 1 due\nWeek 5 — Midterm exam\n10/15 — Final project proposal due`}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </div>
        <button
          className="btn btn-primary"
          style={{ alignSelf: 'flex-start', padding: '11px 20px', fontSize: 14.5 }}
          onClick={handleAnalyze}
          disabled={!text.trim()}
        >
          <Sparkles size={16} /> Analyze syllabus
        </button>
      </div>
    </>
  );
}
