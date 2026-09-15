import React, { useState } from 'react';
import { Modal } from './Modal';
import { useStore } from '../lib/store';
import { useToast } from '../lib/toast';
import { todayStr } from '../lib/dates';
import { DAY_LETTERS } from '../lib/constants';

function emptyForm(defaults = {}) {
  return {
    title: '',
    date: todayStr(),
    time: '',
    type: 'personal',
    classId: null,
    notes: '',
    recurring: false,
    days: [],
    startDate: todayStr(),
    endDate: '',
    ...defaults,
  };
}

export default function EventFormModal({ existing, defaultDate, onClose }) {
  const { data, addEvent, updateEvent } = useStore();
  const showToast = useToast();
  const [form, setForm] = useState(
    existing ? emptyForm(existing) : emptyForm(defaultDate ? { date: defaultDate, startDate: defaultDate } : {})
  );
  const [error, setError] = useState('');

  function toggleDay(idx) {
    setForm((f) => ({
      ...f,
      days: f.days.includes(idx) ? f.days.filter((d) => d !== idx) : [...f.days, idx].sort(),
    }));
  }

  function handleSave() {
    if (!form.title.trim()) {
      setError('Give this event a name.');
      return;
    }
    if (form.recurring && form.days.length === 0) {
      setError('Pick at least one day it repeats on.');
      return;
    }
    if (form.recurring && form.endDate && form.startDate && form.endDate < form.startDate) {
      setError('End date should be after the start date.');
      return;
    }

    const payload = form.recurring
      ? { ...form, date: null }
      : { ...form, days: [], startDate: null, endDate: null };

    if (existing) {
      updateEvent(existing.id, payload);
      showToast('Event updated', 'success');
    } else {
      addEvent(payload);
      showToast(form.recurring ? 'Recurring event added' : 'Event added', 'success');
    }
    onClose();
  }

  return (
    <Modal
      title={existing ? 'Edit event' : 'Add personal event'}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave}>{existing ? 'Save changes' : 'Add event'}</button>
        </>
      }
    >
      <div className="field">
        <label>Title</label>
        <input
          className="input"
          placeholder="Work shift, club meeting, gym…"
          value={form.title}
          onChange={(e) => { setForm({ ...form, title: e.target.value }); setError(''); }}
          autoFocus
        />
      </div>

      <div className="segmented" style={{ alignSelf: 'flex-start' }}>
        <button type="button" className={!form.recurring ? 'active' : ''} onClick={() => setForm({ ...form, recurring: false })}>One-time</button>
        <button type="button" className={form.recurring ? 'active' : ''} onClick={() => setForm({ ...form, recurring: true })}>Repeats weekly</button>
      </div>

      {!form.recurring ? (
        <div className="field-row">
          <div className="field">
            <label>Date</label>
            <input type="date" className="input" value={form.date || ''} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </div>
          <div className="field">
            <label>Time (optional)</label>
            <input type="time" className="input" value={form.time || ''} onChange={(e) => setForm({ ...form, time: e.target.value })} />
          </div>
        </div>
      ) : (
        <>
          <div className="field">
            <label>Repeats on</label>
            <div className="day-picker">
              {DAY_LETTERS.map((d, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={`day-chip ${form.days.includes(idx) ? 'active' : ''}`}
                  onClick={() => toggleDay(idx)}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
          <div className="field-row">
            <div className="field">
              <label>Time (optional)</label>
              <input type="time" className="input" value={form.time || ''} onChange={(e) => setForm({ ...form, time: e.target.value })} />
            </div>
            <div className="field">
              <label>Starts</label>
              <input type="date" className="input" value={form.startDate || ''} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            </div>
          </div>
          <div className="field">
            <label>Ends (optional — leave blank for ongoing)</label>
            <input type="date" className="input" value={form.endDate || ''} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
          </div>
        </>
      )}

      {error && <span style={{ color: 'var(--danger)', fontSize: 12.5 }}>{error}</span>}

      <div className="field">
        <label>Related class (optional)</label>
        <select
          className="select"
          value={form.classId || ''}
          onChange={(e) => setForm({ ...form, classId: e.target.value || null })}
        >
          <option value="">None</option>
          {data.classes.map((c) => (
            <option key={c.id} value={c.id}>{c.code || c.name}</option>
          ))}
        </select>
      </div>
      <div className="field">
        <label>Notes (optional)</label>
        <textarea className="textarea" rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
      </div>
    </Modal>
  );
}
