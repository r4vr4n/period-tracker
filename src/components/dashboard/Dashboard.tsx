import { useState, useEffect, useCallback } from 'react';
import {
  getCycleHistory,
  deleteCycleEntry,
  saveCompletePeriod,
  getUserProfile,
  type UserProfile
} from '../../storage/db';
import { useCyclePredictor } from '../../hooks/useCyclePredictor';
import CycleStatus from './CycleStatus';
import QuickLog from './QuickLog';
import MetricsCards from '../charts/MetricsCards';
import CycleLengthChart from '../charts/CycleLengthChart';
import PeriodDurationChart from '../charts/PeriodDurationChart';
import PredictionCalendar from '../charts/PredictionCalendar';
import CycleHistory from '../history/CycleHistory';
import Settings from '../settings/Settings';
import Onboarding from '../onboarding/Onboarding';
import type { CycleEntry } from '../../types/cycle';

type Tab = 'dashboard' | 'calendar' | 'charts' | 'history' | 'settings';

export default function Dashboard() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [cycles, setCycles] = useState<CycleEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const { metrics, isCalculating } = useCyclePredictor(cycles);

  const loadData = useCallback(async () => {
    try {
      const [userProfile, history] = await Promise.all([
        getUserProfile(),
        getCycleHistory()
      ]);
      setProfile(userProfile);
      setCycles(history);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handlePeriodComplete = async (startDate: string, endDate: string) => {
    await saveCompletePeriod(startDate, endDate);
    await loadData();
  };

  const handleDelete = async (entryId: string) => {
    await deleteCycleEntry(entryId);
    await loadData();
  };

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'dashboard', label: 'Home', icon: '🏠' },
    { key: 'calendar', label: 'Calendar', icon: '📅' },
    { key: 'charts', label: 'Charts', icon: '📊' },
    { key: 'history', label: 'History', icon: '📋' },
    { key: 'settings', label: 'Settings', icon: '⚙️' },
  ];

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p>Loading your data...</p>
      </div>
    );
  }

  if (!profile) {
    return <Onboarding onComplete={(p) => setProfile(p)} />;
  }

  return (
    <div className="app-layout">
      {/* Header */}
      <header className="app-header">
        <div className="header-left">
          <div className="header-logo">
            <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <title>Flo Cycle Logo</title>
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
          <div className="header-titles">
            <h2>Flo Cycle</h2>
            <span className="user-greeting">Hi, {profile.name}</span>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="app-content">
        {activeTab === 'dashboard' && (
          <div className="dashboard-view">
            {metrics && <CycleStatus metrics={metrics} />}
            <QuickLog
              onLogCompletePeriod={handlePeriodComplete}
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

        {activeTab === 'settings' && (
          <div className="settings-view">
            <Settings onDataChanged={loadData} />
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
            type="button"
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
