import React, { useState } from 'react';
import { Modal } from './Modal';
import { useStore } from '../lib/store';
import { useToast } from '../lib/toast';
import { todayStr } from '../lib/dates';

export default function EventFormModal({ existing, onClose }) {
  const { data, addEvent, updateEvent } = useStore();
  const showToast = useToast();
  const [form, setForm] = useState(
    existing || {
      title: '',
      date: todayStr(),
      time: '',
      type: 'personal',
      classId: null,
      notes: '',
    }
  );
  const [error, setError] = useState('');

  function handleSave() {
    if (!form.title.trim()) {
      setError('Give this event a name.');
      return;
    }
    if (existing) {
      updateEvent(existing.id, form);
      showToast('Event updated', 'success');
    } else {
      addEvent(form);
      showToast('Event added', 'success');
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
          placeholder="Club meeting"
          value={form.title}
          onChange={(e) => { setForm({ ...form, title: e.target.value }); setError(''); }}
          autoFocus
        />
        {error && <span style={{ color: 'var(--danger)', fontSize: 12.5 }}>{error}</span>}
      </div>
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
