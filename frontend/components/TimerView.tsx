'use client';

import React, { useState } from 'react';
import { Play, Square, Clock, Trash2, Tag, Calendar, AlertCircle } from 'lucide-react';
import { TimeEntry, Project } from '../lib/types';

interface TimerViewProps {
  timers: TimeEntry[];
  projects: Project[];
  activeTimer: TimeEntry | null;
  elapsedSeconds: number;
  onStartTimer: (projectId: string, description: string) => Promise<void>;
  onStopTimer: () => Promise<void>;
  onDeleteTimer: (id: string) => Promise<void>;
}

export const TimerView: React.FC<TimerViewProps> = ({
  timers,
  projects,
  activeTimer,
  elapsedSeconds,
  onStartTimer,
  onStopTimer,
  onDeleteTimer,
}) => {
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [description, setDescription] = useState('');
  const [validationError, setValidationError] = useState('');
  const [isStarting, setIsStarting] = useState(false);

  const formatDuration = (totalSeconds: number = 0) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    // Notice: if selectedProjectId is empty, let's call onStartTimer so that backend 422 can be triggered or tested!
    try {
      setIsStarting(true);
      await onStartTimer(selectedProjectId, description);
      setDescription('');
    } catch (err: any) {
      if (err.status === 422 || err.data?.code === 'MISSING_PROJECT_ID') {
        setValidationError(err.data?.error || 'Validation Error: Please select a valid Project to start the timer.');
      } else {
        setValidationError(err.message || 'Failed to start timer');
      }
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <div className="space-y-6" data-testid="timer-view">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Time Tracker</h1>
        <p className="text-sm text-slate-400">
          Track billable hours against active client projects with one-click precision.
        </p>
      </div>

      {/* Validation Error Banner */}
      {validationError && (
        <div
          data-testid="timer-validation-error"
          className="p-4 rounded-xl bg-red-950/70 border border-red-800 text-red-200 text-sm flex items-center space-x-3 animate-in fade-in"
        >
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-400" />
          <div>
            <span className="font-semibold">HTTP 422 Unprocessable Entity: </span>
            {validationError}
          </div>
        </div>
      )}

      {/* Active Timer Box / Controller Bar */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        {activeTimer ? (
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6" data-testid="active-timer-box">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-950/80 border border-emerald-700/60 flex items-center justify-center animate-pulse">
                <Clock className="w-7 h-7 text-emerald-400" />
              </div>
              <div>
                <span className="text-xs uppercase font-semibold text-emerald-400 tracking-wider">
                  Timer Active • Running
                </span>
                <h3 className="text-xl font-bold text-white mt-0.5" data-testid="active-timer-project">
                  {activeTimer.projectName || 'Project Task'}
                </h3>
                <p className="text-xs text-slate-400 mt-1" data-testid="active-timer-desc">
                  {activeTimer.description || 'General Development & Consulting'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-6 justify-between md:justify-end">
              <div className="text-right">
                <div
                  className="font-mono text-4xl font-extrabold text-white tracking-wider"
                  data-testid="live-timer-counter"
                >
                  {formatDuration(elapsedSeconds)}
                </div>
                <div className="text-xs text-slate-400 mt-0.5">Elapsed Duration</div>
              </div>

              <button
                onClick={onStopTimer}
                data-testid="stop-timer-btn"
                className="flex items-center space-x-2 px-6 py-3.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold transition-all shadow-lg shadow-red-600/30 active:scale-95"
              >
                <Square className="w-5 h-5 fill-current" />
                <span>Stop Timer</span>
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleStart} className="space-y-4" data-testid="start-timer-form">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
              <div className="md:col-span-5">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Select Project *
                </label>
                <select
                  value={selectedProjectId}
                  onChange={e => {
                    setSelectedProjectId(e.target.value);
                    setValidationError('');
                  }}
                  data-testid="timer-project-select"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  <option value="">-- Choose a Project --</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.clientName || 'Client'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-5">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Task Description (Optional)
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="e.g. Debugging auth token expiration"
                  data-testid="timer-desc-input"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              <div className="md:col-span-2">
                <button
                  type="submit"
                  disabled={isStarting}
                  data-testid="start-timer-btn"
                  className="w-full flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-sm transition-all shadow-md shadow-emerald-600/20 active:scale-95"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Start</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>

      {/* Recorded Time Entries History */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">Tracked Time Logs</h2>
          <span className="text-xs text-slate-400">{timers.length} logged entries</span>
        </div>

        {timers.length === 0 ? (
          <div className="text-center py-10 text-slate-500 text-sm">
            No time entries recorded yet. Select a project and start the timer above!
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80 overflow-x-auto" data-testid="time-entries-list">
            {timers.map(timer => (
              <div
                key={timer.id}
                data-testid={`time-entry-${timer.id}`}
                className="px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:bg-slate-800/40 transition-colors"
              >
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 mt-0.5">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-white text-sm" data-testid="entry-project">
                        {timer.projectName || 'Project Task'}
                      </span>
                      {timer.clientName && (
                        <span className="text-xs text-slate-400">({timer.clientName})</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5" data-testid="entry-desc">
                      {timer.description || 'No description provided'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end space-x-4">
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${
                      timer.isBilled
                        ? 'bg-blue-950/70 text-blue-300 border-blue-800'
                        : 'bg-amber-950/70 text-amber-300 border-amber-800'
                    }`}
                    data-testid="entry-billable-status"
                  >
                    {timer.isBilled ? 'Billed' : 'Unbilled'}
                  </span>

                  <span
                    className="font-mono text-sm font-semibold text-slate-200"
                    data-testid="entry-duration"
                  >
                    {formatDuration(timer.durationSeconds || 0)}
                  </span>

                  <button
                    onClick={() => onDeleteTimer(timer.id)}
                    className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
                    title="Delete Entry"
                    data-testid={`delete-entry-${timer.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
