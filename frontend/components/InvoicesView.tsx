'use client';

import React, { useState } from 'react';
import { Plus, Receipt, Download, Check, Eye, AlertCircle, FileText, Printer, Building } from 'lucide-react';
import { Invoice, Client, Project, TimeEntry } from '../lib/types';

interface InvoicesViewProps {
  invoices: Invoice[];
  clients: Client[];
  onGenerateInvoice: (clientId: string, taxRate: number, notes: string) => Promise<Invoice>;
  onUpdateStatus: (id: string, status: Invoice['status']) => Promise<void>;
}

export const InvoicesView: React.FC<InvoicesViewProps> = ({
  invoices,
  clients,
  onGenerateInvoice,
  onUpdateStatus,
}) => {
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const [selectedClientId, setSelectedClientId] = useState('');
  const [taxRatePercent, setTaxRatePercent] = useState<number>(10);
  const [notes, setNotes] = useState('Payment due within 14 calendar days.');
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const openGenerateModal = () => {
    setSelectedClientId(clients[0]?.id || '');
    setTaxRatePercent(10);
    setNotes('Payment due within 14 calendar days.');
    setErrorMsg('');
    setShowGenerateModal(true);
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId) {
      setErrorMsg('Please select a client');
      return;
    }

    try {
      setIsGenerating(true);
      setErrorMsg('');
      const newInv = await onGenerateInvoice(selectedClientId, taxRatePercent / 100, notes);
      setShowGenerateModal(false);
      setSelectedInvoice(newInv);
    } catch (err: any) {
      setErrorMsg(err.message || 'Invoice generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6" data-testid="invoices-view">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Invoice Management</h1>
          <p className="text-sm text-slate-400">
            Generate itemized invoices from tracked billable hours and export for payment.
          </p>
        </div>
        <button
          onClick={openGenerateModal}
          disabled={clients.length === 0}
          data-testid="generate-invoice-btn"
          className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-medium text-sm transition-colors shadow-sm"
        >
          <Receipt className="w-4 h-4" />
          <span>Generate Invoice</span>
        </button>
      </div>

      {clients.length === 0 && (
        <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-800 text-amber-300 text-sm flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>You must create a Client before generating an invoice.</span>
        </div>
      )}

      {/* Invoices List */}
      {invoices.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-slate-800 rounded-xl bg-slate-900/50">
          <Receipt className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-slate-300">No invoices generated</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto mb-4">
            Convert your tracked billable hours into professional invoices in one click.
          </p>
          {clients.length > 0 && (
            <button
              onClick={openGenerateModal}
              className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg"
            >
              Generate First Invoice
            </button>
          )}
        </div>
      ) : (
        <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl" data-testid="invoices-list">
          <div className="divide-y divide-slate-800/80 overflow-x-auto">
            {invoices.map(inv => (
              <div
                key={inv.id}
                data-testid={`invoice-row-${inv.id}`}
                className="px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 hover:bg-slate-800/40 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-xl bg-violet-950/80 border border-violet-800 flex items-center justify-center text-violet-400 font-bold">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-white text-base" data-testid="invoice-number">
                        {inv.invoiceNumber}
                      </span>
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${
                          inv.status === 'paid'
                            ? 'bg-emerald-950/70 text-emerald-300 border-emerald-800'
                            : inv.status === 'sent'
                            ? 'bg-blue-950/70 text-blue-300 border-blue-800'
                            : 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}
                        data-testid="invoice-status"
                      >
                        {inv.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mt-1 flex items-center space-x-3">
                      <span data-testid="invoice-client-name">{inv.clientName}</span>
                      <span>•</span>
                      <span>Issued: {inv.issueDate}</span>
                      <span>•</span>
                      <span>Due: {inv.dueDate}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end space-x-6">
                  <div className="text-right">
                    <div className="text-lg font-extrabold text-emerald-400" data-testid="invoice-total">
                      ${inv.totalAmount.toFixed(2)} {inv.currency || 'USD'}
                    </div>
                    <div className="text-xs text-slate-400">
                      Subtotal: ${inv.subtotal.toFixed(2)} + Tax ({(inv.taxRate * 100).toFixed(0)}%)
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setSelectedInvoice(inv)}
                      data-testid={`view-invoice-${inv.id}`}
                      className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                      title="View Invoice"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    {inv.status !== 'paid' && (
                      <button
                        onClick={() => onUpdateStatus(inv.id, 'paid')}
                        data-testid={`mark-paid-${inv.id}`}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-800 text-xs font-semibold transition-colors flex items-center space-x-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Mark Paid</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Generate Invoice Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <h2 className="text-xl font-bold text-white mb-2">Generate Invoice</h2>
            <p className="text-xs text-slate-400 mb-4">
              Pulls all unbilled time entries for the selected client and creates an itemized invoice.
            </p>

            {errorMsg && (
              <div className="p-3 mb-4 rounded-lg bg-red-950/80 border border-red-800 text-red-300 text-xs">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Select Client
                </label>
                <select
                  value={selectedClientId}
                  onChange={e => setSelectedClientId(e.target.value)}
                  required
                  data-testid="invoice-client-select"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  <option value="" disabled>-- Choose a Client --</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.hourlyRate} {c.currency}/hr)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Tax Rate (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={taxRatePercent}
                  onChange={e => setTaxRatePercent(Number(e.target.value))}
                  data-testid="invoice-tax-input"
                  className="w-full px-3.5 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Payment Terms / Notes
                </label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={2}
                  data-testid="invoice-notes-input"
                  className="w-full px-3.5 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 placeholder-slate-500"
                />
              </div>

              <div className="mt-6 flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowGenerateModal(false)}
                  className="px-4 py-2 rounded-lg text-slate-300 hover:bg-slate-800 text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isGenerating}
                  data-testid="submit-generate-invoice"
                  className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {isGenerating ? 'Generating...' : 'Create Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice View / Print Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
          <div
            className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-8 shadow-2xl animate-in fade-in zoom-in-95 my-8"
            data-testid="invoice-modal-content"
          >
            {/* Invoice Header */}
            <div className="flex justify-between items-start pb-6 border-b border-slate-800">
              <div>
                <div className="text-2xl font-black bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
                  ClientPilot
                </div>
                <div className="text-xs text-slate-400 mt-1">Autonomous Micro-SaaS Billing</div>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-white" data-testid="modal-invoice-number">
                  {selectedInvoice.invoiceNumber}
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  Issue Date: {selectedInvoice.issueDate}
                </div>
                <div className="text-xs text-slate-400">
                  Due Date: {selectedInvoice.dueDate}
                </div>
              </div>
            </div>

            {/* Bill To */}
            <div className="py-6 border-b border-slate-800">
              <span className="text-xs uppercase font-semibold text-slate-400 tracking-wider">
                Billed To:
              </span>
              <h3 className="text-lg font-bold text-white mt-1" data-testid="modal-client-name">
                {selectedInvoice.clientName}
              </h3>
              {selectedInvoice.clientEmail && (
                <p className="text-xs text-slate-400">{selectedInvoice.clientEmail}</p>
              )}
            </div>

            {/* Line Items Table */}
            <div className="py-6 border-b border-slate-800">
              <table className="w-full text-left text-sm" data-testid="modal-items-table">
                <thead>
                  <tr className="text-xs uppercase text-slate-400 border-b border-slate-800">
                    <th className="pb-3 font-semibold">Description</th>
                    <th className="pb-3 text-center font-semibold">Hours</th>
                    <th className="pb-3 text-right font-semibold">Rate</th>
                    <th className="pb-3 text-right font-semibold">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {selectedInvoice.items.map(item => (
                    <tr key={item.id} className="text-slate-300">
                      <td className="py-3 font-medium text-white">{item.description}</td>
                      <td className="py-3 text-center">{item.hours.toFixed(2)}</td>
                      <td className="py-3 text-right">${item.rate.toFixed(2)}</td>
                      <td className="py-3 text-right font-semibold text-emerald-400">
                        ${item.amount.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Total Summary */}
            <div className="py-6 flex justify-between items-start border-b border-slate-800">
              <div className="max-w-xs text-xs text-slate-400">
                <span className="font-semibold text-slate-300 block mb-1">Notes:</span>
                {selectedInvoice.notes || 'Payment due on receipt.'}
              </div>

              <div className="space-y-1.5 text-right text-sm">
                <div className="flex justify-between space-x-8 text-slate-400">
                  <span>Subtotal:</span>
                  <span>${selectedInvoice.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between space-x-8 text-slate-400">
                  <span>Tax ({(selectedInvoice.taxRate * 100).toFixed(0)}%):</span>
                  <span>${(selectedInvoice.subtotal * selectedInvoice.taxRate).toFixed(2)}</span>
                </div>
                <div className="flex justify-between space-x-8 text-lg font-bold text-white pt-2 border-t border-slate-800">
                  <span>Total Due:</span>
                  <span className="text-emerald-400" data-testid="modal-total-amount">
                    ${selectedInvoice.totalAmount.toFixed(2)} {selectedInvoice.currency || 'USD'}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setSelectedInvoice(null)}
                data-testid="close-invoice-modal-btn"
                className="px-4 py-2 rounded-lg text-slate-300 hover:bg-slate-800 text-sm font-medium transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium transition-colors shadow-sm"
              >
                <Printer className="w-4 h-4" />
                <span>Print Invoice</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
