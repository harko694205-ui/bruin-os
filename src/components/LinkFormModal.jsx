import React, { useState } from 'react';
import { Modal } from './Modal';
import { useStore } from '../lib/store';
import { useToast } from '../lib/toast';
import { LINK_CATEGORIES, LINK_CATEGORY_ICONS } from '../lib/constants';

const COMMON_EMOJI = ['🔗', '🐻', '📚', '📧', '💼', '💵', '📝', '🎓', '📅', '⭐', '🖥️', '📊'];

function normalizeForCompare(url) {
  return url
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/+$/, '');
}

function isValidUrl(url) {
  const candidate = /^https?:\/\//i.test(url) ? url : `https://${url}`;
  try {
    const u = new URL(candidate);
    return u.hostname.includes('.');
  } catch {
    return false;
  }
}

export default function LinkFormModal({ existing, onClose }) {
  const { data, addLink, updateLink } = useStore();
  const showToast = useToast();
  const [form, setForm] = useState(
    existing || {
      name: '',
      url: '',
      category: 'School',
      icon: LINK_CATEGORY_ICONS.School,
      description: '',
      pinned: false,
    }
  );
  const [error, setError] = useState('');

  function handleSave() {
    if (!form.name.trim()) {
      setError('Give this link a name.');
      return;
    }
    if (!form.url.trim() || !isValidUrl(form.url)) {
      setError('Enter a valid website address.');
      return;
    }
    const normalized = normalizeForCompare(form.url);
    const duplicate = data.links.find(
      (l) => normalizeForCompare(l.url) === normalized && l.id !== existing?.id
    );
    if (duplicate) {
      setError(`You already saved this as "${duplicate.name}".`);
      return;
    }

    const finalUrl = /^https?:\/\//i.test(form.url) ? form.url.trim() : `https://${form.url.trim()}`;

    if (existing) {
      updateLink(existing.id, { ...form, url: finalUrl });
      showToast('Link updated', 'success');
    } else {
      addLink({ ...form, url: finalUrl });
      showToast('Link added', 'success');
    }
    onClose();
  }

  return (
    <Modal
      title={existing ? 'Edit link' : 'Add link'}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave}>{existing ? 'Save changes' : 'Add link'}</button>
        </>
      }
    >
      <div className="field">
        <label>Name</label>
        <input className="input" placeholder="MyUCLA" value={form.name} onChange={(e) => { setForm({ ...form, name: e.target.value }); setError(''); }} autoFocus />
      </div>
      <div className="field">
        <label>URL</label>
        <input className="input" placeholder="my.ucla.edu" value={form.url} onChange={(e) => { setForm({ ...form, url: e.target.value }); setError(''); }} />
        {error && <span style={{ color: 'var(--danger)', fontSize: 12.5 }}>{error}</span>}
      </div>
      <div className="field-row">
        <div className="field">
          <label>Category</label>
          <select
            className="select"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value, icon: form.icon === LINK_CATEGORY_ICONS[form.category] ? LINK_CATEGORY_ICONS[e.target.value] : form.icon })}
          >
            {LINK_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="field">
          <label>Icon</label>
          <select className="select" value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })}>
            {COMMON_EMOJI.map((e) => <option key={e} value={e}>{e}</option>)}
          </select>
        </div>
      </div>
      <div className="field">
        <label>Description (optional)</label>
        <input className="input" placeholder="UCLA student portal" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      </div>
      <label className="checkbox-row">
        <input type="checkbox" checked={form.pinned} onChange={(e) => setForm({ ...form, pinned: e.target.checked })} />
        Pin to dashboard
      </label>
    </Modal>
  );
}
