'use client';

import React from 'react';
import { Clock, Users, FolderKanban, Receipt, LayoutDashboard, Square, Play } from 'lucide-react';
import { TimeEntry } from '../lib/types';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  activeTimer: TimeEntry | null;
  elapsedSeconds: number;
  onStopTimer: () => void;
  isBackendConnected: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  activeTimer,
  elapsedSeconds,
  onStopTimer,
  isBackendConnected,
}) => {
  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'clients', label: 'Clients', icon: Users },
    { id: 'projects', label: 'Projects', icon: FolderKanban },
    { id: 'timers', label: 'Time Tracker', icon: Clock },
    { id: 'invoices', label: 'Invoices', icon: Receipt },
  ];

  return (
    <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('overview')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-violet-500/25">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                ClientPilot
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-violet-950/80 text-violet-300 border border-violet-800">
                Micro-SaaS
              </span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex space-x-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-violet-600 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                  data-testid={`nav-${item.id}`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Active Timer Pill / Right Bar */}
          <div className="flex items-center space-x-3">
            {activeTimer ? (
              <div className="flex items-center space-x-3 px-3 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 shadow-sm animate-pulse" data-testid="active-timer-pill">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-xs font-semibold max-w-[120px] truncate">
                  {activeTimer.projectName || 'Active Timer'}
                </span>
                <span className="font-mono text-sm font-bold text-white">
                  {formatTime(elapsedSeconds)}
                </span>
                <button
                  onClick={onStopTimer}
                  className="p-1 rounded-full bg-red-600 hover:bg-red-700 text-white transition-colors"
                  title="Stop Timer"
                  data-testid="stop-active-timer-btn"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                </button>
              </div>
            ) : (
              <div className="hidden sm:flex items-center text-xs text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-full border border-slate-700">
                <span className="w-2 h-2 rounded-full bg-slate-500 mr-2" />
                Timer Idle
              </div>
            )}

            {/* Backend connectivity indicator */}
            <span
              className={`text-xs px-2 py-0.5 rounded-md font-medium border ${
                isBackendConnected
                  ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800'
                  : 'bg-amber-950/60 text-amber-400 border-amber-800'
              }`}
              title={isBackendConnected ? 'Connected to live Hono backend' : 'Running in local fallback mock mode'}
            >
              {isBackendConnected ? 'LIVE API' : 'MOCK'}
            </span>
          </div>
        </div>

        {/* Mobile Navigation Tabs */}
        <div className="flex md:hidden overflow-x-auto py-2 space-x-1 border-t border-slate-800">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
                  isActive
                    ? 'bg-violet-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
