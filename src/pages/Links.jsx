import React, { useMemo, useState } from 'react';
import { Search, Link2, Plus } from 'lucide-react';
import { useStore } from '../lib/store';
import LinkCard from '../components/LinkCard';
import LinkFormModal from '../components/LinkFormModal';
import { EmptyState } from '../components/Modal';
import { LINK_CATEGORIES } from '../lib/constants';

export default function Links() {
  const { data, reorderLinks } = useStore();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [showAdd, setShowAdd] = useState(false);
  const [dragId, setDragId] = useState(null);

  const filtered = useMemo(() => {
    let list = [...data.links].sort((a, b) => a.order - b.order);
    if (category !== 'All') list = list.filter((l) => l.category === category);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((l) => l.name.toLowerCase().includes(q) || l.description?.toLowerCase().includes(q) || l.url.toLowerCase().includes(q));
    }
    return list;
  }, [data.links, query, category]);

  function handleDrop(targetId) {
    if (!dragId || dragId === targetId) return;
    const ordered = [...data.links].sort((a, b) => a.order - b.order).map((l) => l.id);
    const fromIdx = ordered.indexOf(dragId);
    const toIdx = ordered.indexOf(targetId);
    ordered.splice(fromIdx, 1);
    ordered.splice(toIdx, 0, dragId);
    reorderLinks(ordered);
    setDragId(null);
  }

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">Links</div>
          <div className="page-subtitle">Every website you use, one click away.</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}><Plus size={16} /> Add link</button>
      </div>

      {data.links.length > 0 && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1 1 220px', maxWidth: 320 }}>
            <Search size={15} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
            <input
              className="input"
              style={{ paddingLeft: 34 }}
              placeholder="Search links…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="segmented">
            {['All', ...LINK_CATEGORIES].map((c) => (
              <button key={c} className={category === c ? 'active' : ''} onClick={() => setCategory(c)}>{c}</button>
            ))}
          </div>
        </div>
      )}

      {data.links.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<Link2 size={34} />}
            title="No important links yet."
            description="Save the websites you use every day so they're always one click away."
            action={<button className="btn btn-primary" onClick={() => setShowAdd(true)}>+ Add your first link</button>}
          />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card">
          <EmptyState title="No links match" description="Try a different search term or category." />
        </div>
      ) : (
        <>
          <p style={{ fontSize: 12.5, color: 'var(--text-tertiary)', marginBottom: 10 }}>Drag cards to reorder.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
            {filtered.map((l) => (
              <div
                key={l.id}
                draggable
                onDragStart={() => setDragId(l.id)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(l.id)}
                style={{ opacity: dragId === l.id ? 0.5 : 1 }}
              >
                <LinkCard link={l} dragHandleProps={{}} />
              </div>
            ))}
          </div>
        </>
      )}

      {showAdd && <LinkFormModal onClose={() => setShowAdd(false)} />}
    </>
  );
}
