'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { OverviewView } from '../components/OverviewView';
import { ClientsView } from '../components/ClientsView';
import { ProjectsView } from '../components/ProjectsView';
import { TimerView } from '../components/TimerView';
import { InvoicesView } from '../components/InvoicesView';
import { apiClient } from '../lib/apiClient';
import { Client, Project, TimeEntry, Invoice } from '../lib/types';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [timers, setTimers] = useState<TimeEntry[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [activeTimer, setActiveTimer] = useState<TimeEntry | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isBackendConnected, setIsBackendConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load all data
  const refreshData = async () => {
    try {
      // Test health
      try {
        const res = await fetch('/api/health');
        if (res.ok) {
          setIsBackendConnected(true);
          apiClient.mode = 'api';
        } else {
          setIsBackendConnected(false);
          apiClient.mode = 'mock';
        }
      } catch {
        setIsBackendConnected(false);
        apiClient.mode = 'mock';
      }

      const [c, p, t, inv, act] = await Promise.all([
        apiClient.getClients(),
        apiClient.getProjects(),
        apiClient.getTimers(),
        apiClient.getInvoices(),
        apiClient.getActiveTimer(),
      ]);

      setClients(c);
      setProjects(p);
      setTimers(t);
      setInvoices(inv);
      setActiveTimer(act);

      if (act && act.startTime) {
        const diff = Math.max(0, Math.floor((Date.now() - new Date(act.startTime).getTime()) / 1000));
        setElapsedSeconds(diff);
      } else {
        setElapsedSeconds(0);
      }
    } catch (err) {
      console.error('Failed to refresh data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  // Timer interval ticker
  useEffect(() => {
    if (!activeTimer) return;

    const interval = setInterval(() => {
      if (activeTimer.startTime) {
        const diff = Math.max(0, Math.floor((Date.now() - new Date(activeTimer.startTime).getTime()) / 1000));
        setElapsedSeconds(diff);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeTimer]);

  // Client Handlers
  const handleAddClient = async (data: Omit<Client, 'id' | 'createdAt'>) => {
    await apiClient.createClient(data);
    await refreshData();
  };

  const handleUpdateClient = async (id: string, data: Partial<Client>) => {
    await apiClient.updateClient(id, data);
    await refreshData();
  };

  const handleDeleteClient = async (id: string) => {
    await apiClient.deleteClient(id);
    await refreshData();
  };

  // Project Handlers
  const handleAddProject = async (data: Omit<Project, 'id' | 'createdAt'>) => {
    await apiClient.createProject(data);
    await refreshData();
  };

  const handleUpdateProject = async (id: string, data: Partial<Project>) => {
    await apiClient.updateProject(id, data);
    await refreshData();
  };

  const handleDeleteProject = async (id: string) => {
    await apiClient.deleteProject(id);
    await refreshData();
  };

  // Timer Handlers
  const handleStartTimer = async (projectId: string, description: string) => {
    const started = await apiClient.startTimer(projectId, description);
    setActiveTimer(started);
    setElapsedSeconds(0);
    await refreshData();
  };

  const handleStopTimer = async () => {
    if (!activeTimer) return;
    await apiClient.stopTimer(activeTimer.id);
    setActiveTimer(null);
    setElapsedSeconds(0);
    await refreshData();
  };

  const handleDeleteTimer = async (id: string) => {
    await apiClient.deleteTimer(id);
    await refreshData();
  };

  // Invoice Handlers
  const handleGenerateInvoice = async (clientId: string, taxRate: number, notes: string) => {
    const inv = await apiClient.generateInvoice(clientId, taxRate, notes);
    await refreshData();
    return inv;
  };

  const handleUpdateInvoiceStatus = async (id: string, status: Invoice['status']) => {
    await apiClient.updateInvoiceStatus(id, status);
    await refreshData();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeTimer={activeTimer}
        elapsedSeconds={elapsedSeconds}
        onStopTimer={handleStopTimer}
        isBackendConnected={isBackendConnected}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-24 text-slate-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500 mr-3" />
            <span>Loading ClientPilot workspace...</span>
          </div>
        ) : (
          <>
            {activeTab === 'overview' && (
              <OverviewView
                clients={clients}
                projects={projects}
                timers={timers}
                invoices={invoices}
                setActiveTab={setActiveTab}
              />
            )}

            {activeTab === 'clients' && (
              <ClientsView
                clients={clients}
                onAddClient={handleAddClient}
                onUpdateClient={handleUpdateClient}
                onDeleteClient={handleDeleteClient}
              />
            )}

            {activeTab === 'projects' && (
              <ProjectsView
                projects={projects}
                clients={clients}
                onAddProject={handleAddProject}
                onUpdateProject={handleUpdateProject}
                onDeleteProject={handleDeleteProject}
              />
            )}

            {activeTab === 'timers' && (
              <TimerView
                timers={timers}
                projects={projects}
                activeTimer={activeTimer}
                elapsedSeconds={elapsedSeconds}
                onStartTimer={handleStartTimer}
                onStopTimer={handleStopTimer}
                onDeleteTimer={handleDeleteTimer}
              />
            )}

            {activeTab === 'invoices' && (
              <InvoicesView
                invoices={invoices}
                clients={clients}
                onGenerateInvoice={handleGenerateInvoice}
                onUpdateStatus={handleUpdateInvoiceStatus}
              />
            )}
          </>
        )}
      </main>

      <footer className="border-t border-slate-900 bg-slate-950/80 py-6 text-center text-xs text-slate-500">
        ClientPilot © {new Date().getFullYear()} — Autonomous Freelance Micro-SaaS
      </footer>
    </div>
  );
}

