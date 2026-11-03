'use client';

import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Mail, DollarSign, Building } from 'lucide-react';
import { Client } from '../lib/types';

interface ClientsViewProps {
  clients: Client[];
  onAddClient: (data: Omit<Client, 'id' | 'createdAt'>) => Promise<void>;
  onDeleteClient: (id: string) => Promise<void>;
  onUpdateClient: (id: string, data: Partial<Client>) => Promise<void>;
}

export const ClientsView: React.FC<ClientsViewProps> = ({
  clients,
  onAddClient,
  onDeleteClient,
  onUpdateClient,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [hourlyRate, setHourlyRate] = useState<number>(100);
  const [currency, setCurrency] = useState('USD');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const openAddModal = () => {
    setEditingClient(null);
    setName('');
    setEmail('');
    setHourlyRate(100);
    setCurrency('USD');
    setErrorMsg('');
    setShowModal(true);
  };

  const openEditModal = (client: Client) => {
    setEditingClient(client);
    setName(client.name);
    setEmail(client.email);
    setHourlyRate(client.hourlyRate);
    setCurrency(client.currency);
    setErrorMsg('');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Client name is required');
      return;
    }
    if (!email.trim()) {
      setErrorMsg('Client email is required');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg('');
      if (editingClient) {
        await onUpdateClient(editingClient.id, {
          name,
          email,
          hourlyRate: Number(hourlyRate),
          currency,
        });
      } else {
        await onAddClient({
          name,
          email,
          hourlyRate: Number(hourlyRate),
          currency,
        });
      }
      setShowModal(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6" data-testid="clients-view">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Client Management</h1>
          <p className="text-sm text-slate-400">
            Manage your billing clients, hourly rates, and contractual currencies.
          </p>
        </div>
        <button
          onClick={openAddModal}
          data-testid="add-client-button"
          className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-medium text-sm transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add Client</span>
        </button>
      </div>

      {/* Clients Grid */}
      {clients.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-slate-800 rounded-xl bg-slate-900/50">
          <Building className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-slate-300">No clients yet</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto mb-4">
            Add your first client profile to associate with projects and start generating billable invoices.
          </p>
          <button
            onClick={openAddModal}
            className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg"
          >
            Create First Client
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="clients-list">
          {clients.map(client => (
            <div
              key={client.id}
              data-testid={`client-card-${client.id}`}
              className="p-5 rounded-xl border border-slate-800 bg-slate-900/80 hover:border-slate-700 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-violet-400">
                      {client.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3
                        className="font-semibold text-white text-base leading-snug"
                        data-testid="client-name"
                      >
                        {client.name}
                      </h3>
                      <div className="flex items-center text-xs text-slate-400 mt-1">
                        <Mail className="w-3.5 h-3.5 mr-1" />
                        <span data-testid="client-email">{client.email}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-sm">
                  <span className="text-slate-400">Billing Rate:</span>
                  <span className="font-semibold text-emerald-400" data-testid="client-rate">
                    {client.hourlyRate} {client.currency}/hr
                  </span>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-end space-x-2 pt-2">
                <button
                  onClick={() => openEditModal(client)}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                  title="Edit Client"
                  data-testid={`edit-client-${client.id}`}
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDeleteClient(client.id)}
                  className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
                  title="Delete Client"
                  data-testid={`delete-client-${client.id}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Dialog */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <h2 className="text-xl font-bold text-white mb-2">
              {editingClient ? 'Edit Client' : 'Add New Client'}
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              Enter client contact and billing specifications.
            </p>

            {errorMsg && (
              <div className="p-3 mb-4 rounded-lg bg-red-950/80 border border-red-800 text-red-300 text-xs">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Client / Business Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. René & Société <Tech>"
                  required
                  data-testid="client-name-input"
                  className="w-full px-3.5 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="billing@example.com"
                  required
                  data-testid="client-email-input"
                  className="w-full px-3.5 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Hourly Rate
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={hourlyRate}
                    onChange={e => setHourlyRate(Number(e.target.value))}
                    required
                    data-testid="client-rate-input"
                    className="w-full px-3.5 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Currency
                  </label>
                  <select
                    value={currency}
                    onChange={e => setCurrency(e.target.value)}
                    data-testid="client-currency-select"
                    className="w-full px-3.5 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="CAD">CAD ($)</option>
                  </select>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg text-slate-300 hover:bg-slate-800 text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  data-testid="submit-client-btn"
                  className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingClient ? 'Update Client' : 'Create Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

