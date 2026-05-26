
import React, { useState, useEffect, useRef } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { BodyCorporate, User, UserRole, ComplexType, SystemSettings, Contractor, ContractorCategory, InsuranceSettings, WorkflowStepConfig, MeetingChecklistItem, ReminderType, TemplateFileRecord } from '../types';
import {
    Users, Building, Plus, Upload, Search, Settings,
    UserPlus, Archive, Edit2, ArchiveRestore, Save, X, Trash2, Database, ShieldCheck, Terminal,
    LayoutGrid, Loader2, HardHat, ClipboardCheck, PlusCircle, AlertTriangle, FileText,
    Activity, CheckCircle2, MinusCircle, AlertCircle
} from 'lucide-react';
import { Navigate } from 'react-router-dom';

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

const AdminPanel: React.FC = () => {
    const { user: currentUser } = useAuth();
    const { 
        complexes, managers, users, contractors, systemSettings, loading: dataLoading,
        addUser, updateUser, updateSystemSettings, initializeDummyData, toggleArchiveComplex, updateComplex
    } = useData();
    
    const [activeTab, setActiveTab] = useState<'properties' | 'contractors' | 'users' | 'settings' | 'meetings' | 'templates' | 'diagnostics'>('properties');
    const [templateSubTab, setTemplateSubTab] = useState<'bc' | 'isoc' | 'disclosure'>('bc');
    const [searchTerm, setSearchTerm] = useState('');
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    
    const [bwofMessage, setBwofMessage] = useState(systemSettings.bwofConfirmationMessage || '');

    // Local configuration states for granular tabs
    const [localInsurance, setLocalInsurance] = useState<InsuranceSettings>(systemSettings.insuranceSettings || { valuationValidityYears: 2, workflowSteps: [] });
    const [localCategories, setLocalCategories] = useState<string[]>(systemSettings.contractorCategories || []);
    const [localChecklists, setLocalChecklists] = useState(systemSettings.meetingChecklistTemplates || { NOI: [], NOM: [], COMPLETE: [] });

    // Docx template management
    const [docxTemplates, setDocxTemplates] = useState<Partial<Record<string, TemplateFileRecord>>>({});
    const [uploadingDocx, setUploadingDocx] = useState<string | null>(null);
    const docxInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

    useEffect(() => {
        if (systemSettings.bwofConfirmationMessage) setBwofMessage(systemSettings.bwofConfirmationMessage);
        if (systemSettings.insuranceSettings) setLocalInsurance(systemSettings.insuranceSettings);
        if (systemSettings.contractorCategories) setLocalCategories(systemSettings.contractorCategories);
        if (systemSettings.meetingChecklistTemplates) setLocalChecklists(systemSettings.meetingChecklistTemplates);
    }, [systemSettings]);

    useEffect(() => {
        const keys = ['noiCoverLetter', 'responseForm', 'debtCollectionFlowchart', 'noiCoverLetterIsoc', 'responseFormIsoc', 'debtCollectionFlowchartIsoc'];
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

    if (currentUser?.role !== 'admin') return <Navigate to="/" replace />;

    const handleSaveSettings = async () => {
        await updateSystemSettings({
            ...systemSettings,
            bwofConfirmationMessage: bwofMessage,
            insuranceSettings: localInsurance,
            contractorCategories: localCategories,
            meetingChecklistTemplates: localChecklists
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
                    <button onClick={handleSaveSettings} className="bg-pink-600 hover:bg-pink-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg transition-all"><Save size={18} /> Save Changes</button>
                </div>
            </div>

            <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto whitespace-nowrap bg-white dark:bg-slate-900 rounded-t-xl">
                {[
                    { id: 'properties', label: 'Properties', icon: <Building size={16}/> },
                    { id: 'contractors', label: 'Contractors', icon: <HardHat size={16}/> },
                    { id: 'users', label: 'Users', icon: <Users size={16}/> },
                    { id: 'settings', label: 'Compliance', icon: <Settings size={16}/> },
                    { id: 'templates', label: 'Templates', icon: <FileText size={16}/> },
                    { id: 'meetings', label: 'Tasks', icon: <ClipboardCheck size={16}/> },
                    { id: 'diagnostics', label: 'Diagnostics', icon: <Terminal size={16}/> }
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
                        <div className="space-y-8">
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
                                </div>
                            </div>

                            {templateSubTab === 'bc' && (
                                <div className="space-y-2 animate-in fade-in duration-300">
                                    {renderDocxCard('noiCoverLetter', 'NOI Cover Letter')}
                                    {renderDocxCard('responseForm', 'Response Form')}
                                    {renderDocxCard('debtCollectionFlowchart', 'Debt Collection Flowchart')}
                                </div>
                            )}

                            {templateSubTab === 'isoc' && (
                                <div className="space-y-2 animate-in fade-in duration-300">
                                    {renderDocxCard('noiCoverLetterIsoc', 'NOI Cover Letter')}
                                    {renderDocxCard('responseFormIsoc', 'Response Form')}
                                    {renderDocxCard('debtCollectionFlowchartIsoc', 'Debt Collection Flowchart')}
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
                        <div className="space-y-6">
                            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border dark:border-slate-800 shadow-sm space-y-8">
                                <h2 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2 border-b dark:border-slate-800 pb-4">
                                    <ClipboardCheck size={18} className="text-pink-600" /> Master Meeting Checklists
                                </h2>
                                
                                {(['NOI', 'NOM', 'COMPLETE'] as const).map(stage => (
                                    <div key={stage} className="space-y-4">
                                        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center justify-between">
                                            <span>Stage: {stage}</span>
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
                                                <PlusCircle size={14} className="inline mr-1" /> Add requirement to {stage}
                                            </button>
                                        </div>
                                    </div>
                                ))}
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
                </div>
            )}

            {isUserModalOpen && <UserEditModal user={editingUser} onClose={() => setIsUserModalOpen(false)} onSave={async (u) => { if (editingUser) await updateUser(u); else await addUser({ ...u, id: `user_${Date.now()}` }); setIsUserModalOpen(false); }} />}
        </div>
    );
};

export default AdminPanel;
