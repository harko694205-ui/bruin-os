import React, { useMemo, useState } from 'react';
import { Plus, ListChecks, Pencil, Trash2 } from 'lucide-react';
import { useStore } from '../lib/store';
import { useToast } from '../lib/toast';
import AssignmentFormModal from '../components/AssignmentFormModal';
import { EmptyState, ConfirmDialog } from '../components/Modal';
import { formatFriendlyDate, isPast, todayStr } from '../lib/dates';
import { TYPE_BADGE_CLASS } from '../lib/constants';

const FILTERS = ['All', 'Overdue', 'Upcoming', 'Completed'];

export default function Tasks() {
  const { data, toggleAssignmentComplete, deleteAssignment } = useStore();
  const showToast = useToast();
  const [filter, setFilter] = useState('All');
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const filtered = useMemo(() => {
    let list = [...data.assignments];
    if (filter === 'Overdue') list = list.filter((a) => !a.completed && a.dueDate && isPast(a.dueDate));
    else if (filter === 'Upcoming') list = list.filter((a) => !a.completed && a.dueDate && !isPast(a.dueDate));
    else if (filter === 'Completed') list = list.filter((a) => a.completed);
    else list = list.filter((a) => !a.completed || a.dueDate === todayStr());

    return list.sort((a, b) => (a.dueDate || '9999').localeCompare(b.dueDate || '9999'));
  }, [data.assignments, filter]);

  function classOf(id) {
    return data.classes.find((c) => c.id === id);
  }

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">Tasks</div>
          <div className="page-subtitle">{data.assignments.filter((a) => !a.completed).length} open items</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}><Plus size={16} /> Add task</button>
      </div>

      <div className="segmented" style={{ marginBottom: 18 }}>
        {FILTERS.map((f) => (
          <button key={f} className={filter === f ? 'active' : ''} onClick={() => setFilter(f)}>{f}</button>
        ))}
      </div>

      {data.assignments.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<ListChecks size={34} />}
            title="No tasks tracked yet"
            description="Add assignments manually, or import a syllabus to populate your whole term at once."
            action={<button className="btn btn-primary" onClick={() => setShowAdd(true)}>+ Add your first task</button>}
          />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card"><EmptyState title="Nothing here" description={`No tasks match "${filter}."`} /></div>
      ) : (
        <div className="card">
          {filtered.map((a, i) => {
            const cls = classOf(a.classId);
            const overdue = !a.completed && a.dueDate && isPast(a.dueDate);
            return (
              <div
                key={a.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '13px 18px',
                  borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none',
                }}
              >
                <input
                  type="checkbox"
                  checked={a.completed}
                  onChange={() => toggleAssignmentComplete(a.id)}
                  style={{ accentColor: 'var(--accent)', width: 16, height: 16, flexShrink: 0 }}
                />
                {cls && <span className="dot" style={{ background: cls.color, flexShrink: 0 }} />}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 14.5, fontWeight: 500,
                    textDecoration: a.completed ? 'line-through' : 'none',
                    color: a.completed ? 'var(--text-tertiary)' : 'var(--text-primary)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {a.title}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>
                    {cls ? (cls.code || cls.name) : 'No class'}
                  </div>
                </div>
                <span className={`badge ${TYPE_BADGE_CLASS[a.type]}`}>{a.type}</span>
                <span className={`badge ${overdue ? 'badge-red' : 'badge-neutral'}`} style={{ minWidth: 66, justifyContent: 'center' }}>
                  {formatFriendlyDate(a.dueDate)}
                </span>
                <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                  <button className="btn btn-ghost btn-icon" style={{ width: 30, height: 30 }} onClick={() => setEditing(a)}>
                    <Pencil size={13} />
                  </button>
                  <button className="btn btn-ghost btn-icon" style={{ width: 30, height: 30 }} onClick={() => setConfirmDelete(a)}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showAdd && <AssignmentFormModal onClose={() => setShowAdd(false)} />}
      {editing && <AssignmentFormModal existing={editing} onClose={() => setEditing(null)} />}
      {confirmDelete && (
        <ConfirmDialog
          title="Delete task"
          message={`Remove "${confirmDelete.title}"? This can't be undone.`}
          onConfirm={() => { deleteAssignment(confirmDelete.id); showToast('Task deleted', 'success'); }}
          onClose={() => setConfirmDelete(null)}
        />
      )}
    </>
  );
}
