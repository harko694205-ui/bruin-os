import React, { useRef, useState } from 'react';
import { Modal, ConfirmDialog } from './Modal';
import { useStore } from '../lib/store';
import { useToast } from '../lib/toast';
import { Download, Upload, AlertTriangle } from 'lucide-react';
import { todayStr } from '../lib/dates';

export default function BackupModal({ onClose }) {
  const { exportData, importData, data } = useStore();
  const showToast = useToast();
  const fileInputRef = useRef();
  const [pendingImport, setPendingImport] = useState(null); // { parsed, filename }
  const [error, setError] = useState('');

  const totalItems = data.classes.length + data.assignments.length + data.events.length + data.links.length;

  function handleExport() {
    const payload = exportData();
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bruin-os-backup-${todayStr()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Backup downloaded', 'success');
  }

  function handleFileChosen(e) {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file later
    if (!file) return;
    setError('');
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        setPendingImport({ parsed, filename: file.name });
      } catch {
        setError('That file isn\u2019t valid JSON — make sure you\u2019re selecting a Bruin OS backup file.');
      }
    };
    reader.onerror = () => setError('Couldn\u2019t read that file. Try again.');
    reader.readAsText(file);
  }

  function confirmImport() {
    const result = importData(pendingImport.parsed);
    if (result.success) {
      showToast('Backup restored', 'success');
      setPendingImport(null);
      onClose();
    } else {
      setError(result.error);
      setPendingImport(null);
    }
  }

  return (
    <Modal title="Backup & restore" onClose={onClose}>
      <div>
        <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 4 }}>Export your data</div>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 10 }}>
          Everything in Bruin OS lives only in this browser. Download a backup file
          regularly so you don't lose it if you clear your browser data, switch
          browsers, or want to move to a new device.
          {totalItems > 0 && ` You currently have ${totalItems} item${totalItems !== 1 ? 's' : ''} saved.`}
        </p>
        <button className="btn btn-primary" onClick={handleExport}>
          <Download size={15} /> Download backup file
        </button>
      </div>

      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 4 }}>Restore from a backup</div>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 10 }}>
          Importing a backup <strong>replaces everything</strong> currently stored in
          this browser — classes, tasks, links, and settings. This can't be undone.
        </p>
        <button className="btn btn-secondary" onClick={() => fileInputRef.current?.click()}>
          <Upload size={15} /> Choose backup file…
        </button>
        <input ref={fileInputRef} type="file" accept="application/json,.json" style={{ display: 'none' }} onChange={handleFileChosen} />
        {error && (
          <div style={{ display: 'flex', gap: 7, alignItems: 'flex-start', marginTop: 10, fontSize: 12.5, color: 'var(--danger)' }}>
            <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} /> {error}
          </div>
        )}
      </div>

      {pendingImport && (
        <ConfirmDialog
          title="Replace all current data?"
          message={`Importing "${pendingImport.filename}" will overwrite everything currently saved in this browser. This can't be undone. Continue?`}
          confirmLabel="Replace data"
          onConfirm={confirmImport}
          onClose={() => setPendingImport(null)}
        />
      )}
    </Modal>
  );
}
