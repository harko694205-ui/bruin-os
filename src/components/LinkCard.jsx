import React, { useState, useRef, useEffect } from 'react';
import { Pin, MoreHorizontal, Pencil, Trash2, ExternalLink, GripVertical } from 'lucide-react';
import { useStore } from '../lib/store';
import { useToast } from '../lib/toast';
import LinkFormModal from './LinkFormModal';
import { ConfirmDialog } from './Modal';

function normalizeUrl(url) {
  if (!/^https?:\/\//i.test(url)) return `https://${url}`;
  return url;
}

export default function LinkCard({ link, compact, dragHandleProps }) {
  const { updateLink, deleteLink } = useStore();
  const showToast = useToast();
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const ref = useRef();

  useEffect(() => {
    function onDocClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  function open() {
    window.open(normalizeUrl(link.url), '_blank', 'noopener,noreferrer');
  }

  return (
    <div
      className="card"
      style={{
        padding: compact ? '14px 12px' : '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        position: 'relative',
        cursor: 'pointer',
        transition: 'transform 0.15s var(--ease), border-color 0.15s var(--ease)',
      }}
      onClick={open}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--border-strong)')}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          {dragHandleProps && (
            <span onClick={(e) => e.stopPropagation()} {...dragHandleProps} style={{ cursor: 'grab', color: 'var(--text-tertiary)' }}>
              <GripVertical size={14} />
            </span>
          )}
          <span style={{ fontSize: compact ? 20 : 24 }}>{link.icon || '🔗'}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
          <button
            className="btn btn-ghost btn-icon"
            style={{ width: 26, height: 26, color: link.pinned ? 'var(--gold-600)' : 'var(--text-tertiary)' }}
            title={link.pinned ? 'Unpin' : 'Pin to dashboard'}
            onClick={() => { updateLink(link.id, { pinned: !link.pinned }); showToast(link.pinned ? 'Unpinned' : 'Pinned to dashboard', 'success'); }}
          >
            <Pin size={14} fill={link.pinned ? 'var(--gold-600)' : 'none'} />
          </button>
          <div style={{ position: 'relative' }} ref={ref}>
            <button className="btn btn-ghost btn-icon" style={{ width: 26, height: 26 }} onClick={() => setMenuOpen((o) => !o)}>
              <MoreHorizontal size={15} />
            </button>
            {menuOpen && (
              <div className="menu" style={{ right: 0, top: 'calc(100% + 4px)' }}>
                <button className="menu-item" onClick={() => { setEditing(true); setMenuOpen(false); }}><Pencil size={13} /> Edit</button>
                <button className="menu-item" onClick={open}><ExternalLink size={13} /> Open</button>
                <button className="menu-item danger" onClick={() => { setConfirmDelete(true); setMenuOpen(false); }}><Trash2 size={13} /> Delete</button>
              </div>
            )}
          </div>
        </div>
      </div>
      <div>
        <div style={{ fontSize: compact ? 13.5 : 14.5, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{link.name}</div>
        {!compact && link.description && (
          <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 2 }}>{link.description}</div>
        )}
        <div style={{ fontSize: 11.5, color: 'var(--text-tertiary)', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {link.url.replace(/^https?:\/\//, '')}
        </div>
      </div>

      {editing && <LinkFormModal existing={link} onClose={() => setEditing(false)} />}
      {confirmDelete && (
        <ConfirmDialog
          title="Delete link"
          message={`Remove "${link.name}" from your links?`}
          onConfirm={() => { deleteLink(link.id); showToast('Link deleted', 'success'); }}
          onClose={() => setConfirmDelete(false)}
        />
      )}
    </div>
  );
}
