import React, { useState } from 'react';
import { Modal } from './Modal';
import { useStore } from '../lib/store';
import { useToast } from '../lib/toast';

export default function QuarterSetupModal({ onClose }) {
  const { data, updateSettings } = useStore();
  const showToast = useToast();
  const [name, setName] = useState(data.settings.quarterName || '');
  const [start, setStart] = useState(data.settings.quarterStart || '');
  const [end, setEnd] = useState(data.settings.quarterEnd || '');
  const [error, setError] = useState('');

  function handleSave() {
    if (!start || !end) {
      setError('Add both a start and end date.');
      return;
    }
    if (end < start) {
      setError('End date should be after the start date.');
      return;
    }
    updateSettings({ quarterName: name, quarterStart: start, quarterEnd: end });
    showToast('Term dates saved', 'success');
    onClose();
  }

  return (
    <Modal
      title="Set up your term"
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave}>Save</button>
        </>
      }
    >
      <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
        This powers the week counter and lets syllabus imports resolve "Week N" references to real dates.
      </p>
      <div className="field">
        <label>Term name</label>
        <input className="input" placeholder="Fall Quarter 2026" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="field-row">
        <div className="field">
          <label>Start date</label>
          <input type="date" className="input" value={start} onChange={(e) => { setStart(e.target.value); setError(''); }} />
        </div>
        <div className="field">
          <label>End date</label>
          <input type="date" className="input" value={end} onChange={(e) => { setEnd(e.target.value); setError(''); }} />
        </div>
      </div>
      {error && <span style={{ color: 'var(--danger)', fontSize: 12.5 }}>{error}</span>}
    </Modal>
  );
}
