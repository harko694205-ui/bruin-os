import React, { useState } from 'react';
import { Modal } from './Modal';
import { useStore } from '../lib/store';
import { useToast } from '../lib/toast';
import { CLASS_COLORS, DAY_LETTERS } from '../lib/constants';

const emptyForm = {
  name: '',
  code: '',
  professor: '',
  room: '',
  days: [],
  startTime: '',
  endTime: '',
  color: CLASS_COLORS[0],
};

export default function ClassFormModal({ existing, onClose }) {
  const { addClass, updateClass } = useStore();
  const showToast = useToast();
  const [form, setForm] = useState(existing ? { ...emptyForm, ...existing } : emptyForm);
  const [error, setError] = useState('');

  function toggleDay(idx) {
    setForm((f) => ({
      ...f,
      days: f.days.includes(idx) ? f.days.filter((d) => d !== idx) : [...f.days, idx].sort(),
    }));
  }

  function handleSave() {
    if (!form.name.trim()) {
      setError('Give your class a name.');
      return;
    }
    if (existing) {
      updateClass(existing.id, form);
      showToast('Class updated', 'success');
    } else {
      addClass(form);
      showToast('Class added', 'success');
    }
    onClose();
  }

  return (
    <Modal
      title={existing ? 'Edit class' : 'Add class'}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave}>{existing ? 'Save changes' : 'Add class'}</button>
        </>
      }
    >
      <div className="field">
        <label>Course name</label>
        <input
          className="input"
          placeholder="Intro to Microeconomics"
          value={form.name}
          onChange={(e) => { setForm({ ...form, name: e.target.value }); setError(''); }}
          autoFocus
        />
        {error && <span style={{ color: 'var(--danger)', fontSize: 12.5 }}>{error}</span>}
      </div>
      <div className="field-row">
        <div className="field">
          <label>Course code</label>
          <input className="input" placeholder="ECON 1" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
        </div>
        <div className="field">
          <label>Professor</label>
          <input className="input" placeholder="Prof. Rivera" value={form.professor} onChange={(e) => setForm({ ...form, professor: e.target.value })} />
        </div>
      </div>
      <div className="field">
        <label>Classroom</label>
        <input className="input" placeholder="Bunche Hall 3178" value={form.room} onChange={(e) => setForm({ ...form, room: e.target.value })} />
      </div>
      <div className="field">
        <label>Days of week</label>
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
          <label>Start time</label>
          <input type="time" className="input" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
        </div>
        <div className="field">
          <label>End time</label>
          <input type="time" className="input" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
        </div>
      </div>
      <div className="field">
        <label>Color</label>
        <div style={{ display: 'flex', gap: 8 }}>
          {CLASS_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setForm({ ...form, color: c })}
              style={{
                width: 28, height: 28, borderRadius: '50%', background: c,
                border: form.color === c ? '2.5px solid var(--text-primary)' : '2px solid transparent',
                boxShadow: form.color === c ? '0 0 0 2px var(--surface)' : 'none',
              }}
              aria-label={`Choose color ${c}`}
            />
          ))}
        </div>
      </div>
    </Modal>
  );
}
