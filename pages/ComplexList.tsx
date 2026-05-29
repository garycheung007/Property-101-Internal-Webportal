
import React, { useState, useEffect, useRef } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
    Search, ShieldCheck, ShieldAlert, X, Calendar, RefreshCw, Save,
    CheckCircle2, DollarSign, Clock, MapPin, History, Plus, Trash2,
    Database, Lock, ListFilter, MessageSquareMore, ToggleRight,
    ToggleLeft, ArrowRightCircle, Check, AlertCircle, MapPinHouse,
    User, Building, HardHat, Contact, Phone, Mail, ClipboardCheck,
    Briefcase, Shield, UserCircle, PartyPopper, CalendarRange, Sparkles,
    FileSignature, Activity, AlertOctagon, Info, Pencil, ChevronRight, Droplets
} from 'lucide-react';
import { BodyCorporate, Meeting, InsuranceStepStatus, WorkflowStepConfig, MeetingChecklistItem } from '../types';

/**
 * Robust date parser that handles ISO (YYYY-MM-DD), NZ/UK (DD/MM/YYYY), 
 * and common hyphenated formats. Returns null if unparseable.
 */
const parseDateSafe = (dateStr?: string): Date | null => {
  if (!dateStr || typeof dateStr !== 'string') return null;
  
  // Try native parsing first (works for YYYY-MM-DD)
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) return d;

  // Try NZ format (DD/MM/YYYY or DD-MM-YYYY)
  const nzMatch = dateStr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (nzMatch) {
    let [_, day, month, year] = nzMatch;
    // Handle 2-digit years
    if (year.length === 2) year = '20' + year;
    const parsed = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    if (!isNaN(parsed.getTime())) return parsed;
  }
  
  return null;
};

/**
 * Formats a date string to NZ standard (DD/MM/YYYY).
 * If parsing fails, returns the raw string to avoid "Invalid Date" UI errors.
 */
const formatDateNZ = (dateStr?: string) => {
  if (!dateStr) return 'N/A';
  const parsed = parseDateSafe(dateStr);
  if (!parsed) return dateStr;
  return parsed.toLocaleDateString('en-NZ');
};

/**
 * Checks if a date is today or in the future using timestamp comparison.
 */
const isInsuranceValid = (dateStr?: string) => {
  const parsed = parseDateSafe(dateStr);
  if (!parsed) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return parsed >= today;
};

// Global helper for meeting status comparison
const isMeetingPassed = (dateStr?: string) => {
  const parsed = parseDateSafe(dateStr);
  if (!parsed) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return parsed < today;
};

/**
 * Calculates a date 21 days prior to the input string.
 */
const calculateDefaultResponseDueDate = (dateStr?: string) => {
  const parsed = parseDateSafe(dateStr);
  if (!parsed) return '';
  const result = new Date(parsed);
  result.setDate(result.getDate() - 21);
  return result.toISOString().split('T')[0];
};

