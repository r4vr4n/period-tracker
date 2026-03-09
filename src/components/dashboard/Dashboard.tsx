import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getCycleHistory, saveCycleEntry, updateCycleEntry, deleteCycleEntry } from '../../firebase/firestore';
import { useCyclePredictor } from '../../hooks/useCyclePredictor';
import CycleStatus from './CycleStatus';
import QuickLog from './QuickLog';
import MetricsCards from '../charts/MetricsCards';
import CycleLengthChart from '../charts/CycleLengthChart';
import PeriodDurationChart from '../charts/PeriodDurationChart';
import PredictionCalendar from '../charts/PredictionCalendar';
import CycleHistory from '../history/CycleHistory';
import type { CycleEntry } from '../../types/cycle';

type Tab = 'dashboard' | 'calendar' | 'charts' | 'history';

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const [cycles, setCycles] = useState<CycleEntry[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const { metrics, isCalculating } = useCyclePredictor(cycles);

  const loadCycles = useCallback(async () => {
    if (!user) return;
    try {
      const data = await getCycleHistory(user.uid);
      setCycles(data);
    } catch (err) {
      console.error('Failed to load cycles:', err);
    } finally {
      setLoadingData(false);
    }
  }, [user]);

  useEffect(() => {
    loadCycles();
  }, [loadCycles]);

  const handlePeriodStart = async (date: string) => {
    if (!user) return;
    await saveCycleEntry(user.uid, { startDate: date, endDate: null });
    await loadCycles();
  };

  const handlePeriodEnd = async (date: string) => {
    if (!user) return;
    // Find the most recent cycle without an end date
    const ongoing = cycles.find((c) => !c.endDate);
    if (ongoing) {
      await updateCycleEntry(user.uid, ongoing.id, { endDate: date });
      await loadCycles();
    }
  };

  const handleDelete = async (entryId: string) => {
    if (!user) return;
    await deleteCycleEntry(user.uid, entryId);
    await loadCycles();
  };

  const hasOngoingPeriod = cycles.some((c) => !c.endDate);

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'dashboard', label: 'Home', icon: '🏠' },
    { key: 'calendar', label: 'Calendar', icon: '📅' },
    { key: 'charts', label: 'Charts', icon: '📊' },
    { key: 'history', label: 'History', icon: '📋' },
  ];

  if (loadingData) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p>Loading your data...</p>
      </div>
    );
  }

  return (
    <div className="app-layout">
      {/* Header */}
      <header className="app-header">
        <div className="header-left">
          <div className="header-logo">
            <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M16 4C11 4 8 8 8 13C8 18 11 23 16 28C21 23 24 18 24 13C24 8 21 4 16 4Z"
                fill="url(#hdr-grad)"
              />
              <defs>
                <linearGradient id="hdr-grad" x1="8" y1="4" x2="24" y2="28">
                  <stop stopColor="#FF6B9D" />
                  <stop offset="1" stopColor="#C44AFF" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <h2>Flo Cycle</h2>
        </div>
        <div className="header-right">
          <div className="user-info">
            {user?.photoURL && (
              <img src={user.photoURL} alt="" className="user-avatar" referrerPolicy="no-referrer" />
            )}
            <span className="user-name">{user?.displayName || user?.email}</span>
          </div>
          <button className="btn btn-ghost" onClick={signOut} title="Sign out">
            ↗
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="app-content">
        {activeTab === 'dashboard' && (
          <div className="dashboard-view">
            {metrics && <CycleStatus metrics={metrics} />}
            <QuickLog
              onLogPeriodStart={handlePeriodStart}
              onLogPeriodEnd={handlePeriodEnd}
              hasOngoingPeriod={hasOngoingPeriod}
            />
            {metrics && <MetricsCards metrics={metrics} />}
          </div>
        )}

        {activeTab === 'calendar' && (
          <div className="calendar-view">
            <PredictionCalendar
              cycles={cycles}
              predictions={metrics?.predictions ?? []}
              fertileWindow={metrics?.fertileWindow ?? null}
            />
          </div>
        )}

        {activeTab === 'charts' && (
          <div className="charts-view">
            <CycleLengthChart cycles={cycles} />
            <PeriodDurationChart cycles={cycles} />
          </div>
        )}

        {activeTab === 'history' && (
          <div className="history-view">
            <CycleHistory cycles={cycles} onDelete={handleDelete} />
          </div>
        )}

        {isCalculating && (
          <div className="calculating-indicator">
            <div className="loading-spinner small" />
            <span>Calculating predictions...</span>
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="bottom-nav">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`nav-item ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            <span className="nav-icon">{tab.icon}</span>
            <span className="nav-label">{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
