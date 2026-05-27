import { useState, useEffect, useCallback } from 'react';
import {
  getCycleHistory,
  deleteCycleEntry,
  getDailyLogs,
  saveCycleEntry,
  saveDailyLog,
  saveCompletePeriod,
  updateCycleEntry,
  getUserProfile,
  updateUserProfile,
  DEFAULT_USUAL_FLOW_DAYS,
  type UserProfile
} from '../../storage/db';
import { useCyclePredictor } from '../../hooks/useCyclePredictor';
import CycleStatus from './CycleStatus';
import QuickLog from './QuickLog';
import CycleInsights from './CycleInsights';
import MetricsCards from '../charts/MetricsCards';
import CycleLengthChart from '../charts/CycleLengthChart';
import PeriodDurationChart from '../charts/PeriodDurationChart';
import PredictionCalendar from '../charts/PredictionCalendar';
import CycleHistory from '../history/CycleHistory';
import Settings from '../settings/Settings';
import Onboarding from '../onboarding/Onboarding';
import type { CycleEntry, DailyLog } from '../../types/cycle';
import { format } from 'date-fns';

type Tab = 'dashboard' | 'calendar' | 'charts' | 'history' | 'settings';
type ToastState = { message: string; type: 'success' | 'error' } | null;

export default function Dashboard() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [cycles, setCycles] = useState<CycleEntry[]>([]);
  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [toast, setToast] = useState<ToastState>(null);
  const usualFlowDays = profile?.usualFlowDays ?? DEFAULT_USUAL_FLOW_DAYS;
  const { metrics, isCalculating } = useCyclePredictor(cycles, usualFlowDays);

  // Auto-dismiss toast after 3 s
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const showToast = (message: string, type: 'success' | 'error') =>
    setToast({ message, type });

  const loadData = useCallback(async () => {
    try {
      const [userProfile, history] = await Promise.all([
        getUserProfile(),
        getCycleHistory()
      ]);
      const logs = await getDailyLogs();
      setProfile(userProfile);
      setCycles(history);
      setDailyLogs(logs);
    } catch (err) {
      console.error('Failed to load data:', err);
      showToast('Failed to load data. Please refresh.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handlePeriodComplete = async (startDate: string, endDate: string): Promise<void> => {
    await saveCompletePeriod(startDate, endDate);
    await loadData();
    showToast('Period saved on this device.', 'success');
  };

  const handleDailyLogSave = async (
    date: string,
    data: Partial<Pick<DailyLog, 'symptoms' | 'mood' | 'energy' | 'spotting' | 'note'>>
  ): Promise<void> => {
    await saveDailyLog(date, data);
    await loadData();
  };

  const handleStartPeriodToday = async (): Promise<void> => {
    const activePeriod = cycles.find((cycle) => !cycle.endDate);
    if (activePeriod) {
      showToast('An active period is already being tracked.', 'error');
      return;
    }

    await saveCycleEntry({ startDate: format(new Date(), 'yyyy-MM-dd'), endDate: null });
    await loadData();
    showToast('Period started. Saved on this device.', 'success');
  };

  const handleEndActivePeriod = async (endDate: string): Promise<void> => {
    const activePeriod = cycles.find((cycle) => !cycle.endDate);
    if (!activePeriod) {
      showToast('No active period to end right now.', 'error');
      return;
    }

    if (endDate < activePeriod.startDate) {
      showToast('End date must be after the start date.', 'error');
      return;
    }

    await updateCycleEntry(activePeriod.id, { endDate });
    await loadData();
    showToast('Period ended. Saved on this device.', 'success');
  };

  const handleDelete = async (entryId: string) => {
    try {
      await deleteCycleEntry(entryId);
      await loadData();
      showToast('Entry deleted.', 'success');
    } catch {
      showToast('Failed to delete entry. Please try again.', 'error');
    }
  };

  const handleCycleUpdate = async (
    entryId: string,
    data: Partial<Pick<CycleEntry, 'startDate' | 'endDate'>>
  ) => {
    try {
      await updateCycleEntry(entryId, data);
      await loadData();
      showToast('Entry updated.', 'success');
    } catch {
      showToast('Failed to update entry.', 'error');
    }
  };

  const dismissBackupReminder = async () => {
    await updateUserProfile({ backupReminderDismissedAt: Date.now() });
    await loadData();
  };

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'dashboard', label: 'Home', icon: 'H' },
    { key: 'calendar', label: 'Calendar', icon: 'C' },
    { key: 'charts', label: 'Trends', icon: 'T' },
    { key: 'history', label: 'History', icon: 'R' },
    { key: 'settings', label: 'Settings', icon: 'S' },
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

  const todaysLog = dailyLogs.find((log) => log.date === format(new Date(), 'yyyy-MM-dd')) ?? null;
  const minimalMode = Boolean(profile.minimalMode);
  const showFertility = profile.showFertility !== false && !minimalMode;
  const appTitle = profile.discreetMode ? 'Cycle Notes' : 'Flo Cycle';
  const layoutClasses = [
    'app-layout',
    profile.discreetMode ? 'discreet-mode' : '',
    profile.reducedMotion ? 'reduced-motion' : '',
    profile.highContrast ? 'high-contrast' : '',
    profile.largeText ? 'large-text' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={layoutClasses}>
      {/* Global Toast */}
      {toast && (
        <div className={`app-toast ${toast.type}`} role="status" aria-live="polite">
          {toast.message}
        </div>
      )}

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
            <h2>{appTitle}</h2>
            <span className="user-greeting">Hi, {profile.name}</span>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="app-content">
        {activeTab === 'dashboard' && (
          <div className="dashboard-view">
            <div className="today-strip">
              <div>
                <span className="eyebrow">Today</span>
                <h1>{format(new Date(), 'EEEE, MMM d')}</h1>
              </div>
              <span className="local-save-pill">Saved on this device</span>
            </div>
            {metrics && <CycleStatus metrics={metrics} minimalMode={minimalMode} />}
            <QuickLog
              cycles={cycles}
              dailyLog={todaysLog}
              metrics={metrics}
              usualFlowDays={usualFlowDays}
              onStartPeriodToday={handleStartPeriodToday}
              onEndActivePeriod={handleEndActivePeriod}
              onSaveDailyLog={handleDailyLogSave}
              onLogCompletePeriod={handlePeriodComplete}
              onSoftLog={(message) => showToast(message, 'success')}
            />
            {cycles.length === 0 && !isCalculating && (
              <div className="empty-dashboard-hint">
                <p>
                  No pressure to fill everything in. Start with today, or add past
                  period dates when you have a minute.
                </p>
              </div>
            )}
            {metrics && cycles.length > 0 && (
              <CycleInsights cycles={cycles} dailyLogs={dailyLogs} metrics={metrics} />
            )}
            {cycles.length >= 3 && !profile.backupReminderDismissedAt && (
              <div className="backup-nudge">
                <p>Your history is stored on this device. Export a backup when you want a copy you control.</p>
                <div>
                  <button type="button" onClick={() => setActiveTab('settings')}>Backup</button>
                  <button type="button" onClick={dismissBackupReminder}>Later</button>
                </div>
              </div>
            )}
            {metrics && cycles.length > 0 && <MetricsCards metrics={metrics} />}
          </div>
        )}

        {activeTab === 'calendar' && (
          <div className="calendar-view">
            <PredictionCalendar
              cycles={cycles}
              dailyLogs={dailyLogs}
              predictions={metrics?.predictions ?? []}
              fertileWindow={showFertility ? metrics?.fertileWindow ?? null : null}
              showFertility={showFertility}
              onLogPeriod={handlePeriodComplete}
              onSaveDailyLog={handleDailyLogSave}
              onSoftLog={(message) => showToast(message, 'success')}
            />
          </div>
        )}

        {activeTab === 'charts' && !minimalMode && (
          <div className="charts-view">
            <CycleLengthChart cycles={cycles} />
            <PeriodDurationChart cycles={cycles} dailyLogs={dailyLogs} />
          </div>
        )}

        {activeTab === 'charts' && minimalMode && (
          <div className="charts-view">
            <div className="empty-dashboard-hint">
              <p>Minimal Mode is on. Trends are hidden so the app stays focused on period dates.</p>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="history-view">
            <CycleHistory cycles={cycles} onDelete={handleDelete} onUpdate={handleCycleUpdate} />
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="settings-view">
            <Settings profile={profile} onDataChanged={loadData} />
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
