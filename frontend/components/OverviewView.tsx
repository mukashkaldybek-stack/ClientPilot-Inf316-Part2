'use client';

import React from 'react';
import { Clock, Users, FolderKanban, Receipt, ArrowRight, Play, CheckCircle } from 'lucide-react';
import { Client, Project, TimeEntry, Invoice } from '../lib/types';

interface OverviewViewProps {
  clients: Client[];
  projects: Project[];
  timers: TimeEntry[];
  invoices: Invoice[];
  setActiveTab: (tab: string) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  clients,
  projects,
  timers,
  invoices,
  setActiveTab,
}) => {
  const totalSeconds = timers.reduce((acc, t) => acc + (t.durationSeconds || 0), 0);
  const totalHours = (totalSeconds / 3600).toFixed(1);
  const activeProjectsCount = projects.filter(p => p.status === 'active').length;
  const totalInvoiced = invoices.reduce((acc, inv) => acc + inv.totalAmount, 0).toFixed(2);
  const unbilledCount = timers.filter(t => !t.isBilled).length;

  return (
    <div className="space-y-8" data-testid="overview-view">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-900/60 via-indigo-900/40 to-slate-900 border border-violet-800/40 p-8 shadow-xl">
        <div className="relative z-10 max-w-2xl">
          <span className="text-xs font-bold uppercase tracking-widest text-violet-400">
            Welcome to ClientPilot
          </span>
          <h1 className="text-3xl font-extrabold text-white mt-1 tracking-tight">
            Freelance Operations, Synchronized.
          </h1>
          <p className="text-sm text-slate-300 mt-2 leading-relaxed">
            Manage clients, track billable project time with sub-second accuracy, and generate itemized invoices with zero administrative friction.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={() => setActiveTab('timers')}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold transition-all shadow-lg shadow-violet-600/30"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Start Timer</span>
            </button>
            <button
              onClick={() => setActiveTab('invoices')}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold transition-colors border border-slate-700"
            >
              <Receipt className="w-4 h-4" />
              <span>Generate Invoices</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Tracked Hours */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Tracked Hours
            </span>
            <div className="text-2xl font-black text-white mt-1" data-testid="kpi-hours">
              {totalHours} hrs
            </div>
            <div className="text-xs text-amber-400 mt-1">{unbilledCount} unbilled entries</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-950/70 border border-emerald-800/80 flex items-center justify-center text-emerald-400">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Active Projects */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Active Projects
            </span>
            <div className="text-2xl font-black text-white mt-1" data-testid="kpi-projects">
              {activeProjectsCount}
            </div>
            <div className="text-xs text-slate-400 mt-1">{projects.length} total projects</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-950/70 border border-blue-800/80 flex items-center justify-center text-blue-400">
            <FolderKanban className="w-6 h-6" />
          </div>
        </div>

        {/* Total Clients */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Clients
            </span>
            <div className="text-2xl font-black text-white mt-1" data-testid="kpi-clients">
              {clients.length}
            </div>
            <div className="text-xs text-slate-400 mt-1">Directory active</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-950/70 border border-purple-800/80 flex items-center justify-center text-purple-400">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Total Invoiced */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Invoiced
            </span>
            <div className="text-2xl font-black text-emerald-400 mt-1" data-testid="kpi-revenue">
              ${totalInvoiced}
            </div>
            <div className="text-xs text-slate-400 mt-1">{invoices.length} invoices generated</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-violet-950/70 border border-violet-800/80 flex items-center justify-center text-violet-400">
            <Receipt className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          onClick={() => setActiveTab('clients')}
          className="p-5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-white group-hover:text-violet-400 transition-colors">
              Manage Clients
            </h3>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-violet-400 group-hover:translate-x-1 transition-all" />
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Configure hourly rates, contact profiles, and currency parameters.
          </p>
        </div>

        <div
          onClick={() => setActiveTab('projects')}
          className="p-5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-white group-hover:text-violet-400 transition-colors">
              Track Projects
            </h3>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-violet-400 group-hover:translate-x-1 transition-all" />
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Assign deliverables to clients and monitor budget hours.
          </p>
        </div>

        <div
          onClick={() => setActiveTab('invoices')}
          className="p-5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-white group-hover:text-violet-400 transition-colors">
              Billing & Invoices
            </h3>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-violet-400 group-hover:translate-x-1 transition-all" />
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Export itemized invoice sheets and track payment receipt statuses.
          </p>
        </div>
      </div>
    </div>
  );
};

