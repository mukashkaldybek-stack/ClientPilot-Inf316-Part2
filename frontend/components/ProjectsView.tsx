'use client';

import React, { useState } from 'react';
import { Plus, Trash2, Edit2, FolderKanban, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { Project, Client } from '../lib/types';

interface ProjectsViewProps {
  projects: Project[];
  clients: Client[];
  onAddProject: (data: Omit<Project, 'id' | 'createdAt'>) => Promise<void>;
  onDeleteProject: (id: string) => Promise<void>;
  onUpdateProject: (id: string, data: Partial<Project>) => Promise<void>;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({
  projects,
  clients,
  onAddProject,
  onDeleteProject,
  onUpdateProject,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const [name, setName] = useState('');
  const [clientId, setClientId] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'active' | 'completed' | 'on_hold'>('active');
  const [budgetHours, setBudgetHours] = useState(40);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const openAddModal = () => {
    setEditingProject(null);
    setName('');
    setClientId(clients[0]?.id || '');
    setDescription('');
    setStatus('active');
    setBudgetHours(40);
    setErrorMsg('');
    setShowModal(true);
  };

  const openEditModal = (project: Project) => {
    setEditingProject(project);
    setName(project.name);
    setClientId(project.clientId);
    setDescription(project.description || '');
    setStatus(project.status);
    setBudgetHours(project.budgetHours || 40);
    setErrorMsg('');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Project name is required');
      return;
    }
    if (!clientId) {
      setErrorMsg('Please select a client');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg('');
      if (editingProject) {
        await onUpdateProject(editingProject.id, {
          name,
          clientId,
          description,
          status,
          budgetHours: Number(budgetHours),
        });
      } else {
        await onAddProject({
          name,
          clientId,
          description,
          status,
          budgetHours: Number(budgetHours),
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
    <div className="space-y-6" data-testid="projects-view">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Project Management</h1>
          <p className="text-sm text-slate-400">
            Organize freelance contracts, scope budgets, and track project deliverables.
          </p>
        </div>
        <button
          onClick={openAddModal}
          data-testid="add-project-button"
          disabled={clients.length === 0}
          className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-medium text-sm transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>New Project</span>
        </button>
      </div>

      {clients.length === 0 && (
        <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-800 text-amber-300 text-sm flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>You must create at least one Client before creating a Project.</span>
        </div>
      )}

      {/* Projects List */}
      {projects.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-slate-800 rounded-xl bg-slate-900/50">
          <FolderKanban className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-slate-300">No projects created</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto mb-4">
            Create a project linked to a client to start tracking billable time.
          </p>
          {clients.length > 0 && (
            <button
              onClick={openAddModal}
              className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg"
            >
              Create First Project
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="projects-list">
          {projects.map(project => {
            const client = clients.find(c => c.id === project.clientId);
            const clientName = project.clientName || client?.name || 'Unknown Client';

            return (
              <div
                key={project.id}
                data-testid={`project-card-${project.id}`}
                className="p-5 rounded-xl border border-slate-800 bg-slate-900/80 hover:border-slate-700 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs uppercase tracking-wider font-semibold text-violet-400">
                        {clientName}
                      </span>
                      <h3
                        className="font-bold text-white text-lg mt-0.5"
                        data-testid="project-name"
                      >
                        {project.name}
                      </h3>
                    </div>
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${
                        project.status === 'active'
                          ? 'bg-emerald-950/70 text-emerald-300 border-emerald-800'
                          : project.status === 'completed'
                          ? 'bg-blue-950/70 text-blue-300 border-blue-800'
                          : 'bg-amber-950/70 text-amber-300 border-amber-800'
                      }`}
                      data-testid="project-status"
                    >
                      {project.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 mt-2 line-clamp-2">
                    {project.description || 'No description provided.'}
                  </p>

                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center">
                      <Clock className="w-3.5 h-3.5 mr-1" />
                      Budget: {project.budgetHours || 0} hrs
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-end space-x-2 pt-2">
                  <button
                    onClick={() => openEditModal(project)}
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                    title="Edit Project"
                    data-testid={`edit-project-${project.id}`}
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDeleteProject(project.id)}
                    className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
                    title="Delete Project"
                    data-testid={`delete-project-${project.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Dialog */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <h2 className="text-xl font-bold text-white mb-2">
              {editingProject ? 'Edit Project' : 'New Project'}
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              Configure project scope and assign to a client.
            </p>

            {errorMsg && (
              <div className="p-3 mb-4 rounded-lg bg-red-950/80 border border-red-800 text-red-300 text-xs">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Project Title
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Website Redesign"
                  required
                  data-testid="project-name-input"
                  className="w-full px-3.5 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Select Client
                </label>
                <select
                  value={clientId}
                  onChange={e => setClientId(e.target.value)}
                  required
                  data-testid="project-client-select"
                  className="w-full px-3.5 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm"
                >
                  <option value="" disabled>-- Select a client --</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.currency})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={2}
                  placeholder="Scope deliverables and project notes..."
                  data-testid="project-desc-input"
                  className="w-full px-3.5 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Budget Hours
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={budgetHours}
                    onChange={e => setBudgetHours(Number(e.target.value))}
                    data-testid="project-budget-input"
                    className="w-full px-3.5 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value as any)}
                    data-testid="project-status-select"
                    className="w-full px-3.5 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm"
                  >
                    <option value="active">Active</option>
                    <option value="on_hold">On Hold</option>
                    <option value="completed">Completed</option>
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
                  data-testid="submit-project-btn"
                  className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingProject ? 'Update Project' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

