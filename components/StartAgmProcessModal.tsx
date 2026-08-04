import React, { useState } from 'react';
import { X, Calendar, FileText, AlertCircle } from 'lucide-react';
import { BodyCorporate, SystemSettings } from '../types';

interface Props {
  bc: BodyCorporate;
  systemSettings: SystemSettings;
  fyeYear: number;
  upcomingFYE: Date;
  onConfirm: (agmDate: string, financialsNeededBy: string, notes: string) => Promise<void>;
  onClose: () => void;
}

const StartAgmProcessModal: React.FC<Props> = ({ bc, systemSettings, fyeYear, upcomingFYE, onConfirm, onClose }) => {
  const defaultLeadWeeks = systemSettings.financialStatementLeadTimeWeeks ?? 3;
  const defaultFinancialsDate = new Date(upcomingFYE.getTime() + defaultLeadWeeks * 7 * 24 * 60 * 60 * 1000);

  const [agmDate, setAgmDate] = useState('');
  const [financialsBy, setFinancialsBy] = useState(defaultFinancialsDate.toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!agmDate) return;
    setSaving(true);
    await onConfirm(agmDate, financialsBy, notes);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-md"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-800 dark:text-white">Start AGM Process</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate max-w-[280px]">{bc.name}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40">
            <AlertCircle size={14} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 dark:text-amber-300">
              FYE {bc.financialYearEnd} {fyeYear} — no AGM scheduled. Set a proposed date to kick off the process.
            </p>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
              <Calendar size={12} />
              Proposed AGM Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={agmDate}
              onChange={e => setAgmDate(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-pink-400 transition"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
              <FileText size={12} />
              Financial Statements Needed By
            </label>
            <input
              type="date"
              value={financialsBy}
              onChange={e => setFinancialsBy(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-pink-400 transition"
            />
            <p className="text-[10px] text-slate-400">
              Default: FYE + {defaultLeadWeeks} week{defaultLeadWeeks !== 1 ? 's' : ''} (set in Admin Panel)
            </p>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              Notes for Accounts (optional)
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              placeholder="Any special requirements or context for the accounts team..."
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-pink-400 resize-none transition placeholder:text-slate-300 dark:placeholder:text-slate-600"
            />
          </div>
        </div>

        <div className="flex gap-2 px-6 py-4 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm font-semibold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!agmDate || saving}
            className="flex-1 px-4 py-2 text-sm font-bold rounded-lg bg-pink-600 text-white hover:bg-pink-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? 'Saving…' : 'Confirm & Notify Accounts'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StartAgmProcessModal;
