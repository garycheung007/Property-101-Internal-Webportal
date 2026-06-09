
import React, { useState, useEffect, useRef } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { DEFAULT_CONFLICT_REGISTER_TEMPLATE } from '../constants/defaultTemplates';
import { db } from '../firebase';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { BodyCorporate, User, UserRole, ComplexType, SystemSettings, Contractor, ContractorCategory, InsuranceSettings, WorkflowStepConfig, MeetingChecklistItem, ReminderType, TemplateFileRecord } from '../types';
import {
    Users, Building, Plus, Upload, Search, Settings,
    UserPlus, Archive, Edit2, ArchiveRestore, Save, X, Trash2, Database, ShieldCheck, Terminal,
    LayoutGrid, Loader2, HardHat, ClipboardCheck, PlusCircle, AlertTriangle, FileText,
    Activity, CheckCircle2, MinusCircle, AlertCircle, FileSignature, Droplets, Download
} from 'lucide-react';
import { Navigate, useNavigate } from 'react-router-dom';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#6366f1', '#ec4899'];

const UserEditModal: React.FC<{ user: User | null; onClose: () => void; onSave: (u: User) => Promise<void> }> = ({ user, onClose, onSave }) => {
    const [form, setForm] = useState<Partial<User>>(user || { role: 'account_manager' });
    const [isSaving, setIsSaving] = useState(false);
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setForm({ ...form, signatureUrl: reader.result as string });
            reader.readAsDataURL(file);
        }
    };
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-md shadow-2xl border dark:border-slate-800 flex flex-col overflow-hidden">
                <div className="p-4 border-b dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950"><h3 className="font-bold text-xs uppercase tracking-widest dark:text-white">{user ? 'Edit Staff Profile' : 'New Staff Member'}</h3><button onClick={onClose} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors"><X size={18}/></button></div>
                <div className="p-6 space-y-4">
                    <div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Full Name</label><input type="text" className="w-full border dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl p-3 text-sm" value={form.name || ''} onChange={e => setForm({...form, name: e.target.value})} /></div>
                    <div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Email</label><input type="email" className="w-full border dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl p-3 text-sm" value={form.email || ''} onChange={e => setForm({...form, email: e.target.value})} /></div>
                    <div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Role</label><select className="w-full border dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl p-3 text-sm bg-white" value={form.role || 'account_manager'} onChange={e => setForm({...form, role: e.target.value as any})}><option value="admin">Admin</option><option value="account_manager">Manager</option><option value="support">Support</option></select></div>
                    <div className="pt-2 border-t dark:border-slate-800">
                        <label className="text-[10px] font-bold text-pink-600 uppercase block mb-2">Electronic Signature</label>
                        <div className="flex flex-col gap-3">
                            {form.signatureUrl && <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border flex justify-center"><img src={form.signatureUrl} alt="Signature" className="max-h-16 w-auto object-contain" style={{ maxWidth: '200px' }} /></div>}
                            <label className="flex items-center justify-center gap-2 w-full p-3 border-2 border-dashed rounded-xl cursor-pointer hover:border-pink-500 hover:bg-pink-50 dark:hover:bg-pink-900/10 transition-all"><Upload size={16} className="text-slate-400" /><span className="text-xs font-bold text-slate-500 uppercase">Upload Signature</span><input type="file" className="hidden" accept="image/*" onChange={handleFileChange} /></label>
                        </div>
                    </div>
                    <button onClick={() => { setIsSaving(true); onSave(form as User).finally(() => setIsSaving(false)); }} disabled={isSaving || !form.name || !form.email} className="w-full bg-pink-600 hover:bg-pink-700 text-white py-4 rounded-2xl font-bold uppercase text-xs shadow-lg flex items-center justify-center gap-2">{isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}{user ? 'Update Profile' : 'Create Staff Member'}</button>
                </div>
            </div>
        </div>
    );
};

// ── CSV Import/Export ──────────────────────────────────────────────────────

interface CsvColumnDef { key: keyof BodyCorporate; header: string; type?: 'number' | 'boolean' | 'date'; }
interface CsvChange { field: string; oldValue: string; newValue: string; }
interface CsvPreviewRow { id: string; bcNumber: string; name: string; changes: CsvChange[]; updates: Partial<BodyCorporate>; }

const CSV_COLUMNS: CsvColumnDef[] = [
    { key: 'bcNumber',                   header: 'BC Number' },
    { key: 'name',                       header: 'Name' },
    { key: 'address',                    header: 'Address' },
    { key: 'units',                      header: 'Units',                        type: 'number' },
    { key: 'type',                       header: 'Type' },
    { key: 'managerName',                header: 'Manager Name' },
    { key: 'managementFee',              header: 'Management Fee',               type: 'number' },
    { key: 'managementStartDate',        header: 'Management Start Date',        type: 'date' },
    { key: 'onboardingType',             header: 'Onboarding Type' },
    { key: 'financialYearStart',         header: 'FY Start' },
    { key: 'financialYearEnd',           header: 'FY End' },
    { key: 'isGstRegistered',            header: 'GST Registered',               type: 'boolean' },
    { key: 'insuranceExpiry',            header: 'Insurance Expiry',             type: 'date' },
    { key: 'insuranceBroker',            header: 'Insurance Broker' },
    { key: 'insuranceUnderwriter',       header: 'Insurance Underwriter' },
    { key: 'lastInsuranceValuationDate', header: 'Last Valuation Date',          type: 'date' },
    { key: 'lastInsuranceValuer',        header: 'Last Valuer' },
    { key: 'hasBwof',                    header: 'Has BWOF',                     type: 'boolean' },
    { key: 'bwofExpiry',                 header: 'BWOF Expiry',                  type: 'date' },
    { key: 'bwofLastCompletionDate',     header: 'BWOF Last Completion',         type: 'date' },
    { key: 'bwofNextRenewalDate',        header: 'BWOF Next Renewal',            type: 'date' },
    { key: 'complianceCompany',          header: 'BWOF Compliance Company' },
    { key: 'complianceContactEmail',     header: 'BWOF Compliance Email' },
    { key: 'hasLtmp',                    header: 'Has LTMP',                     type: 'boolean' },
    { key: 'ltmpCompletedDate',          header: 'LTMP Completed Date',          type: 'date' },
    { key: 'ltmpLastRenewalDate',        header: 'LTMP Last Renewal',            type: 'date' },
    { key: 'ltmpNextRenewalDate',        header: 'LTMP Next Renewal',            type: 'date' },
    { key: 'hasHsReport',               header: 'Has H&S Report',               type: 'boolean' },
    { key: 'hsReportDate',              header: 'H&S Report Date',              type: 'date' },
    { key: 'hasBuildingManager',         header: 'Has Building Manager',         type: 'boolean' },
    { key: 'buildingManagerCompany',     header: 'BM Company' },
    { key: 'buildingManagerName',        header: 'BM Name' },
    { key: 'buildingManagerPhone',       header: 'BM Phone' },
    { key: 'buildingManagerEmail',       header: 'BM Email' },
    { key: 'bcAccountName',              header: 'BC Account Name' },
    { key: 'bcAccountNumber',            header: 'BC Account Number' },
    { key: 'levyInstalments',            header: 'Levy Instalments Per Year' },
    { key: 'levyDueDates',              header: 'Levy Due Dates' },
    { key: 'waterRateDescription',       header: 'Water Rate Description' },
    { key: 'operatingFundBalance',       header: 'Operating Fund Balance' },
    { key: 'reserveFundBalance',         header: 'Reserve Fund Balance' },
    { key: 'numberOfCommitteeMeetings',  header: 'Committee Meetings Per Year',  type: 'number' },
    { key: 'notes',                      header: 'Notes' },
];

const parseCsvLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
            if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
            else inQuotes = !inQuotes;
        } else if (ch === ',' && !inQuotes) { result.push(current); current = ''; }
        else current += ch;
    }
    result.push(current);
    return result;
};

const escapeCsvValue = (val: string): string => {
    if (val.includes(',') || val.includes('"') || val.includes('\n')) return `"${val.replace(/"/g, '""')}"`;
    return val;
};

const formatDateForCsv = (dateStr: string): string => {
    const parts = dateStr.split('-');
    if (parts.length === 3 && parts[0].length === 4) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return dateStr;
};

const parseDateFromCsv = (val: string): string => {
    const parts = val.split('/');
    if (parts.length === 3 && parts[2].length === 4) return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    return val;
};

const formatValueForCsv = (value: any, type?: string): string => {
    if (value === undefined || value === null || value === '') return '';
    if (type === 'boolean') return value ? 'Yes' : 'No';
    if (type === 'date') return formatDateForCsv(String(value));
    return String(value);
};

const parseValueFromCsv = (val: string, type?: string): any => {
    if (type === 'boolean') return val.toLowerCase() === 'yes' || val.toLowerCase() === 'true';
    if (type === 'date') return parseDateFromCsv(val);
    if (type === 'number') { const n = Number(val); return isNaN(n) ? val : n; }
    return val;
};

// ──────────────────────────────────────────────────────────────────────────────

