import { useState, useRef } from 'react';
import { exportData, importData, clearAllData } from '../../storage/db';

interface Props {
  onDataChanged: () => void;
}

export default function Settings({ onDataChanged }: Props) {
  const [status, setStatus] = useState('');
  const [statusType, setStatusType] = useState<'success' | 'error' | ''>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    try {
      const json = await exportData();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `flo-cycle-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setStatusType('success');
      setStatus('Data exported successfully!');
    } catch {
      setStatusType('error');
      setStatus('Failed to export data.');
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const count = await importData(text);
      setStatusType('success');
      setStatus(`Imported ${count} cycle entries!`);
      onDataChanged();
    } catch {
      setStatusType('error');
      setStatus('Failed to import — invalid file format.');
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClear = async () => {
    if (!confirm('Are you sure you want to delete all cycle data? This cannot be undone.')) return;
    try {
      await clearAllData();
      setStatusType('success');
      setStatus('All data cleared.');
      onDataChanged();
    } catch {
      setStatusType('error');
      setStatus('Failed to clear data.');
    }
  };

  return (
    <div className="settings-card">
      <h3 className="card-title">Data Management</h3>
      <p className="settings-description">
        Your data is stored locally in your browser. Export a backup to keep it safe, or import from a previous backup.
      </p>

      {status && (
        <div className={`settings-status ${statusType}`}>
          {status}
        </div>
      )}

      <div className="settings-actions">
        <button className="btn btn-primary" onClick={handleExport}>
          <span className="btn-icon">📥</span>
          Export Data (JSON)
        </button>

        <label className="btn btn-secondary import-btn">
          <span className="btn-icon">📤</span>
          Import Data (JSON)
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            hidden
          />
        </label>

        <div className="settings-divider" />

        <button className="btn btn-danger" onClick={handleClear}>
          <span className="btn-icon">🗑️</span>
          Clear All Data
        </button>
      </div>
    </div>
  );
}
