import React, { useEffect, useRef, useState } from 'react';
import { Plus, GraduationCap, ListChecks, CalendarPlus } from 'lucide-react';
import ClassFormModal from './ClassFormModal';
import AssignmentFormModal from './AssignmentFormModal';
import EventFormModal from './EventFormModal';

export default function QuickAdd({ label = 'Quick add' }) {
  const [open, setOpen] = useState(false);
  const [modal, setModal] = useState(null); // 'class' | 'assignment' | 'event'
  const ref = useRef();

  useEffect(() => {
    function onDocClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  return (
    <div style={{ position: 'relative', display: 'inline-block' }} ref={ref}>
      <button className="btn btn-primary" onClick={() => setOpen((o) => !o)}>
        <Plus size={16} /> {label}
      </button>
      {open && (
        <div className="menu" style={{ right: 0, top: 'calc(100% + 6px)' }}>
          <button className="menu-item" onClick={() => { setModal('class'); setOpen(false); }}>
            <GraduationCap size={15} /> Class
          </button>
          <button className="menu-item" onClick={() => { setModal('assignment'); setOpen(false); }}>
            <ListChecks size={15} /> Assignment / exam
          </button>
          <button className="menu-item" onClick={() => { setModal('event'); setOpen(false); }}>
            <CalendarPlus size={15} /> Personal event
          </button>
        </div>
      )}
      {modal === 'class' && <ClassFormModal onClose={() => setModal(null)} />}
      {modal === 'assignment' && <AssignmentFormModal onClose={() => setModal(null)} />}
      {modal === 'event' && <EventFormModal onClose={() => setModal(null)} />}
    </div>
  );
}