const AdminPanel: React.FC = () => {
    const navigate = useNavigate();
    const { user: currentUser } = useAuth();
    const {
        complexes, managers, users, contractors, systemSettings, loading: dataLoading,
        addUser, updateUser, updateSystemSettings, initializeDummyData, toggleArchiveComplex, updateComplex,
        restoreData, bulkUpdateComplexes
    } = useData();
    
    const [activeTab, setActiveTab] = useState<'properties' | 'contractors' | 'users' | 'settings' | 'meetings' | 'templates' | 'diagnostics' | 'data'>('properties');
    const [templateSubTab, setTemplateSubTab] = useState<'bc' | 'isoc' | 'disclosure' | 'conflict'>('bc');
    const [searchTerm, setSearchTerm] = useState('');
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    
    const [bwofMessage, setBwofMessage] = useState(systemSettings.bwofConfirmationMessage || '');

    // Local configuration states for granular tabs
    const [localInsurance, setLocalInsurance] = useState<InsuranceSettings>(systemSettings.insuranceSettings || { valuationValidityYears: 2, workflowSteps: [] });
    const [localCategories, setLocalCategories] = useState<string[]>(systemSettings.contractorCategories || []);
    const [localChecklists, setLocalChecklists] = useState({ NOI: [], NOM: [], PRIOR_TO_MEETING: [], AFTER_MEETING: [], ...systemSettings.meetingChecklistTemplates });
    const [localVenues, setLocalVenues] = useState<string[]>(systemSettings.meetingVenues || []);
    const [newVenueInput, setNewVenueInput] = useState('');
    const [localStandardParagraph, setLocalStandardParagraph] = useState(systemSettings.disclosureStandardParagraph ?? 'You will need to arrange for the statement to be signed before providing it to any interested parties. The responsibility for disclosure rests with the vendor, therefore, please ensure all documents are checked for accuracy prior to signing.');
    const [localRemediationParagraph, setLocalRemediationParagraph] = useState(systemSettings.disclosureRemediationParagraph ?? 'You will need to arrange for the statement to be signed before providing it to any interested parties. The responsibility for disclosure rests with the vendor, therefore, please ensure all documents are checked for accuracy prior to signing. Especially with regard to item (1)(a) & disclosing information on the levies & remedial project as per updates provided to owners by the Body Corporate.');
    const [localWaterRateOptions, setLocalWaterRateOptions] = useState<string[]>(
        systemSettings.waterRateOptions ?? ['Water rate not included in levy — unit has its own meter']
    );
    const [localConflictRegisterTemplate, setLocalConflictRegisterTemplate] = useState<string>(
        systemSettings.conflictRegisterTemplate ?? DEFAULT_CONFLICT_REGISTER_TEMPLATE
    );

    // Data tab — CSV
    const [csvPreview, setCsvPreview] = useState<CsvPreviewRow[] | null>(null);
    const [csvErrors, setCsvErrors] = useState<string[]>([]);
    const [csvImporting, setCsvImporting] = useState(false);
    const [csvSuccess, setCsvSuccess] = useState('');
    // Data tab — JSON backup
    const [jsonPreview, setJsonPreview] = useState<{ complexes: number; users: number; contractors: number; hasSettings: boolean; exportedAt: string } | null>(null);
    const [jsonParsed, setJsonParsed] = useState<any>(null);
    const [jsonRestoring, setJsonRestoring] = useState(false);
    const [jsonError, setJsonError] = useState('');
    const [jsonSuccess, setJsonSuccess] = useState('');

    // Docx template management
    const [docxTemplates, setDocxTemplates] = useState<Partial<Record<string, TemplateFileRecord>>>({});
    const [uploadingDocx, setUploadingDocx] = useState<string | null>(null);
    const docxInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

    useEffect(() => {
        if (systemSettings.bwofConfirmationMessage) setBwofMessage(systemSettings.bwofConfirmationMessage);
        if (systemSettings.insuranceSettings) setLocalInsurance(systemSettings.insuranceSettings);
        if (systemSettings.contractorCategories) setLocalCategories(systemSettings.contractorCategories);
        if (systemSettings.meetingChecklistTemplates) setLocalChecklists({ NOI: [], NOM: [], PRIOR_TO_MEETING: [], AFTER_MEETING: [], ...systemSettings.meetingChecklistTemplates });
        if (systemSettings.meetingVenues) setLocalVenues(systemSettings.meetingVenues);
        if (systemSettings.waterRateOptions) setLocalWaterRateOptions(systemSettings.waterRateOptions);
        if (systemSettings.conflictRegisterTemplate) setLocalConflictRegisterTemplate(systemSettings.conflictRegisterTemplate);
    }, [systemSettings]);

    useEffect(() => {
        const keys = ['noiCoverLetter', 'responseForm', 'debtCollectionFlowchart', 'noticeOfDelegation', 'noiCoverLetterIsoc', 'responseFormIsoc', 'debtCollectionFlowchartIsoc', 's146', 's147', 'cpl', 'conflictRegister'];
        Promise.all(keys.map(k => getDoc(doc(db, 'templates_v2', k)))).then(snaps => {
            const loaded: Partial<Record<string, TemplateFileRecord>> = {};
            snaps.forEach((snap, i) => { if (snap.exists()) loaded[keys[i]] = snap.data() as TemplateFileRecord; });
            setDocxTemplates(loaded);
        });
    }, []);

    const handleDocxUpload = (key: string, file: File) => {
        setUploadingDocx(key);
        const reader = new FileReader();
        reader.onload = async (e) => {
            const base64 = (e.target?.result as string).split(',')[1];
            const record: TemplateFileRecord = { name: file.name, data: base64, uploadedAt: new Date().toISOString() };
            await setDoc(doc(db, 'templates_v2', key), record);
            setDocxTemplates(prev => ({ ...prev, [key]: record }));
            setUploadingDocx(null);
        };
        reader.readAsDataURL(file);
    };

    const renderDocxCard = (key: string, label: string) => {
        const tpl = docxTemplates[key];
        return (
            <div key={key} className="bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
                        {tpl ? (
                            <>
                                <div className="flex items-center gap-1.5 mt-1">
                                    <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                                    <p className="text-sm text-slate-700 dark:text-slate-300 truncate">{tpl.name}</p>
                                </div>
                                <p className="text-[10px] text-slate-400 mt-0.5">Uploaded {new Date(tpl.uploadedAt).toLocaleDateString('en-NZ')}</p>
                            </>
                        ) : (
                            <p className="text-sm text-slate-400 italic mt-1">No template uploaded</p>
                        )}
                    </div>
                    <>
                        <input
                            ref={el => { docxInputRefs.current[key] = el; }}
                            type="file"
                            accept=".docx"
                            className="hidden"
                            onChange={e => { if (e.target.files?.[0]) handleDocxUpload(key, e.target.files[0]); e.target.value = ''; }}
                        />
                        <button
                            onClick={() => docxInputRefs.current[key]?.click()}
                            disabled={uploadingDocx === key}
                            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
                        >
                            {uploadingDocx === key ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                            {tpl ? 'Replace' : 'Upload'}
                        </button>
                    </>
                </div>
            </div>
        );
    };

    // ── CSV handlers ────────────────────────────────────────────────────────
    const handleCsvExport = () => {
        const headers = CSV_COLUMNS.map(c => c.header);
        const rows = complexes.map(bc =>
            CSV_COLUMNS.map(col => escapeCsvValue(formatValueForCsv((bc as any)[col.key], col.type)))
        );
        const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `complexes-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleCsvImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        e.target.value = '';
        setCsvPreview(null); setCsvErrors([]); setCsvSuccess('');
        const reader = new FileReader();
        reader.onload = (ev) => {
            const raw = ev.target?.result as string;
            const text = raw.charCodeAt(0) === 0xFEFF ? raw.slice(1) : raw;
            const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
            if (lines.length < 2) { setCsvErrors(['CSV has no data rows.']); return; }
            const headers = parseCsvLine(lines[0]);
            const errors: string[] = [];
            const preview: CsvPreviewRow[] = [];
            for (let i = 1; i < lines.length; i++) {
                const vals = parseCsvLine(lines[i]);
                const row: Record<string, string> = {};
                headers.forEach((h, idx) => { row[h] = vals[idx] ?? ''; });
                const bcNum = row['BC Number']?.trim();
                if (!bcNum) continue;
                const existing = complexes.find(c => c.bcNumber === bcNum);
                if (!existing) { errors.push(`Row ${i + 1}: BC Number "${bcNum}" not found.`); continue; }
                const changes: CsvChange[] = [];
                const updates: Partial<BodyCorporate> = {};
                for (const col of CSV_COLUMNS) {
                    if (col.key === 'bcNumber') continue;
                    const csvVal = row[col.header]?.trim();
                    if (!csvVal) continue;
                    const currentDisplay = formatValueForCsv((existing as any)[col.key], col.type);
                    if (csvVal === currentDisplay) continue;
                    const newVal = parseValueFromCsv(csvVal, col.type);
                    (updates as any)[col.key] = newVal;
                    changes.push({ field: col.header, oldValue: currentDisplay || '(blank)', newValue: csvVal });
                }
                if (changes.length > 0) preview.push({ id: existing.id, bcNumber: bcNum, name: existing.name, changes, updates });
            }
            setCsvErrors(errors);
            setCsvPreview(preview);
        };
        reader.readAsText(file, 'utf-8');
    };

    const handleApplyCsvChanges = async () => {
        if (!csvPreview || csvPreview.length === 0) return;
        if (!window.confirm(`Apply changes to ${csvPreview.length} complex${csvPreview.length !== 1 ? 'es' : ''}?`)) return;
        setCsvImporting(true);
        try {
            await bulkUpdateComplexes(csvPreview.map(row => ({ id: row.id, ...row.updates })));
            setCsvSuccess(`Updated ${csvPreview.length} complex${csvPreview.length !== 1 ? 'es' : ''} successfully.`);
            setCsvPreview(null);
        } catch {
            setCsvErrors(['Failed to apply changes. Please try again.']);
        } finally {
            setCsvImporting(false);
        }
    };

    // ── JSON backup handlers ─────────────────────────────────────────────────
    const handleJsonExport = () => {
        const backup = {
            version: 1,
            exportedAt: new Date().toISOString(),
            note: 'Meeting history is stored in Firestore subcollections and is not included.',
            complexes: complexes.map(({ meetings: _, ...rest }) => rest),
            users,
            contractors,
            systemSettings,
        };
        const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `property101-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleJsonRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        e.target.value = '';
        setJsonPreview(null); setJsonParsed(null); setJsonError(''); setJsonSuccess('');
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const data = JSON.parse(ev.target?.result as string);
                if (!data.complexes && !data.users && !data.systemSettings) {
                    setJsonError('Invalid backup file — no recognised data found.'); return;
                }
                setJsonParsed(data);
                setJsonPreview({
                    complexes: data.complexes?.length ?? 0,
                    users: data.users?.length ?? 0,
                    contractors: data.contractors?.length ?? 0,
                    hasSettings: !!data.systemSettings,
                    exportedAt: data.exportedAt || 'Unknown',
                });
            } catch {
                setJsonError('Invalid JSON file. Please upload a valid backup file.');
            }
        };
        reader.readAsText(file);
    };

    const handleConfirmJsonRestore = async () => {
        if (!jsonParsed) return;
        if (!window.confirm('Restore from backup? This will merge backup data into Firestore, overwriting matching records. This cannot be undone.')) return;
        setJsonRestoring(true);
        try {
            await restoreData(jsonParsed);
            setJsonSuccess('Backup restored successfully.');
            setJsonPreview(null); setJsonParsed(null);
        } catch {
            setJsonError('Restore failed. Please try again.');
        } finally {
            setJsonRestoring(false);
        }
    };
    // ────────────────────────────────────────────────────────────────────────

    if (currentUser?.role !== 'admin') return <Navigate to="/" replace />;

    const handleSaveSettings = async () => {
        await updateSystemSettings({
            ...systemSettings,
            bwofConfirmationMessage: bwofMessage,
            insuranceSettings: localInsurance,
            contractorCategories: localCategories,
            meetingChecklistTemplates: localChecklists,
            meetingVenues: localVenues,
            disclosureStandardParagraph: localStandardParagraph,
            disclosureRemediationParagraph: localRemediationParagraph,
            waterRateOptions: localWaterRateOptions,
            conflictRegisterTemplate: localConflictRegisterTemplate,
        });
        alert("System settings updated successfully.");
    };

    const filteredUsers = users.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const filteredComplexes = complexes.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        c.bcNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Admin Panel</h1>
                <div className="flex gap-2">
                    <button onClick={handleSaveSettings} className="border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all"><Save size={16} /> Save</button>
                </div>
            </div>

            <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto whitespace-nowrap bg-white dark:bg-slate-900 rounded-t-xl">
                {[
                    { id: 'properties', label: 'Properties', icon: <Building size={16}/> },
                    { id: 'contractors', label: 'Contractors', icon: <HardHat size={16}/> },
                    { id: 'users', label: 'Users', icon: <Users size={16}/> },
                    { id: 'settings', label: 'Compliance', icon: <Settings size={16}/> },
                    { id: 'templates', label: 'Templates', icon: <FileText size={16}/> },
                    { id: 'meetings', label: 'Meetings', icon: <ClipboardCheck size={16}/> },
                    { id: 'diagnostics', label: 'Diagnostics', icon: <Terminal size={16}/> },
                    { id: 'data', label: 'Data', icon: <Database size={16}/> }
                ].map((tab) => (
                    <button 
                        key={tab.id} 
                        onClick={() => { setActiveTab(tab.id as any); setSearchTerm(''); }} 
                        className={`px-6 py-4 text-xs font-bold transition-colors border-b-2 uppercase tracking-widest flex items-center gap-2 ${activeTab === tab.id ? 'border-pink-600 text-pink-600' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 border-transparent'}`}
                    >
                        {tab.icon}{tab.label}
                    </button>
                ))}
            </div>

            {!dataLoading && (
                <div className="animate-in fade-in duration-300">
                    {activeTab === 'properties' && (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <div className="relative w-full max-w-md">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input type="text" placeholder="Filter property database..." className="w-full pl-10 pr-4 py-2 border dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg text-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                                </div>
                            </div>
                            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border dark:border-slate-800 overflow-hidden">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs uppercase font-bold text-slate-500">
                                        <tr>
                                            <th className="px-6 py-4">ID / BC Number</th>
                                            <th className="px-6 py-4">Name</th>
                                            <th className="px-6 py-4">Manager</th>
                                            <th className="px-6 py-4">Status</th>
                                            <th className="px-6 py-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y dark:divide-slate-800">
                                        {filteredComplexes.map((bc) => (
                                            <tr key={bc.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                                                <td className="px-6 py-4 font-mono text-xs">{bc.bcNumber}</td>
                                                <td className="px-6 py-4 font-bold text-slate-800 dark:text-white">{bc.name}</td>
                                                <td className="px-6 py-4">{bc.managerName}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${bc.isArchived ? 'bg-slate-100 text-slate-500' : 'bg-emerald-50 text-emerald-600'}`}>
                                                        {bc.isArchived ? 'Archived' : 'Active'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <button onClick={() => navigate(`/complexes?id=${bc.id}`)} className="p-1.5 hover:text-pink-600 transition-colors" title="Edit complex">
                                                            <Edit2 size={18} />
                                                        </button>
                                                        <button onClick={() => toggleArchiveComplex(bc.id)} className="p-1.5 hover:text-pink-600 transition-colors" title={bc.isArchived ? 'Restore' : 'Archive'}>
                                                            {bc.isArchived ? <ArchiveRestore size={18} /> : <Archive size={18} />}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'contractors' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border dark:border-slate-800 shadow-sm space-y-6">
                                <h2 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                                    <LayoutGrid size={18} className="text-pink-600" /> Contractor Categories
                                </h2>
                                <p className="text-xs text-slate-500">Configure the company types available in the contractor directory.</p>
                                
                                <div className="space-y-2">
                                    {localCategories.map((cat, idx) => (
                                        <div key={idx} className="flex items-center gap-2 group">
                                            <input 
                                                type="text" 
                                                className="flex-1 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-lg p-2 text-sm"
                                                value={cat}
                                                onChange={(e) => {
                                                    const next = [...localCategories];
                                                    next[idx] = e.target.value;
                                                    setLocalCategories(next);
                                                }}
                                            />
                                            <button 
                                                onClick={() => setLocalCategories(localCategories.filter((_, i) => i !== idx))}
                                                className="p-2 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                    <button 
                                        onClick={() => setLocalCategories([...localCategories, ''])}
                                        className="w-full flex items-center justify-center gap-2 p-2 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg text-slate-400 hover:text-pink-600 hover:border-pink-300 transition-all text-sm font-bold uppercase"
                                    >
                                        <Plus size={16} /> Add New Category
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'settings' && (
                        <div className="space-y-8 pb-24">
                            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border dark:border-slate-800 shadow-sm space-y-6">
                                <h2 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                                    <ShieldCheck size={18} className="text-pink-600" /> Insurance Configuration
                                </h2>
                                
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Valuation Validity (Years)</label>
                                        <input 
                                            type="number" 
                                            className="w-full border dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl p-3 text-sm"
                                            value={localInsurance.valuationValidityYears}
                                            onChange={(e) => setLocalInsurance({...localInsurance, valuationValidityYears: parseInt(e.target.value) || 0})}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-xs font-bold uppercase text-slate-400 tracking-widest">Global Renewal Workflow</h3>
                                    <div className="space-y-2">
                                        {localInsurance.workflowSteps.map((step, idx) => (
                                            <div key={step.id || idx} className="grid grid-cols-12 gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border dark:border-slate-700 items-center">
                                                <div className="col-span-4">
                                                    <input 
                                                        type="text" 
                                                        className="w-full bg-white dark:bg-slate-900 border dark:border-slate-700 rounded-lg p-2 text-sm"
                                                        value={step.label}
                                                        placeholder="Step Label"
                                                        onChange={(e) => {
                                                            const next = [...localInsurance.workflowSteps];
                                                            next[idx].label = e.target.value;
                                                            setLocalInsurance({...localInsurance, workflowSteps: next});
                                                        }}
                                                    />
                                                </div>
                                                <div className="col-span-2">
                                                    <input 
                                                        type="number" 
                                                        className="w-full bg-white dark:bg-slate-900 border dark:border-slate-700 rounded-lg p-2 text-sm"
                                                        value={step.offsetDays}
                                                        onChange={(e) => {
                                                            const next = [...localInsurance.workflowSteps];
                                                            next[idx].offsetDays = parseInt(e.target.value) || 0;
                                                            setLocalInsurance({...localInsurance, workflowSteps: next});
                                                        }}
                                                    />
                                                </div>
                                                <div className="col-span-2">
                                                    <select 
                                                        className="w-full bg-white dark:bg-slate-900 border dark:border-slate-700 rounded-lg p-2 text-sm"
                                                        value={step.type}
                                                        onChange={(e) => {
                                                            const next = [...localInsurance.workflowSteps];
                                                            next[idx].type = e.target.value as 'prior' | 'after';
                                                            setLocalInsurance({...localInsurance, workflowSteps: next});
                                                        }}
                                                    >
                                                        <option value="prior">Days Prior</option>
                                                        <option value="after">Days After</option>
                                                    </select>
                                                </div>
                                                <div className="col-span-3 flex gap-2 justify-center">
                                                    <label className="flex items-center gap-2 text-[10px] font-bold cursor-pointer">
                                                        <input 
                                                            type="checkbox" 
                                                            checked={step.isBcOnly}
                                                            onChange={(e) => {
                                                                const next = [...localInsurance.workflowSteps];
                                                                next[idx].isBcOnly = e.target.checked;
                                                                setLocalInsurance({...localInsurance, workflowSteps: next});
                                                            }}
                                                        />
                                                        BC ONLY
                                                    </label>
                                                    <label className="flex items-center gap-2 text-[10px] font-bold cursor-pointer">
                                                        <input 
                                                            type="checkbox" 
                                                            checked={step.isValuationCheck}
                                                            onChange={(e) => {
                                                                const next = [...localInsurance.workflowSteps];
                                                                next[idx].isValuationCheck = e.target.checked;
                                                                setLocalInsurance({...localInsurance, workflowSteps: next});
                                                            }}
                                                        />
                                                        VAL CHECK
                                                    </label>
                                                </div>
                                                <div className="col-span-1 flex justify-end">
                                                    <button 
                                                        onClick={() => {
                                                            const next = localInsurance.workflowSteps.filter((_, i) => i !== idx);
                                                            setLocalInsurance({...localInsurance, workflowSteps: next});
                                                        }}
                                                        className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                        <button 
                                            onClick={() => {
                                                const newStep: WorkflowStepConfig = { id: `wf_${Date.now()}`, label: 'New Step', offsetDays: 30, type: 'prior' };
                                                setLocalInsurance({...localInsurance, workflowSteps: [...localInsurance.workflowSteps, newStep]});
                                            }}
                                            className="w-full py-3 border-2 border-dashed rounded-xl text-slate-400 hover:text-pink-600 transition-all font-bold uppercase text-xs"
                                        >
                                            <Plus size={16} className="inline mr-1" /> Add Workflow Step
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border dark:border-slate-800 shadow-sm space-y-6">
                                <h2 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                                    <FileSignature size={18} className="text-pink-600" /> Disclosure Closing Paragraphs
                                </h2>
                                <p className="text-xs text-slate-400">These paragraphs appear at the end of the S146 cover letter. Select which one to use per-property in the complex's Disclosure tab.</p>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Standard (No Remediation)</label>
                                        <textarea
                                            className="w-full border dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl p-3 text-sm resize-none outline-none focus:ring-2 focus:ring-pink-500"
                                            rows={4}
                                            value={localStandardParagraph}
                                            onChange={e => setLocalStandardParagraph(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Remediation Works Applies</label>
                                        <textarea
                                            className="w-full border dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl p-3 text-sm resize-none outline-none focus:ring-2 focus:ring-pink-500"
                                            rows={4}
                                            value={localRemediationParagraph}
                                            onChange={e => setLocalRemediationParagraph(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border dark:border-slate-800 shadow-sm space-y-6">
                                <h2 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                                    <Droplets size={18} className="text-pink-600" /> Water Rate Options
                                </h2>
                                <p className="text-xs text-slate-400">Configure the water rate descriptions available for each complex. The first option is the default shown when no selection has been made.</p>
                                <div className="space-y-2">
                                    {localWaterRateOptions.map((opt, idx) => (
                                        <div key={idx} className="flex items-center gap-2 group">
                                            <input
                                                type="text"
                                                className="flex-1 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-lg p-2 text-sm dark:text-white"
                                                value={opt}
                                                onChange={e => {
                                                    const next = [...localWaterRateOptions];
                                                    next[idx] = e.target.value;
                                                    setLocalWaterRateOptions(next);
                                                }}
                                            />
                                            {idx === 0 && <span className="text-[10px] font-bold text-slate-400 uppercase whitespace-nowrap">Default</span>}
                                            {idx > 0 && (
                                                <button
                                                    onClick={() => setLocalWaterRateOptions(localWaterRateOptions.filter((_, i) => i !== idx))}
                                                    className="p-2 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    <button
                                        onClick={() => setLocalWaterRateOptions([...localWaterRateOptions, ''])}
                                        className="w-full flex items-center justify-center gap-2 p-2 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg text-slate-400 hover:text-pink-600 hover:border-pink-300 transition-all text-sm font-bold uppercase"
                                    >
                                        <Plus size={16} /> Add Option
                                    </button>
                                </div>
                            </div>

                            <div className="sticky bottom-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-t dark:border-slate-800 py-4 flex justify-end gap-3 -mx-6 px-6 mt-6 rounded-b-xl">
                                <p className="text-[10px] font-bold text-amber-600 dark:text-amber-500 flex items-center gap-1.5 flex-1"><AlertCircle size={13} /> Remember to save your compliance configuration changes.</p>
                                <button onClick={handleSaveSettings} className="bg-pink-600 hover:bg-pink-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg transition-all"><Save size={16} /> Save Compliance Config</button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'templates' && (
                        <div className="space-y-6">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white dark:bg-slate-900 p-4 rounded-xl border dark:border-slate-800 shadow-sm gap-4">
                                <div className="flex items-center gap-3">
                                    <FileText size={20} className="text-pink-600" />
                                    <h2 className="text-sm font-bold uppercase tracking-widest dark:text-white">Word Templates (.docx)</h2>
                                </div>
                                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg w-full md:w-auto">
                                    <button onClick={() => setTemplateSubTab('bc')} className={`flex-1 md:flex-none px-4 py-1.5 text-[10px] font-bold uppercase rounded-md transition-all ${templateSubTab === 'bc' ? 'bg-white dark:bg-slate-700 shadow-sm text-pink-600' : 'text-slate-400'}`}>Body Corporate</button>
                                    <button onClick={() => setTemplateSubTab('isoc')} className={`flex-1 md:flex-none px-4 py-1.5 text-[10px] font-bold uppercase rounded-md transition-all ${templateSubTab === 'isoc' ? 'bg-white dark:bg-slate-700 shadow-sm text-pink-600' : 'text-slate-400'}`}>Inc Society</button>
                                    <button onClick={() => setTemplateSubTab('disclosure')} className={`flex-1 md:flex-none px-4 py-1.5 text-[10px] font-bold uppercase rounded-md transition-all ${templateSubTab === 'disclosure' ? 'bg-white dark:bg-slate-700 shadow-sm text-pink-600' : 'text-slate-400'}`}>Disclosure & CPL</button>
                                    <button onClick={() => setTemplateSubTab('conflict')} className={`flex-1 md:flex-none px-4 py-1.5 text-[10px] font-bold uppercase rounded-md transition-all ${templateSubTab === 'conflict' ? 'bg-white dark:bg-slate-700 shadow-sm text-pink-600' : 'text-slate-400'}`}>Conflict Register</button>
                                </div>
                            </div>

                            {templateSubTab === 'bc' && (
                                <div className="space-y-2 animate-in fade-in duration-300">
                                    {renderDocxCard('noiCoverLetter', 'NOI Cover Letter')}
                                    {renderDocxCard('responseForm', 'Response Form')}
                                    {renderDocxCard('debtCollectionFlowchart', 'Debt Collection Flowchart')}
                                    {renderDocxCard('noticeOfDelegation', 'Notice of Delegation')}
                                </div>
                            )}

                            {templateSubTab === 'isoc' && (
                                <div className="space-y-2 animate-in fade-in duration-300">
                                    {renderDocxCard('noiCoverLetterIsoc', 'NOI Cover Letter')}
                                    {renderDocxCard('responseFormIsoc', 'Response Form')}
                                    {renderDocxCard('debtCollectionFlowchartIsoc', 'Debt Collection Flowchart')}
                                </div>
                            )}

                            {templateSubTab === 'disclosure' && (
                                <div className="space-y-2 animate-in fade-in duration-300">
                                    {renderDocxCard('s146', 'S146 Disclosure')}
                                    {renderDocxCard('s147', 'S147 Disclosure')}
                                    {renderDocxCard('cpl', 'CPL Template')}
                                </div>
                            )}

                            {templateSubTab === 'conflict' && (
                                <div className="space-y-4 animate-in fade-in duration-300">
                                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border dark:border-slate-800 shadow-sm space-y-4">
                                        <div className="flex items-start gap-3 border-b dark:border-slate-800 pb-4">
                                            <FileText size={20} className="text-pink-600 mt-0.5 shrink-0" />
                                            <div>
                                                <h3 className="font-bold text-sm dark:text-white">Conflict Register HTML Template</h3>
                                                <p className="text-xs text-slate-400 mt-1">This HTML template is used when downloading the Conflict Register from a complex. Use <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-pink-600">{'{{BC_NAME}}'}</code>, <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-pink-600">{'{{BC_NUMBER}}'}</code>, <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-pink-600">{'{{GENERATED_DATE}}'}</code>, and <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-pink-600">{'{{CONFLICT_REGISTER_ROWS}}'}</code> merge tags.</p>
                                            </div>
                                        </div>
                                        <textarea
                                            className="w-full border dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl p-3 text-xs font-mono resize-y outline-none focus:ring-2 focus:ring-pink-500"
                                            rows={20}
                                            value={localConflictRegisterTemplate}
                                            onChange={e => setLocalConflictRegisterTemplate(e.target.value)}
                                        />
                                        <div className="flex justify-between items-center pt-2">
                                            <button
                                                onClick={() => setLocalConflictRegisterTemplate(DEFAULT_CONFLICT_REGISTER_TEMPLATE)}
                                                className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 underline transition-colors"
                                            >
                                                Reset to default
                                            </button>
                                            <button
                                                onClick={handleSaveSettings}
                                                className="bg-pink-600 hover:bg-pink-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg transition-all"
                                            >
                                                <Save size={16} /> Save Template
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'users' && (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <div className="relative w-full max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} /><input type="text" placeholder="Search staff..." className="w-full pl-10 pr-4 py-2 border dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg text-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
                                <button onClick={() => {setEditingUser(null); setIsUserModalOpen(true);}} className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2"><UserPlus size={16} /> Add Staff</button>
                            </div>
                            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border dark:border-slate-800 overflow-hidden">
                                <table className="w-full text-left text-sm"><thead className="bg-slate-50 dark:bg-slate-800/50 text-xs uppercase font-bold text-slate-500"><tr><th className="px-6 py-4">Name</th><th className="px-6 py-4">Email</th><th className="px-6 py-4">Role</th><th className="px-6 py-4 text-right">Actions</th></tr></thead><tbody className="divide-y dark:divide-slate-800">{filteredUsers.map((u) => (<tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors text-slate-600 dark:text-slate-400"><td className="px-6 py-4 font-bold text-slate-800 dark:text-white">{u.name}</td><td className="px-6 py-4">{u.email}</td><td className="px-6 py-4 capitalize">{u.role}</td><td className="px-6 py-4 text-right"><button onClick={() => {setEditingUser(u); setIsUserModalOpen(true);}} className="p-1.5 hover:text-pink-600 transition-colors"><Edit2 size={16}/></button></td></tr>))}</tbody></table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'meetings' && (
                        <div className="space-y-6 pb-24">
                            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border dark:border-slate-800 shadow-sm space-y-4">
                                <h2 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2 border-b dark:border-slate-800 pb-4">
                                    <ClipboardCheck size={18} className="text-pink-600" /> Meeting Venues
                                </h2>
                                <p className="text-xs text-slate-400">These venues appear as dropdown options when scheduling a meeting.</p>
                                <div className="space-y-2">
                                    {localVenues.map((venue, idx) => (
                                        <div key={idx} className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border dark:border-slate-700">
                                            <input
                                                type="text"
                                                className="flex-1 bg-white dark:bg-slate-900 border dark:border-slate-700 rounded-lg p-2 text-sm"
                                                value={venue}
                                                onChange={(e) => {
                                                    const next = [...localVenues];
                                                    next[idx] = e.target.value;
                                                    setLocalVenues(next);
                                                }}
                                            />
                                            <button
                                                onClick={() => setLocalVenues(localVenues.filter((_, i) => i !== idx))}
                                                className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        className="flex-1 border dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl p-2.5 text-sm"
                                        placeholder="New venue name..."
                                        value={newVenueInput}
                                        onChange={e => setNewVenueInput(e.target.value)}
                                        onKeyDown={e => {
                                            if (e.key === 'Enter' && newVenueInput.trim()) {
                                                setLocalVenues([...localVenues, newVenueInput.trim()]);
                                                setNewVenueInput('');
                                            }
                                        }}
                                    />
                                    <button
                                        onClick={() => {
                                            if (newVenueInput.trim()) {
                                                setLocalVenues([...localVenues, newVenueInput.trim()]);
                                                setNewVenueInput('');
                                            }
                                        }}
                                        className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-sm font-bold transition-colors flex items-center gap-2"
                                    >
                                        <Plus size={16} /> Add
                                    </button>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border dark:border-slate-800 shadow-sm space-y-8">
                                <h2 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2 border-b dark:border-slate-800 pb-4">
                                    <ClipboardCheck size={18} className="text-pink-600" /> Master Meeting Checklists
                                </h2>
                                
                                {(['NOI', 'NOM', 'PRIOR_TO_MEETING', 'AFTER_MEETING'] as const).map(stage => {
                                    const stageLabel = { NOI: 'NOI', NOM: 'NOM', PRIOR_TO_MEETING: 'Prior to Meeting', AFTER_MEETING: 'After Meeting' }[stage];
                                    return (
                                    <div key={stage} className="space-y-4">
                                        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center justify-between">
                                            <span>Stage: {stageLabel}</span>
                                        </h3>
                                        <div className="space-y-2">
                                            {localChecklists[stage].map((item, idx) => (
                                                <div key={item.id} className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border dark:border-slate-700 group">
                                                    <input
                                                        type="text"
                                                        className="flex-1 bg-white dark:bg-slate-900 border dark:border-slate-700 rounded-lg p-2 text-sm"
                                                        value={item.label}
                                                        onChange={(e) => {
                                                            const next = {...localChecklists};
                                                            next[stage][idx].label = e.target.value;
                                                            setLocalChecklists(next);
                                                        }}
                                                    />
                                                    <button
                                                        onClick={() => {
                                                            const next = {...localChecklists};
                                                            next[stage] = next[stage].filter((_, i) => i !== idx);
                                                            setLocalChecklists(next);
                                                        }}
                                                        className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            ))}
                                            <button
                                                onClick={() => {
                                                    const next = {...localChecklists};
                                                    next[stage] = [...next[stage], { id: `${stage.toLowerCase()}_${Date.now()}`, label: 'New Requirement' }];
                                                    setLocalChecklists(next);
                                                }}
                                                className="w-full py-2 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-slate-400 hover:text-pink-600 transition-all font-bold uppercase text-[10px]"
                                            >
                                                <PlusCircle size={14} className="inline mr-1" /> Add requirement to {stageLabel}
                                            </button>
                                        </div>
                                    </div>
                                    );
                                })}
                            </div>
                            <div className="sticky bottom-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-t dark:border-slate-800 py-4 flex justify-end gap-3 -mx-6 px-6 mt-6 rounded-b-xl">
                                <p className="text-[10px] font-bold text-amber-600 dark:text-amber-500 flex items-center gap-1.5 flex-1"><AlertCircle size={13} /> Remember to save your meeting configuration changes.</p>
                                <button onClick={handleSaveSettings} className="bg-pink-600 hover:bg-pink-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg transition-all"><Save size={16} /> Save Meetings Config</button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'diagnostics' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                {[
                                    { label: 'Total Complexes', val: complexes.length, icon: <Building />, color: 'pink' },
                                    { label: 'System Users', val: users.length, icon: <Users />, color: 'blue' },
                                    { label: 'Active Contractors', val: contractors.length, icon: <HardHat />, color: 'emerald' },
                                    { label: 'Log Entries', val: filteredComplexes.reduce((acc, c) => acc + (c.meetings?.length || 0), 0), icon: <Activity />, color: 'amber' }
                                ].map((stat, i) => (
                                    <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-xl border dark:border-slate-800 shadow-sm">
                                        <div className="flex items-center gap-4">
                                            <div className={`p-2 rounded-lg bg-${stat.color}-50 text-${stat.color}-600 dark:bg-${stat.color}-950/30`}>{stat.icon}</div>
                                            <div>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{stat.label}</p>
                                                <p className="text-xl font-bold dark:text-white">{stat.val}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border dark:border-slate-800 shadow-sm space-y-6">
                                <h2 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2 text-red-600">
                                    <AlertTriangle size={18} /> Danger Zone
                                </h2>
                                <p className="text-sm text-slate-500">System initialization and destructive actions. Use with extreme caution.</p>
                                <div className="p-6 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-4">
                                    <div>
                                        <h3 className="font-bold text-red-700 dark:text-red-400">Initialize / Reset System Data</h3>
                                        <p className="text-xs text-red-600/70">Wipes current configuration and restores factory default data and templates.</p>
                                    </div>
                                    <button 
                                        onClick={() => {
                                            if (window.confirm("CRITICAL WARNING: This will overwrite system settings and add demo data. Are you absolutely sure?")) {
                                                initializeDummyData();
                                            }
                                        }}
                                        className="bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-xl font-bold text-xs uppercase shadow-lg flex items-center gap-2 transition-all"
                                    >
                                        <Database size={16} /> Reset Database
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                    {activeTab === 'data' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                            {/* CSV */}
                            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border dark:border-slate-800 shadow-sm space-y-5">
                                <h2 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                                    <FileText size={18} className="text-pink-600" /> Complex Data — CSV
                                </h2>
                                <p className="text-xs text-slate-500">Export all complex details to a spreadsheet. Edit values, then re-upload to update multiple records at once. Matched by BC Number — cannot create new complexes via CSV.</p>

                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Export</p>
                                    <button onClick={handleCsvExport} className="flex items-center gap-2 px-4 py-2.5 bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold rounded-xl transition-colors">
                                        <Download size={14} /> Download Complexes CSV
                                    </button>
                                    <p className="text-[10px] text-slate-400 mt-1.5">{complexes.length} complexes · {CSV_COLUMNS.length} columns</p>
                                </div>

                                <div className="border-t dark:border-slate-800 pt-5 space-y-3">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Import / Update</p>
                                    <label className="flex items-center justify-center gap-2 w-full p-3 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer hover:border-pink-500 hover:bg-pink-50 dark:hover:bg-pink-900/10 transition-all">
                                        <Upload size={15} className="text-slate-400" />
                                        <span className="text-xs font-bold text-slate-500 uppercase">Choose CSV File</span>
                                        <input type="file" accept=".csv" className="hidden" onChange={handleCsvImportFile} />
                                    </label>

                                    {csvErrors.length > 0 && (
                                        <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-xl space-y-1">
                                            {csvErrors.map((err, i) => <p key={i} className="text-xs text-red-600 dark:text-red-400">{err}</p>)}
                                        </div>
                                    )}
                                    {csvSuccess && (
                                        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 rounded-xl">
                                            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">{csvSuccess}</p>
                                        </div>
                                    )}
                                    {csvPreview !== null && csvPreview.length === 0 && !csvErrors.length && (
                                        <p className="text-xs text-slate-400 italic">No changes detected in uploaded CSV.</p>
                                    )}
                                    {csvPreview && csvPreview.length > 0 && (
                                        <div className="space-y-3">
                                            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                                {csvPreview.length} complex{csvPreview.length !== 1 ? 'es' : ''} will be updated &nbsp;·&nbsp; {csvPreview.reduce((a, r) => a + r.changes.length, 0)} field change{csvPreview.reduce((a, r) => a + r.changes.length, 0) !== 1 ? 's' : ''}
                                            </p>
                                            <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
                                                {csvPreview.map(row => (
                                                    <div key={row.id} className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3">
                                                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{row.name} <span className="font-normal text-slate-400">BC {row.bcNumber}</span></p>
                                                        <div className="mt-1.5 space-y-1">
                                                            {row.changes.map(ch => (
                                                                <div key={ch.field} className="flex items-baseline gap-1.5 text-[11px]">
                                                                    <span className="text-slate-400 shrink-0 w-36 truncate">{ch.field}</span>
                                                                    <span className="text-red-500 line-through shrink-0">{ch.oldValue}</span>
                                                                    <span className="text-slate-400 shrink-0">→</span>
                                                                    <span className="text-emerald-600 dark:text-emerald-400">{ch.newValue}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            <button onClick={handleApplyCsvChanges} disabled={csvImporting} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-colors">
                                                {csvImporting ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                                                Apply Changes
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* JSON Backup */}
                            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border dark:border-slate-800 shadow-sm space-y-5">
                                <h2 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                                    <Database size={18} className="text-pink-600" /> Full System Backup — JSON
                                </h2>
                                <p className="text-xs text-slate-500">Download a complete backup of all complexes, users, contractors, and system settings. Use for disaster recovery or data migration.</p>
                                <p className="text-[10px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-lg p-2.5">
                                    Note: Meeting history is stored in Firestore subcollections and is not included in this backup.
                                </p>

                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Backup</p>
                                    <button onClick={handleJsonExport} className="flex items-center gap-2 px-4 py-2.5 bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold rounded-xl transition-colors">
                                        <Download size={14} /> Download Full Backup
                                    </button>
                                    <p className="text-[10px] text-slate-400 mt-1.5">{complexes.length} complexes · {users.length} users · {contractors.length} contractors</p>
                                </div>

                                <div className="border-t dark:border-slate-800 pt-5 space-y-3">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Restore</p>
                                    <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-xl">
                                        <p className="text-xs font-bold text-amber-700 dark:text-amber-400">Warning</p>
                                        <p className="text-xs text-amber-600 dark:text-amber-500 mt-0.5">Restoring merges backup data into Firestore. Existing records with the same IDs will be overwritten. This cannot be undone.</p>
                                    </div>
                                    <label className="flex items-center justify-center gap-2 w-full p-3 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer hover:border-pink-500 hover:bg-pink-50 dark:hover:bg-pink-900/10 transition-all">
                                        <Upload size={15} className="text-slate-400" />
                                        <span className="text-xs font-bold text-slate-500 uppercase">Upload Backup JSON</span>
                                        <input type="file" accept=".json" className="hidden" onChange={handleJsonRestoreFile} />
                                    </label>

                                    {jsonError && (
                                        <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-xl">
                                            <p className="text-xs text-red-600 dark:text-red-400">{jsonError}</p>
                                        </div>
                                    )}
                                    {jsonSuccess && (
                                        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 rounded-xl">
                                            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">{jsonSuccess}</p>
                                        </div>
                                    )}
                                    {jsonPreview && (
                                        <div className="space-y-3">
                                            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 space-y-2">
                                                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Backup Contents</p>
                                                {jsonPreview.exportedAt !== 'Unknown' && (
                                                    <p className="text-[10px] text-slate-400">Exported {new Date(jsonPreview.exportedAt).toLocaleString('en-NZ')}</p>
                                                )}
                                                <div className="flex flex-wrap gap-4 mt-1">
                                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{jsonPreview.complexes} <span className="text-xs font-normal text-slate-400">complexes</span></span>
                                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{jsonPreview.users} <span className="text-xs font-normal text-slate-400">users</span></span>
                                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{jsonPreview.contractors} <span className="text-xs font-normal text-slate-400">contractors</span></span>
                                                    {jsonPreview.hasSettings && <span className="text-xs font-bold text-emerald-600">✓ settings</span>}
                                                </div>
                                            </div>
                                            <button onClick={handleConfirmJsonRestore} disabled={jsonRestoring} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-colors">
                                                {jsonRestoring ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                                                Restore from Backup
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                        </div>
                    )}
                </div>
            )}

            {isUserModalOpen && <UserEditModal user={editingUser} onClose={() => setIsUserModalOpen(false)} onSave={async (u) => { if (editingUser) await updateUser(u); else await addUser({ ...u, id: `user_${Date.now()}` }); setIsUserModalOpen(false); }} />}
        </div>
    );
};

export default AdminPanel;
