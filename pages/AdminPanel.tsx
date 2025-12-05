
import React, { useState, useRef } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { BodyCorporate, User, UserRole, ComplexType, OnboardingType } from '../types';
import { Users, Building, FileSpreadsheet, Plus, Upload, Search, Settings, UserPlus, Archive, Edit2, ArchiveRestore } from 'lucide-react';
import { Navigate } from 'react-router-dom';

const AdminPanel: React.FC = () => {
    const { user } = useAuth();
    const { complexes, managers, users, addComplex, addComplexes, assignManagerToComplex, updateUserRole, addUser, updateUser, updateComplex, toggleArchiveComplex } = useData();
    const [activeTab, setActiveTab] = useState<'properties' | 'users'>('properties');

    // State for Property Management
    const [searchTerm, setSearchTerm] = useState('');
    const [showArchived, setShowArchived] = useState(false);
    const [isPropertyModalOpen, setIsPropertyModalOpen] = useState(false);
    const [editingComplex, setEditingComplex] = useState<BodyCorporate | null>(null);
    
    // State for User Management
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);

    if (user?.role !== 'admin') {
        return <Navigate to="/" replace />;
    }

    const filteredComplexes = complexes
        .filter(c => showArchived ? c.isArchived : !c.isArchived)
        .filter(c => 
            c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
            c.bcNumber.toLowerCase().includes(searchTerm.toLowerCase())
        );

    const handleEditProperty = (bc: BodyCorporate) => {
        setEditingComplex(bc);
        setIsPropertyModalOpen(true);
    };

    const handleAddProperty = () => {
        setEditingComplex(null);
        setIsPropertyModalOpen(true);
    };

    const handleEditUser = (u: User) => {
        setEditingUser(u);
        setIsUserModalOpen(true);
    };

    const handleAddUser = () => {
        setEditingUser(null);
        setIsUserModalOpen(true);
    };

    const getRoleLabel = (role: UserRole) => {
        switch(role) {
            case 'admin': return 'Administrator';
            case 'account_manager': return 'Body Corporate Manager';
            case 'support': return 'Admin Support';
            default: return role;
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-800">Administrator Panel</h1>
                <p className="text-slate-500">System Configuration, User Management and Property Allocation.</p>
            </div>

            <div className="flex border-b border-slate-200">
                <button 
                    onClick={() => setActiveTab('properties')}
                    className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'properties' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    Property Management
                </button>
                <button 
                     onClick={() => setActiveTab('users')}
                    className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'users' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    User Permissions
                </button>
            </div>

            {activeTab === 'properties' ? (
                <div className="space-y-6 animate-fade-in">
                    <div className="flex justify-between items-center">
                         <div className="flex items-center gap-4">
                            <div className="relative w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input 
                                    type="text" 
                                    placeholder="Filter properties..." 
                                    className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    className="rounded text-blue-600"
                                    checked={showArchived}
                                    onChange={(e) => setShowArchived(e.target.checked)} 
                                />
                                Show Archived
                            </label>
                        </div>
                        <button 
                            onClick={handleAddProperty}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2"
                        >
                            <Plus size={16} /> Add / Import Property
                        </button>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                        <table className="w-full text-left text-sm text-slate-600">
                            <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500">
                                <tr>
                                    <th className="px-6 py-4">Property</th>
                                    <th className="px-6 py-4">Current Manager</th>
                                    <th className="px-6 py-4 text-center">Type</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredComplexes.map((bc) => (
                                    <tr key={bc.id} className={`hover:bg-slate-50 ${bc.isArchived ? 'opacity-60 bg-slate-50' : ''}`}>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-slate-800">{bc.bcNumber}</div>
                                            <div className="text-xs text-slate-500">{bc.name}</div>
                                            {bc.isArchived && <span className="text-[10px] bg-slate-200 text-slate-600 px-1 rounded ml-2">ARCHIVED</span>}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${bc.managerName ? 'bg-blue-50 text-blue-700' : 'bg-red-50 text-red-600'}`}>
                                                {bc.managerName || 'Unassigned'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="text-xs bg-slate-100 px-2 py-1 rounded">{bc.type || 'Body Corporate'}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button 
                                                    onClick={() => handleEditProperty(bc)}
                                                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                    title="Edit Property"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button 
                                                    onClick={() => toggleArchiveComplex(bc.id)}
                                                    className={`p-1.5 rounded transition-colors ${
                                                        bc.isArchived 
                                                        ? 'text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50' 
                                                        : 'text-slate-400 hover:text-amber-600 hover:bg-amber-50'
                                                    }`}
                                                    title={bc.isArchived ? "Restore Property" : "Archive Property"}
                                                >
                                                    {bc.isArchived ? <ArchiveRestore size={16} /> : <Archive size={16} />}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="space-y-6 animate-fade-in">
                    <div className="flex justify-end">
                        <button 
                            onClick={handleAddUser}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2"
                        >
                            <UserPlus size={16} /> Add New User
                        </button>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                        <table className="w-full text-left text-sm text-slate-600">
                            <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500">
                                <tr>
                                    <th className="px-6 py-4">User</th>
                                    <th className="px-6 py-4">Email</th>
                                    <th className="px-6 py-4">Position / Role</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {users.map((u) => (
                                    <tr key={u.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-slate-800">{u.name}</div>
                                            {u.title && <div className="text-xs text-slate-400">{u.title}</div>}
                                        </td>
                                        <td className="px-6 py-4">{u.email}</td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 bg-slate-100 rounded text-xs font-medium text-slate-700">
                                                {getRoleLabel(u.role)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button 
                                                onClick={() => handleEditUser(u)}
                                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {isPropertyModalOpen && (
                 <PropertyModal 
                    initialData={editingComplex}
                    onClose={() => setIsPropertyModalOpen(false)} 
                    onSave={(bc) => { 
                        if (editingComplex) {
                            updateComplex(bc);
                        } else {
                            addComplex(bc);
                        }
                        setIsPropertyModalOpen(false); 
                    }}
                    onBulkAdd={(bcs) => { addComplexes(bcs); setIsPropertyModalOpen(false); }}
                />
            )}

            {isUserModalOpen && (
                <UserModal 
                    initialData={editingUser}
                    onClose={() => setIsUserModalOpen(false)}
                    onSave={(user) => {
                         if (editingUser) {
                             updateUser(user);
                         } else {
                             addUser(user);
                         }
                         setIsUserModalOpen(false); 
                    }}
                />
            )}
        </div>
    );
};

// --- Sub Components ---

const UserModal: React.FC<{ initialData: User | null; onClose: () => void; onSave: (user: User) => void }> = ({ initialData, onClose, onSave }) => {
    const [form, setForm] = useState<Partial<User>>(initialData || { role: 'account_manager' });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (form.name && form.email && form.role) {
            onSave({
                id: initialData?.id || Math.random().toString(36).substr(2, 9),
                name: form.name,
                email: form.email,
                role: form.role,
                title: form.title || '',
                phone: form.phone || '',
                qualifications: form.qualifications || '',
                signatureUrl: form.signatureUrl
            });
        }
    };

    const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setForm(prev => ({ ...prev, signatureUrl: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
             <div className="bg-white rounded-xl w-full max-w-md shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold text-slate-800">{initialData ? 'Edit User' : 'Add New User'}</h3>
                    <button onClick={onClose}><span className="text-slate-400 hover:text-slate-600">✕</span></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Full Name</label>
                        <input required type="text" className="w-full border rounded p-2 text-sm" value={form.name || ''} onChange={e => setForm({...form, name: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Email</label>
                        <input required type="email" className="w-full border rounded p-2 text-sm" value={form.email || ''} onChange={e => setForm({...form, email: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">System Role</label>
                        <select 
                            className="w-full border rounded p-2 text-sm bg-white"
                            value={form.role}
                            onChange={e => setForm({...form, role: e.target.value as UserRole})}
                        >
                            <option value="admin">Administrator</option>
                            <option value="account_manager">Body Corporate Manager</option>
                            <option value="support">Admin Support</option>
                        </select>
                    </div>
                    <div className="pt-2 border-t border-slate-100 mt-2">
                        <p className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Contact & Position</p>
                        <div className="grid grid-cols-2 gap-3">
                             <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">Position / Job Title</label>
                                <input type="text" className="w-full border rounded p-2 text-sm" value={form.title || ''} onChange={e => setForm({...form, title: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">Phone</label>
                                <input type="text" className="w-full border rounded p-2 text-sm" value={form.phone || ''} onChange={e => setForm({...form, phone: e.target.value})} />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-xs font-medium text-slate-700 mb-1">Qualifications</label>
                                <input type="text" placeholder="e.g. BProp" className="w-full border rounded p-2 text-sm" value={form.qualifications || ''} onChange={e => setForm({...form, qualifications: e.target.value})} />
                            </div>
                             <div className="col-span-2">
                                <label className="block text-xs font-medium text-slate-700 mb-1">Signature Upload (Image)</label>
                                <div className="border border-dashed border-slate-300 rounded p-4 text-center">
                                    <input type="file" accept="image/*" onChange={handleSignatureUpload} className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
                                    {form.signatureUrl && (
                                        <div className="mt-2">
                                            <p className="text-[10px] text-green-600 mb-1">Signature Loaded:</p>
                                            <img src={form.signatureUrl} alt="Signature Preview" className="h-10 mx-auto object-contain" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium transition-colors mt-4">
                        {initialData ? 'Update User' : 'Create User'}
                    </button>
                </form>
             </div>
        </div>
    )
}

const PropertyModal: React.FC<{ 
    initialData: BodyCorporate | null;
    onClose: () => void; 
    onSave: (bc: BodyCorporate) => void; 
    onBulkAdd: (bcs: BodyCorporate[]) => void;
}> = ({ initialData, onClose, onSave, onBulkAdd }) => {
    const { managers } = useData();
    const [activeTab, setActiveTab] = useState<'manual' | 'csv'>('manual');
    const [manualForm, setManualForm] = useState<Partial<BodyCorporate>>(initialData || { type: 'Body Corporate', onboardingType: 'Takeover' });
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [csvFile, setCsvFile] = useState<File | null>(null);

    const handleManualSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newBc: BodyCorporate = {
            id: initialData?.id || Math.random().toString(36).substr(2, 9),
            bcNumber: manualForm.bcNumber || '',
            name: manualForm.name || '',
            address: manualForm.address || '',
            units: manualForm.units || 0,
            managerName: manualForm.managerName || '',
            managementFee: manualForm.managementFee || 0,
            financialYearEnd: manualForm.financialYearEnd || '',
            insuranceExpiry: manualForm.insuranceExpiry || '',
            type: manualForm.type,
            managementStartDate: manualForm.managementStartDate,
            onboardingType: manualForm.onboardingType,
            meetings: initialData?.meetings || [],
            // preserve existing fields if editing, otherwise spread manualForm
            ...manualForm
        };
        onSave(newBc);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setCsvFile(e.target.files[0]);
        }
    };

    const processCSV = async () => {
        if (!csvFile) return;
        const text = await csvFile.text();
        const lines = text.split(/\r\n|\n/).filter(line => line.trim() !== '');
        
        const splitCSV = (row: string) => {
            const matches = row.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
            if (!matches) return row.split(',');
            return matches.map(m => m.replace(/^"|"$/g, '').trim());
        };

        const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, '').toLowerCase());
        const dataRows = lines.slice(1);
        
        const newComplexes: BodyCorporate[] = [];

        dataRows.forEach(row => {
            const values = row.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g) || [];
            const cleanValues = values.map(v => v.replace(/^"|"$/g, '').trim());
            const getVal = (headerPart: string) => {
                const index = headers.findIndex(h => h.includes(headerPart.toLowerCase()));
                return index !== -1 ? cleanValues[index] : undefined;
            };

            if (cleanValues.length > 3) {
                const bc: BodyCorporate = {
                    id: Math.random().toString(36).substr(2, 9),
                    bcNumber: getVal('body corporate number') || getVal('isoc') || 'Unknown',
                    name: getVal('complex name') || 'Unnamed Complex',
                    address: getVal('bc address') || getVal('address') || '',
                    units: parseInt(getVal('number of units') || '0'),
                    type: (getVal('type') || 'Body Corporate') as ComplexType,
                    managerName: getVal('account manager') || getVal('manager') || '',
                    managementFee: parseFloat((getVal('management fee') || '0').replace(/[^0-9.-]+/g,"")),
                    financialYearEnd: getVal('financial year end') || '',
                    previousAgmDate: getVal('previous agm date'),
                    nextAgmDate: getVal('next agm date'),
                    nextAgmTime: getVal('next agm time'),
                    nextAgmVenue: getVal('next agm venue'),
                    insuranceExpiry: getVal('insurance expiry date') || '',
                    insuranceBroker: getVal('insurance broker'),
                    bwofExpiry: getVal('bwof expiry date'),
                    meetings: []
                };
                newComplexes.push(bc);
            }
        });

        if (newComplexes.length > 0) {
            onBulkAdd(newComplexes);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold text-slate-800">{initialData ? 'Edit Property' : 'Add New Property'}</h3>
                    <button onClick={onClose}><span className="text-slate-400 hover:text-slate-600">✕</span></button>
                </div>

                {!initialData && (
                    <div className="flex border-b border-slate-100">
                        <button 
                            className={`flex-1 py-3 text-sm font-medium ${activeTab === 'manual' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}
                            onClick={() => setActiveTab('manual')}
                        >
                            Manual Entry
                        </button>
                        <button 
                            className={`flex-1 py-3 text-sm font-medium ${activeTab === 'csv' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}
                            onClick={() => setActiveTab('csv')}
                        >
                            Import CSV
                        </button>
                    </div>
                )}

                <div className="p-6">
                    {activeTab === 'manual' ? (
                        <form onSubmit={handleManualSubmit} className="space-y-4">
                             <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-xs font-medium text-slate-700 mb-1">Complex Type</label>
                                    <select 
                                        className="w-full border rounded p-2 text-sm bg-white"
                                        value={manualForm.type || 'Body Corporate'}
                                        onChange={e => {
                                            const newType = e.target.value as ComplexType;
                                            setManualForm(prev => ({
                                                ...prev, 
                                                type: newType,
                                                bcNumber: newType === 'Incorporated Society' && (!prev.bcNumber || prev.bcNumber.startsWith('BC')) ? 'IS ' : prev.bcNumber
                                            }))
                                        }}
                                    >
                                        <option value="Body Corporate">Body Corporate</option>
                                        <option value="Incorporated Society">Incorporated Society</option>
                                    </select>
                                </div>
                                {manualForm.type === 'Incorporated Society' && (
                                     <div className="col-span-2 bg-blue-50 p-3 rounded-lg border border-blue-100">
                                        <label className="block text-xs font-medium text-blue-800 mb-1">
                                            NOM Notice Period (Days)
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <input 
                                                type="number" 
                                                className="w-24 border rounded p-2 text-sm"
                                                value={manualForm.isocNomDaysPrior || ''} 
                                                placeholder="Default: 7"
                                                onChange={e => setManualForm({...manualForm, isocNomDaysPrior: parseInt(e.target.value)})} 
                                            />
                                            <span className="text-xs text-slate-500">days prior to meeting (Statutory minimum)</span>
                                        </div>
                                    </div>
                                )}
                                <div>
                                    <label className="block text-xs font-medium text-slate-700 mb-1">BC / IS Number</label>
                                    <input required type="text" className="w-full border rounded p-2 text-sm" placeholder="BC123456" value={manualForm.bcNumber || ''} onChange={e => setManualForm({...manualForm, bcNumber: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-700 mb-1">Complex Name</label>
                                    <input required type="text" className="w-full border rounded p-2 text-sm" placeholder="Sunrise Apts" value={manualForm.name || ''} onChange={e => setManualForm({...manualForm, name: e.target.value})} />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-xs font-medium text-slate-700 mb-1">Address</label>
                                    <input required type="text" className="w-full border rounded p-2 text-sm" value={manualForm.address || ''} onChange={e => setManualForm({...manualForm, address: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-700 mb-1">Units</label>
                                    <input required type="number" className="w-full border rounded p-2 text-sm" value={manualForm.units || ''} onChange={e => setManualForm({...manualForm, units: parseInt(e.target.value)})} />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-700 mb-1">Management Fee (Inc GST)</label>
                                    <input type="number" step="0.01" className="w-full border rounded p-2 text-sm" value={manualForm.managementFee || ''} onChange={e => setManualForm({...manualForm, managementFee: parseFloat(e.target.value)})} />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-700 mb-1">Financial Year End</label>
                                    <input 
                                        type="text" 
                                        className="w-full border rounded p-2 text-sm" 
                                        placeholder="e.g. 31 March" 
                                        value={manualForm.financialYearEnd || ''} 
                                        onChange={e => setManualForm({...manualForm, financialYearEnd: e.target.value})} 
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-xs font-medium text-slate-700 mb-1">Account Manager</label>
                                    <select 
                                        className="w-full border rounded p-2 text-sm bg-white"
                                        value={manualForm.managerName || ''}
                                        onChange={e => setManualForm({...manualForm, managerName: e.target.value})}
                                    >
                                        <option value="">-- Select Manager --</option>
                                        {managers.map(m => (
                                            <option key={m.id} value={m.name}>{m.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-700 mb-1">Management Start Date</label>
                                    <input type="date" className="w-full border rounded p-2 text-sm" value={manualForm.managementStartDate || ''} onChange={e => setManualForm({...manualForm, managementStartDate: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-700 mb-1">Onboarding Type</label>
                                    <select 
                                        className="w-full border rounded p-2 text-sm bg-white"
                                        value={manualForm.onboardingType || 'Takeover'}
                                        onChange={e => setManualForm({...manualForm, onboardingType: e.target.value as OnboardingType})}
                                    >
                                        <option value="Takeover">Takeover</option>
                                        <option value="New Development">New Development</option>
                                    </select>
                                </div>
                            </div>
                            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium transition-colors mt-4">
                                {initialData ? 'Save Changes' : 'Add Property'}
                            </button>
                        </form>
                    ) : (
                        <div className="text-center space-y-6">
                            <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                <FileSpreadsheet className="text-emerald-500 mb-3" size={40} />
                                <p className="text-sm font-medium text-slate-700">Click to upload CSV</p>
                                <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={handleFileUpload} />
                            </div>
                            
                            {csvFile && (
                                <div className="flex items-center justify-center gap-2 text-sm text-slate-600 bg-blue-50 p-2 rounded">
                                    <FileSpreadsheet size={16} />
                                    <span>{csvFile.name}</span>
                                </div>
                            )}

                            <button onClick={processCSV} disabled={!csvFile} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg font-medium transition-colors disabled:opacity-50">
                                Process & Import
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminPanel;
