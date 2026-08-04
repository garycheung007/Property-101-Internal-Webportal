
import React, { useState, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Receipt, Clock, CheckCircle2, Loader2, Plus, AlertTriangle, X, Trash2, Edit2, RotateCcw, ChevronDown, ChevronRight, Calendar, FileText, ThumbsUp, ThumbsDown, Play, CheckSquare, AlertCircle } from 'lucide-react';

const parseFyeDate = (fyeStr: string, year: number): Date | null => {
    const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const parts = fyeStr.trim().split(' ');
    if (parts.length !== 2) return null;
    const day = parseInt(parts[0]);
    const monthIdx = months.findIndex(m => m.toLowerCase() === parts[1].toLowerCase());
    if (monthIdx === -1 || isNaN(day)) return null;
    return new Date(year, monthIdx, day);
};

const Financial: React.FC = () => {
    const { user } = useAuth();
    const { invoices, markInvoiceRecovered, addInvoice, deleteInvoice, restoreInvoice, unrecoverInvoice, complexes, pricingTiers, updateComplex, systemSettings, loadMeetings } = useData();
    const [activeTab, setActiveTab] = useState<'invoices' | 'fye'>('invoices');

    // FYE Schedule state
    const [altDateInputId, setAltDateInputId] = useState<string | null>(null);
    const [altDateValue, setAltDateValue] = useState('');
    const [fyeUpdatingId, setFyeUpdatingId] = useState<string | null>(null);

    useEffect(() => { loadMeetings(); }, [loadMeetings]);
    const [invoiceFilterComplex, setInvoiceFilterComplex] = useState('all');
    const [invoiceFilterDocType, setInvoiceFilterDocType] = useState('all');
    const [recoveringId, setRecoveringId] = useState<string | null>(null);
    const [confirmRecoverId, setConfirmRecoverId] = useState<string | null>(null);
    const [showDeletedSection, setShowDeletedSection] = useState(false);

    // Delete modal
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    const [deleteReason, setDeleteReason] = useState('');
    const [deleting, setDeleting] = useState(false);

    // Restore
    const [restoringId, setRestoringId] = useState<string | null>(null);

    // Un-recover modal
    const [confirmUnrecoverId, setConfirmUnrecoverId] = useState<string | null>(null);
    const [unrecoverReason, setUnrecoverReason] = useState('');
    const [unrecovering, setUnrecovering] = useState(false);

    // Create invoice modal
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createComplexId, setCreateComplexId] = useState('');
    const [createDocType, setCreateDocType] = useState<'S146' | 'S147' | 'CPL' | 'Other'>('S146');
    const [createUnitRef, setCreateUnitRef] = useState('');
    const [createDescription, setCreateDescription] = useState('');
    const [createDescriptionCustomized, setCreateDescriptionCustomized] = useState(false);
    const [createTierId, setCreateTierId] = useState('');
    const [createCustomAmount, setCreateCustomAmount] = useState('');
    const [creating, setCreating] = useState(false);
    const [createError, setCreateError] = useState('');

    if (!user) return <Navigate to="/" replace />;

    const canDeleteRestore = user.role === 'admin' || user.role === 'accounts';

    const activeInvoices = invoices.filter(i => !i.deletedAt);
    const outstandingInvoices = activeInvoices
        .filter(inv => !inv.recoveredAt)
        .filter(inv => invoiceFilterComplex === 'all' || inv.complexId === invoiceFilterComplex)
        .filter(inv => invoiceFilterDocType === 'all' || inv.documentType === invoiceFilterDocType)
        .sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime());

    const recoveredInvoices = activeInvoices
        .filter(inv => !!inv.recoveredAt)
        .filter(inv => invoiceFilterComplex === 'all' || inv.complexId === invoiceFilterComplex)
        .filter(inv => invoiceFilterDocType === 'all' || inv.documentType === invoiceFilterDocType)
        .sort((a, b) => new Date(b.recoveredAt!).getTime() - new Date(a.recoveredAt!).getTime());

    const deletedInvoices = invoices
        .filter(inv => !!inv.deletedAt)
        .sort((a, b) => new Date(b.deletedAt!).getTime() - new Date(a.deletedAt!).getTime());

    const totalOutstanding = activeInvoices.filter(i => !i.recoveredAt).reduce((s, i) => s + i.amountInclGst, 0);
    const totalRecovered   = activeInvoices.filter(i => !!i.recoveredAt).reduce((s, i) => s + i.amountInclGst, 0);

    const handleMarkRecovered = async (invoiceId: string) => {
        setRecoveringId(invoiceId);
        try { await markInvoiceRecovered(invoiceId, user?.name || 'Unknown'); }
        finally { setRecoveringId(null); setConfirmRecoverId(null); }
    };

    const handleDeleteInvoice = async () => {
        if (!confirmDeleteId || !deleteReason.trim()) return;
        setDeleting(true);
        try { await deleteInvoice(confirmDeleteId, deleteReason.trim(), user?.name || 'Unknown'); }
        finally { setDeleting(false); setConfirmDeleteId(null); setDeleteReason(''); }
    };

    const handleRestoreInvoice = async (invoiceId: string) => {
        setRestoringId(invoiceId);
        try { await restoreInvoice(invoiceId); }
        finally { setRestoringId(null); }
    };

    const handleUnrecoverInvoice = async () => {
        if (!confirmUnrecoverId || !unrecoverReason.trim()) return;
        setUnrecovering(true);
        try { await unrecoverInvoice(confirmUnrecoverId, unrecoverReason.trim()); }
        finally { setUnrecovering(false); setConfirmUnrecoverId(null); setUnrecoverReason(''); }
    };

    // FYE Schedule data
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const defaultLeadWeeks = systemSettings.financialStatementLeadTimeWeeks ?? 3;

    const fyeRows = complexes
        .filter(c => !c.isArchived && c.financialYearEnd)
        .map(bc => {
            const fyeThisYear = parseFyeDate(bc.financialYearEnd, today.getFullYear());
            if (!fyeThisYear) return null;
            const daysFromThisYearFye = (fyeThisYear.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
            const upcomingFYE = daysFromThisYearFye < -90
                ? parseFyeDate(bc.financialYearEnd, today.getFullYear() + 1)!
                : fyeThisYear;
            const lastFYE = new Date(upcomingFYE);
            lastFYE.setFullYear(lastFYE.getFullYear() - 1);
            const fyeYear = upcomingFYE.getFullYear();
            const daysUntilFYE = Math.ceil((upcomingFYE.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            const agmMeetings = (bc.meetings || []).filter(m => m.type === 'AGM' && new Date(m.date) >= lastFYE);
            const hasAgm = agmMeetings.length > 0;
            const agmDate = agmMeetings.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0]?.date;
            const isCycleDataCurrent = bc.agmCycleYear === fyeYear;
            return { bc, upcomingFYE, fyeYear, daysUntilFYE, hasAgm, agmDate, isCycleDataCurrent };
        })
        .filter(Boolean) as { bc: typeof complexes[0]; upcomingFYE: Date; fyeYear: number; daysUntilFYE: number; hasAgm: boolean; agmDate?: string; isCycleDataCurrent: boolean }[];

    // Sort: overdue no-AGM first, then upcoming no-AGM, then by FYE date
    fyeRows.sort((a, b) => {
        const aCritical = a.daysUntilFYE < 0 && !a.hasAgm ? 0 : !a.hasAgm ? 1 : 2;
        const bCritical = b.daysUntilFYE < 0 && !b.hasAgm ? 0 : !b.hasAgm ? 1 : 2;
        if (aCritical !== bCritical) return aCritical - bCritical;
        return a.daysUntilFYE - b.daysUntilFYE;
    });

    const fyeActionCount = fyeRows.filter(r => !r.hasAgm && r.daysUntilFYE <= 30).length;

    const handleFyeConfirm = async (bc: typeof complexes[0]) => {
        setFyeUpdatingId(bc.id);
        try { await updateComplex({ ...bc, agmCycleFinancialsConfirmedByAccounts: true, agmCycleFinancialsAltDate: undefined }); }
        finally { setFyeUpdatingId(null); }
    };

    const handleFyeAltDate = async (bc: typeof complexes[0]) => {
        if (!altDateValue) return;
        setFyeUpdatingId(bc.id);
        try {
            await updateComplex({ ...bc, agmCycleFinancialsAltDate: altDateValue, agmCycleFinancialsConfirmedByAccounts: false });
            setAltDateInputId(null);
            setAltDateValue('');
        } finally { setFyeUpdatingId(null); }
    };

    const handleFyeMarkStatus = async (bc: typeof complexes[0], status: 'in_progress' | 'done') => {
        setFyeUpdatingId(bc.id);
        try { await updateComplex({ ...bc, agmCycleFinancialsStatus: status }); }
        finally { setFyeUpdatingId(null); }
    };

    const handleFyeAcceptAlt = async (bc: typeof complexes[0]) => {
        setFyeUpdatingId(bc.id);
        try {
            await updateComplex({ ...bc, agmCycleFinancialsNeededBy: bc.agmCycleFinancialsAltDate, agmCycleFinancialsAltDate: undefined, agmCycleFinancialsConfirmedByAccounts: false });
        } finally { setFyeUpdatingId(null); }
    };

    const fmtCurrency = (n: number) => `$${n.toLocaleString('en-NZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('en-NZ');

    const activeTier = pricingTiers.find(t => t.id === createTierId);
    const createAmount = createDocType === 'Other'
        ? createCustomAmount
        : createTierId === 'other'
            ? createCustomAmount
            : (activeTier ? String(activeTier.amountExclGst) : '');
    const createComplex = complexes.find(c => c.id === createComplexId);
    const autoDescription = createUnitRef.trim()
        ? `${createDocType} - Unit ${createUnitRef.trim()}`
        : createDocType;
    const displayDescription = createDescriptionCustomized ? createDescription : autoDescription;

    const handleCreateInvoice = async () => {
        if (!createComplex || !createAmount || parseFloat(createAmount) <= 0 || !createUnitRef.trim() || !displayDescription.trim()) {
            setCreateError('Please fill in all fields including description.');
            return;
        }
        setCreateError('');
        setCreating(true);
        try {
            const exclGst = parseFloat(createAmount);
            const gst = parseFloat((exclGst * 0.15).toFixed(2));
            await addInvoice({
                date: new Date().toISOString().split('T')[0],
                complexId: createComplex.id,
                complexName: createComplex.name,
                bcNumber: createComplex.bcNumber,
                documentType: createDocType,
                unitReference: createUnitRef.trim(),
                details: displayDescription.trim(),
                amountExclGst: exclGst,
                gstAmount: gst,
                amountInclGst: parseFloat((exclGst + gst).toFixed(2)),
                generatedBy: user?.name || 'Unknown',
                generatedAt: new Date().toISOString(),
            });
            setShowCreateModal(false);
            setCreateComplexId('');
            setCreateDocType('S146');
            setCreateUnitRef('');
            setCreateDescription('');
            setCreateDescriptionCustomized(false);
            setCreateTierId('');
            setCreateCustomAmount('');
        } finally {
            setCreating(false);
        }
    };

    const confirmInvoice = invoices.find(i => i.id === confirmRecoverId);
    const deleteInvoiceObj = invoices.find(i => i.id === confirmDeleteId);
    const unrecoverInvoiceObj = invoices.find(i => i.id === confirmUnrecoverId);

    const InvoiceTable: React.FC<{
        rows: typeof outstandingInvoices;
        showRecover?: boolean;
        showDelete?: boolean;
    }> = ({ rows, showRecover, showDelete }) => (
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-[10px] uppercase font-bold text-slate-500 tracking-widest">
                    <tr>
                        <th className="px-4 py-3">Invoice No.</th>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">BC Number</th>
                        <th className="px-4 py-3">BC / IS Name</th>
                        <th className="px-4 py-3">Unit</th>
                        <th className="px-4 py-3">Type</th>
                        <th className="px-4 py-3">Description</th>
                        <th className="px-4 py-3 text-right">Excl. GST</th>
                        <th className="px-4 py-3 text-right">GST</th>
                        <th className="px-4 py-3 text-right">Incl. GST</th>
                        <th className="px-4 py-3">Generated By</th>
                        {showRecover && <th className="px-4 py-3">Recover</th>}
                        {showDelete && <th className="px-4 py-3"></th>}
                    </tr>
                </thead>
                <tbody className="divide-y dark:divide-slate-800">
                    {rows.map(inv => (
                        <tr key={inv.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                            <td className="px-4 py-3 font-mono text-xs font-bold text-pink-600 dark:text-pink-400 whitespace-nowrap">{inv.invoiceNumber || '—'}</td>
                            <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{fmtDate(inv.date || inv.generatedAt)}</td>
                            <td className="px-4 py-3 font-mono text-xs text-slate-500">{inv.bcNumber}</td>
                            <td className="px-4 py-3 font-bold text-slate-800 dark:text-white text-xs">{inv.complexName}</td>
                            <td className="px-4 py-3 text-xs font-mono text-slate-600 dark:text-slate-300">{inv.unitReference}</td>
                            <td className="px-4 py-3">
                                <span className="px-2 py-0.5 bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400 rounded text-[10px] font-bold uppercase">{inv.documentType}</span>
                            </td>
                            <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400 max-w-[180px] truncate" title={inv.details}>{inv.details || '—'}</td>
                            <td className="px-4 py-3 text-right font-mono text-xs">{fmtCurrency(inv.amountExclGst)}</td>
                            <td className="px-4 py-3 text-right font-mono text-xs text-slate-500">{fmtCurrency(inv.gstAmount)}</td>
                            <td className="px-4 py-3 text-right font-mono text-xs font-bold text-emerald-600">{fmtCurrency(inv.amountInclGst)}</td>
                            <td className="px-4 py-3">
                                <div className="text-xs font-medium dark:text-white">{inv.generatedBy}</div>
                                <div className="text-[10px] text-slate-400">{fmtDate(inv.generatedAt)}</div>
                            </td>
                            {showRecover && (
                                <td className="px-4 py-3">
                                    <button
                                        onClick={() => setConfirmRecoverId(inv.id)}
                                        disabled={recoveringId === inv.id}
                                        title="Mark as recovered"
                                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${confirmRecoverId === inv.id ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300 dark:border-slate-600 hover:border-emerald-500'}`}
                                    >
                                        {recoveringId === inv.id
                                            ? <Loader2 size={10} className="animate-spin text-white" />
                                            : confirmRecoverId === inv.id
                                                ? <CheckCircle2 size={10} className="text-white" />
                                                : null}
                                    </button>
                                </td>
                            )}
                            {showDelete && (
                                <td className="px-4 py-3">
                                    {canDeleteRestore && (
                                        <button
                                            onClick={() => { setConfirmDeleteId(inv.id); setDeleteReason(''); }}
                                            title="Delete invoice"
                                            className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Financial</h1>
                {activeTab === 'invoices' && (
                    <div className="flex items-center gap-3">
                        <div className="flex gap-2 text-xs">
                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-amber-700 dark:text-amber-400 font-bold">
                                <Clock size={12} /> Outstanding: {fmtCurrency(totalOutstanding)}
                            </div>
                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg text-emerald-700 dark:text-emerald-400 font-bold">
                                <CheckCircle2 size={12} /> Recovered: {fmtCurrency(totalRecovered)}
                            </div>
                        </div>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-sm"
                        >
                            <Plus size={14} /> Create Invoice
                        </button>
                    </div>
                )}
            </div>

            {/* Tab bar */}
            <div className="flex gap-1 bg-slate-100 dark:bg-slate-800/60 p-1 rounded-xl w-fit">
                <button
                    onClick={() => setActiveTab('invoices')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-colors ${activeTab === 'invoices' ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                >
                    <Receipt size={13} /> On-Charge Invoices
                </button>
                <button
                    onClick={() => setActiveTab('fye')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-colors ${activeTab === 'fye' ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                >
                    <Calendar size={13} /> FYE Schedule
                    {fyeActionCount > 0 && (
                        <span className="px-1.5 py-0.5 text-[9px] font-bold bg-red-500 text-white rounded-full leading-none">{fyeActionCount}</span>
                    )}
                </button>
            </div>

            {/* FYE Schedule Tab */}
            {activeTab === 'fye' && (
                <div className="space-y-4">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        Tracks the AGM scheduling cycle and financial statement preparation for each complex. Managers use the Dashboard to start the process; accounts confirm dates and update status here.
                    </p>
                    {fyeRows.length === 0 ? (
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border dark:border-slate-800 shadow-sm p-10 text-center text-slate-400">
                            <Calendar size={28} className="mx-auto mb-2 opacity-20" />
                            <p className="text-sm">No active complexes with a financial year end date.</p>
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border dark:border-slate-800 shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50 dark:bg-slate-800/50 text-[10px] uppercase font-bold text-slate-500 tracking-widest">
                                        <tr>
                                            <th className="px-4 py-3">Property</th>
                                            <th className="px-4 py-3">FYE Date</th>
                                            <th className="px-4 py-3">AGM Scheduled</th>
                                            <th className="px-4 py-3">Financials Needed By</th>
                                            <th className="px-4 py-3">Status</th>
                                            <th className="px-4 py-3">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y dark:divide-slate-800">
                                        {fyeRows.map(({ bc, upcomingFYE, fyeYear, daysUntilFYE, hasAgm, agmDate, isCycleDataCurrent }) => {
                                            const isOverdue = daysUntilFYE < 0 && !hasAgm;
                                            const isUrgent = daysUntilFYE <= 30 && daysUntilFYE >= 0 && !hasAgm;
                                            const financialsBy = isCycleDataCurrent ? bc.agmCycleFinancialsNeededBy : undefined;
                                            const altDate = isCycleDataCurrent ? bc.agmCycleFinancialsAltDate : undefined;
                                            const confirmedByAccounts = isCycleDataCurrent && bc.agmCycleFinancialsConfirmedByAccounts;
                                            const finStatus = isCycleDataCurrent ? bc.agmCycleFinancialsStatus : undefined;
                                            const notes = isCycleDataCurrent ? bc.agmCycleFinancialsNotes : undefined;
                                            const isAccounts = user?.role === 'accounts' || user?.role === 'admin';
                                            const isManager = user?.role === 'admin' || user?.role === 'account_manager';
                                            const isLoading = fyeUpdatingId === bc.id;
                                            const defaultBy = new Date(upcomingFYE.getTime() + defaultLeadWeeks * 7 * 24 * 60 * 60 * 1000);

                                            let statusBadge: React.ReactNode;
                                            if (finStatus === 'done') {
                                                statusBadge = <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"><CheckCircle2 size={9} />Ready</span>;
                                            } else if (finStatus === 'in_progress') {
                                                statusBadge = <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"><Play size={9} />In Progress</span>;
                                            } else if (altDate) {
                                                statusBadge = <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800"><AlertCircle size={9} />Alt. Date Proposed</span>;
                                            } else if (confirmedByAccounts) {
                                                statusBadge = <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800"><ThumbsUp size={9} />Date Confirmed</span>;
                                            } else if (financialsBy) {
                                                statusBadge = <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"><Clock size={9} />Date Requested</span>;
                                            } else if (!hasAgm) {
                                                statusBadge = isOverdue
                                                    ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800"><AlertCircle size={9} />No AGM Scheduled</span>
                                                    : <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">Not Started</span>;
                                            } else {
                                                statusBadge = <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">Not Started</span>;
                                            }

                                            return (
                                                <tr key={bc.id} className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors ${isOverdue ? 'bg-red-50/30 dark:bg-red-950/10' : isUrgent ? 'bg-amber-50/20 dark:bg-amber-950/10' : ''}`}>
                                                    <td className="px-4 py-3">
                                                        <div className="font-bold text-slate-800 dark:text-white text-xs">{bc.name}</div>
                                                        <div className="text-[10px] text-slate-400 font-mono">{bc.bcNumber}</div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">{bc.financialYearEnd} {fyeYear}</div>
                                                        {isOverdue && <div className="text-[10px] text-red-500 font-bold">{Math.abs(daysUntilFYE)}d overdue</div>}
                                                        {isUrgent && <div className="text-[10px] text-amber-500 font-bold">in {daysUntilFYE}d</div>}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        {agmDate
                                                            ? <div className="text-xs text-slate-700 dark:text-slate-200">{new Date(agmDate + 'T00:00:00').toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                                                            : <span className="text-[10px] text-slate-400 italic">Not scheduled</span>}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        {financialsBy
                                                            ? <div>
                                                                <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">{new Date(financialsBy + 'T00:00:00').toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                                                                {altDate && <div className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">Alt: {new Date(altDate + 'T00:00:00').toLocaleDateString('en-NZ', { day: 'numeric', month: 'short' })}</div>}
                                                                {notes && <div className="text-[10px] text-slate-400 mt-0.5 max-w-[140px] truncate" title={notes}>{notes}</div>}
                                                              </div>
                                                            : <span className="text-[10px] text-slate-400 italic">Suggested: {defaultBy.toLocaleDateString('en-NZ', { day: 'numeric', month: 'short' })}</span>}
                                                    </td>
                                                    <td className="px-4 py-3">{statusBadge}</td>
                                                    <td className="px-4 py-3">
                                                        {isLoading ? (
                                                            <Loader2 size={14} className="animate-spin text-slate-400" />
                                                        ) : (
                                                            <div className="flex flex-col gap-1.5">
                                                                {/* Manager: accept alt date */}
                                                                {isManager && altDate && (
                                                                    <button onClick={() => handleFyeAcceptAlt(bc)} className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition-colors whitespace-nowrap">
                                                                        <ThumbsUp size={9} /> Accept {new Date(altDate + 'T00:00:00').toLocaleDateString('en-NZ', { day: 'numeric', month: 'short' })}
                                                                    </button>
                                                                )}
                                                                {/* Accounts: confirm date */}
                                                                {isAccounts && financialsBy && !confirmedByAccounts && !altDate && finStatus !== 'done' && finStatus !== 'in_progress' && (
                                                                    <div className="flex flex-col gap-1">
                                                                        <button onClick={() => handleFyeConfirm(bc)} className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors whitespace-nowrap">
                                                                            <ThumbsUp size={9} /> Confirm Date
                                                                        </button>
                                                                        {altDateInputId === bc.id ? (
                                                                            <div className="flex gap-1">
                                                                                <input type="date" value={altDateValue} onChange={e => setAltDateValue(e.target.value)} className="text-[10px] border dark:border-slate-700 dark:bg-slate-800 rounded-lg px-1.5 py-1 outline-none w-28" />
                                                                                <button onClick={() => handleFyeAltDate(bc)} disabled={!altDateValue} className="text-[10px] font-bold px-2 py-1 rounded-lg bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-40 transition-colors">Send</button>
                                                                                <button onClick={() => { setAltDateInputId(null); setAltDateValue(''); }} className="text-[10px] px-1.5 py-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><X size={10} /></button>
                                                                            </div>
                                                                        ) : (
                                                                            <button onClick={() => { setAltDateInputId(bc.id); setAltDateValue(''); }} className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors whitespace-nowrap">
                                                                                <ThumbsDown size={9} /> Can't Make It
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                )}
                                                                {/* Accounts: mark in progress */}
                                                                {isAccounts && confirmedByAccounts && finStatus !== 'in_progress' && finStatus !== 'done' && (
                                                                    <button onClick={() => handleFyeMarkStatus(bc, 'in_progress')} className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors whitespace-nowrap">
                                                                        <Play size={9} /> Start Work
                                                                    </button>
                                                                )}
                                                                {/* Accounts: mark done */}
                                                                {isAccounts && finStatus === 'in_progress' && (
                                                                    <button onClick={() => handleFyeMarkStatus(bc, 'done')} className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors whitespace-nowrap">
                                                                        <CheckSquare size={9} /> Mark Done
                                                                    </button>
                                                                )}
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'invoices' && (<>

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
                <select
                    value={invoiceFilterComplex}
                    onChange={e => setInvoiceFilterComplex(e.target.value)}
                    className="rounded-xl border dark:border-slate-700 dark:bg-slate-800 dark:text-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                >
                    <option value="all">All Properties</option>
                    {[...new Map(activeInvoices.map(i => [i.complexId, i])).values()].sort((a, b) => a.complexName.localeCompare(b.complexName)).map(i => (
                        <option key={i.complexId} value={i.complexId}>{i.bcNumber} — {i.complexName}</option>
                    ))}
                </select>
                <select
                    value={invoiceFilterDocType}
                    onChange={e => setInvoiceFilterDocType(e.target.value)}
                    className="rounded-xl border dark:border-slate-700 dark:bg-slate-800 dark:text-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                >
                    <option value="all">All Types</option>
                    <option value="S146">S146</option>
                    <option value="S147">S147</option>
                    <option value="CPL">CPL</option>
                    <option value="Other">Other</option>
                </select>
            </div>

            {/* Outstanding */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="px-5 py-3 border-b dark:border-slate-800 flex items-center gap-2">
                    <Clock size={14} className="text-amber-500" />
                    <h2 className="text-xs font-bold uppercase tracking-widest text-slate-600 dark:text-slate-300">Outstanding</h2>
                    <span className="ml-auto text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-full">{outstandingInvoices.length}</span>
                </div>
                {outstandingInvoices.length === 0 ? (
                    <div className="p-10 text-center text-slate-400">
                        <Receipt size={28} className="mx-auto mb-2 opacity-20" />
                        <p className="text-sm">No outstanding invoices.</p>
                    </div>
                ) : (
                    <InvoiceTable rows={outstandingInvoices} showRecover showDelete />
                )}
            </div>

            {/* Recovered */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="px-5 py-3 border-b dark:border-slate-800 flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-emerald-500" />
                    <h2 className="text-xs font-bold uppercase tracking-widest text-slate-600 dark:text-slate-300">Recovered</h2>
                    <span className="ml-auto text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">{recoveredInvoices.length}</span>
                </div>
                {recoveredInvoices.length === 0 ? (
                    <div className="p-10 text-center text-slate-400">
                        <CheckCircle2 size={28} className="mx-auto mb-2 opacity-20" />
                        <p className="text-sm">No recovered invoices yet.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 dark:bg-slate-800/50 text-[10px] uppercase font-bold text-slate-500 tracking-widest">
                                <tr>
                                    <th className="px-4 py-3">Invoice No.</th>
                                    <th className="px-4 py-3">Date</th>
                                    <th className="px-4 py-3">BC Number</th>
                                    <th className="px-4 py-3">BC / IS Name</th>
                                    <th className="px-4 py-3">Unit</th>
                                    <th className="px-4 py-3">Type</th>
                                    <th className="px-4 py-3">Description</th>
                                    <th className="px-4 py-3 text-right">Incl. GST</th>
                                    <th className="px-4 py-3">Recovered By</th>
                                    <th className="px-4 py-3"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y dark:divide-slate-800">
                                {recoveredInvoices.map(inv => (
                                    <tr key={inv.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="px-4 py-3 font-mono text-xs font-bold text-pink-600 dark:text-pink-400 whitespace-nowrap">{inv.invoiceNumber || '—'}</td>
                                        <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{fmtDate(inv.date || inv.generatedAt)}</td>
                                        <td className="px-4 py-3 font-mono text-xs text-slate-500">{inv.bcNumber}</td>
                                        <td className="px-4 py-3 font-bold text-slate-800 dark:text-white text-xs">{inv.complexName}</td>
                                        <td className="px-4 py-3 text-xs font-mono text-slate-600 dark:text-slate-300">{inv.unitReference}</td>
                                        <td className="px-4 py-3">
                                            <span className="px-2 py-0.5 bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400 rounded text-[10px] font-bold uppercase">{inv.documentType}</span>
                                        </td>
                                        <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400 max-w-[180px] truncate" title={inv.details}>{inv.details || '—'}</td>
                                        <td className="px-4 py-3 text-right font-mono text-xs font-bold text-emerald-600">{fmtCurrency(inv.amountInclGst)}</td>
                                        <td className="px-4 py-3">
                                            <div className="text-xs font-medium dark:text-white">{inv.recoveredBy}</div>
                                            <div className="text-[10px] text-slate-400">{fmtDate(inv.recoveredAt!)}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => { setConfirmUnrecoverId(inv.id); setUnrecoverReason(''); }}
                                                    title="Un-recover invoice"
                                                    className="p-1.5 text-slate-400 hover:text-amber-500 transition-colors"
                                                >
                                                    <RotateCcw size={14} />
                                                </button>
                                                {canDeleteRestore && (
                                                    <button
                                                        onClick={() => { setConfirmDeleteId(inv.id); setDeleteReason(''); }}
                                                        title="Delete invoice"
                                                        className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Deleted invoices — admin + accounts only */}
            {canDeleteRestore && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-red-100 dark:border-red-900/30 shadow-sm overflow-hidden">
                    <button
                        onClick={() => setShowDeletedSection(v => !v)}
                        className="w-full px-5 py-3 flex items-center gap-2 hover:bg-red-50/50 dark:hover:bg-red-900/10 transition-colors"
                    >
                        {showDeletedSection ? <ChevronDown size={14} className="text-red-400" /> : <ChevronRight size={14} className="text-red-400" />}
                        <Trash2 size={14} className="text-red-400" />
                        <h2 className="text-xs font-bold uppercase tracking-widest text-red-500">Deleted Invoices</h2>
                        <span className="ml-auto text-[10px] font-bold text-red-500 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-full">{deletedInvoices.length}</span>
                    </button>
                    {showDeletedSection && (
                        deletedInvoices.length === 0 ? (
                            <div className="p-10 text-center text-slate-400 border-t dark:border-slate-800">
                                <p className="text-sm">No deleted invoices.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto border-t dark:border-slate-800">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-red-50/50 dark:bg-red-900/10 text-[10px] uppercase font-bold text-slate-500 tracking-widest">
                                        <tr>
                                            <th className="px-4 py-3">Invoice No.</th>
                                            <th className="px-4 py-3">Date</th>
                                            <th className="px-4 py-3">BC Number</th>
                                            <th className="px-4 py-3">BC / IS Name</th>
                                            <th className="px-4 py-3">Unit</th>
                                            <th className="px-4 py-3">Type</th>
                                            <th className="px-4 py-3">Description</th>
                                            <th className="px-4 py-3 text-right">Incl. GST</th>
                                            <th className="px-4 py-3">Deleted By</th>
                                            <th className="px-4 py-3">Reason</th>
                                            <th className="px-4 py-3"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y dark:divide-slate-800">
                                        {deletedInvoices.map(inv => (
                                            <tr key={inv.id} className="opacity-70 hover:opacity-100 transition-opacity">
                                                <td className="px-4 py-3 font-mono text-xs font-bold text-slate-400 whitespace-nowrap">{inv.invoiceNumber || '—'}</td>
                                                <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">{fmtDate(inv.date || inv.generatedAt)}</td>
                                                <td className="px-4 py-3 font-mono text-xs text-slate-400">{inv.bcNumber}</td>
                                                <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">{inv.complexName}</td>
                                                <td className="px-4 py-3 text-xs font-mono text-slate-400">{inv.unitReference}</td>
                                                <td className="px-4 py-3">
                                                    <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded text-[10px] font-bold uppercase">{inv.documentType}</span>
                                                </td>
                                                <td className="px-4 py-3 text-xs text-slate-400 max-w-[140px] truncate" title={inv.details}>{inv.details || '—'}</td>
                                                <td className="px-4 py-3 text-right font-mono text-xs text-slate-400">{fmtCurrency(inv.amountInclGst)}</td>
                                                <td className="px-4 py-3">
                                                    <div className="text-xs text-slate-500">{inv.deletedBy}</div>
                                                    <div className="text-[10px] text-slate-400">{fmtDate(inv.deletedAt!)}</div>
                                                </td>
                                                <td className="px-4 py-3 text-xs text-slate-400 max-w-[140px] truncate" title={inv.deletionReason}>{inv.deletionReason || '—'}</td>
                                                <td className="px-4 py-3">
                                                    <button
                                                        onClick={() => handleRestoreInvoice(inv.id)}
                                                        disabled={restoringId === inv.id}
                                                        title="Restore invoice"
                                                        className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold uppercase text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors disabled:opacity-50"
                                                    >
                                                        {restoringId === inv.id ? <Loader2 size={10} className="animate-spin" /> : <RotateCcw size={10} />}
                                                        Restore
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )
                    )}
                </div>
            )}

            </>)}

            {/* Recover confirmation modal */}
            {confirmRecoverId && confirmInvoice && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl border dark:border-slate-800 p-6 space-y-4">
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl shrink-0">
                                <CheckCircle2 size={20} className="text-emerald-600" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800 dark:text-white">Confirm Recovery</h3>
                                <p className="text-sm text-slate-500 mt-1">Please confirm that this on-charge invoice has been recovered by Property 101:</p>
                                <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs space-y-1">
                                    <div className="flex justify-between"><span className="text-slate-400">Invoice No.</span><span className="font-mono font-bold text-pink-600 dark:text-pink-400">{confirmInvoice.invoiceNumber || '—'}</span></div>
                                    <div className="flex justify-between"><span className="text-slate-400">Property</span><span className="font-bold dark:text-white">{confirmInvoice.complexName}</span></div>
                                    <div className="flex justify-between"><span className="text-slate-400">Unit</span><span className="font-mono dark:text-white">{confirmInvoice.unitReference}</span></div>
                                    <div className="flex justify-between"><span className="text-slate-400">Type</span><span className="font-bold dark:text-white">{confirmInvoice.documentType}</span></div>
                                    <div className="flex justify-between"><span className="text-slate-400">Amount (incl. GST)</span><span className="font-mono font-bold text-emerald-600">{fmtCurrency(confirmInvoice.amountInclGst)}</span></div>
                                </div>
                                <p className="text-xs text-slate-400 mt-2">This will be logged as recovered by <strong>{user?.name}</strong> at the current time.</p>
                            </div>
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button onClick={() => setConfirmRecoverId(null)} className="flex-1 py-2.5 rounded-xl border dark:border-slate-700 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Cancel</button>
                            <button onClick={() => handleMarkRecovered(confirmRecoverId)} disabled={!!recoveringId} className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                                {recoveringId ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                                Yes, mark recovered
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Un-recover confirmation modal */}
            {confirmUnrecoverId && unrecoverInvoiceObj && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl border dark:border-slate-800 p-6 space-y-4">
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-xl shrink-0">
                                <RotateCcw size={20} className="text-amber-600" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-slate-800 dark:text-white">Un-recover Invoice</h3>
                                <p className="text-sm text-slate-500 mt-1">This will move the invoice back to Outstanding. Please enter a reason.</p>
                                <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs space-y-1">
                                    <div className="flex justify-between"><span className="text-slate-400">Invoice No.</span><span className="font-mono font-bold text-pink-600 dark:text-pink-400">{unrecoverInvoiceObj.invoiceNumber || '—'}</span></div>
                                    <div className="flex justify-between"><span className="text-slate-400">Property</span><span className="font-bold dark:text-white">{unrecoverInvoiceObj.complexName}</span></div>
                                    <div className="flex justify-between"><span className="text-slate-400">Unit</span><span className="font-mono dark:text-white">{unrecoverInvoiceObj.unitReference}</span></div>
                                    <div className="flex justify-between"><span className="text-slate-400">Amount (incl. GST)</span><span className="font-mono font-bold text-emerald-600">{fmtCurrency(unrecoverInvoiceObj.amountInclGst)}</span></div>
                                </div>
                                <div className="mt-3">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Reason <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        className="w-full border dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl p-3 text-sm"
                                        placeholder="e.g. Marked recovered in error..."
                                        value={unrecoverReason}
                                        onChange={e => setUnrecoverReason(e.target.value)}
                                        autoFocus
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button onClick={() => { setConfirmUnrecoverId(null); setUnrecoverReason(''); }} className="flex-1 py-2.5 rounded-xl border dark:border-slate-700 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Cancel</button>
                            <button onClick={handleUnrecoverInvoice} disabled={unrecovering || !unrecoverReason.trim()} className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                                {unrecovering ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />}
                                Un-recover
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete confirmation modal */}
            {confirmDeleteId && deleteInvoiceObj && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl border dark:border-slate-800 p-6 space-y-4">
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-xl shrink-0">
                                <Trash2 size={20} className="text-red-600" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-slate-800 dark:text-white">Delete Invoice</h3>
                                <p className="text-sm text-slate-500 mt-1">This invoice will be moved to the Deleted Invoices section and can be restored later.</p>
                                <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs space-y-1">
                                    <div className="flex justify-between"><span className="text-slate-400">Invoice No.</span><span className="font-mono font-bold text-pink-600 dark:text-pink-400">{deleteInvoiceObj.invoiceNumber || '—'}</span></div>
                                    <div className="flex justify-between"><span className="text-slate-400">Property</span><span className="font-bold dark:text-white">{deleteInvoiceObj.complexName}</span></div>
                                    <div className="flex justify-between"><span className="text-slate-400">Unit</span><span className="font-mono dark:text-white">{deleteInvoiceObj.unitReference}</span></div>
                                    <div className="flex justify-between"><span className="text-slate-400">Amount (incl. GST)</span><span className="font-mono font-bold text-red-600">{fmtCurrency(deleteInvoiceObj.amountInclGst)}</span></div>
                                </div>
                                <div className="mt-3">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Reason for deletion <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        className="w-full border dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl p-3 text-sm"
                                        placeholder="e.g. Duplicate entry, incorrect amount..."
                                        value={deleteReason}
                                        onChange={e => setDeleteReason(e.target.value)}
                                        autoFocus
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button onClick={() => { setConfirmDeleteId(null); setDeleteReason(''); }} className="flex-1 py-2.5 rounded-xl border dark:border-slate-700 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Cancel</button>
                            <button onClick={handleDeleteInvoice} disabled={deleting || !deleteReason.trim()} className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                                {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                Delete Invoice
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create invoice modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl border dark:border-slate-800 flex flex-col overflow-hidden">
                        <div className="p-4 border-b dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950">
                            <h3 className="font-bold text-xs uppercase tracking-widest dark:text-white flex items-center gap-2"><Receipt size={14} className="text-emerald-600" /> New On-charge Invoice</h3>
                            <button onClick={() => setShowCreateModal(false)} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors"><X size={18} /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Property</label>
                                <select
                                    className="w-full border dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                                    value={createComplexId}
                                    onChange={e => setCreateComplexId(e.target.value)}
                                >
                                    <option value="">— Select property —</option>
                                    {complexes.filter(c => !c.isArchived).sort((a, b) => a.name.localeCompare(b.name)).map(c => (
                                        <option key={c.id} value={c.id}>{c.bcNumber} — {c.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Document Type</label>
                                    <select
                                        className="w-full border dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                                        value={createDocType}
                                        onChange={e => {
                                            setCreateDocType(e.target.value as 'S146' | 'S147' | 'CPL' | 'Other');
                                            setCreateTierId('');
                                            setCreateCustomAmount('');
                                            setCreateDescriptionCustomized(false);
                                        }}
                                    >
                                        <option value="S146">S146</option>
                                        <option value="S147">S147</option>
                                        <option value="CPL">CPL</option>
                                        <option value="Other">Others</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Unit / PU</label>
                                    <input
                                        type="text"
                                        className="w-full border dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl p-3 text-sm"
                                        placeholder="e.g. 5A"
                                        value={createUnitRef}
                                        onChange={e => { setCreateUnitRef(e.target.value); setCreateDescriptionCustomized(false); }}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Description</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        className="flex-1 border dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl p-3 text-sm"
                                        placeholder="e.g. S146 - 5A"
                                        value={displayDescription}
                                        readOnly={!createDescriptionCustomized}
                                        onChange={e => setCreateDescription(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        title={createDescriptionCustomized ? 'Reset to auto' : 'Customise description'}
                                        onClick={() => {
                                            if (createDescriptionCustomized) {
                                                setCreateDescriptionCustomized(false);
                                                setCreateDescription('');
                                            } else {
                                                setCreateDescription(autoDescription);
                                                setCreateDescriptionCustomized(true);
                                            }
                                        }}
                                        className={`p-2.5 rounded-xl border transition-colors shrink-0 ${createDescriptionCustomized ? 'border-emerald-400 text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' : 'border-slate-200 dark:border-slate-700 text-slate-400 hover:text-pink-600 hover:border-pink-300'}`}
                                    >
                                        <Edit2 size={14} />
                                    </button>
                                </div>
                                {!createDescriptionCustomized && (
                                    <p className="text-[10px] text-slate-400 mt-1">Auto-filled from type and unit. Click <Edit2 size={9} className="inline" /> to customise.</p>
                                )}
                            </div>
                            {createDocType !== 'Other' ? (
                                <>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Invoice Amount</label>
                                        <select
                                            className="w-full border dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                                            value={createTierId}
                                            onChange={e => { setCreateTierId(e.target.value); setCreateCustomAmount(''); }}
                                        >
                                            <option value="">— Select amount —</option>
                                            {pricingTiers.map(t => (
                                                <option key={t.id} value={t.id}>{t.name} (${t.amountExclGst.toFixed(2)} + GST)</option>
                                            ))}
                                            <option value="other">Other (custom amount)</option>
                                        </select>
                                    </div>
                                    {createTierId === 'other' && (
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Custom Amount excl. GST ($)</label>
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                className="w-full border dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl p-3 text-sm"
                                                placeholder="e.g. 150.00"
                                                value={createCustomAmount}
                                                onChange={e => setCreateCustomAmount(e.target.value)}
                                            />
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Invoice Amount excl. GST ($)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        className="w-full border dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl p-3 text-sm"
                                        placeholder="e.g. 150.00"
                                        value={createCustomAmount}
                                        onChange={e => setCreateCustomAmount(e.target.value)}
                                    />
                                </div>
                            )}
                            {createAmount && parseFloat(createAmount) > 0 && (
                                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 text-xs space-y-1">
                                    <div className="flex justify-between"><span className="text-slate-500">Excl. GST</span><span className="font-mono font-bold dark:text-white">${parseFloat(createAmount).toFixed(2)}</span></div>
                                    <div className="flex justify-between"><span className="text-slate-500">GST (15%)</span><span className="font-mono font-bold dark:text-white">${(parseFloat(createAmount) * 0.15).toFixed(2)}</span></div>
                                    <div className="flex justify-between border-t dark:border-slate-700 pt-1 mt-1"><span className="font-bold text-slate-700 dark:text-slate-300">Incl. GST</span><span className="font-mono font-bold text-emerald-600">${(parseFloat(createAmount) * 1.15).toFixed(2)}</span></div>
                                </div>
                            )}
                            {createError && (
                                <div className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
                                    <AlertTriangle size={12} /> {createError}
                                </div>
                            )}
                            <button
                                onClick={handleCreateInvoice}
                                disabled={creating || !createComplexId || !createUnitRef.trim() || !createAmount || parseFloat(createAmount) <= 0}
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold uppercase text-xs shadow-md flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                            >
                                {creating ? <Loader2 size={16} className="animate-spin" /> : <Receipt size={16} />}
                                Create Invoice
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Financial;
