import React, { useState } from 'react';
import { Plus, GraduationCap, MapPin, User, Clock, Pencil, Trash2, ArrowLeft } from 'lucide-react';
import { useStore } from '../lib/store';
import { useToast } from '../lib/toast';
import ClassFormModal from '../components/ClassFormModal';
import AssignmentFormModal from '../components/AssignmentFormModal';
import { EmptyState, ConfirmDialog } from '../components/Modal';
import { formatTime, formatFriendlyDate, DAY_ABBR } from '../lib/dates';
import { TYPE_BADGE_CLASS } from '../lib/constants';

export default function Classes() {
  const { data, deleteClass, toggleAssignmentComplete, deleteAssignment } = useStore();
  const showToast = useToast();
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [addItemFor, setAddItemFor] = useState(null);

  const selected = data.classes.find((c) => c.id === selectedId);

  if (selected) {
    const items = data.assignments.filter((a) => a.classId === selected.id).sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''));
    const upcomingEvents = data.events.filter((e) => e.classId === selected.id);

    return (
      <>
        <button className="btn btn-ghost btn-sm" style={{ marginBottom: 14 }} onClick={() => setSelectedId(null)}>
          <ArrowLeft size={14} /> All classes
        </button>
        <div className="page-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="dot" style={{ background: selected.color, width: 14, height: 14 }} />
            <div>
              <div className="page-title">{selected.name}</div>
              <div className="page-subtitle">
                {selected.code}{selected.professor ? ` · ${selected.professor}` : ''}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary" onClick={() => setEditing(selected)}><Pencil size={14} /> Edit</button>
            <button className="btn btn-danger" onClick={() => setConfirmDelete(selected)}><Trash2 size={14} /> Delete</button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginBottom: 20 }}>
          <div className="card card-pad">
            <div style={{ display: 'flex', gap: 9, alignItems: 'center', fontSize: 13.5, color: 'var(--text-secondary)' }}>
              <Clock size={15} />
              {selected.days?.length ? selected.days.map((d) => DAY_ABBR[d]).join(' ') : 'No days set'}
              {selected.startTime ? ` · ${formatTime(selected.startTime)}–${formatTime(selected.endTime)}` : ''}
            </div>
          </div>
          <div className="card card-pad">
            <div style={{ display: 'flex', gap: 9, alignItems: 'center', fontSize: 13.5, color: 'var(--text-secondary)' }}>
              <MapPin size={15} /> {selected.room || 'No room set'}
            </div>
          </div>
          <div className="card card-pad">
            <div style={{ display: 'flex', gap: 9, alignItems: 'center', fontSize: 13.5, color: 'var(--text-secondary)' }}>
              <User size={15} /> {selected.professor || 'No professor set'}
            </div>
          </div>
        </div>

        <div className="card card-pad">
          <div className="card-header">
            <div className="card-title">Assignments, exams & projects</div>
            <button className="btn btn-secondary btn-sm" onClick={() => setAddItemFor(selected.id)}><Plus size={14} /> Add item</button>
          </div>
          {items.length === 0 && upcomingEvents.length === 0 ? (
            <EmptyState title="Nothing tracked yet" description="Add assignments manually or import this class's syllabus." />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {items.map((a) => (
                <label key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 4px', borderBottom: '1px solid var(--border)' }}>
                  <input type="checkbox" checked={a.completed} onChange={() => toggleAssignmentComplete(a.id)} style={{ accentColor: 'var(--accent)', width: 15, height: 15 }} />
                  <div style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 500, textDecoration: a.completed ? 'line-through' : 'none', color: a.completed ? 'var(--text-tertiary)' : 'var(--text-primary)' }}>
                    {a.title}
                  </div>
                  <span className={`badge ${TYPE_BADGE_CLASS[a.type]}`}>{a.type}</span>
                  <span style={{ fontSize: 12.5, color: 'var(--text-secondary)', minWidth: 60, textAlign: 'right' }}>{formatFriendlyDate(a.dueDate)}</span>
                  <button className="btn btn-ghost btn-icon" style={{ width: 28, height: 28 }} onClick={() => deleteAssignment(a.id)}>
                    <Trash2 size={13} />
                  </button>
                </label>
              ))}
            </div>
          )}
        </div>

        {editing && <ClassFormModal existing={editing} onClose={() => setEditing(null)} />}
        {addItemFor && <AssignmentFormModal defaultClassId={addItemFor} onClose={() => setAddItemFor(null)} />}
        {confirmDelete && (
          <ConfirmDialog
            title="Delete class"
            message={`This removes "${confirmDelete.name}" and all of its assignments and events. This can't be undone.`}
            onConfirm={() => { deleteClass(confirmDelete.id); setSelectedId(null); showToast('Class deleted', 'success'); }}
            onClose={() => setConfirmDelete(null)}
          />
        )}
      </>
    );
  }

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">Classes</div>
          <div className="page-subtitle">{data.classes.length} class{data.classes.length !== 1 ? 'es' : ''} this term</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}><Plus size={16} /> Add class</button>
      </div>

      {data.classes.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<GraduationCap size={34} />}
            title="No classes yet"
            description="Add your classes to unlock the syllabus importer, schedule view, and workload tracking."
            action={<button className="btn btn-primary" onClick={() => setShowAdd(true)}>+ Add your first class</button>}
          />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
          {data.classes.map((c) => {
            const openCount = data.assignments.filter((a) => a.classId === c.id && !a.completed).length;
            return (
              <div key={c.id} className="card card-pad" style={{ cursor: 'pointer' }} onClick={() => setSelectedId(c.id)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span className="dot" style={{ background: c.color, width: 12, height: 12, marginTop: 4 }} />
                  <span className="badge badge-neutral">{openCount} open</span>
                </div>
                <div style={{ fontSize: 15.5, fontWeight: 600, marginTop: 10 }}>{c.name}</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>{c.code}{c.professor ? ` · ${c.professor}` : ''}</div>
                <div style={{ fontSize: 12.5, color: 'var(--text-tertiary)', marginTop: 8 }}>
                  {c.days?.length ? c.days.map((d) => DAY_ABBR[d]).join(' ') : 'No schedule set'}
                  {c.startTime ? ` · ${formatTime(c.startTime)}` : ''}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showAdd && <ClassFormModal onClose={() => setShowAdd(false)} />}
    </>
  );
}
