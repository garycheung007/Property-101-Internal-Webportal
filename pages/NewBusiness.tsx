
import React, { useState, useMemo, useCallback } from 'react';
import {
  ArrowLeft, Plus, Search, ChevronDown, ChevronRight, CheckCircle2,
  AlertCircle, Clock, Building2, Users, Calendar, DollarSign,
  FileText, Edit2, X, Save, MessageSquare, TrendingUp, Phone, Mail,
  CheckSquare, RotateCcw
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import {
  BodyCorporate, PipelineStage, OnboardingTaskStatus,
  OnboardingTaskProgress, OnboardingNote, OnboardingChecklistSection
} from '../types';
import { DEFAULT_ONBOARDING_CHECKLIST } from '../constants/defaults';

// ─── Stage helpers ────────────────────────────────────────────────────────────
const STAGE_ORDER: PipelineStage[] = ['Lead', 'Appointed', 'Onboarding', 'Ready for Review', 'Live', 'On Hold', 'Lost'];

const stageStyle = (stage: PipelineStage) => {
  const map: Record<PipelineStage, string> = {
    'Lead':            'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
    'Appointed':       'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
    'Onboarding':      'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
    'Ready for Review':'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
    'Live':            'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
    'On Hold':         'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
    'Lost':            'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  };
  return map[stage];
};

const statusStyle = (status: OnboardingTaskStatus) => {
  const map: Record<OnboardingTaskStatus, string> = {
    'Not Started':      'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
    'In Progress':      'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    'Waiting External': 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
    'Blocked':          'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
    'Completed':        'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    'N/A':              'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500',
  };
  return map[status];
};

const STATUS_CYCLE: OnboardingTaskStatus[] = ['Not Started', 'In Progress', 'Waiting External', 'Blocked', 'Completed', 'N/A'];

const NOTE_CATEGORIES = ['General', 'Insurance', 'Finance', 'Legal', 'Developer', 'Start Date', 'Contractors', 'USM'];

// ─── Checklist helpers ────────────────────────────────────────────────────────
function getActiveSections(complex: BodyCorporate, template: OnboardingChecklistSection[]): OnboardingChecklistSection[] {
  const isIsoc = complex.type === 'Incorporated Society';
  const isBC   = complex.type === 'Body Corporate';
  return template
    .map(section => ({
      ...section,
      tasks: section.tasks.filter(t => {
        if (t.isISOCOnly && !isIsoc) return false;
        if (t.isBCOnly   && !isBC)   return false;
        return true;
      }),
    }))
    .filter(section => {
      if (section.id === 'isoc-requirements' && !isIsoc) return false;
      return section.tasks.length > 0;
    });
}

function getTaskStatus(complex: BodyCorporate, taskId: string): OnboardingTaskStatus {
  return complex.onboardingProgress?.[taskId]?.status ?? 'Not Started';
}

function getSectionProgress(complex: BodyCorporate, section: OnboardingChecklistSection) {
  const done = section.tasks.filter(t => getTaskStatus(complex, t.id) === 'Completed').length;
  return { done, total: section.tasks.length };
}

function getGoLiveReadiness(complex: BodyCorporate, sections: OnboardingChecklistSection[]) {
  const mandatoryTasks = sections.flatMap(s => s.tasks.filter(t => t.isMandatory));
  const completedMandatory = mandatoryTasks.filter(t => getTaskStatus(complex, t.id) === 'Completed');
  const blocking: string[] = [];

  if (!complex.confirmedStartDate) blocking.push('Confirmed start date not entered');
  if (!complex.managementAgreementStatus || complex.managementAgreementStatus !== 'Signed')
    blocking.push('Management Agreement not signed');
  if (!complex.bcAccountNumber) blocking.push('Bank account number not entered');

  mandatoryTasks.forEach(t => {
    if (getTaskStatus(complex, t.id) !== 'Completed') {
      // no need to enumerate — counted below
    }
  });

  const outstandingMandatory = mandatoryTasks.length - completedMandatory.length;
  if (outstandingMandatory > 0) blocking.push(`${outstandingMandatory} mandatory task${outstandingMandatory > 1 ? 's' : ''} outstanding`);

  return {
    isReady: blocking.length === 0,
    blocking,
    completedMandatory: completedMandatory.length,
    totalMandatory: mandatoryTasks.length,
  };
}

function getOverallProgress(complex: BodyCorporate, sections: OnboardingChecklistSection[]) {
  const allTasks = sections.flatMap(s => s.tasks);
  const done = allTasks.filter(t => getTaskStatus(complex, t.id) === 'Completed').length;
  return { done, total: allTasks.length, pct: allTasks.length ? Math.round((done / allTasks.length) * 100) : 0 };
}

// ─── Sub-components ───────────────────────────────────────────────────────────
const StageBadge: React.FC<{ stage: PipelineStage; size?: 'sm' | 'md' }> = ({ stage, size = 'sm' }) => (
  <span className={`inline-flex items-center rounded font-bold uppercase tracking-wide ${stageStyle(stage)} ${size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-1'}`}>
    {stage}
  </span>
);

const StatusChip: React.FC<{ status: OnboardingTaskStatus; onClick?: () => void }> = ({ status, onClick }) => (
  <button
    onClick={onClick}
    title={onClick ? 'Click to cycle status' : undefined}
    className={`inline-flex items-center rounded px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap ${statusStyle(status)} ${onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : 'cursor-default'}`}
  >
    {status}
  </button>
);

// ─── Add Lead Modal ───────────────────────────────────────────────────────────
interface AddLeadModalProps { onClose: () => void; onCreated: (id: string) => void; }
const AddLeadModal: React.FC<AddLeadModalProps> = ({ onClose, onCreated }) => {
  const { addComplex } = useData();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '', type: 'Incorporated Society' as 'Body Corporate' | 'Incorporated Society',
    address: '', units: '', bcNumber: '',
    developerCompany: '', developerContactName: '', developerContactEmail: '', developerContactPhone: '',
    anticipatedStartDate: '', managerName: '',
    onboardingType: 'New Development' as 'New Development' | 'Takeover',
  });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleCreate = async () => {
    if (!form.name || !form.address) return;
    setSaving(true);
    const id = `bc_${Date.now()}`;
    const newComplex: BodyCorporate = {
      id,
      name: form.name,
      type: form.type,
      address: form.address,
      units: parseInt(form.units) || 0,
      bcNumber: form.bcNumber || '',
      managerName: form.managerName || user?.name || '',
      managementFee: 0,
      financialYearEnd: '',
      insuranceExpiry: '',
      meetings: [],
      pipelineStage: 'Lead',
      onboardingType: form.onboardingType,
      developerCompany: form.developerCompany,
      developerContactName: form.developerContactName,
      developerContactEmail: form.developerContactEmail,
      developerContactPhone: form.developerContactPhone,
      anticipatedStartDate: form.anticipatedStartDate,
    };
    await addComplex(newComplex);
    setSaving(false);
    onCreated(id);
  };

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-700">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">New Lead</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Step {step} of 2</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X size={20} /></button>
        </div>

        <div className="p-5 space-y-4">
          {step === 1 && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Complex Name *</label>
                  <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. 48 Tennessee Ave" className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-pink-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Type *</label>
                  <select value={form.type} onChange={e => set('type', e.target.value)} className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-pink-500">
                    <option>Incorporated Society</option>
                    <option>Body Corporate</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Onboarding Type</label>
                  <select value={form.onboardingType} onChange={e => set('onboardingType', e.target.value)} className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-pink-500">
                    <option>New Development</option>
                    <option>Takeover</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Address *</label>
                  <input value={form.address} onChange={e => set('address', e.target.value)} placeholder="Street address" className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-pink-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Units</label>
                  <input type="number" value={form.units} onChange={e => set('units', e.target.value)} placeholder="0" className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-pink-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">BC / ISOC Number</label>
                  <input value={form.bcNumber} onChange={e => set('bcNumber', e.target.value)} placeholder="Leave blank if new" className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-pink-500" />
                </div>
              </div>
            </>
          )}
          {step === 2 && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Developer / Owner Company</label>
                  <input value={form.developerCompany} onChange={e => set('developerCompany', e.target.value)} placeholder="e.g. Nest Living" className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-pink-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Contact Name</label>
                  <input value={form.developerContactName} onChange={e => set('developerContactName', e.target.value)} placeholder="Full name" className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-pink-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Contact Phone</label>
                  <input value={form.developerContactPhone} onChange={e => set('developerContactPhone', e.target.value)} placeholder="021 xxx xxxx" className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-pink-500" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Contact Email</label>
                  <input type="email" value={form.developerContactEmail} onChange={e => set('developerContactEmail', e.target.value)} placeholder="email@example.com" className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-pink-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Anticipated Start Date</label>
                  <input type="date" value={form.anticipatedStartDate} onChange={e => set('anticipatedStartDate', e.target.value)} className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-pink-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Account Manager</label>
                  <input value={form.managerName} onChange={e => set('managerName', e.target.value)} placeholder={user?.name || ''} className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-pink-500" />
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center justify-between p-5 border-t border-slate-200 dark:border-slate-700 gap-3">
          <button onClick={step === 1 ? onClose : () => setStep(1)} className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            {step === 1 ? 'Cancel' : '← Back'}
          </button>
          {step === 1 ? (
            <button onClick={() => setStep(2)} disabled={!form.name || !form.address} className="px-4 py-2 rounded-lg bg-pink-600 text-white text-sm font-semibold disabled:opacity-50 hover:bg-pink-700 transition-colors">
              Next →
            </button>
          ) : (
            <button onClick={handleCreate} disabled={saving} className="px-4 py-2 rounded-lg bg-pink-600 text-white text-sm font-semibold disabled:opacity-50 hover:bg-pink-700 transition-colors">
              {saving ? 'Creating…' : 'Create Lead'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Edit Overview Modal ──────────────────────────────────────────────────────
interface EditOverviewModalProps { complex: BodyCorporate; onClose: () => void; }
const EditOverviewModal: React.FC<EditOverviewModalProps> = ({ complex, onClose }) => {
  const { updateComplex } = useData();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    developerCompany: complex.developerCompany || '',
    developerContactName: complex.developerContactName || '',
    developerContactEmail: complex.developerContactEmail || '',
    developerContactPhone: complex.developerContactPhone || '',
    proposalSubmittedDate: complex.proposalSubmittedDate || '',
    adminFeeExclGst: complex.adminFeeExclGst?.toString() || '',
    letterOfAppointmentDate: complex.letterOfAppointmentDate || '',
    managementAgreementStatus: complex.managementAgreementStatus || 'Not Started',
    openingResolutionsStatus: complex.openingResolutionsStatus || 'Not Started',
    anticipatedStartDate: complex.anticipatedStartDate || '',
    confirmedStartDate: complex.confirmedStartDate || '',
    bcAccountNumber: complex.bcAccountNumber || '',
    bcAccountName: complex.bcAccountName || '',
    insuranceBroker: complex.insuranceBroker || '',
    managementStartDate: complex.managementStartDate || '',
    financialYearEnd: complex.financialYearEnd || '',
    isGstRegistered: complex.isGstRegistered ? 'Yes' : 'No',
    hasBwof: complex.hasBwof ? 'Yes' : 'No',
    managerName: complex.managerName || '',
  });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    await updateComplex({
      ...complex,
      developerCompany: form.developerCompany,
      developerContactName: form.developerContactName,
      developerContactEmail: form.developerContactEmail,
      developerContactPhone: form.developerContactPhone,
      proposalSubmittedDate: form.proposalSubmittedDate,
      adminFeeExclGst: form.adminFeeExclGst ? parseFloat(form.adminFeeExclGst) : undefined,
      letterOfAppointmentDate: form.letterOfAppointmentDate,
      managementAgreementStatus: form.managementAgreementStatus as BodyCorporate['managementAgreementStatus'],
      openingResolutionsStatus: form.openingResolutionsStatus as BodyCorporate['openingResolutionsStatus'],
      anticipatedStartDate: form.anticipatedStartDate,
      confirmedStartDate: form.confirmedStartDate,
      bcAccountNumber: form.bcAccountNumber,
      bcAccountName: form.bcAccountName,
      insuranceBroker: form.insuranceBroker,
      managementStartDate: form.managementStartDate,
      financialYearEnd: form.financialYearEnd,
      isGstRegistered: form.isGstRegistered === 'Yes',
      hasBwof: form.hasBwof === 'Yes',
      managerName: form.managerName,
    });
    setSaving(false);
    onClose();
  };

  const LabeledInput: React.FC<{ label: string; value: string; onChange: (v: string) => void; type?: string; }> = ({ label, value, onChange, type = 'text' }) => (
    <div>
      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-pink-500" />
    </div>
  );

  const LabeledSelect: React.FC<{ label: string; value: string; onChange: (v: string) => void; options: string[]; }> = ({ label, value, onChange, options }) => (
    <div>
      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)} className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-pink-500">
        {options.map(o => <option key={o}>{o}</option>)}
      </select>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Edit Overview — {complex.name}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X size={20} /></button>
        </div>
        <div className="p-5 overflow-y-auto space-y-5">
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Developer & Contacts</h3>
            <div className="grid grid-cols-2 gap-3">
              <LabeledInput label="Developer Company" value={form.developerCompany} onChange={v => set('developerCompany', v)} />
              <LabeledInput label="Contact Name" value={form.developerContactName} onChange={v => set('developerContactName', v)} />
              <LabeledInput label="Contact Email" value={form.developerContactEmail} onChange={v => set('developerContactEmail', v)} />
              <LabeledInput label="Contact Phone" value={form.developerContactPhone} onChange={v => set('developerContactPhone', v)} />
              <LabeledInput label="Account Manager" value={form.managerName} onChange={v => set('managerName', v)} />
            </div>
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">New Business Status</h3>
            <div className="grid grid-cols-2 gap-3">
              <LabeledInput label="Proposal Submitted Date" value={form.proposalSubmittedDate} onChange={v => set('proposalSubmittedDate', v)} type="date" />
              <LabeledInput label="Admin Fee (excl GST)" value={form.adminFeeExclGst} onChange={v => set('adminFeeExclGst', v)} type="number" />
              <LabeledInput label="Letter of Appointment Date" value={form.letterOfAppointmentDate} onChange={v => set('letterOfAppointmentDate', v)} type="date" />
              <LabeledSelect label="Management Agreement Status" value={form.managementAgreementStatus} onChange={v => set('managementAgreementStatus', v)} options={['Not Started', 'Draft', 'Sent', 'Signed']} />
              <LabeledSelect label="Opening Resolutions Status" value={form.openingResolutionsStatus} onChange={v => set('openingResolutionsStatus', v)} options={['Not Started', 'Draft', 'Passed']} />
              <LabeledInput label="Insurance Broker" value={form.insuranceBroker} onChange={v => set('insuranceBroker', v)} />
            </div>
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Key Dates</h3>
            <div className="grid grid-cols-2 gap-3">
              <LabeledInput label="Anticipated Start Date" value={form.anticipatedStartDate} onChange={v => set('anticipatedStartDate', v)} type="date" />
              <LabeledInput label="Confirmed Start Date" value={form.confirmedStartDate} onChange={v => set('confirmedStartDate', v)} type="date" />
              <LabeledInput label="Management Start Date" value={form.managementStartDate} onChange={v => set('managementStartDate', v)} type="date" />
              <LabeledInput label="Financial Year End (e.g. 31 March)" value={form.financialYearEnd} onChange={v => set('financialYearEnd', v)} />
            </div>
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Banking</h3>
            <div className="grid grid-cols-2 gap-3">
              <LabeledInput label="Bank Account Name" value={form.bcAccountName} onChange={v => set('bcAccountName', v)} />
              <LabeledInput label="Bank Account Number" value={form.bcAccountNumber} onChange={v => set('bcAccountNumber', v)} />
            </div>
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Other</h3>
            <div className="grid grid-cols-2 gap-3">
              <LabeledSelect label="GST Registered" value={form.isGstRegistered} onChange={v => set('isGstRegistered', v)} options={['Yes', 'No']} />
              <LabeledSelect label="BWOF Required" value={form.hasBwof} onChange={v => set('hasBwof', v)} options={['Yes', 'No']} />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 p-5 border-t border-slate-200 dark:border-slate-700 flex-shrink-0">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="px-4 py-2 rounded-lg bg-pink-600 text-white text-sm font-semibold disabled:opacity-50 hover:bg-pink-700 transition-colors flex items-center gap-2">
            <Save size={14} />{saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Change Stage Modal ───────────────────────────────────────────────────────
interface ChangeStageModalProps { complex: BodyCorporate; onClose: () => void; onBack: () => void; }
const ChangeStageModal: React.FC<ChangeStageModalProps> = ({ complex, onClose, onBack }) => {
  const { updateComplex } = useData();
  const [saving, setSaving] = useState(false);

  const handleChange = async (stage: PipelineStage) => {
    setSaving(true);
    await updateComplex({ ...complex, pipelineStage: stage });
    setSaving(false);
    if (stage === 'Live') onBack(); // removes from pipeline view
    else onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Change Stage</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>
        <div className="p-4 space-y-2">
          {STAGE_ORDER.map(stage => (
            <button
              key={stage}
              disabled={saving || stage === complex.pipelineStage}
              onClick={() => handleChange(stage)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-colors disabled:opacity-40 ${stage === complex.pipelineStage ? 'bg-slate-100 dark:bg-slate-800 cursor-default' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}
            >
              <StageBadge stage={stage} size="md" />
              {stage === complex.pipelineStage && <span className="text-xs text-slate-400">Current</span>}
              {stage === 'Live' && stage !== complex.pipelineStage && <span className="text-xs text-emerald-600 font-semibold">→ Moves to Complexes</span>}
            </button>
          ))}
        </div>
        <div className="p-4 border-t border-slate-200 dark:border-slate-700">
          <button onClick={onClose} className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Cancel</button>
        </div>
      </div>
    </div>
  );
};

// ─── Overview Tab ─────────────────────────────────────────────────────────────
const OverviewTab: React.FC<{ complex: BodyCorporate; sections: OnboardingChecklistSection[] }> = ({ complex, sections }) => {
  const readiness = getGoLiveReadiness(complex, sections);
  const progress  = getOverallProgress(complex, sections);

  const fmt = (d?: string) => {
    if (!d) return null;
    try { return new Date(d).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric' }); } catch { return d; }
  };

  const Field: React.FC<{ label: string; value?: string | null; status?: 'ok' | 'warn' | 'err' | 'na' }> = ({ label, value, status }) => {
    const cls = {
      ok:   'text-emerald-700 dark:text-emerald-400',
      warn: 'text-amber-700 dark:text-amber-400',
      err:  'text-red-700 dark:text-red-400',
      na:   'text-slate-400 dark:text-slate-500 italic',
    }[status || 'na'];
    return (
      <div className="flex justify-between items-start gap-4 py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
        <span className="text-xs text-slate-500 dark:text-slate-400 flex-shrink-0">{label}</span>
        <span className={`text-xs font-medium text-right ${value ? (status ? cls : 'text-slate-800 dark:text-slate-200') : cls}`}>{value || '—'}</span>
      </div>
    );
  };

  const sectionBarColor = (done: number, total: number) => {
    if (total === 0) return 'bg-slate-200 dark:bg-slate-700';
    const pct = done / total;
    if (pct === 0)   return 'bg-slate-300 dark:bg-slate-600';
    if (pct < 0.5)   return 'bg-red-400';
    if (pct < 1)     return 'bg-amber-400';
    return 'bg-emerald-500';
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Complex Details */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Complex Details</h3>
          <Field label="Type" value={complex.type} />
          <Field label="Units" value={complex.units?.toString()} />
          <Field label="BC / ISOC Number" value={complex.bcNumber || null} status={complex.bcNumber ? undefined : 'na'} />
          <Field label="Onboarding Type" value={complex.onboardingType} />
          <Field label="GST Registered" value={complex.isGstRegistered === true ? 'Yes' : complex.isGstRegistered === false ? 'No' : null} status={complex.isGstRegistered == null ? 'na' : undefined} />
          <Field label="BWOF Required" value={complex.hasBwof === true ? 'Yes' : complex.hasBwof === false ? 'No' : null} status={complex.hasBwof == null ? 'na' : undefined} />
        </div>

        {/* New Business Status */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">New Business Status</h3>
          <Field label="Proposal Submitted" value={complex.proposalSubmittedDate ? fmt(complex.proposalSubmittedDate) : null} status={complex.proposalSubmittedDate ? 'ok' : 'na'} />
          <Field label="Admin Fee (excl GST)" value={complex.adminFeeExclGst ? `$${complex.adminFeeExclGst.toLocaleString()}` : null} status={complex.adminFeeExclGst ? undefined : 'na'} />
          <Field label="Letter of Appointment" value={complex.letterOfAppointmentDate ? fmt(complex.letterOfAppointmentDate) : null} status={complex.letterOfAppointmentDate ? 'ok' : 'na'} />
          <Field label="Management Agreement" value={complex.managementAgreementStatus || null} status={complex.managementAgreementStatus === 'Signed' ? 'ok' : complex.managementAgreementStatus ? 'warn' : 'na'} />
          <Field label="Opening Resolutions" value={complex.openingResolutionsStatus || null} status={complex.openingResolutionsStatus === 'Passed' ? 'ok' : complex.openingResolutionsStatus ? 'warn' : 'na'} />
          <Field label="Insurance Broker" value={complex.insuranceBroker || null} status={complex.insuranceBroker ? undefined : 'na'} />
          <Field label="Bank Account" value={complex.bcAccountNumber || null} status={complex.bcAccountNumber ? 'ok' : 'na'} />
        </div>

        {/* Contacts */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Contacts</h3>
          <Field label="Developer" value={complex.developerCompany || null} status={complex.developerCompany ? undefined : 'na'} />
          <Field label="Primary Contact" value={complex.developerContactName || null} status={complex.developerContactName ? undefined : 'na'} />
          <Field label="Email" value={complex.developerContactEmail || null} status={complex.developerContactEmail ? undefined : 'na'} />
          <Field label="Phone" value={complex.developerContactPhone || null} status={complex.developerContactPhone ? undefined : 'na'} />
          <Field label="Account Manager" value={complex.managerName || null} status={complex.managerName ? undefined : 'na'} />
        </div>

        {/* Key Dates */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Key Dates</h3>
          <Field label="Anticipated Start" value={complex.anticipatedStartDate ? fmt(complex.anticipatedStartDate) : null} status={complex.anticipatedStartDate ? 'warn' : 'na'} />
          <Field label="Confirmed Start" value={complex.confirmedStartDate ? fmt(complex.confirmedStartDate) : null} status={complex.confirmedStartDate ? 'ok' : 'err'} />
          <Field label="Financial Year End" value={complex.financialYearEnd || null} status={complex.financialYearEnd ? undefined : 'na'} />
          <Field label="Management Start" value={complex.managementStartDate ? fmt(complex.managementStartDate) : null} status={complex.managementStartDate ? 'ok' : 'na'} />
        </div>
      </div>

      {/* Go-Live Readiness */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Go-Live Readiness</h3>
          <span className={`text-xs font-bold px-3 py-1 rounded-full ${readiness.isReady ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'}`}>
            {readiness.isReady ? '✓ Ready to go live' : '✕ Not ready to go live'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
          {sections.map(section => {
            const { done, total } = getSectionProgress(complex, section);
            const pct = total ? Math.round((done / total) * 100) : 0;
            return (
              <div key={section.id}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300 leading-tight">{section.label}</span>
                  <span className="text-[10px] text-slate-400 ml-1 flex-shrink-0">{done}/{total}</span>
                </div>
                <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${sectionBarColor(done, total)}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 leading-relaxed space-y-1">
          <div className="font-medium text-slate-800 dark:text-slate-200">
            Overall: {progress.pct}% — {progress.done} of {progress.total} tasks completed.{' '}
            {readiness.completedMandatory}/{readiness.totalMandatory} mandatory tasks done.
          </div>
          {readiness.blocking.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {readiness.blocking.map((b, i) => (
                <span key={i} className="inline-flex items-center gap-1 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-full px-2 py-0.5 text-[10px] font-semibold">
                  <AlertCircle size={10} />{b}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Checklist Tab ────────────────────────────────────────────────────────────
const ChecklistTab: React.FC<{ complex: BodyCorporate; sections: OnboardingChecklistSection[] }> = ({ complex, sections }) => {
  const { updateComplex } = useData();
  const { user } = useAuth();
  const [expanded, setExpanded] = useState<Set<string>>(new Set([sections[0]?.id]));
  const [adding, setAdding] = useState<string | null>(null); // sectionId being added to
  const [newTaskLabel, setNewTaskLabel] = useState('');

  const toggleSection = (id: string) => setExpanded(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const cycleStatus = useCallback(async (taskId: string) => {
    const current = getTaskStatus(complex, taskId);
    const idx = STATUS_CYCLE.indexOf(current);
    const next = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
    const progress: Record<string, OnboardingTaskProgress> = {
      ...(complex.onboardingProgress || {}),
      [taskId]: {
        ...(complex.onboardingProgress?.[taskId] || {}),
        status: next,
        ...(next === 'Completed' ? { completedAt: new Date().toISOString(), completedBy: user?.name || '' } : {}),
      },
    };
    await updateComplex({ ...complex, onboardingProgress: progress });
  }, [complex, updateComplex, user]);

  const addCustomTask = async (sectionId: string) => {
    if (!newTaskLabel.trim()) return;
    const id = `custom_${Date.now()}`;
    // Custom tasks are stored as custom sections on the complex — we add a note about the custom task
    // and store progress with a special id
    const progress: Record<string, OnboardingTaskProgress> = {
      ...(complex.onboardingProgress || {}),
      [id]: { status: 'Not Started' },
    };
    // Store custom tasks as onboardingNotes entries with a special marker
    const newNote: OnboardingNote = {
      id: `note_${Date.now()}`,
      text: `[Custom Task Added — ${sectionId}] ${newTaskLabel.trim()}`,
      authorId: user?.id || '',
      authorName: user?.name || '',
      category: 'General',
      createdAt: new Date().toISOString(),
    };
    await updateComplex({
      ...complex,
      onboardingProgress: progress,
      onboardingNotes: [...(complex.onboardingNotes || []), newNote],
    });
    setNewTaskLabel('');
    setAdding(null);
  };

  const sectionProgressColor = (done: number, total: number) => {
    if (total === 0) return 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400';
    const pct = done / total;
    if (pct === 0)  return 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400';
    if (pct < 0.5)  return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    if (pct < 1)    return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
    return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
  };

  const isIsoc = complex.type === 'Incorporated Society';

  return (
    <div className="space-y-2">
      {isIsoc && (
        <div className="flex items-center gap-2 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg px-3 py-2 text-xs text-purple-700 dark:text-purple-300 mb-3">
          <AlertCircle size={13} />
          Incorporated Society checklist active — ISOC-specific tasks shown, BC-only tasks hidden.
        </div>
      )}

      {sections.map(section => {
        const { done, total } = getSectionProgress(complex, section);
        const isOpen = expanded.has(section.id);
        return (
          <div key={section.id} className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
            <button
              onClick={() => toggleSection(section.id)}
              className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800/50 hover:bg-pink-50 dark:hover:bg-pink-900/10 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">{section.label}</span>
                {section.assignedTeam && (
                  <span className="text-[10px] text-slate-400 dark:text-slate-500">{section.assignedTeam}</span>
                )}
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${sectionProgressColor(done, total)}`}>{done}/{total}</span>
              </div>
              <ChevronRight size={16} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
            </button>

            {isOpen && (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {section.tasks.map(task => {
                  const status = getTaskStatus(complex, task.id);
                  const isDone = status === 'Completed';
                  return (
                    <div key={task.id} className="flex items-center gap-3 px-4 py-2.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                      <button
                        onClick={() => cycleStatus(task.id)}
                        className={`w-4 h-4 rounded flex-shrink-0 border-2 flex items-center justify-center transition-all ${isDone ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300 dark:border-slate-600 hover:border-pink-400'}`}
                        title="Click to mark complete"
                      >
                        {isDone && <CheckCircle2 size={10} className="text-white" />}
                      </button>
                      <span className={`flex-1 text-sm min-w-0 ${isDone ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-800 dark:text-slate-200'}`}>
                        {task.label}
                        {task.isMandatory && <span className="ml-1.5 text-red-500 text-[10px] font-bold">●</span>}
                      </span>
                      <StatusChip status={status} onClick={() => cycleStatus(task.id)} />
                    </div>
                  );
                })}

                {/* Add custom task */}
                <div className="px-4 py-2 bg-white dark:bg-slate-900">
                  {adding === section.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        autoFocus
                        value={newTaskLabel}
                        onChange={e => setNewTaskLabel(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') addCustomTask(section.id); if (e.key === 'Escape') setAdding(null); }}
                        placeholder="Task description…"
                        className="flex-1 text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-pink-500"
                      />
                      <button onClick={() => addCustomTask(section.id)} className="px-3 py-1.5 bg-pink-600 text-white text-xs font-semibold rounded-lg hover:bg-pink-700 transition-colors">Add</button>
                      <button onClick={() => setAdding(null)} className="px-3 py-1.5 text-slate-500 text-xs rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">Cancel</button>
                    </div>
                  ) : (
                    <button onClick={() => setAdding(section.id)} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-pink-600 dark:hover:text-pink-400 transition-colors py-1">
                      <Plus size={12} />Add custom task
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// ─── Notes Tab ────────────────────────────────────────────────────────────────
const NotesTab: React.FC<{ complex: BodyCorporate }> = ({ complex }) => {
  const { updateComplex } = useData();
  const { user } = useAuth();
  const [noteText, setNoteText] = useState('');
  const [noteCategory, setNoteCategory] = useState('General');
  const [saving, setSaving] = useState(false);

  const notes = [...(complex.onboardingNotes || [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const handleAdd = async () => {
    if (!noteText.trim()) return;
    setSaving(true);
    const newNote: OnboardingNote = {
      id: `note_${Date.now()}`,
      text: noteText.trim(),
      authorId: user?.id || '',
      authorName: user?.name || '',
      category: noteCategory,
      createdAt: new Date().toISOString(),
    };
    await updateComplex({ ...complex, onboardingNotes: [...(complex.onboardingNotes || []), newNote] });
    setNoteText('');
    setSaving(false);
  };

  const fmt = (iso: string) => {
    try { return new Date(iso).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric' }); } catch { return iso; }
  };

  return (
    <div className="space-y-3">
      {/* Compose */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Add Note</h3>
        <textarea
          value={noteText}
          onChange={e => setNoteText(e.target.value)}
          rows={3}
          placeholder="Add an update, note or action…"
          className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-pink-500 resize-none"
        />
        <div className="flex items-center justify-between mt-2 gap-3">
          <select value={noteCategory} onChange={e => setNoteCategory(e.target.value)} className="border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 outline-none focus:border-pink-500">
            {NOTE_CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
          <button onClick={handleAdd} disabled={!noteText.trim() || saving} className="px-4 py-1.5 bg-pink-600 text-white text-xs font-semibold rounded-lg disabled:opacity-50 hover:bg-pink-700 transition-colors">
            {saving ? 'Saving…' : 'Add Note'}
          </button>
        </div>
      </div>

      {/* Notes list */}
      {notes.length === 0 ? (
        <div className="text-center py-10 text-slate-400 dark:text-slate-500 text-sm">No notes yet.</div>
      ) : (
        notes
          .filter(n => !n.text.startsWith('[Custom Task Added'))
          .map(note => (
            <div key={note.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">{note.authorName}</span>
                <span className="text-xs text-slate-400">{fmt(note.createdAt)}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400">{note.category}</span>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{note.text}</p>
            </div>
          ))
      )}
    </div>
  );
};

// ─── Detail View ──────────────────────────────────────────────────────────────
interface DetailViewProps { complex: BodyCorporate; onBack: () => void; }
const DetailView: React.FC<DetailViewProps> = ({ complex, onBack }) => {
  const { systemSettings } = useData();
  const [activeTab, setActiveTab] = useState<'overview' | 'checklist' | 'notes'>('overview');
  const [showEdit, setShowEdit] = useState(false);
  const [showStageModal, setShowStageModal] = useState(false);

  const template = systemSettings.onboardingChecklistTemplate || DEFAULT_ONBOARDING_CHECKLIST;
  const sections = useMemo(() => getActiveSections(complex, template), [complex, template]);
  const progress = getOverallProgress(complex, sections);
  const readiness = getGoLiveReadiness(complex, sections);

  const overdueCount = sections.flatMap(s => s.tasks).filter(t => getTaskStatus(complex, t.id) === 'Blocked').length;
  const waitingCount = sections.flatMap(s => s.tasks).filter(t => getTaskStatus(complex, t.id) === 'Waiting External').length;

  const Tab: React.FC<{ id: 'overview' | 'checklist' | 'notes'; label: string; badge?: number; badgeColor?: string }> = ({ id, label, badge, badgeColor }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors flex items-center gap-2 ${activeTab === id ? 'border-pink-600 text-pink-600 dark:text-pink-400 dark:border-pink-400' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
    >
      {label}
      {badge != null && badge > 0 && (
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${badgeColor || 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'}`}>{badge}</span>
      )}
    </button>
  );

  return (
    <>
      {showEdit && <EditOverviewModal complex={complex} onClose={() => setShowEdit(false)} />}
      {showStageModal && <ChangeStageModal complex={complex} onClose={() => setShowStageModal(false)} onBack={onBack} />}

      <div>
        {/* Back */}
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-pink-600 dark:hover:text-pink-400 mb-4 transition-colors">
          <ArrowLeft size={16} />Back to New Business
        </button>

        {/* Header card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-5 mb-4">
          <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
            <div>
              <div className="flex items-center gap-3 flex-wrap mb-1">
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">{complex.name}</h1>
                {complex.pipelineStage && <StageBadge stage={complex.pipelineStage} size="md" />}
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {complex.type} · {complex.units} units{complex.bcNumber ? ` · ${complex.bcNumber}` : ''}{complex.managerName ? ` · ${complex.managerName}` : ''}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button onClick={() => setShowEdit(true)} className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                <Edit2 size={13} />Edit
              </button>
              <button onClick={() => setShowStageModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 border border-amber-300 dark:border-amber-700 rounded-lg text-xs font-semibold text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors">
                Change Stage <ChevronDown size={13} />
              </button>
            </div>
          </div>

          {/* Stats strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Start Date</div>
              <div className={`text-sm font-semibold ${complex.confirmedStartDate ? 'text-emerald-600 dark:text-emerald-400' : complex.anticipatedStartDate ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'}`}>
                {complex.confirmedStartDate
                  ? new Date(complex.confirmedStartDate).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric' })
                  : complex.anticipatedStartDate
                    ? `≈ ${new Date(complex.anticipatedStartDate).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric' })}`
                    : 'TBC'}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Developer</div>
              <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{complex.developerCompany || '—'}</div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Overall</div>
              <div className="text-sm font-semibold text-pink-600 dark:text-pink-400">{progress.pct}% · {progress.done}/{progress.total}</div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Mandatory</div>
              <div className={`text-sm font-semibold ${readiness.completedMandatory === readiness.totalMandatory ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                {readiness.completedMandatory}/{readiness.totalMandatory}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Blocked</div>
              <div className={`text-sm font-semibold ${overdueCount > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-400'}`}>{overdueCount || '—'}</div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Go-Live</div>
              <div className={`text-sm font-semibold ${readiness.isReady ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                {readiness.isReady ? 'Ready' : 'Not ready'}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-700 mb-4 overflow-x-auto">
          <Tab id="overview" label="Overview" />
          <Tab id="checklist" label="Checklist" badge={readiness.totalMandatory - readiness.completedMandatory} badgeColor="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" />
          <Tab id="notes" label="Notes & Activity" badge={(complex.onboardingNotes || []).filter(n => !n.text.startsWith('[Custom Task')).length} badgeColor="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300" />
        </div>

        {/* Tab content */}
        {activeTab === 'overview'  && <OverviewTab complex={complex} sections={sections} />}
        {activeTab === 'checklist' && <ChecklistTab complex={complex} sections={sections} />}
        {activeTab === 'notes'     && <NotesTab complex={complex} />}
      </div>
    </>
  );
};

// ─── Pipeline List ────────────────────────────────────────────────────────────
const PipelineList: React.FC<{ onSelect: (id: string) => void }> = ({ onSelect }) => {
  const { complexes, systemSettings } = useData();
  const [stageFilter, setStageFilter] = useState<PipelineStage | 'all'>('all');
  const [search, setSearch] = useState('');
  const [showAddLead, setShowAddLead] = useState(false);

  const template = systemSettings.onboardingChecklistTemplate || DEFAULT_ONBOARDING_CHECKLIST;

  const pipeline = useMemo(() =>
    complexes.filter(bc => bc.pipelineStage && bc.pipelineStage !== 'Live' && !bc.isArchived),
    [complexes]
  );

  const filtered = useMemo(() => {
    let list = pipeline;
    if (stageFilter !== 'all') list = list.filter(bc => bc.pipelineStage === stageFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(bc =>
        bc.name.toLowerCase().includes(q) ||
        bc.address?.toLowerCase().includes(q) ||
        bc.developerCompany?.toLowerCase().includes(q) ||
        bc.developerContactName?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [pipeline, stageFilter, search]);

  const stageCounts = useMemo(() => {
    const counts: Partial<Record<PipelineStage, number>> = {};
    pipeline.forEach(bc => { if (bc.pipelineStage) counts[bc.pipelineStage] = (counts[bc.pipelineStage] || 0) + 1; });
    return counts;
  }, [pipeline]);

  const stats = useMemo(() => {
    const onboarding = pipeline.filter(bc => bc.pipelineStage === 'Onboarding').length;
    const appointed  = pipeline.filter(bc => bc.pipelineStage === 'Appointed').length;
    const lead       = pipeline.filter(bc => bc.pipelineStage === 'Lead').length;
    const blocked    = pipeline.reduce((sum, bc) => {
      const sections = getActiveSections(bc, template);
      return sum + sections.flatMap(s => s.tasks).filter(t => getTaskStatus(bc, t.id) === 'Blocked').length;
    }, 0);
    const waiting = pipeline.reduce((sum, bc) => {
      const sections = getActiveSections(bc, template);
      return sum + sections.flatMap(s => s.tasks).filter(t => getTaskStatus(bc, t.id) === 'Waiting External').length;
    }, 0);
    return { onboarding, appointed, lead, blocked, waiting };
  }, [pipeline, template]);

  const STAGE_FILTERS: Array<{ value: PipelineStage | 'all'; label: string }> = [
    { value: 'all', label: 'All' },
    { value: 'Lead', label: 'Lead / Marketing' },
    { value: 'Appointed', label: 'Appointed' },
    { value: 'Onboarding', label: 'Onboarding' },
    { value: 'Ready for Review', label: 'Ready for Review' },
    { value: 'On Hold', label: 'On Hold' },
    { value: 'Lost', label: 'Lost' },
  ];

  return (
    <>
      {showAddLead && (
        <AddLeadModal
          onClose={() => setShowAddLead(false)}
          onCreated={id => { setShowAddLead(false); onSelect(id); }}
        />
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <TrendingUp size={22} className="text-pink-600" />
            New Business
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Pipeline, onboarding and go-live tracking</p>
        </div>
        <button onClick={() => setShowAddLead(true)} className="flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg text-sm font-semibold hover:bg-pink-700 transition-colors">
          <Plus size={16} />New Lead
        </button>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-5">
        {[
          { label: 'Onboarding', value: stats.onboarding, color: 'text-amber-600 dark:text-amber-400' },
          { label: 'Appointed',  value: stats.appointed,  color: 'text-purple-600 dark:text-purple-400' },
          { label: 'Leads',      value: stats.lead,       color: 'text-blue-600 dark:text-blue-400' },
          { label: 'Blocked Tasks', value: stats.blocked, color: stats.blocked > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-400' },
          { label: 'Waiting External', value: stats.waiting, color: stats.waiting > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400' },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wide mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Stage filter pills */}
      <div className="flex flex-wrap gap-2 mb-3">
        {STAGE_FILTERS.map(f => {
          const count = f.value === 'all' ? pipeline.length : stageCounts[f.value as PipelineStage] || 0;
          const active = stageFilter === f.value;
          return (
            <button
              key={f.value}
              onClick={() => setStageFilter(f.value)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                active
                  ? 'bg-pink-600 border-pink-600 text-white'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              {f.label}
              <span className={`rounded-full px-1.5 text-[10px] font-bold ${active ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, address or developer…"
          className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:border-pink-500 dark:focus:border-pink-400"
        />
      </div>

      {/* Complex rows */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400 dark:text-slate-500">
          <TrendingUp size={32} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">No complexes found</p>
          <p className="text-sm mt-1">{search ? 'Try a different search term.' : 'Click "+ New Lead" to add the first one.'}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(bc => {
            const sections = getActiveSections(bc, template);
            const prog = getOverallProgress(bc, sections);
            const blocked = sections.flatMap(s => s.tasks).filter(t => getTaskStatus(bc, t.id) === 'Blocked').length;
            const startDate = bc.confirmedStartDate || bc.anticipatedStartDate;
            const startLabel = bc.confirmedStartDate ? 'Confirmed' : bc.anticipatedStartDate ? 'Anticipated' : null;
            const startColor = bc.confirmedStartDate ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400';
            return (
              <button
                key={bc.id}
                onClick={() => onSelect(bc.id)}
                className="w-full text-left bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 hover:border-pink-300 dark:hover:border-pink-700 hover:shadow-sm transition-all group"
              >
                <div className="flex items-center gap-3 flex-wrap">
                  {bc.pipelineStage && <StageBadge stage={bc.pipelineStage} />}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-slate-900 dark:text-white">{bc.name}</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400">{bc.type === 'Incorporated Society' ? 'ISOC' : 'BC'}</span>
                      <span className="text-xs text-slate-400">{bc.units ? `${bc.units} units` : ''}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-400 flex-wrap">
                      {bc.developerCompany && <span>{bc.developerCompany}{bc.developerContactName ? ` · ${bc.developerContactName}` : ''}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0">
                    {startLabel && startDate && (
                      <div className="text-right hidden sm:block">
                        <div className={`text-xs font-semibold ${startColor}`}>
                          {new Date(startDate).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                        <div className="text-[10px] text-slate-400">{startLabel}</div>
                      </div>
                    )}
                    <div className="text-right hidden md:block min-w-[90px]">
                      <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400 mb-1">
                        <span>{prog.pct}%</span>
                        {blocked > 0 && <span className="text-red-500 font-bold">{blocked} blocked</span>}
                      </div>
                      <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden w-24">
                        <div className="h-full bg-pink-500 rounded-full transition-all" style={{ width: `${prog.pct}%` }} />
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-slate-300 dark:text-slate-600 group-hover:text-pink-500 transition-colors" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const NewBusiness: React.FC = () => {
  const { complexes } = useData();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedComplex = useMemo(() =>
    selectedId ? complexes.find(bc => bc.id === selectedId) : null,
    [selectedId, complexes]
  );

  return (
    <div className="max-w-5xl mx-auto">
      {selectedComplex ? (
        <DetailView complex={selectedComplex} onBack={() => setSelectedId(null)} />
      ) : (
        <PipelineList onSelect={setSelectedId} />
      )}
    </div>
  );
};

export default NewBusiness;
