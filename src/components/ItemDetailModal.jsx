import React, { useState } from 'react';
import { Modal, ConfirmDialog } from './Modal';
import { useStore } from '../lib/store';
import { useToast } from '../lib/toast';
import AssignmentFormModal from './AssignmentFormModal';
import EventFormModal from './EventFormModal';
import { formatFriendlyDate, formatTime } from '../lib/dates';
import { TYPE_BADGE_CLASS } from '../lib/constants';
import { Clock, MapPin, Pencil, Trash2, CheckCircle2 } from 'lucide-react';

export default function ItemDetailModal({ item, onClose, onGoToClass }) {
  const { deleteAssignment, deleteEvent, toggleAssignmentComplete } = useStore();
  const showToast = useToast();
  const [editMode, setEditMode] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (item.kind === 'class' && !editMode) {
    return (
      <Modal
        title={item.title}
        onClose={onClose}
        footer={<button className="btn btn-primary" onClick={() => { onGoToClass(item.refId); onClose(); }}>View class</button>}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 14, color: 'var(--text-secondary)' }}>
          {item.time && <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}><Clock size={15} /> {formatTime(item.time)} – {formatTime(item.endTime)}</div>}
          {item.subtitle && <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}><MapPin size={15} /> {item.subtitle}</div>}
        </div>
      </Modal>
    );
  }

  if (item.kind === 'assignment') {
    if (editMode) return <AssignmentFormModal existing={item.raw} onClose={onClose} />;
    return (
      <Modal
        title={item.title}
        onClose={onClose}
        footer={
          <>
            <button className="btn btn-danger" onClick={() => setConfirmDelete(true)}><Trash2 size={14} /> Delete</button>
            <button className="btn btn-secondary" onClick={() => setEditMode(true)}><Pencil size={14} /> Edit</button>
            <button className="btn btn-primary" onClick={() => { toggleAssignmentComplete(item.refId); showToast(item.completed ? 'Marked incomplete' : 'Marked complete', 'success'); onClose(); }}>
              <CheckCircle2 size={14} /> {item.completed ? 'Mark incomplete' : 'Mark complete'}
            </button>
          </>
        }
      >
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <span className={`badge ${TYPE_BADGE_CLASS[item.type]}`}>{item.type}</span>
          <span className="badge badge-neutral">{formatFriendlyDate(item.date)}</span>
          {item.subtitle && <span className="badge badge-blue">{item.subtitle}</span>}
        </div>
        {item.raw.notes && <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{item.raw.notes}</p>}
        {confirmDelete && (
          <ConfirmDialog
            title="Delete task"
            message={`Remove "${item.title}"?`}
            onConfirm={() => { deleteAssignment(item.refId); showToast('Deleted', 'success'); onClose(); }}
            onClose={() => setConfirmDelete(false)}
          />
        )}
      </Modal>
    );
  }

  if (item.kind === 'event') {
    if (editMode) return <EventFormModal existing={item.raw} onClose={onClose} />;
    return (
      <Modal
        title={item.title}
        onClose={onClose}
        footer={
          <>
            <button className="btn btn-danger" onClick={() => setConfirmDelete(true)}><Trash2 size={14} /> Delete</button>
            <button className="btn btn-primary" onClick={() => setEditMode(true)}><Pencil size={14} /> Edit</button>
          </>
        }
      >
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <span className="badge badge-neutral">{formatFriendlyDate(item.date)}{item.time ? ` · ${formatTime(item.time)}` : ''}</span>
          {item.subtitle && <span className="badge badge-blue">{item.subtitle}</span>}
        </div>
        {item.raw.notes && <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{item.raw.notes}</p>}
        {confirmDelete && (
          <ConfirmDialog
            title="Delete event"
            message={`Remove "${item.title}"?`}
            onConfirm={() => { deleteEvent(item.refId); showToast('Deleted', 'success'); onClose(); }}
            onClose={() => setConfirmDelete(false)}
          />
        )}
      </Modal>
    );
  }

  return null;
}
