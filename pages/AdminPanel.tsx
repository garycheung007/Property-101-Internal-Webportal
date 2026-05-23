
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { BodyCorporate, User, UserRole, ComplexType, SystemSettings, Contractor, ContractorCategory, InsuranceSettings, WorkflowStepConfig, MeetingChecklistItem, DocumentTemplates, ReminderType } from '../types';
import { 
    Users, Building, Plus, Upload, Search, Settings, 
    UserPlus, Archive, Edit2, ArchiveRestore, Save, X, Image as ImageIcon, Trash2, Database, ShieldCheck, Terminal, FileInput, FileQuestion, ArrowUp, ArrowDown, Mail, ShieldAlert, ChevronRight, LayoutGrid, Loader2, HardHat, ClipboardCheck, MessageSquare, PlusCircle, AlertTriangle, MessageSquareMore, FileText, Bold, Italic, List, Type as TypeIcon, HelpCircle, Underline as UnderlineIcon, Heading1, Heading2, Eye, Layout, AlignLeft, AlignCenter, AlignRight, ListOrdered, ChevronDown, Download, Table, MoveVertical, FileSignature, Scissors, Activity, CheckCircle2, MinusCircle, AlertCircle
} from 'lucide-react';
import { Navigate } from 'react-router-dom';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#6366f1', '#ec4899'];

