import { useState, useRef, useEffect } from 'react';
import {
  exportData,
  importData,
  clearAllData,
  applySyncPayload,
  generateSyncCode
} from '../../storage/db';
import { p2pService } from '../../storage/peerService';

interface Props {
  onDataChanged: () => void;
}

export default function Settings({ onDataChanged }: Props) {
  const [status, setStatus] = useState('');
  const [statusType, setStatusType] = useState<'success' | 'error' | ''>('');
  const [syncMode, setSyncMode] = useState<'idle' | 'send' | 'receive'>('idle');
  const [transferCode, setTransferCode] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showStatus = (msg: string, type: 'success' | 'error') => {
    setStatus(msg);
    setStatusType(type);
    setTimeout(() => {
      setStatus('');
      setStatusType('');
    }, 5000);
  };

  // Cleanup peer service on unmount or mode change
  useEffect(() => {
    return () => p2pService.destroy();
  }, []);

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
      showStatus('Data exported successfully!', 'success');
    } catch {
      showStatus('Failed to export data.', 'error');
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const count = await importData(text);
      showStatus(`Imported ${count} cycle entries!`, 'success');
      onDataChanged();
    } catch {
      showStatus('Failed to import — invalid file format.', 'error');
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };



  const startReceiving = async () => {
    const code = generateSyncCode();
    setTransferCode(code);
    setSyncMode('receive');
    setIsProcessing(true);
    try {
      await p2pService.startReceiving(code, async (payload) => {
        await applySyncPayload(payload);
        showStatus('Data received and applied!', 'success');
        setSyncMode('idle');
        onDataChanged();
      });
    } catch (err: any) {
      showStatus(err.message, 'error');
      setSyncMode('idle');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConnectAndPull = async () => {
    if (!inputCode.trim()) return;
    setIsProcessing(true);
    try {
      // The "Consumer" (this device) connects to the "Provider" (other device)
      // Wait, let's reverse for simplicity:
      // Device A (has data) -> "Send Mode" -> types a code from Device B.
      // Device B (wants data) -> "Receive Mode" -> generates Code "ABC".
      await p2pService.sendData(inputCode.trim());
      showStatus('Data sent!', 'success');
      onDataChanged();
    } catch (err: any) {
      showStatus(err.message, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClear = async () => {
    if (!confirm('Are you sure you want to delete all cycle data? This cannot be undone.')) return;
    try {
      await clearAllData();
      showStatus('All data cleared.', 'success');
      onDataChanged();
    } catch {
      showStatus('Failed to clear data.', 'error');
    }
  };

  return (
    <div className="settings-container">
      {status && (
        <div className={`settings-status-toast ${statusType}`}>
          {status}
        </div>
      )}

      {/* P2P Sync Section */}
      <div className="settings-card sync-card">
        <h3 className="card-title">Local Device Sync</h3>
        <p className="settings-description">
          Sync your data directly between devices over Wi-Fi without using a cloud server.
        </p>

        {syncMode === 'idle' && (
          <div className="settings-actions horizontal">
            <button className="btn btn-primary" onClick={startReceiving}>
              <span className="btn-icon">📥</span>
              Receive Data
            </button>
            <button className="btn btn-secondary" onClick={() => setSyncMode('send')}>
              <span className="btn-icon">📤</span>
              Send Data
            </button>
          </div>
        )}

        {syncMode === 'receive' && (
          <div className="sync-active-box">
            <span className="sync-id-label">This Device's Code</span>
            <div className="sync-id-value">{transferCode}</div>
            <p className="sync-id-note">Enter this code on the device you want to sync FROM.</p>
            <button className="btn btn-secondary btn-sm" onClick={() => { p2pService.destroy(); setSyncMode('idle'); }}>
              Cancel
            </button>
          </div>
        )}

        {syncMode === 'send' && (
          <div className="sync-send-box">
            <p className="settings-description small">Enter the code shown on the receiving device:</p>
            <div className="sync-input-group">
              <input
                type="text"
                placeholder="Receive Code (e.g. ABC12)"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                className="sync-input"
                autoFocus
              />
              <button
                className="btn btn-primary btn-sm"
                onClick={handleConnectAndPull}
                disabled={isProcessing || !inputCode.trim()}
              >
                {isProcessing ? 'Connecting...' : 'Sync Now'}
              </button>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => setSyncMode('idle')}>
              Back
            </button>
          </div>
        )}
      </div>

      {/* Local Backup Section */}
      <div className="settings-card">
        <h3 className="card-title">Manual Backup</h3>
        <p className="settings-description">
          Export your history to a JSON file for your own records or manual transfer.
        </p>

        <div className="settings-actions horizontal">
          <button className="btn btn-secondary" onClick={handleExport}>
            <span className="btn-icon">💾</span>
            Export JSON
          </button>

          <label className="btn btn-secondary import-btn">
            <span className="btn-icon">📂</span>
            Import JSON
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImport}
              hidden
            />
          </label>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="settings-card danger-card">
        <h3 className="card-title">Danger Zone</h3>
        <button className="btn btn-danger" onClick={handleClear}>
          <span className="btn-icon">🗑️</span>
          Clear All Data
        </button>
      </div>
    </div>
  );
}