const ComplexList: React.FC = () => {
  const { complexes, updateComplex, managers, initializeDummyData, updateMeeting, deleteMeeting } = useData();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterManager, setFilterManager] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const hasInitializedFilter = useRef(false);
  const [selectedComplexId, setSelectedComplexId] = useState<string | null>(null);
  const [initialModalTab, setInitialModalTab] = useState<'details' | 'insurance' | 'meetings' | 'disclosure' | 'logs' >('details');

  const selectedComplex = complexes.find(c => c.id === selectedComplexId) || null;

  useEffect(() => {
    if (!hasInitializedFilter.current && complexes.length > 0 && user) {
      const hasOwnComplexes = complexes.some(c => !c.isArchived && c.managerName === user.name);
      if (hasOwnComplexes) setFilterManager(user.name);
      hasInitializedFilter.current = true;
    }
  }, [complexes, user]);

  useEffect(() => {
    const idParam = searchParams.get('id');
    const tabParam = searchParams.get('tab');
    if (idParam) {
        setSelectedComplexId(idParam);
        if (tabParam && ['details', 'insurance', 'meetings', 'disclosure', 'logs'].includes(tabParam)) setInitialModalTab(tabParam as any);
    }
  }, [searchParams]);

  const filteredComplexes = complexes.filter(c => !c.isArchived).filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.bcNumber.toLowerCase().includes(searchTerm.toLowerCase()) || c.address.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesManager = filterManager === 'all' || c.managerName === filterManager;
        const matchesType = filterType === 'all' || c.type === filterType;
        return matchesSearch && matchesManager && matchesType;
  });

  const handleUpdate = async (updatedBc: BodyCorporate) => {
    // 1. Update main complex document (meetings array is stripped by cleanData in DataContext)
    await updateComplex(updatedBc);
    
    // 2. Synchronize meetings sub-collection
    const originalComplex = complexes.find(c => c.id === updatedBc.id);
    const originalMeetingIds = originalComplex?.meetings.map(m => m.id) || [];
    const currentMeetingIds = new Set(updatedBc.meetings?.map(m => m.id) || []);
    
    // Process Deletions
    const deletePromises = originalMeetingIds
        .filter(id => !currentMeetingIds.has(id))
        .map(id => deleteMeeting(updatedBc.id, id));
    
    // Process Updates/Additions
    const updatePromises = (updatedBc.meetings || [])
        .map(m => updateMeeting(updatedBc.id, m));

    // Await all database operations to ensure persistence before unmounting modal
    await Promise.all([...deletePromises, ...updatePromises]);

    handleCloseModal();
  };

  const handleCloseModal = () => {
    const fromDashboard = searchParams.get('from') === 'dashboard';
    setSelectedComplexId(null);
    setInitialModalTab('details');
    if (fromDashboard) {
      navigate('/');
    } else {
      setSearchParams({});
    }
  };

  return (
    <div className="space-y-6">
       <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div><h1 className="text-2xl font-bold text-slate-800 dark:text-white">Properties</h1><p className="text-slate-500">View and Update Portfolios</p></div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border dark:border-slate-800 overflow-hidden transition-colors">
        <div className="p-4 border-b dark:border-slate-800 flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full md:max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><input type="text" placeholder="Search..." className="w-full pl-10 pr-4 py-2 rounded-lg border dark:border-slate-700 dark:bg-slate-800 dark:text-white text-sm outline-none transition-all" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}/></div>
            <div className="flex gap-2 w-full md:w-auto">
                 <select className="flex-1 md:flex-none py-2 px-3 border dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg text-sm outline-none transition-all" value={filterManager} onChange={(e) => setFilterManager(e.target.value)}><option value="all">All Managers</option>{managers.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}</select>
                 <select className="flex-1 md:flex-none py-2 px-3 border dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg text-sm outline-none transition-all" value={filterType} onChange={(e) => setFilterType(e.target.value)}><option value="all">All Types</option><option value="Body Corporate">Body Corporate</option><option value="Incorporated Society">Incorporated Society</option></select>
            </div>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
                <thead className="bg-slate-50 dark:bg-slate-800 text-xs uppercase font-semibold">
                    <tr><th className="px-6 py-4">Number</th><th className="px-6 py-4">Name</th><th className="px-6 py-4">Manager</th><th className="px-6 py-4">Insurance Expiry</th><th className="px-6 py-4 text-right">Actions</th></tr>
                </thead>
                <tbody className="divide-y dark:divide-slate-800">
                    {filteredComplexes.map((bc) => (
                        <tr key={bc.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer group transition-colors" onClick={() => setSelectedComplexId(bc.id)}>
                            <td className="px-6 py-4 font-mono">{bc.bcNumber}</td>
                            <td className="px-6 py-4 font-medium text-slate-800 dark:text-white">{bc.name}</td>
                            <td className="px-6 py-4"><div className="flex items-center gap-2"><div className="w-7 h-7 rounded-full bg-pink-100 dark:bg-pink-900/40 text-pink-600 dark:text-pink-400 flex items-center justify-center text-[10px] font-bold border border-pink-200 dark:border-pink-800">{bc.managerName?.charAt(0) || '?'}</div><span className="text-xs font-medium">{bc.managerName || 'Unassigned'}</span></div></td>
                            <td className="px-6 py-4"><div className="flex items-center gap-2">{isInsuranceValid(bc.insuranceExpiry) ? <ShieldCheck size={16} className="text-emerald-500" /> : <ShieldAlert size={16} className="text-red-500" />}<span className="text-xs">{formatDateNZ(bc.insuranceExpiry)}</span></div></td>
                            <td className="px-6 py-4 text-right"><ChevronRight size={18} className="text-slate-300 group-hover:text-pink-600 transition-colors inline-block" /></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>
      {selectedComplex && <EditComplexModal complex={selectedComplex} onClose={handleCloseModal} onSave={handleUpdate} initialTab={initialModalTab} />}
    </div>
  );
};

const EditComplexModal: React.FC<{ complex: BodyCorporate; onClose: () => void; onSave: (bc: BodyCorporate) => void; initialTab?: 'details' | 'insurance' | 'meetings' | 'disclosure' | 'logs' }> = ({ complex, onClose, onSave, initialTab = 'details' }) => {
    const { contractors, actionComments, addActionComment, systemSettings, managers } = useData();
    const { user: currentUser } = useAuth();
    const [form, setForm] = useState<BodyCorporate>(complex);
    const [hasBuildingManager, setHasBuildingManager] = useState<boolean>(!!complex.buildingManagerName);
    const [activeTab, setActiveTab] = useState<'details' | 'insurance' | 'meetings' | 'disclosure' | 'logs'>(initialTab);
    const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(null);
    const [meetingForm, setMeetingForm] = useState<Partial<Meeting>>({});
    const [renewalPrompt, setRenewalPrompt] = useState<{ show: boolean, nextExpiry: string }>({ show: false, nextExpiry: '' });
    const [bwofRenewalPrompt, setBwofRenewalPrompt] = useState<{ show: boolean, pendingDate: string }>({ show: false, pendingDate: '' });
    const [feeEditing, setFeeEditing] = useState(false);
    const [venueOther, setVenueOther] = useState(false);
    const [meetingDeleteConfirm, setMeetingDeleteConfirm] = useState<string | null>(null);
    
    const brokers = contractors.filter(c => c.category === 'Insurance Broker');
    const valuers = contractors.filter(c => c.category === 'Insurance Valuer');
    const underwriters = contractors.filter(c => c.category === 'Insurance Underwriter');
    const bwofCos = contractors.filter(c => c.category === 'Compliance');
    
    const relevantComments = actionComments.filter(c => c.bcId === complex.id || c.reminderId.endsWith(complex.id)).sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    useEffect(() => { setForm(complex); }, [complex]);

    const checkStageComplete = (stage: 'NOI' | 'NOM' | 'COMPLETE', currentMeeting: Partial<Meeting>) => {
        const templates = systemSettings.meetingChecklistTemplates?.[stage] || [];
        if (templates.length === 0) return false;
        const progress = currentMeeting.checklistProgress || {};
        return templates.every(item => progress[item.id] === true);
    };

    /**
     * Finds the most recent completed AGM date based on meeting data
     */
    const getCalculatedLastAgmDate = () => {
        const agmMeetings = (form.meetings || []).filter(m => 
            (m.type === 'AGM' || m.type === 'SGM') && m.date && checkStageComplete('COMPLETE', m)
        );
        if (agmMeetings.length === 0) return null;
        
        const sorted = [...agmMeetings].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        return sorted[0].date;
    };

    const calculatedAgmDate = getCalculatedLastAgmDate();

    // Side effect to sync calculated date to form if user hasn't manually overridden it
    // or if the calculated date has changed (newly completed meeting)
    useEffect(() => {
        if (calculatedAgmDate && calculatedAgmDate !== form.previousAgmDate) {
            setForm(prev => ({ ...prev, previousAgmDate: calculatedAgmDate }));
        }
    }, [calculatedAgmDate]);

    useEffect(() => {
        const venues = systemSettings.meetingVenues || [];
        if (selectedMeetingId && venues.length > 0 && meetingForm.venue && !venues.includes(meetingForm.venue)) {
            setVenueOther(true);
        } else {
            setVenueOther(false);
        }
    }, [selectedMeetingId]);

    const handleToggleChecklistItem = (itemId: string, stage: 'NOI' | 'NOM' | 'COMPLETE') => {
        const currentProgress = meetingForm.checklistProgress || {};
        const updatedProgress = { ...currentProgress, [itemId]: !currentProgress[itemId] };
        const updatedMeeting = { ...meetingForm, checklistProgress: updatedProgress };
        updatedMeeting.noiIssued = checkStageComplete('NOI', updatedMeeting);
        updatedMeeting.nomIssued = checkStageComplete('NOM', updatedMeeting);
        updatedMeeting.minutesIssued = checkStageComplete('COMPLETE', updatedMeeting);
        setMeetingForm(updatedMeeting);
    };

    const handleSaveMeetingForm = () => {
        const currentMeetings = form.meetings || [];
        let updatedMeetings = [...currentMeetings];
        const finalMeeting = { 
            id: selectedMeetingId === 'new' ? `mtg_${Date.now()}` : selectedMeetingId!,
            type: meetingForm.type || 'AGM',
            date: meetingForm.date || '',
            time: meetingForm.time || '10:00',
            venue: meetingForm.venue || 'TBC',
            ...meetingForm
        } as Meeting;
        if (selectedMeetingId === 'new') updatedMeetings.push(finalMeeting);
        else updatedMeetings = currentMeetings.map(m => m.id === selectedMeetingId ? finalMeeting : m);
        setForm({ ...form, meetings: updatedMeetings });
        setSelectedMeetingId(null);
        setMeetingForm({});
    };

    const handleDeleteMeeting = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setMeetingDeleteConfirm(id);
    };

    const confirmDeleteMeeting = (id: string) => {
        const updatedMeetings = (form.meetings || []).filter(m => m.id !== id);
        setForm({ ...form, meetings: updatedMeetings });
        setSelectedMeetingId(null);
        setMeetingForm({});
        setMeetingDeleteConfirm(null);
    };

    const workflowSteps = systemSettings.insuranceSettings?.workflowSteps || [];
    const insuranceProgress: Record<string, InsuranceStepStatus> = form.insuranceWorkflowProgress || {};

    const toggleInsuranceStep = (stepId: string) => {
        if (!currentUser || !stepId) return;
        
        const currentIsCompleted = insuranceProgress[stepId]?.completed;
        const updatedProgress = { 
            ...insuranceProgress, 
            [stepId]: { 
                completed: !currentIsCompleted, 
                date: !currentIsCompleted ? new Date().toISOString() : undefined, 
                userId: currentUser.id, 
                userName: currentUser.name 
            } 
        };

        if (!currentIsCompleted) {
            const activeSteps = workflowSteps.filter(s => !s.isBcOnly || form.type === 'Body Corporate');
            const totalSteps = activeSteps.length;
            const completedCount = activeSteps.filter(s => s.id === stepId || updatedProgress[s.id]?.completed).length;

            if (completedCount === totalSteps) {
                let nextExpiryStr = '';
                const currentExpiry = parseDateSafe(form.insuranceExpiry);
                if (currentExpiry) {
                    const d = new Date(currentExpiry);
                    d.setFullYear(d.getFullYear() + 1);
                    nextExpiryStr = d.toISOString().split('T')[0];
                }
                setRenewalPrompt({ show: true, nextExpiry: nextExpiryStr });
            }
        }

        setForm({ ...form, insuranceWorkflowProgress: updatedProgress });
    };

    const confirmRenewal = async () => {
        if (!renewalPrompt.nextExpiry) return;
        const oldExpiry = form.insuranceExpiry;
        const newExpiry = renewalPrompt.nextExpiry;
        const updatedForm = { ...form, insuranceExpiry: newExpiry, insuranceWorkflowProgress: {} };
        if (currentUser) {
            await addActionComment(`ren-${Date.now()}`, form.id, `Insurance Renewal Completed. Portfolio advanced from ${oldExpiry} to ${newExpiry}. Workflow checklist reset for next cycle.`, currentUser);
        }
        setForm(updatedForm);
        setRenewalPrompt({ show: false, nextExpiry: '' });
    };

    const handleBwofDateChange = (newDate: string) => {
        if (!newDate) return;
        setBwofRenewalPrompt({ show: true, pendingDate: newDate });
    };

    const handleBwofRemove = async () => {
        const oldExpiry = form.bwofExpiry;
        if (currentUser) {
            await addActionComment(`bwof-rem-${Date.now()}`, form.id, `BWOF expiry removed (was ${oldExpiry || 'N/A'}).`, currentUser);
        }
        setForm(f => ({ ...f, bwofExpiry: '' }));
    };

    const confirmBwofRenewal = async () => {
        const oldExpiry = form.bwofExpiry;
        const newExpiry = bwofRenewalPrompt.pendingDate;
        const updatedForm = { ...form, bwofExpiry: newExpiry };
        if (currentUser) {
            await addActionComment(`bwof-${Date.now()}`, form.id, `BWOF Renewal Confirmed. Statutory expiry advanced from ${oldExpiry || 'N/A'} to ${newExpiry}.`, currentUser);
        }
        setForm(updatedForm);
        setBwofRenewalPrompt({ show: false, pendingDate: '' });
    };

    const sortedMeetings = [...(form.meetings || [])].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const computeMeetingDates = (dateStr: string) => {
        const mDate = new Date(dateStr);
        const shift = (days: number) => {
            const d = new Date(mDate);
            d.setDate(d.getDate() + days);
            return d.toISOString().split('T')[0];
        };
        if (form.type === 'Incorporated Society') {
            const period = form.isocNomDaysPrior || 7;
            const nomDeadDate = new Date(mDate);
            nomDeadDate.setDate(nomDeadDate.getDate() - period);
            const nomPrefDate = new Date(nomDeadDate); nomPrefDate.setDate(nomPrefDate.getDate() - 7);
            const noiDeadDate = new Date(nomDeadDate); noiDeadDate.setDate(noiDeadDate.getDate() - 7);
            const noiPrefDate = new Date(nomDeadDate); noiPrefDate.setDate(noiPrefDate.getDate() - 14);
            return {
                noiPref: noiPrefDate.toISOString().split('T')[0],
                noiDead: noiDeadDate.toISOString().split('T')[0],
                nomPref: nomPrefDate.toISOString().split('T')[0],
                nomDead: nomDeadDate.toISOString().split('T')[0],
            };
        }
        return { noiPref: shift(-35), noiDead: shift(-21), nomPref: shift(-21), nomDead: shift(-14) };
    };

    const toggleStatutoryField = (field: keyof BodyCorporate) => {
        setForm(prev => ({ ...prev, [field]: !prev[field] }));
    };

    const handleDetailChange = (field: keyof BodyCorporate, value: string) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const handleSaveWithLogs = async () => {
        if (!currentUser) { onSave(form); return; }
        const changes: string[] = [];
        if (form.managerName !== complex.managerName)
            changes.push(`Account Manager changed from "${complex.managerName || 'Unassigned'}" to "${form.managerName || 'Unassigned'}"`);
        if (form.financialYearStart !== complex.financialYearStart)
            changes.push(`FY Start changed from "${complex.financialYearStart || 'N/A'}" to "${form.financialYearStart || 'N/A'}"`);
        if (form.financialYearEnd !== complex.financialYearEnd)
            changes.push(`FY End changed from "${complex.financialYearEnd || 'N/A'}" to "${form.financialYearEnd || 'N/A'}"`);
        if (form.numberOfCommitteeMeetings !== complex.numberOfCommitteeMeetings)
            changes.push(`Contracted Committee Meetings changed from ${complex.numberOfCommitteeMeetings || 0} to ${form.numberOfCommitteeMeetings || 0}`);
        if (form.managementFee !== complex.managementFee)
            changes.push(`Management Fee changed from $${complex.managementFee || 0} to $${form.managementFee || 0}`);
        if (changes.length > 0)
            await addActionComment(`edit-${Date.now()}`, form.id, changes.join(' | '), currentUser);
        onSave(form);
    };

    return (
        <div className="fixed top-0 right-0 bottom-0 left-64 z-50 flex">
            <div className="flex-1 bg-black/40 backdrop-blur-sm" />
            <div className="bg-white dark:bg-slate-900 w-full max-w-6xl h-full overflow-hidden flex flex-col shadow-2xl border-l dark:border-slate-800">
                <div className="p-5 border-b dark:border-slate-800 flex justify-between bg-slate-50 dark:bg-slate-950">
                    <div>
                        <h2 className="text-xl font-bold dark:text-white">{form.name}</h2>
                        <p className="text-slate-500 text-xs font-mono">{form.bcNumber} • {form.address}</p>
                    </div>
                    <button onClick={onClose} className="p-2 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors"><X size={20} /></button>
                </div>
                
                <div className="flex border-b dark:border-slate-800 px-6 overflow-x-auto bg-white dark:bg-slate-900 transition-colors">
                    {[
                        { id: 'details', label: 'Details', icon: Building },
                        { id: 'insurance', label: 'Insurance', icon: ShieldCheck },
                        { id: 'meetings', label: 'Meetings', icon: Calendar },
                        { id: 'disclosure', label: 'Disclosure', icon: FileSignature },
                        { id: 'logs', label: 'History', icon: History }
                    ].map(tab => {
                        const Icon = tab.icon;
                        return (
                            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`py-3 mr-6 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${activeTab === tab.id ? 'border-pink-600 text-pink-600' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
                                <Icon size={13} />{tab.label}
                            </button>
                        );
                    })}
                </div>

                <div className="flex-1 overflow-y-auto p-8 bg-slate-50/30 dark:bg-slate-950/30 transition-colors relative">
                    {activeTab === 'details' && (
                        <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border dark:border-slate-800 space-y-5">
                                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 border-b dark:border-slate-800 pb-3">
                                    <Building size={16} className="text-pink-600" /> Portfolio & Statutory
                                    {currentUser?.role !== 'admin' && <Lock size={12} className="text-slate-400 ml-auto" />}
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Account Manager</label>
                                        {currentUser?.role === 'admin' ? (
                                            <select className="w-full border dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl p-2.5 text-sm outline-none focus:ring-1 focus:ring-pink-500" value={form.managerName || ''} onChange={e => setForm({...form, managerName: e.target.value})}>
                                                <option value="">-- Choose Manager --</option>
                                                {managers.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
                                            </select>
                                        ) : (
                                            <p className="text-sm font-medium text-slate-700 dark:text-slate-200 px-1 py-1">{form.managerName || 'Unassigned'}</p>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">FY Start</label>
                                            {currentUser?.role === 'admin' ? (
                                                <input type="text" className="w-full border dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl p-2.5 text-sm" value={form.financialYearStart || ''} onChange={e => setForm({...form, financialYearStart: e.target.value})} placeholder="e.g. 1-May" />
                                            ) : (
                                                <p className="text-sm font-medium text-slate-700 dark:text-slate-200 px-1 py-1">{form.financialYearStart || 'N/A'}</p>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">FY End</label>
                                            {currentUser?.role === 'admin' ? (
                                                <input type="text" className="w-full border dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl p-2.5 text-sm" value={form.financialYearEnd || ''} onChange={e => setForm({...form, financialYearEnd: e.target.value})} placeholder="e.g. 30-Apr" />
                                            ) : (
                                                <p className="text-sm font-medium text-slate-700 dark:text-slate-200 px-1 py-1">{form.financialYearEnd || 'N/A'}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div
                                        className="flex items-center justify-between p-3 rounded-2xl border dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 cursor-pointer select-none"
                                        onClick={() => currentUser?.role === 'admin' && setForm(f => ({ ...f, isGstRegistered: !f.isGstRegistered }))}
                                    >
                                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300">GST Registered</span>
                                        <div className={`w-12 h-6 rounded-full p-1 transition-colors ${form.isGstRegistered ? 'bg-pink-600' : 'bg-slate-300 dark:bg-slate-700'}`}>
                                            <div className={`w-4 h-4 bg-white rounded-full transition-transform ${form.isGstRegistered ? 'translate-x-6' : 'translate-x-0'}`}></div>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Management Fee (Annual)</label>
                                        {feeEditing ? (
                                            <div className="flex gap-2 items-center">
                                                <div className="relative flex-1">
                                                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                                    <input autoFocus type="number" className="w-full pl-10 border dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl p-2.5 text-sm outline-none focus:ring-1 focus:ring-pink-500" value={form.managementFee || 0} onChange={e => setForm({...form, managementFee: parseFloat(e.target.value) || 0})} placeholder="0.00" />
                                                </div>
                                                <button onClick={() => setFeeEditing(false)} className="px-3 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs font-bold transition-colors">Done</button>
                                                <button onClick={() => { setForm({...form, managementFee: complex.managementFee}); setFeeEditing(false); }} className="px-3 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors">Cancel</button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-between px-3 py-2.5 border dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800">
                                                <div className="flex items-center gap-2">
                                                    <DollarSign size={16} className="text-slate-400" />
                                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{(form.managementFee || 0).toLocaleString('en-NZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                                </div>
                                                <button onClick={() => setFeeEditing(true)} className="flex items-center gap-1.5 text-[10px] font-bold text-pink-600 hover:text-pink-700 uppercase tracking-wider transition-colors">
                                                    <Pencil size={12} /> Edit
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Contracted Committee Meetings</label>
                                        {currentUser?.role === 'admin' ? (
                                            <div className="relative">
                                                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                                <input type="number" className="w-full pl-10 border dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl p-2.5 text-sm outline-none focus:ring-1 focus:ring-pink-500" value={form.numberOfCommitteeMeetings || 0} onChange={e => setForm({...form, numberOfCommitteeMeetings: parseInt(e.target.value) || 0})} placeholder="0" />
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 px-1 py-1">
                                                <Clock size={16} className="text-slate-400" />
                                                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{form.numberOfCommitteeMeetings || 0}</p>
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <div className="flex justify-between items-center mb-1">
                                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Last AGM Date</label>
                                            {form.previousAgmDate === calculatedAgmDate && calculatedAgmDate && (
                                                <span className="flex items-center gap-1 text-[8px] font-bold text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-900/30 px-1.5 py-0.5 rounded-full animate-pulse uppercase">
                                                    <Sparkles size={8} /> Smart Value
                                                </span>
                                            )}
                                        </div>
                                        <div className="relative">
                                            <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                            <input type="date" className="w-full border dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl p-2.5 text-sm" value={form.previousAgmDate || ''} onChange={e => setForm({...form, previousAgmDate: e.target.value})} />
                                        </div>
                                        <p className="text-[9px] text-slate-400 mt-1 italic leading-tight">Syncs automatically when a meeting is marked 'Complete'. Manual entry allowed.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border dark:border-slate-800 space-y-5">
                                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 border-b dark:border-slate-800 pb-3">
                                    <Shield size={16} className="text-pink-600" /> Compliance & Insurance
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Insurance Expiry Date</label>
                                        <div className={`relative rounded-xl border-2 transition-colors ${isInsuranceValid(form.insuranceExpiry) ? 'border-slate-200 dark:border-slate-700' : 'border-pink-500 bg-pink-50/30'}`}>
                                            <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none">
                                                {isInsuranceValid(form.insuranceExpiry) ? null : <AlertCircle size={16} className="text-pink-600" />}
                                                <span className={`text-sm font-bold ${!isInsuranceValid(form.insuranceExpiry) ? 'text-pink-600' : 'text-slate-700 dark:text-slate-200'}`}>
                                                    {formatDateNZ(form.insuranceExpiry) || 'dd/mm/yyyy'}
                                                </span>
                                            </div>
                                            <input type="date" className="w-full p-2.5 text-sm opacity-0 cursor-pointer" value={form.insuranceExpiry || ''} onChange={e => setForm({...form, insuranceExpiry: e.target.value})} />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex items-center justify-between mb-1">
                                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">BWOF Expiry Date</label>
                                            {currentUser?.role === 'admin' && form.bwofExpiry && (
                                                <button type="button" onClick={handleBwofRemove} className="text-[10px] font-bold text-pink-500 hover:text-pink-700 dark:hover:text-pink-300 transition-colors">Remove</button>
                                            )}
                                        </div>
                                        <div className="relative">
                                            <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                            <input type="date" className="w-full border dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl p-2.5 text-sm cursor-pointer" value={form.bwofExpiry || ''} onChange={e => handleBwofDateChange(e.target.value)} />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Compliance Company</label>
                                        <select className="w-full border dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl p-2.5 text-sm outline-none focus:ring-1 focus:ring-pink-500" value={form.complianceCompany || ''} onChange={e => setForm({...form, complianceCompany: e.target.value})}>
                                            <option value="">-- Choose Contractor --</option>
                                            {bwofCos.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border dark:border-slate-800 space-y-5">
                                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 border-b dark:border-slate-800 pb-3">
                                    <UserCircle size={16} className="text-pink-600" /> Building Manager
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (hasBuildingManager) {
                                                setHasBuildingManager(false);
                                                setForm(f => ({ ...f, buildingManagerName: '', buildingManagerPhone: '', buildingManagerEmail: '' }));
                                            } else {
                                                setHasBuildingManager(true);
                                            }
                                        }}
                                        className="ml-auto text-[10px] font-bold text-pink-500 hover:text-pink-700 dark:hover:text-pink-300 transition-colors"
                                    >
                                        {hasBuildingManager ? 'Remove' : '+ Add'}
                                    </button>
                                </h3>
                                {hasBuildingManager ? (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Name</label>
                                            <input type="text" className="w-full border dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl p-3 text-sm" value={form.buildingManagerName || ''} onChange={e => setForm({...form, buildingManagerName: e.target.value})} />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Contact Details</label>
                                            <div className="space-y-2">
                                                <div className="relative">
                                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                                    <input type="text" className="w-full pl-10 border dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl p-2.5 text-xs" placeholder="Phone" value={form.buildingManagerPhone || ''} onChange={e => setForm({...form, buildingManagerPhone: e.target.value})} />
                                                </div>
                                                <div className="relative">
                                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                                    <input type="email" className="w-full pl-10 border dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl p-2.5 text-xs" placeholder="Email" value={form.buildingManagerEmail || ''} onChange={e => setForm({...form, buildingManagerEmail: e.target.value})} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-xs text-slate-400 italic">No building manager assigned.</p>
                                )}
                            </div>
                        </div>
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border dark:border-slate-800 space-y-3">
                            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 border-b dark:border-slate-800 pb-3">
                                <MessageSquareMore size={16} className="text-pink-600" /> Notes
                            </h3>
                            <textarea
                                className="w-full border dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl p-3 text-sm resize-none outline-none focus:ring-1 focus:ring-pink-500 min-h-[120px]"
                                placeholder="Add internal notes for this complex..."
                                value={form.notes || ''}
                                onChange={e => setForm({...form, notes: e.target.value})}
                            />
                        </div>
                        </div>
                    )}

                    {activeTab === 'insurance' && (
                        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                            <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border dark:border-slate-800 space-y-6">
                                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 border-b dark:border-slate-800 pb-4">
                                    <ShieldCheck size={16} className="text-pink-600" /> Policy Configuration
                                </h3>
                                <div className="grid grid-cols-1 gap-5">
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Underwriter</label>
                                        <select className="w-full border dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl p-2.5 text-sm" value={form.insuranceUnderwriter || ''} onChange={e => setForm({...form, insuranceUnderwriter: e.target.value})}>
                                            <option value="">-- Choose --</option>
                                            {underwriters.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Broker</label>
                                        <select className="w-full border dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl p-2.5 text-sm" value={form.insuranceBroker || ''} onChange={e => setForm({...form, insuranceBroker: e.target.value})}>
                                            <option value="">-- Choose --</option>
                                            {brokers.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Insurance Valuer</label>
                                        <select className="w-full border dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl p-2.5 text-sm" value={form.insuranceValuer || ''} onChange={e => setForm({...form, insuranceValuer: e.target.value})}>
                                            <option value="">-- Choose --</option>
                                            {valuers.map(v => <option key={v.id} value={v.name}>{v.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Valuation Date</label>
                                        <div className="relative">
                                            <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                            <input type="date" className="w-full border dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl p-2.5 text-sm" value={form.lastInsuranceValuationDate || ''} onChange={e => setForm({...form, lastInsuranceValuationDate: e.target.value})} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="lg:col-span-3 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col transition-colors relative overflow-hidden">
                                <div className="flex justify-between items-center border-b dark:border-slate-800 pb-4 mb-4">
                                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <RefreshCw size={16} className="text-pink-600" /> Renewal Workflow
                                    </h3>
                                    <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full">
                                        {Object.values(insuranceProgress).filter(p => p.completed).length}/{workflowSteps.filter(s => !s.isBcOnly || form.type === 'Body Corporate').length} Steps
                                    </span>
                                </div>
                                <div className="space-y-2 overflow-y-auto max-h-[500px] pr-2 custom-scrollbar">
                                    {workflowSteps.map(step => {
                                        if (step.isBcOnly && form.type !== 'Body Corporate') return null;
                                        const status = insuranceProgress[step.id];
                                        const isCompleted = status?.completed;
                                        return (
                                            <div key={step.id} className={`flex items-center justify-between p-3 rounded-xl border transition-all ${isCompleted ? 'bg-emerald-50/50 border-emerald-100 dark:bg-emerald-900/10 dark:border-emerald-900/30' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:border-pink-200'}`}>
                                                <div className="flex items-center gap-4">
                                                    <input 
                                                        type="checkbox" 
                                                        className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                                        checked={!!isCompleted}
                                                        onChange={() => toggleInsuranceStep(step.id)}
                                                    />
                                                    <div className="flex flex-col">
                                                        <span className={`text-sm font-bold ${isCompleted ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-200'}`}>
                                                            {step.label}
                                                        </span>
                                                        {isCompleted && status.date && (
                                                            <span className="text-[9px] font-bold text-emerald-600/60 uppercase">Completed: {new Date(status.date).toLocaleDateString()}</span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase ${step.type === 'prior' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                                                    {step.offsetDays}d {step.type}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {renewalPrompt.show && (
                                    <div className="absolute inset-0 z-20 bg-pink-600/95 flex flex-col items-center justify-center p-8 text-center animate-in fade-in slide-in-from-bottom-8 duration-300">
                                        <PartyPopper size={48} className="text-white mb-4 animate-bounce" />
                                        <h3 className="text-xl font-bold text-white mb-2">Workflow 100% Complete!</h3>
                                        <p className="text-pink-100 text-sm mb-6 max-w-xs">All statutory steps for this cycle are finished. Confirm the new policy expiry date to finalize renewal.</p>
                                        
                                        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-sm shadow-2xl space-y-4">
                                            <div className="text-left">
                                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                                                    <CalendarRange size={14} className="text-pink-600" /> New Expiry Date
                                                </label>
                                                <input 
                                                    type="date" 
                                                    className="w-full border dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl p-3 text-sm focus:ring-2 focus:ring-pink-500 outline-none"
                                                    value={renewalPrompt.nextExpiry}
                                                    onChange={e => setRenewalPrompt({ ...renewalPrompt, nextExpiry: e.target.value })}
                                                />
                                                <p className="text-[9px] text-slate-400 mt-2 italic">* This will advance the complex and clear the checklist for next year.</p>
                                            </div>
                                            <div className="flex gap-2 pt-2">
                                                <button onClick={() => setRenewalPrompt({ show: false, nextExpiry: '' })} className="flex-1 py-3 text-slate-500 font-bold text-xs uppercase hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors">Cancel</button>
                                                <button onClick={confirmRenewal} className="flex-1 bg-pink-600 hover:bg-pink-700 text-white py-3 rounded-xl font-bold text-sm shadow-lg flex items-center justify-center gap-2">
                                                    <ShieldCheck size={16} /> Finish Cycle
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'meetings' && (
                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-[500px]">
                            <div className="lg:col-span-3">
                                {selectedMeetingId ? (
                                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border dark:border-slate-800 shadow-xl space-y-6">
                                        <div className="flex justify-between items-center border-b dark:border-slate-800 pb-3">
                                            <div className="flex items-center gap-3">
                                                <h3 className="font-bold text-xs uppercase dark:text-white tracking-widest text-slate-400">{selectedMeetingId === 'new' ? 'Schedule New Meeting' : 'Meeting Details'}</h3>
                                                {meetingForm.date && isMeetingPassed(meetingForm.date) && <span className="text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded uppercase flex items-center gap-1"><Lock size={10} /> Locked</span>}
                                            </div>
                                            <button onClick={() => { setSelectedMeetingId(null); setMeetingForm({}); setMeetingDeleteConfirm(null); }} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"><X size={18}/></button>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <fieldset className="space-y-4" disabled={meetingForm.date ? isMeetingPassed(meetingForm.date) : false}>
                                                <div><label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-widest">Type</label><select className="w-full border dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl p-2.5 text-sm" value={meetingForm.type || 'AGM'} onChange={e => setMeetingForm({...meetingForm, type: e.target.value as any})}><option value="AGM">AGM</option><option value="EGM">EGM</option><option value="SGM">SGM</option><option value="Committee">Committee</option></select></div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div><label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-widest">Date</label><input type="date" className="w-full border dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl p-2.5 text-sm" value={meetingForm.date || ''} onChange={e => { const newDate = e.target.value; setMeetingForm({ ...meetingForm, date: newDate, noiResponseDueDate: calculateDefaultResponseDueDate(newDate) }); }} /></div>
                                                    <div><label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-widest">Time</label><input type="time" className="w-full border dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl p-2.5 text-sm" value={meetingForm.time || ''} onChange={e => setMeetingForm({...meetingForm, time: e.target.value})} /></div>
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-widest">Venue</label>
                                                    {(systemSettings.meetingVenues?.length ?? 0) > 0 ? (
                                                        <>
                                                            <select
                                                                className="w-full border dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl p-2.5 text-sm"
                                                                value={venueOther ? '__other__' : (meetingForm.venue || '')}
                                                                onChange={e => {
                                                                    if (e.target.value === '__other__') {
                                                                        setVenueOther(true);
                                                                        setMeetingForm({...meetingForm, venue: ''});
                                                                    } else {
                                                                        setVenueOther(false);
                                                                        setMeetingForm({...meetingForm, venue: e.target.value});
                                                                    }
                                                                }}
                                                            >
                                                                <option value="">-- Select Venue --</option>
                                                                {systemSettings.meetingVenues!.map(v => <option key={v} value={v}>{v}</option>)}
                                                                <option value="__other__">Other...</option>
                                                            </select>
                                                            {venueOther && (
                                                                <input type="text" className="w-full border dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl p-2.5 text-sm mt-2" placeholder="Enter venue..." value={meetingForm.venue || ''} onChange={e => setMeetingForm({...meetingForm, venue: e.target.value})} />
                                                            )}
                                                        </>
                                                    ) : (
                                                        <input type="text" className="w-full border dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl p-2.5 text-sm" value={meetingForm.venue || ''} onChange={e => setMeetingForm({...meetingForm, venue: e.target.value})} />
                                                    )}
                                                </div>
                                            </fieldset>
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-2 border-b dark:border-slate-800 pb-2">
                                                    <ClipboardCheck size={16} className="text-pink-600" />
                                                    <h3 className="text-xs font-bold uppercase tracking-widest dark:text-white">Compliance Checklist</h3>
                                                </div>
                                                <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                                    {(['NOI', 'NOM', 'COMPLETE'] as const).map(stage => {
                                                        const items = systemSettings.meetingChecklistTemplates?.[stage] || [];
                                                        const progress = meetingForm.checklistProgress || {};
                                                        return (
                                                            <div key={stage} className="space-y-2 p-3 rounded-2xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-700 transition-colors">
                                                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{stage}</span>
                                                                <div className="space-y-1">
                                                                    {items.map(item => (
                                                                        <label key={item.id} className="flex items-center gap-3 p-2 hover:bg-white dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors group">
                                                                            <input type="checkbox" className="rounded text-pink-600 focus:ring-pink-500 w-4 h-4" checked={progress[item.id] || false} onChange={() => handleToggleChecklistItem(item.id, stage)} disabled={meetingForm.date ? isMeetingPassed(meetingForm.date) : false} />
                                                                            <span className={`text-xs ${progress[item.id] ? 'text-slate-400 line-through' : 'text-slate-700 dark:text-slate-300'}`}>{item.label}</span>
                                                                        </label>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-2 border-b dark:border-slate-800 pb-2">
                                                    <Calendar size={16} className="text-pink-600" />
                                                    <h3 className="text-xs font-bold uppercase tracking-widest dark:text-white">Key Dates</h3>
                                                </div>
                                                {meetingForm.date && meetingForm.type !== 'Committee' ? (() => {
                                                    const dates = computeMeetingDates(meetingForm.date);
                                                    const today = new Date(); today.setHours(0,0,0,0);
                                                    const isPast = (d: string) => new Date(d) < today;
                                                    const fmt = (d: string) => new Date(d).toLocaleDateString('en-NZ');
                                                    return (
                                                        <div className="space-y-2">
                                                            {([
                                                                { label: 'NOI', pref: dates.noiPref, statutory: dates.noiDead },
                                                                { label: 'NOM', pref: dates.nomPref, statutory: dates.nomDead },
                                                            ] as const).map(row => (
                                                                <div key={row.label} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border dark:border-slate-700">
                                                                    <div className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-2">{row.label}</div>
                                                                    <div className="space-y-1.5">
                                                                        <div className="flex justify-between items-center text-xs">
                                                                            <span className="text-slate-500">Preferred</span>
                                                                            <span className={`font-mono font-bold ${isPast(row.pref) ? 'text-red-500' : 'text-slate-700 dark:text-slate-300'}`}>{fmt(row.pref)}</span>
                                                                        </div>
                                                                        <div className="flex justify-between items-center text-xs">
                                                                            <span className="text-slate-500">Statutory</span>
                                                                            <span className={`font-mono font-bold ${isPast(row.statutory) ? 'text-red-500' : 'text-amber-600 dark:text-amber-400'}`}>{fmt(row.statutory)}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border dark:border-slate-700">
                                                                <div className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-2">NOI Response Due <span className="text-pink-500 font-normal normal-case">(editable)</span></div>
                                                                <input
                                                                    type="date"
                                                                    className={`w-full border dark:border-slate-700 dark:bg-slate-800 rounded-lg px-2 py-1.5 text-xs font-mono ${meetingForm.noiResponseDueDate && isPast(meetingForm.noiResponseDueDate) ? 'text-red-500 border-red-300' : 'dark:text-white'}`}
                                                                    value={meetingForm.noiResponseDueDate || ''}
                                                                    onChange={e => setMeetingForm({...meetingForm, noiResponseDueDate: e.target.value})}
                                                                />
                                                            </div>
                                                            <div className="p-3 bg-pink-50 dark:bg-pink-900/10 rounded-xl border border-pink-200 dark:border-pink-900/30">
                                                                <div className="text-[9px] font-bold uppercase tracking-widest text-pink-400 mb-1">Meeting Date</div>
                                                                <div className="text-sm font-mono font-bold text-pink-700 dark:text-pink-400">{fmt(meetingForm.date)}</div>
                                                            </div>
                                                        </div>
                                                    );
                                                })() : (
                                                    <div className="flex flex-col items-center justify-center h-32 text-center">
                                                        <Calendar size={28} className="text-slate-200 dark:text-slate-700 mb-2" />
                                                        <p className="text-[10px] text-slate-400">Set a meeting date to see key deadlines</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="pt-4 border-t dark:border-slate-800">
                                            {meetingDeleteConfirm === selectedMeetingId && (
                                                <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-950/20 rounded-xl border border-red-100 dark:border-red-900/30 mb-3">
                                                    <span className="text-xs text-red-700 dark:text-red-400 font-medium flex-1">Remove this meeting permanently?</span>
                                                    <button onClick={() => confirmDeleteMeeting(selectedMeetingId!)} className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-colors">Delete</button>
                                                    <button onClick={() => setMeetingDeleteConfirm(null)} className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Cancel</button>
                                                </div>
                                            )}
                                            <div className="flex gap-3">
                                                {selectedMeetingId !== 'new' && !isMeetingPassed(meetingForm.date!) && (
                                                    <button onClick={(e) => handleDeleteMeeting(e, selectedMeetingId!)} className="p-4 bg-red-50 dark:bg-red-950/20 text-red-600 rounded-2xl hover:bg-red-100 dark:hover:bg-red-900/30 border border-red-100 dark:border-red-900/30 transition-colors"><Trash2 size={18}/></button>
                                                )}
                                                {!isMeetingPassed(meetingForm.date || '') && (
                                                    <button onClick={handleSaveMeetingForm} className="flex-1 bg-pink-600 hover:bg-pink-700 text-white py-4 rounded-2xl font-bold uppercase tracking-widest shadow-lg flex items-center justify-center gap-2"><Save size={18} /> Save Meeting</button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-slate-400 border-2 border-dashed dark:border-slate-800 rounded-3xl p-10 bg-white/40 dark:bg-slate-900/40">
                                        <Calendar size={48} className="opacity-20 mb-4 text-pink-500"/><h4 className="font-bold text-slate-500 mb-1">Meeting Portfolio</h4><p className="text-xs italic text-center max-w-[200px]">Select a session to view or amend compliance progress.</p>
                                    </div>
                                )}
                            </div>
                            <div className="lg:col-span-1 bg-slate-100 dark:bg-slate-800/40 rounded-3xl p-5 border dark:border-slate-700/50 flex flex-col shadow-inner overflow-hidden">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Scheduled Meetings</h3>
                                    <button onClick={() => { setMeetingForm({ type: 'AGM', date: '', time: '10:00', venue: '', checklistProgress: {} }); setVenueOther(false); setSelectedMeetingId('new'); }} className="flex items-center gap-1.5 px-3 py-1.5 bg-pink-600 hover:bg-pink-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm">
                                        <Plus size={13} /> Schedule
                                    </button>
                                </div>
                                <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                                    {sortedMeetings.map(m => {
                                        const passed = isMeetingPassed(m.date);
                                        return (
                                            <div key={m.id} onClick={() => { setMeetingForm({ ...m }); setSelectedMeetingId(m.id); }} className={`p-3 bg-white dark:bg-slate-900 rounded-xl border-2 transition-all cursor-pointer hover:shadow-md ${selectedMeetingId === m.id ? 'border-pink-500 shadow-pink-100 dark:shadow-none' : passed ? 'border-transparent opacity-70' : 'border-transparent dark:border-slate-800 hover:border-pink-200'}`}>
                                                <div className="flex justify-between text-[10px] font-bold uppercase mb-1.5"><span className={passed ? 'text-slate-500' : 'text-pink-600'}>{m.type}</span><span className="text-slate-500 font-mono">{m.date ? formatDateNZ(m.date) : 'TBC'}</span></div>
                                                <div className="flex items-center gap-1.5"><MapPinHouse size={12} className="text-slate-400" /><p className="text-xs font-bold dark:text-white truncate">{m.venue || 'TBC'}</p></div>
                                                <div className="mt-2 flex items-center justify-between">
                                                    <div className="flex gap-1">
                                                        {m.noiIssued && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="NOI Done"></div>}
                                                        {m.nomIssued && <div className="w-1.5 h-1.5 rounded-full bg-blue-500" title="NOM Done"></div>}
                                                        {passed && <Lock size={10} className="text-slate-400" />}
                                                    </div>
                                                    <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded ${passed ? 'bg-slate-100 dark:bg-slate-800 text-slate-500' : 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'}`}>{passed ? 'Passed Session' : 'Upcoming'}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'disclosure' && (
                        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300 pb-20">
                            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border dark:border-slate-800">
                                <div className="flex items-center gap-3 mb-8 border-b dark:border-slate-800 pb-5">
                                    <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900/30 rounded-2xl flex items-center justify-center text-pink-600">
                                        <FileSignature size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg dark:text-white">Statutory Disclosure Settings</h3>
                                        <p className="text-xs text-slate-500">Configure property-wide legal status for automated disclosure statements.</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                                    {/* Weathertightness Section */}
                                    <div className="space-y-6">
                                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                            <Activity size={14} className="text-pink-600" /> Weathertightness Status
                                        </h4>
                                        <div className="space-y-6">
                                            {[
                                                { field: 'weathertightnessClaimMade', detailField: 'weathertightnessClaimDetails', label: 'Claim made under UTA 2006' },
                                                { field: 'weathertightnessRemediatedWithoutClaim', detailField: 'weathertightnessRemediatedDetails', label: 'Remediated without claim/proceedings' },
                                                { field: 'weathertightnessNotRemediated', detailField: 'weathertightnessNotRemediatedDetails', label: 'Known issues - NOT remediated' }
                                            ].map(item => (
                                                <div key={item.field} className="space-y-2">
                                                    <div className="flex items-center justify-between p-3 rounded-2xl border dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 hover:bg-white dark:hover:bg-slate-900 transition-all cursor-pointer group" onClick={() => toggleStatutoryField(item.field as any)}>
                                                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{item.label}</span>
                                                        <div className={`w-12 h-6 rounded-full p-1 transition-colors ${form[item.field as keyof BodyCorporate] ? 'bg-pink-600' : 'bg-slate-300 dark:bg-slate-700'}`}>
                                                            <div className={`w-4 h-4 bg-white rounded-full transition-transform ${form[item.field as keyof BodyCorporate] ? 'translate-x-6' : 'translate-x-0'}`}></div>
                                                        </div>
                                                    </div>
                                                    {form[item.field as keyof BodyCorporate] && (
                                                        <div className="animate-in slide-in-from-top-2 duration-200">
                                                            <textarea 
                                                                placeholder={`Provide details for: ${item.label}...`}
                                                                className="w-full p-3 text-xs border-2 border-pink-100 dark:border-pink-900/30 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none dark:bg-slate-800 dark:text-white min-h-[80px]"
                                                                value={(form[item.detailField as keyof BodyCorporate] as string) || ''}
                                                                onChange={(e) => handleDetailChange(item.detailField as any, e.target.value)}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Other Defects Section */}
                                    <div className="space-y-6">
                                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                            <AlertOctagon size={14} className="text-amber-500" /> Defects & Legal
                                        </h4>
                                        <div className="space-y-6">
                                            {[
                                                { field: 'earthquakeProneIssues', detailField: 'earthquakeProneDetails', label: 'Earthquake-prone issues' },
                                                { field: 'anyOtherSignificantDefects', detailField: 'anyOtherSignificantDefectsDetails', label: 'Other significant land/building defects' },
                                                { field: 'involvedInProceedings', detailField: 'proceedingsInCourt', label: 'Involved in active court/tribunal proceedings' }
                                            ].map(item => (
                                                <div key={item.field} className="space-y-2">
                                                    <div className="flex items-center justify-between p-3 rounded-2xl border dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 hover:bg-white dark:hover:bg-slate-900 transition-all cursor-pointer group" onClick={() => toggleStatutoryField(item.field as any)}>
                                                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{item.label}</span>
                                                        <div className={`w-12 h-6 rounded-full p-1 transition-colors ${form[item.field as keyof BodyCorporate] ? 'bg-pink-600' : 'bg-slate-300 dark:bg-slate-700'}`}>
                                                            <div className={`w-4 h-4 bg-white rounded-full transition-transform ${form[item.field as keyof BodyCorporate] ? 'translate-x-6' : 'translate-x-0'}`}></div>
                                                        </div>
                                                    </div>
                                                    {form[item.field as keyof BodyCorporate] && (
                                                        <div className="animate-in slide-in-from-top-2 duration-200">
                                                            <textarea 
                                                                placeholder={`Provide details for: ${item.label}...`}
                                                                className="w-full p-3 text-xs border-2 border-pink-100 dark:border-pink-900/30 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none dark:bg-slate-800 dark:text-white min-h-[80px]"
                                                                value={(form[item.detailField as keyof BodyCorporate] as string) || ''}
                                                                onChange={(e) => handleDetailChange(item.detailField as any, e.target.value)}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-12 p-4 bg-slate-100 dark:bg-slate-800/50 rounded-2xl text-[10px] text-slate-500 italic leading-relaxed flex gap-3">
                                    <Info size={16} className="text-blue-500 flex-shrink-0" />
                                    <span>These settings provide the default "Yes/No" values for your PCDS/Disclosure packages. Details entered here will be appended to the "Yes" response in generated documents.</span>
                                </div>
                            </div>

                            {/* Water Rate */}
                            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border dark:border-slate-800">
                                <div className="flex items-center gap-3 mb-6 border-b dark:border-slate-800 pb-5">
                                    <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900/30 rounded-2xl flex items-center justify-center text-pink-600">
                                        <Droplets size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg dark:text-white">Water Rate</h3>
                                        <p className="text-xs text-slate-500">How water is charged for this complex. Used in the S146 disclosure.</p>
                                    </div>
                                </div>
                                <select
                                    className="w-full border dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-pink-500"
                                    value={form.waterRateDescription || (systemSettings.waterRateOptions?.[0] ?? '')}
                                    onChange={e => setForm(f => ({ ...f, waterRateDescription: e.target.value }))}
                                >
                                    {(systemSettings.waterRateOptions ?? ['Water rate not included in levy — unit has its own meter']).map((opt, i) => (
                                        <option key={i} value={opt}>{opt}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Closing Paragraph selector */}
                            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border dark:border-slate-800">
                                <div className="flex items-center gap-3 mb-6 border-b dark:border-slate-800 pb-5">
                                    <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900/30 rounded-2xl flex items-center justify-center text-pink-600">
                                        <FileSignature size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg dark:text-white">Closing Paragraph</h3>
                                        <p className="text-xs text-slate-500">Selects which paragraph appears at the end of the S146 cover letter.</p>
                                    </div>
                                </div>
                                <div
                                    className="flex items-center justify-between p-3 rounded-2xl border dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 hover:bg-white dark:hover:bg-slate-900 transition-all cursor-pointer mb-4"
                                    onClick={() => setForm(f => ({ ...f, remedialWorkDone: !f.remedialWorkDone }))}
                                >
                                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Has remediation works</span>
                                    <div className={`w-12 h-6 rounded-full p-1 transition-colors ${form.remedialWorkDone ? 'bg-pink-600' : 'bg-slate-300 dark:bg-slate-700'}`}>
                                        <div className={`w-4 h-4 bg-white rounded-full transition-transform ${form.remedialWorkDone ? 'translate-x-6' : 'translate-x-0'}`}></div>
                                    </div>
                                </div>
                                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 leading-relaxed italic">
                                    {form.remedialWorkDone
                                        ? (systemSettings.disclosureRemediationParagraph || 'Remediation paragraph not configured. Set it in Admin Panel → Compliance/Settings.')
                                        : (systemSettings.disclosureStandardParagraph || 'Standard paragraph not configured. Set it in Admin Panel → Compliance/Settings.')
                                    }
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'logs' && (
                        <div className="bg-white dark:bg-slate-900 rounded-xl border dark:border-slate-800 shadow-sm divide-y dark:divide-slate-800 transition-colors">
                             {relevantComments.length === 0 ? <div className="p-12 text-center text-slate-400 italic">No historical logs found.</div> : relevantComments.map(c => (
                                 <div key={c.id} className="p-4"><div className="flex justify-between text-[10px] mb-1 font-bold"><span>{c.userName}</span><span className="text-slate-400">{new Date(c.timestamp).toLocaleString('en-NZ')}</span></div><p className="text-sm dark:text-slate-300">{c.text}</p></div>
                             ))}
                        </div>
                    )}

                    {/* BWOF Confirmation Overlay */}
                    {bwofRenewalPrompt.show && (
                        <div className="absolute inset-0 z-50 bg-slate-900/80 flex flex-col items-center justify-center p-8 text-center backdrop-blur-sm animate-in fade-in duration-300">
                            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 w-full max-w-md shadow-2xl border dark:border-slate-800 space-y-6 animate-in zoom-in duration-300">
                                <div className="w-16 h-16 bg-pink-100 dark:bg-pink-900/30 rounded-full flex items-center justify-center text-pink-600 mx-auto">
                                    <ShieldAlert size={32} />
                                </div>
                                <h3 className="text-xl font-bold dark:text-white">Confirm BWOF Renewal</h3>
                                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                                    {systemSettings.bwofConfirmationMessage || "Please confirm that the BWOF renewal has been processed correctly."}
                                </p>
                                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border dark:border-slate-700 text-left">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">New Expiry Date</p>
                                    <p className="text-sm font-bold text-pink-600 font-mono">{formatDateNZ(bwofRenewalPrompt.pendingDate)}</p>
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <button onClick={() => setBwofRenewalPrompt({ show: false, pendingDate: '' })} className="flex-1 py-3 text-slate-500 font-bold text-xs uppercase hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">Cancel</button>
                                    <button onClick={confirmBwofRenewal} className="flex-1 bg-pink-600 hover:bg-pink-700 text-white py-3 rounded-xl font-bold text-xs uppercase shadow-lg transition-all flex items-center justify-center gap-2">
                                        <Check size={16} /> Confirm Update
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-5 border-t dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-between items-center transition-colors">
                    <div className="text-[10px] font-bold text-amber-600 dark:text-amber-500 flex items-center gap-2"><AlertCircle size={14} /> Unsaved changes will be lost.</div>
                    <div className="flex gap-3">
                        <button onClick={onClose} className="px-6 py-2.5 text-slate-600 dark:text-slate-300 font-bold text-sm border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Discard</button>
                        <button onClick={handleSaveWithLogs} className="px-8 py-2.5 bg-pink-600 hover:bg-pink-700 text-white rounded-xl font-bold text-sm shadow-lg flex items-center gap-2 transition-all"><Save size={18} /> Save Changes</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ComplexList;
