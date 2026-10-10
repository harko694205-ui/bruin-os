import React, { useState } from 'react';
import { Modal } from './Modal';
import { useStore } from '../lib/store';
import { useToast } from '../lib/toast';
import { EVENT_TYPES } from '../lib/constants';
import { todayStr } from '../lib/dates';

const TYPE_OPTIONS = EVENT_TYPES.filter((t) => t.value !== 'personal');

export default function AssignmentFormModal({ existing, defaultType, defaultClassId, onClose }) {
  const { data, addAssignment, updateAssignment } = useStore();
  const showToast = useToast();
  const [form, setForm] = useState(
    existing || {
      title: '',
      type: defaultType || 'assignment',
      classId: defaultClassId || (data.classes[0] ? data.classes[0].id : null),
      dueDate: todayStr(),
      estimatedMinutes: 60,
      notes: '',
      completed: false,
    }
  );
  const [error, setError] = useState('');

  function handleSave() {
    if (!form.title.trim()) {
      setError('Give this a title.');
      return;
    }
    if (existing) {
      updateAssignment(existing.id, form);
      showToast('Updated', 'success');
    } else {
      addAssignment(form);
      showToast('Added to your calendar', 'success');
    }
    onClose();
  }

  return (
    <Modal
      title={existing ? 'Edit item' : 'Add assignment'}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave}>{existing ? 'Save changes' : 'Add'}</button>
        </>
      }
    >
      <div className="field">
        <label>Title</label>
        <input
          className="input"
          placeholder="Problem Set 4"
          value={form.title}
          onChange={(e) => { setForm({ ...form, title: e.target.value }); setError(''); }}
          autoFocus
        />
        {error && <span style={{ color: 'var(--danger)', fontSize: 12.5 }}>{error}</span>}
      </div>
      <div className="field-row">
        <div className="field">
          <label>Type</label>
          <select className="select" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            {TYPE_OPTIONS.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Class</label>
          <select
            className="select"
            value={form.classId || ''}
            onChange={(e) => setForm({ ...form, classId: e.target.value || null })}
          >
            <option value="">No class</option>
            {data.classes.map((c) => (
              <option key={c.id} value={c.id}>{c.code || c.name}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="field-row">
        <div className="field">
          <label>Due date</label>
          <input type="date" className="input" value={form.dueDate || ''} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
        </div>
        <div className="field">
          <label>Estimated time (minutes)</label>
          <input
            type="number"
            min="5"
            step="5"
            className="input"
            value={form.estimatedMinutes}
            onChange={(e) => setForm({ ...form, estimatedMinutes: parseInt(e.target.value, 10) || 0 })}
          />
        </div>
      </div>
      <div className="field">
        <label>Notes (optional)</label>
        <textarea
          className="textarea"
          rows={3}
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
        />
      </div>
    </Modal>
  );
}