// Sub-components moved above AdminPanel to prevent "used before declaration" errors
const RichTemplateEditor: React.FC<{ title: string; value: string; onChange: (val: string) => void; description: string }> = ({ title, value, onChange, description }) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const [showTableConfig, setShowTableConfig] = useState(false);
    const [showSymbolPicker, setShowSymbolPicker] = useState(false);
    const [tableConfig, setTableConfig] = useState({ rows: 2, cols: 2, width: '100%', border: '1pt' });

    const FONTS = [
        'Calibri', 'Arial', 'Times New Roman', 'Georgia', 'Verdana', 'Tahoma', 'Trebuchet MS', 'Courier New'
    ];

    const SIZES = [
        '8pt', '9pt', '10pt', '11pt', '12pt', '14pt', '16pt', '18pt', '20pt', '24pt', '28pt', '36pt'
    ];

    const SYMBOLS = [
        { char: '☐', name: 'Square Box' },
        { char: '☑', name: 'Checked Box' },
        { char: '☒', name: 'Crossed Box' },
        { char: '§', name: 'Section' },
        { char: '©', name: 'Copyright' },
        { char: '®', name: 'Registered' },
        { char: '™', name: 'Trademark' },
        { char: '•', name: 'Bullet' },
        { char: '—', name: 'Em Dash' },
        { char: 'NZ$', name: 'NZ Dollar' }
    ];

    useEffect(() => {
        if (editorRef.current && editorRef.current.innerHTML !== value) {
            editorRef.current.innerHTML = value;
        }
    }, [value]);

    const execCommand = (command: string, value: string = '') => {
        document.execCommand(command, false, value);
        if (editorRef.current) {
            onChange(editorRef.current.innerHTML);
        }
    };

    const applyFontSize = (size: string) => {
        document.execCommand('fontSize', false, '7');
        if (editorRef.current) {
            const fontEls = Array.from(editorRef.current.querySelectorAll('font[size="7"]'));
            fontEls.forEach(el => {
                const htmlEl = el as HTMLElement;
                const span = document.createElement('span');
                span.style.fontSize = size;
                span.innerHTML = htmlEl.innerHTML;
                htmlEl.parentNode?.replaceChild(span, htmlEl);
            });

            const spanEls = Array.from(editorRef.current.querySelectorAll('span'));
            spanEls.forEach(el => {
                const htmlEl = el as HTMLElement;
                if (htmlEl.style.fontSize === 'xxx-large' || htmlEl.style.fontSize === '48px') {
                    htmlEl.style.fontSize = size;
                }
            });
            onChange(editorRef.current.innerHTML);
        }
    };

    const insertSymbol = (char: string) => {
        execCommand('insertHTML', char);
        setShowSymbolPicker(false);
    };

    const insertTable = () => {
        const { rows, cols, width, border } = tableConfig;
        const bStyle = border === 'none' ? 'none' : `solid #000 ${border}`;
        const tableLayout = width === '100%' ? 'table-layout: fixed;' : '';
        const minWidth = width === '100%' ? 'min-width: 100%;' : '';
        const displayStyle = width === '100%' ? 'display: table;' : '';
        
        let tableHtml = `<table style="border-collapse: collapse; width: ${width}; ${minWidth} ${tableLayout} ${displayStyle} margin-bottom: 10pt; border: ${bStyle};"><tbody>`;
        for(let i=0; i<rows; i++) {
            tableHtml += '<tr>';
            for(let j=0; j<cols; j++) {
                tableHtml += `<td style="border: ${bStyle}; padding: 5pt; height: 20pt; vertical-align: top;"></td>`;
            }
            tableHtml += '</tr>';
        }
        tableHtml += '</tbody></table>';
        
        execCommand('insertHTML', tableHtml);
        setShowTableConfig(false);
    };

    const handleTableAction = (action: 'add-row' | 'delete-row') => {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return;
        
        let node = selection.anchorNode;
        while (node && node !== editorRef.current) {
            if (node.nodeName === 'TR') break;
            node = node.parentNode;
        }
        
        if (node && node.nodeName === 'TR') {
            if (action === 'add-row') {
                const newRow = node.cloneNode(true) as HTMLTableRowElement;
                Array.from(newRow.cells).forEach(cell => {
                    const htmlCell = cell as HTMLElement;
                    htmlCell.innerHTML = '';
                    // Ensure it has some height if it was empty
                    if (!htmlCell.style.height) htmlCell.style.height = '20pt';
                });
                node.parentNode?.insertBefore(newRow, node.nextSibling);
            } else if (action === 'delete-row') {
                const parent = node.parentNode;
                node.parentNode?.removeChild(node);
                // If the table body is now empty, remove the table too? 
                // Usually better to leave it to the user to delete the table if they want.
            }
            
            if (editorRef.current) {
                onChange(editorRef.current.innerHTML);
            }
        } else {
            // If not in a row, maybe alert or just do nothing
            // For better UX, we could try to find the nearest table
        }
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border dark:border-slate-800 shadow-sm overflow-hidden flex flex-col transition-colors relative">
            <style>{`
                .editor-content table { border-collapse: collapse; margin-bottom: 1rem; }
                .editor-content td { border: 1px solid #cbd5e1; padding: 8px; min-height: 24px; }
                .dark .editor-content td { border-color: #334155; }
                .editor-content .page-break { pointer-events: none; user-select: none; }
            `}</style>
            <div className="p-5 border-b dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/50">
                <div className="space-y-1">
                    <h3 className="font-bold text-slate-800 dark:text-white text-sm uppercase tracking-widest">{title}</h3>
                    <p className="text-[10px] text-slate-500 italic">{description}</p>
                </div>
            </div>
            
            <div className="bg-white dark:bg-slate-900 border-b dark:border-slate-800 p-2 flex flex-wrap items-center gap-1 sticky top-0 z-10 transition-colors">
                <select className="h-8 bg-transparent border border-slate-200 dark:border-slate-700 rounded px-2 text-[10px] font-bold uppercase tracking-tighter outline-none focus:ring-1 focus:ring-pink-500 dark:bg-slate-800 dark:text-slate-200 min-w-[100px]" onChange={(e) => execCommand('fontName', e.target.value)} defaultValue="Calibri"><option value="" disabled>Font</option>{FONTS.map(f => <option key={f} value={f}>{f}</option>)}</select>
                <select className="h-8 bg-transparent border border-slate-200 dark:border-slate-700 rounded px-2 text-[10px] font-bold uppercase tracking-tighter outline-none focus:ring-1 focus:ring-pink-500 dark:bg-slate-800 dark:text-slate-200 min-w-[60px]" onChange={(e) => applyFontSize(e.target.value)} defaultValue="11pt"><option value="" disabled>Size</option>{SIZES.map(s => <option key={s} value={s}>{s}</option>)}</select>
                <div className="w-px h-6 bg-slate-200 dark:bg-slate-800 mx-1"></div>
                <button title="Bold" onClick={() => execCommand('bold')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors text-slate-600 dark:text-slate-400"><Bold size={16}/></button>
                <button title="Italic" onClick={() => execCommand('italic')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors text-slate-600 dark:text-slate-400"><Italic size={16}/></button>
                <button title="Underline" onClick={() => execCommand('underline')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors text-slate-600 dark:text-slate-400"><UnderlineIcon size={16}/></button>
                <div className="w-px h-6 bg-slate-200 dark:bg-slate-800 mx-1"></div>
                <button title="Heading 1" onClick={() => execCommand('formatBlock', 'h1')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors text-slate-600 dark:text-slate-400 font-bold">H1</button>
                <button title="Heading 2" onClick={() => execCommand('formatBlock', 'h2')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors text-slate-600 dark:text-slate-400 font-bold">H2</button>
                <div className="w-px h-6 bg-slate-200 dark:bg-slate-800 mx-1"></div>
                <button title="List" onClick={() => execCommand('insertUnorderedList')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors text-slate-600 dark:text-slate-400"><List size={16}/></button>
                <button title="Ordered List" onClick={() => execCommand('insertOrderedList')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors text-slate-600 dark:text-slate-400"><ListOrdered size={16}/></button>
                <div className="w-px h-6 bg-slate-200 dark:bg-slate-800 mx-1"></div>
                <button title="Align Left" onClick={() => execCommand('justifyLeft')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors text-slate-600 dark:text-slate-400"><AlignLeft size={16}/></button>
                <button title="Align Center" onClick={() => execCommand('justifyCenter')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors text-slate-600 dark:text-slate-400"><AlignCenter size={16}/></button>
                <button title="Align Right" onClick={() => execCommand('justifyRight')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors text-slate-600 dark:text-slate-400"><AlignRight size={16}/></button>
                <div className="w-px h-6 bg-slate-200 dark:bg-slate-800 mx-1"></div>
                <button title="Insert Symbol" onClick={() => setShowSymbolPicker(!showSymbolPicker)} className={`p-2 rounded transition-colors flex items-center justify-center ${showSymbolPicker ? 'bg-pink-100 text-pink-600' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'}`}><TypeIcon size={16}/></button>
                <button title="Insert Table" onClick={() => setShowTableConfig(true)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors text-slate-600 dark:text-slate-400"><Table size={16}/></button>
                <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg px-1">
                    <button title="Add Row Below" onClick={() => handleTableAction('add-row')} className="p-2 hover:text-pink-600 transition-colors text-slate-500 dark:text-slate-400"><PlusCircle size={14}/></button>
                    <button title="Delete Current Row" onClick={() => handleTableAction('delete-row')} className="p-2 hover:text-red-600 transition-colors text-slate-500 dark:text-slate-400"><MinusCircle size={14}/></button>
                </div>
                <button 
                    title="Insert Page Break" 
                    onClick={() => {
                        const snippet = `<div class="page-break" style="page-break-after: always; mso-special-character:page-break; border-top: 2px dashed #db2777; margin: 24pt 0; position: relative; height: 0;" contenteditable="false"><span style="position: absolute; top: -10px; left: 50%; transform: translateX(-50%); background: #fdf2f8; border: 1px solid #db2777; padding: 2px 10px; font-size: 8pt; color: #db2777; font-weight: bold; font-family: sans-serif; border-radius: 4px; white-space: nowrap;">PAGE BREAK</span></div>`;
                        execCommand('insertHTML', snippet);
                    }} 
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors text-slate-600 dark:text-slate-400"
                >
                    <Scissors size={16}/>
                </button>
            </div>

            {showSymbolPicker && (
                <div className="absolute top-[105px] left-2 z-50 bg-white dark:bg-slate-800 shadow-2xl border dark:border-slate-700 rounded-xl p-3 grid grid-cols-5 gap-1 animate-in slide-in-from-top-2 duration-150">
                    {SYMBOLS.map(s => (<button key={s.char} onClick={() => insertSymbol(s.char)} title={s.name} className="w-10 h-10 flex items-center justify-center text-xl hover:bg-pink-50 dark:hover:bg-pink-900/30 rounded-lg transition-colors text-slate-700 dark:text-slate-200">{s.char}</button>))}
                </div>
            )}

            {showTableConfig && (
                <div className="absolute inset-0 z-50 bg-white/90 dark:bg-slate-900/95 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border dark:border-slate-700 p-6 w-full max-w-sm animate-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-4 border-b dark:border-slate-700 pb-2"><h4 className="text-xs font-bold uppercase tracking-widest dark:text-white">Table Config</h4><button onClick={() => setShowTableConfig(false)} className="text-slate-400 hover:text-slate-600"><X size={18}/></button></div>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Rows</label><input type="number" min="1" max="50" className="w-full border dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded p-2 text-sm outline-none" value={tableConfig.rows} onChange={e => setTableConfig({...tableConfig, rows: parseInt(e.target.value) || 1})} /></div>
                                <div><label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Cols</label><input type="number" min="1" max="10" className="w-full border dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded p-2 text-sm outline-none" value={tableConfig.cols} onChange={e => setTableConfig({...tableConfig, cols: parseInt(e.target.value) || 1})} /></div>
                            </div>
                            <button onClick={insertTable} className="w-full bg-pink-600 hover:bg-pink-700 text-white py-3 rounded-xl text-xs font-bold uppercase shadow-lg flex items-center justify-center gap-2"><Plus size={16} /> Insert Table</button>
                        </div>
                    </div>
                </div>
            )}

            <div 
                ref={editorRef}
                contentEditable
                onInput={(e) => onChange(e.currentTarget.innerHTML)}
                className="editor-content min-h-[350px] p-8 text-sm outline-none focus:ring-1 focus:ring-pink-500/20 bg-white dark:bg-slate-900 dark:text-slate-200 prose dark:prose-invert max-w-none custom-scrollbar overflow-y-auto"
                style={{ fontFamily: 'Calibri, sans-serif' }}
            />
        </div>
    );
};

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
    const [docTemplates, setDocTemplates] = useState<DocumentTemplates>(systemSettings.documentTemplates || { noiLetter: '', responseForm: '', s146: '', s147: '', cpl: '' });
    const [paragraphSpacing, setParagraphSpacing] = useState(systemSettings.paragraphSpacing !== undefined ? systemSettings.paragraphSpacing : 10);
    const [headerImage, setHeaderImage] = useState(systemSettings.headerImageUrl || '');
    const [footerImage, setFooterImage] = useState(systemSettings.footerImageUrl || '');

    // Local configuration states for granular tabs
    const [localInsurance, setLocalInsurance] = useState<InsuranceSettings>(systemSettings.insuranceSettings || { valuationValidityYears: 2, workflowSteps: [] });
    const [localCategories, setLocalCategories] = useState<string[]>(systemSettings.contractorCategories || []);
    const [localChecklists, setLocalChecklists] = useState(systemSettings.meetingChecklistTemplates || { NOI: [], NOM: [], COMPLETE: [] });

    useEffect(() => {
        if (systemSettings.bwofConfirmationMessage) setBwofMessage(systemSettings.bwofConfirmationMessage);
        if (systemSettings.documentTemplates) setDocTemplates(systemSettings.documentTemplates);
        if (systemSettings.headerImageUrl) setHeaderImage(systemSettings.headerImageUrl);
        if (systemSettings.footerImageUrl) setFooterImage(systemSettings.footerImageUrl);
        if (systemSettings.paragraphSpacing !== undefined) setParagraphSpacing(systemSettings.paragraphSpacing);
        if (systemSettings.insuranceSettings) setLocalInsurance(systemSettings.insuranceSettings);
        if (systemSettings.contractorCategories) setLocalCategories(systemSettings.contractorCategories);
        if (systemSettings.meetingChecklistTemplates) setLocalChecklists(systemSettings.meetingChecklistTemplates);
    }, [systemSettings]);

    if (currentUser?.role !== 'admin') return <Navigate to="/" replace />;

    const handleSaveSettings = async () => {
        await updateSystemSettings({ 
            ...systemSettings, 
            bwofConfirmationMessage: bwofMessage,
            documentTemplates: docTemplates,
            paragraphSpacing: paragraphSpacing,
            headerImageUrl: headerImage,
            footerImageUrl: footerImage,
            insuranceSettings: localInsurance,
            contractorCategories: localCategories,
            meetingChecklistTemplates: localChecklists
        });
        alert("System settings updated successfully.");
    };

    const handleAssetUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'header' | 'footer') => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = reader.result as string;
                if (type === 'header') setHeaderImage(base64);
                else setFooterImage(base64);
            };
            reader.readAsDataURL(file);
        }
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
                                    <h2 className="text-sm font-bold uppercase tracking-widest dark:text-white">Master Document Templates</h2>
                                </div>
                                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg w-full md:w-auto">
                                    <button onClick={() => setTemplateSubTab('bc')} className={`flex-1 md:flex-none px-4 py-1.5 text-[10px] font-bold uppercase rounded-md transition-all ${templateSubTab === 'bc' ? 'bg-white dark:bg-slate-700 shadow-sm text-pink-600' : 'text-slate-400'}`}>Body Corporate</button>
                                    <button onClick={() => setTemplateSubTab('isoc')} className={`flex-1 md:flex-none px-4 py-1.5 text-[10px] font-bold uppercase rounded-md transition-all ${templateSubTab === 'isoc' ? 'bg-white dark:bg-slate-700 shadow-sm text-pink-600' : 'text-slate-400'}`}>Inc Society</button>
                                    <button onClick={() => setTemplateSubTab('disclosure')} className={`flex-1 md:flex-none px-4 py-1.5 text-[10px] font-bold uppercase rounded-md transition-all ${templateSubTab === 'disclosure' ? 'bg-white dark:bg-slate-700 shadow-sm text-pink-600' : 'text-slate-400'}`}>Disclosure</button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                                <div className="lg:col-span-3 space-y-8">
                                    {/* Branding Section (Always visible in templates) */}
                                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border dark:border-slate-800 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-6">
                                            <h3 className="text-xs font-bold uppercase text-slate-400 tracking-widest border-b dark:border-slate-800 pb-3">Document Branding</h3>
                                            <p className="text-[10px] text-slate-500 italic mb-4">These images are inserted into documents wherever the <code className="text-pink-600 font-bold">{"{{header}}"}</code> and <code className="text-pink-600 font-bold">{"{{footer}}"}</code> tags are placed in the templates below.</p>
                                            <div className="grid grid-cols-1 gap-6">
                                                <div>
                                                    <label className="block text-[10px] font-bold text-pink-600 uppercase mb-2">Letterhead Header</label>
                                                    {headerImage ? (
                                                        <div className="relative group"><img src={headerImage} className="w-full max-h-32 object-contain border rounded-xl p-2 bg-slate-50 dark:bg-slate-950" /><button onClick={() => setHeaderImage('')} className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100"><X size={14}/></button></div>
                                                    ) : (
                                                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-2xl cursor-pointer hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-all"><Upload size={24} className="text-slate-300 mb-2" /><span className="text-[10px] font-bold text-slate-400 uppercase">Upload Header</span><input type="file" className="hidden" accept="image/*" onChange={(e) => handleAssetUpload(e, 'header')} /></label>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-6">
                                            <h3 className="text-xs font-bold uppercase text-slate-400 tracking-widest border-b dark:border-slate-800 pb-3">Global Layout</h3>
                                            <div className="p-6 bg-slate-50 dark:bg-slate-950 rounded-2xl border dark:border-slate-800 space-y-4">
                                                <div className="flex justify-between items-center mb-1"><label className="block text-[10px] font-bold text-pink-600 uppercase tracking-widest flex items-center gap-2"><MoveVertical size={14} /> Paragraph Spacing (After)</label><span className="text-sm font-mono font-bold text-pink-600">{paragraphSpacing}pt</span></div>
                                                <input type="range" min="0" max="36" step="1" className="flex-1 w-full accent-pink-600 h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer" value={paragraphSpacing} onChange={(e) => setParagraphSpacing(parseInt(e.target.value))} />
                                                <div className="flex justify-between text-[8px] font-bold text-slate-400 uppercase tracking-tighter"><span>Compact</span><span>Loose</span></div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Meeting Templates - BC */}
                                    {templateSubTab === 'bc' && (
                                        <div className="grid grid-cols-1 gap-8 animate-in fade-in duration-300">
                                            <RichTemplateEditor title="BC Notice of Intention (AGM/EGM)" value={docTemplates.noiLetterBC || docTemplates.noiLetter} onChange={(val) => setDocTemplates({...docTemplates, noiLetterBC: val})} description="Formal letter notifying owners of an upcoming general meeting for a Body Corporate." />
                                            <RichTemplateEditor title="BC Meeting Response Form" value={docTemplates.responseFormBC || docTemplates.responseForm} onChange={(val) => setDocTemplates({...docTemplates, responseFormBC: val})} description="The nomination and agenda items response form for Body Corporate owners." />
                                        </div>
                                    )}

                                    {/* Meeting Templates - ISOC */}
                                    {templateSubTab === 'isoc' && (
                                        <div className="grid grid-cols-1 gap-8 animate-in fade-in duration-300">
                                            <RichTemplateEditor title="ISOC Notice of Intention (AGM/EGM)" value={docTemplates.noiLetterISOC || ''} onChange={(val) => setDocTemplates({...docTemplates, noiLetterISOC: val})} description="Formal letter notifying members of an upcoming general meeting for an Incorporated Society." />
                                            <RichTemplateEditor title="ISOC Meeting Response Form" value={docTemplates.responseFormISOC || ''} onChange={(val) => setDocTemplates({...docTemplates, responseFormISOC: val})} description="The nomination and agenda items response form for Incorporated Society members." />
                                        </div>
                                    )}

                                    {/* Disclosure Templates */}
                                    {templateSubTab === 'disclosure' && (
                                        <div className="grid grid-cols-1 gap-8 animate-in fade-in duration-300">
                                            <div className="flex items-center gap-2"><FileSignature className="text-blue-500" /><h3 className="text-xs font-bold uppercase tracking-widest dark:text-white">Disclosure & CPL Packages</h3></div>
                                            <RichTemplateEditor title="S146 - Pre-Contract Disclosure" value={docTemplates.s146 || ''} onChange={(val) => setDocTemplates({...docTemplates, s146: val})} description="Standard PCDS document for sales. Includes remediation and weathertightness fields." />
                                            <RichTemplateEditor title="S147 - Pre-Settlement Disclosure" value={docTemplates.s147 || ''} onChange={(val) => setDocTemplates({...docTemplates, s147: val})} description="Final certification of unit levies and period details prior to settlement." />
                                            <RichTemplateEditor title="Public Liability (CPL) Certificate" value={docTemplates.cpl || ''} onChange={(val) => setDocTemplates({...docTemplates, cpl: val})} description="Official insurance verification for the complex. Merges underwriter and expiry data." />
                                        </div>
                                    )}
                                </div>

                                <div className="lg:col-span-1">
                                    <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl p-6 border dark:border-slate-700 sticky top-4">
                                        <div className="flex items-center gap-2 mb-4 border-b dark:border-slate-700 pb-2"><HelpCircle size={18} className="text-pink-600" /><h3 className="font-bold text-xs uppercase tracking-widest text-slate-800 dark:text-white">Merge Tag Cloud</h3></div>
                                        <p className="text-[10px] text-slate-500 mb-4 italic">Click to insert at cursor position.</p>
                                        
                                        <div className="space-y-6">
                                            <div>
                                                <h4 className="text-[9px] font-bold text-slate-400 uppercase mb-2">Core Property Data</h4>
                                                <div className="space-y-1">
                                                    {[ 
                                                        { tag: '{{header}}', desc: 'Letterhead Image' },
                                                        { tag: '{{footer}}', desc: 'Footer Image' },
                                                        { tag: '{{bc_name}}', desc: 'Complex Name' }, 
                                                        { tag: '{{bc_number}}', desc: 'BC/IS Number' }, 
                                                        { tag: '{{address}}', desc: 'Full Address' }, 
                                                        { tag: '{{current_date}}', desc: 'Today\'s Date' } 
                                                    ].map(item => (
                                                        <button key={item.tag} onClick={() => document.execCommand('insertHTML', false, ` ${item.tag} `)} className="w-full text-left p-2 rounded bg-white dark:bg-slate-900 border hover:border-pink-500 transition-all"><code className="text-[10px] font-bold text-pink-600">{item.tag}</code><p className="text-[9px] text-slate-500">{item.desc}</p></button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div>
                                                <h4 className="text-[9px] font-bold text-slate-400 uppercase mb-2">Unit Specific Data</h4>
                                                <div className="space-y-1">
                                                    {[ { tag: '{{unit_number}}', desc: 'Unit/PU Number' }, { tag: '{{owner_name}}', desc: 'Owner Name' }, { tag: '{{unit_levy}}', desc: 'Annual Levy' }, { tag: '{{fy_start}}', desc: 'FY Start' }, { tag: '{{fy_end}}', desc: 'FY End' } ].map(item => (
                                                        <button key={item.tag} onClick={() => document.execCommand('insertHTML', false, ` ${item.tag} `)} className="w-full text-left p-2 rounded bg-blue-50 dark:bg-blue-900/10 border hover:border-blue-500 transition-all"><code className="text-[10px] font-bold text-blue-600">{item.tag}</code><p className="text-[9px] text-slate-500">{item.desc}</p></button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div>
                                                <h4 className="text-[9px] font-bold text-slate-400 uppercase mb-2">Insurance & Compliance</h4>
                                                <div className="space-y-1">
                                                    {[ { tag: '{{insurance_noting}}', desc: 'Broker Instructions' }, { tag: '{{insurance_underwriter}}', desc: 'Insurer' }, { tag: '{{insurance_expiry}}', desc: 'Policy Expiry' }, { tag: '{{remediation_text}}', desc: 'Legal Remedial Text' } ].map(item => (
                                                        <button key={item.tag} onClick={() => document.execCommand('insertHTML', false, ` ${item.tag} `)} className="w-full text-left p-2 rounded bg-emerald-50 dark:bg-emerald-900/10 border hover:border-emerald-500 transition-all"><code className="text-[10px] font-bold text-emerald-600">{item.tag}</code><p className="text-[9px] text-slate-500">{item.desc}</p></button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
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
