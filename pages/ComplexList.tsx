
import React, { useState, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { Search, Filter, ShieldCheck, ShieldAlert, X, Building, Calendar, AlertTriangle, Save, Plus, Clock, MapPin, Edit2, Trash2, CheckCircle2, UserCheck } from 'lucide-react';
import { BodyCorporate, Meeting, UserRole } from '../types';

const ComplexList: React.FC = () => {
  const { complexes, updateComplex, addMeeting, updateMeeting, deleteMeeting } = useData();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  
  // FIX: Store the ID instead of the object. This ensures the modal always pulls the latest data from Context.
  const [selectedComplexId, setSelectedComplexId] = useState<string | null>(null);

  const selectedComplex = complexes.find(c => c.id === selectedComplexId) || null;

  // Filter Logic - Only show active (non-archived) complexes
  const filteredComplexes = complexes
    .filter(c => !c.isArchived)
    .filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        c.bcNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.address.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const isInsuranceValid = (dateStr?: string) => {
    if (!dateStr) return false;
    return new Date(dateStr) > new Date();
  };

  const handleUpdate = (updatedBc: BodyCorporate) => {
      updateComplex(updatedBc);
      setSelectedComplexId(null);
  };

  return (
    <div className="space-y-6">
       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Properties</h1>
          <p className="text-slate-500">View and Update Property Information</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        {/* Filters */}
        <div className="p-4 border-b border-slate-100 flex gap-4">
            <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                    type="text" 
                    placeholder="Search by Name, BC Number, or Address..." 
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 text-sm">
                <Filter size={16} />
                <span>Filters</span>
            </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500">
                    <tr>
                        <th className="px-6 py-4">ID / Number</th>
                        <th className="px-6 py-4">Name & Address</th>
                        <th className="px-6 py-4">Manager</th>
                        <th className="px-6 py-4">Insurance Expiry</th>
                        <th className="px-6 py-4">Next AGM</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {filteredComplexes.map((bc) => (
                        <tr key={bc.id} className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => setSelectedComplexId(bc.id)}>
                            <td className="px-6 py-4 font-mono font-medium text-slate-800">{bc.bcNumber}</td>
                            <td className="px-6 py-4">
                                <div className="font-medium text-slate-800">{bc.name}</div>
                                <div className="text-xs text-slate-400">{bc.address}</div>
                            </td>
                            <td className="px-6 py-4">{bc.managerName}</td>
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                    {isInsuranceValid(bc.insuranceExpiry) ? (
                                        <ShieldCheck size={16} className="text-emerald-500" />
                                    ) : (
                                        <ShieldAlert size={16} className="text-red-500" />
                                    )}
                                    <span>{bc.insuranceExpiry ? new Date(bc.insuranceExpiry).toLocaleDateString('en-NZ') : 'N/A'}</span>
                                </div>
                            </td>
                            <td className="px-6 py-4">{bc.nextAgmDate ? new Date(bc.nextAgmDate).toLocaleDateString('en-NZ') : '-'}</td>
                            <td className="px-6 py-4 text-right">
                                <button 
                                    onClick={(e) => { e.stopPropagation(); setSelectedComplexId(bc.id); }}
                                    className="text-blue-600 hover:text-blue-800 p-1 rounded font-medium text-xs border border-blue-200 bg-blue-50 px-3 py-1"
                                >
                                    Details
                                </button>
                            </td>
                        </tr>
                    ))}
                    {filteredComplexes.length === 0 && (
                        <tr>
                            <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                                No properties found matching your search.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>

      {/* Edit Details Modal */}
      {selectedComplex && (
        <EditComplexModal 
            complex={selectedComplex} 
            userRole={user?.role || 'support'}
            onClose={() => setSelectedComplexId(null)} 
            onSave={handleUpdate}
            onAddMeeting={addMeeting}
            onUpdateMeeting={updateMeeting}
            onDeleteMeeting={deleteMeeting}
        />
      )}
    </div>
  );
};

// --- Sub-components ---

interface EditModalProps {
    complex: BodyCorporate;
    userRole: UserRole;
    onClose: () => void;
    onSave: (bc: BodyCorporate) => void;
    onAddMeeting: (bcId: string, meeting: Meeting) => void;
    onUpdateMeeting: (bcId: string, meeting: Meeting) => void;
    onDeleteMeeting: (bcId: string, meetingId: string) => void;
}

const EditComplexModal: React.FC<EditModalProps> = ({ complex, userRole, onClose, onSave, onAddMeeting, onUpdateMeeting, onDeleteMeeting }) => {
    const { contractors } = useData();
    const [form, setForm] = useState<BodyCorporate>(complex);
    const [activeTab, setActiveTab] = useState<'details' | 'meetings'>('details');

    // Update local form state if complex prop changes (e.g. meeting added in background)
    useEffect(() => {
        setForm(complex);
    }, [complex]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(form);
    };

    const handleLtmpDateChange = (date: string) => {
        if (!date) {
            setForm({...form, ltmpCompletedDate: date, nextLtmpRenewalDate: ''});
            return;
        }
        
        const completedDate = new Date(date);
        const renewalDate = new Date(completedDate);
        renewalDate.setFullYear(completedDate.getFullYear() + 3);
        
        setForm({
            ...form, 
            ltmpCompletedDate: date, 
            nextLtmpRenewalDate: renewalDate.toISOString().split('T')[0]
        });
    };

    // Filter Contractors
    const brokers = contractors.filter(c => c.category === 'Insurance Broker');
    const valuers = contractors.filter(c => c.category === 'Insurance Valuer');
    const consultants = contractors.filter(c => c.category === 'Consultant');
    const complianceContractors = contractors.filter(c => c.category === 'Compliance');

    // Logic for Incorporated Society Check
    const isIS = form.bcNumber.toUpperCase().startsWith('IS') || form.isocRegistrationType !== undefined || form.type === 'Incorporated Society';
    
    // Fee calculation
    const feeExclGst = (form.managementFee || 0) / 1.15;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h2 className="text-2xl font-bold text-slate-800">{complex.name}</h2>
                            <span className="px-2 py-1 bg-slate-200 text-slate-600 text-xs font-mono rounded">{complex.bcNumber}</span>
                        </div>
                        <p className="text-slate-500 flex items-center gap-2 text-sm">
                            <Building size={14} /> {complex.address}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
                        <X size={24} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-200 px-6">
                    <button 
                        onClick={() => setActiveTab('details')}
                        className={`py-3 mr-6 text-sm font-medium border-b-2 transition-colors ${activeTab === 'details' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    >
                        Property Details
                    </button>
                    <button 
                        onClick={() => setActiveTab('meetings')}
                        className={`py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'meetings' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    >
                        Meeting Management
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
                    {activeTab === 'details' ? (
                        <form onSubmit={handleSubmit}>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* General Info */}
                                <div className="space-y-4 bg-white p-5 rounded-lg border border-slate-100 shadow-sm">
                                    <h3 className="text-md font-bold text-slate-800 flex items-center gap-2 pb-2 border-b border-slate-100">
                                        <Building size={16} className="text-blue-500" /> General Info
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-medium text-slate-500 block mb-1">Financial Year End</label>
                                            <input 
                                                type="text" 
                                                className="w-full border rounded p-2 text-sm bg-slate-100 text-slate-600 cursor-not-allowed"
                                                value={form.financialYearEnd} 
                                                readOnly
                                                disabled
                                            />
                                            <span className="text-[10px] text-slate-400">Edit in Admin Panel</span>
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-slate-500 block mb-1">Manager</label>
                                            <input 
                                                type="text" 
                                                className={`w-full border rounded p-2 text-sm bg-slate-100 text-slate-600 cursor-not-allowed`}
                                                value={form.managerName} 
                                                readOnly
                                                disabled
                                            />
                                            {userRole !== 'admin' && <span className="text-[10px] text-amber-600">Admin only</span>}
                                        </div>
                                        <div className="col-span-2">
                                            <label className="text-xs font-medium text-slate-500 block mb-1">Management Fee (Inc GST)</label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-2 text-slate-400 text-sm">$</span>
                                                <input 
                                                    type="number" 
                                                    step="0.01"
                                                    className="w-full border rounded p-2 pl-7 text-sm"
                                                    value={form.managementFee || ''} 
                                                    onChange={e => setForm({...form, managementFee: parseFloat(e.target.value)})}
                                                    disabled={userRole !== 'admin'}
                                                />
                                            </div>
                                            <p className="text-xs text-slate-500 mt-1">Excl GST: <span className="font-medium text-slate-700">${feeExclGst.toFixed(2)}</span></p>
                                        </div>
                                    </div>
                                </div>

                                {/* Insurance (Editable) */}
                                <div className="space-y-4 bg-white p-5 rounded-lg border border-slate-100 shadow-sm">
                                    <h3 className="text-md font-bold text-slate-800 flex items-center gap-2 pb-2 border-b border-slate-100">
                                        <ShieldCheck size={16} className="text-emerald-500" /> Insurance
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-medium text-slate-500 block mb-1">Expiry Date</label>
                                            <input type="date" className="w-full border rounded p-2 text-sm" value={form.insuranceExpiry || ''} onChange={e => setForm({...form, insuranceExpiry: e.target.value})} />
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-slate-500 block mb-1">Broker</label>
                                            <select 
                                                className="w-full border rounded p-2 text-sm bg-white"
                                                value={form.insuranceBroker || ''}
                                                onChange={e => setForm({...form, insuranceBroker: e.target.value})}
                                            >
                                                <option value="">-- Select Broker --</option>
                                                {brokers.map(b => (
                                                    <option key={b.id} value={b.name}>{b.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-slate-500 block mb-1">Valuation Due</label>
                                            <input type="date" className="w-full border rounded p-2 text-sm" value={form.nextValuationDue || ''} onChange={e => setForm({...form, nextValuationDue: e.target.value})} />
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-slate-500 block mb-1">Insurance Valuer</label>
                                            <select 
                                                className="w-full border rounded p-2 text-sm bg-white"
                                                value={form.insuranceValuer || ''}
                                                onChange={e => setForm({...form, insuranceValuer: e.target.value})}
                                            >
                                                <option value="">-- Select Valuer --</option>
                                                {valuers.map(v => (
                                                    <option key={v.id} value={v.name}>{v.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Compliance (Detailed) */}
                                <div className="space-y-4 bg-white p-5 rounded-lg border border-slate-100 shadow-sm lg:col-span-2">
                                    <h3 className="text-md font-bold text-slate-800 flex items-center gap-2 pb-2 border-b border-slate-100">
                                        <AlertTriangle size={16} className="text-amber-500" /> Compliance & Maintenance
                                    </h3>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                        {/* BWOF Section */}
                                        <div className="space-y-3">
                                            <h4 className="text-sm font-semibold text-slate-700">Building Warrant of Fitness</h4>
                                            <div className="flex items-center gap-4 mb-2">
                                                <label className="inline-flex items-center gap-2 cursor-pointer">
                                                    <input 
                                                        type="radio" 
                                                        name="hasBwof" 
                                                        className="text-blue-600"
                                                        checked={form.hasBwof === true} 
                                                        onChange={() => setForm({...form, hasBwof: true})} 
                                                    />
                                                    <span className="text-sm">Yes</span>
                                                </label>
                                                <label className="inline-flex items-center gap-2 cursor-pointer">
                                                    <input 
                                                        type="radio" 
                                                        name="hasBwof" 
                                                        className="text-blue-600"
                                                        checked={form.hasBwof === false} 
                                                        onChange={() => setForm({...form, hasBwof: false, bwofExpiry: '', bwofConsultant: ''})} 
                                                    />
                                                    <span className="text-sm">No</span>
                                                </label>
                                            </div>
                                            {form.hasBwof && (
                                                <div className="space-y-3">
                                                    <div>
                                                        <label className="text-xs font-medium text-slate-500 block mb-1">BWOF Expiry Date</label>
                                                        <input 
                                                            type="date" 
                                                            className="w-full border rounded p-2 text-sm" 
                                                            value={form.bwofExpiry || ''} 
                                                            onChange={e => setForm({...form, bwofExpiry: e.target.value})} 
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs font-medium text-slate-500 block mb-1">BWOF Consultant</label>
                                                        <select 
                                                            className="w-full border rounded p-2 text-sm bg-white"
                                                            value={form.bwofConsultant || ''}
                                                            onChange={e => setForm({...form, bwofConsultant: e.target.value})}
                                                        >
                                                            <option value="">-- Select Consultant --</option>
                                                            {complianceContractors.map(c => (
                                                                <option key={c.id} value={c.name}>{c.name}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* LTMP Section */}
                                        <div className="space-y-3">
                                            <h4 className="text-sm font-semibold text-slate-700">Long Term Maintenance Plan</h4>
                                            
                                            {/* ISOC Specific Toggle */}
                                            {isIS && (
                                                <div className="flex items-center gap-4 mb-2">
                                                    <label className="text-xs text-slate-500 mr-2">Has LTMP?</label>
                                                    <label className="inline-flex items-center gap-2 cursor-pointer">
                                                        <input 
                                                            type="radio" 
                                                            name="hasLtmp" 
                                                            checked={form.hasLtmp === true} 
                                                            onChange={() => setForm({...form, hasLtmp: true})} 
                                                        />
                                                        <span className="text-sm">Yes</span>
                                                    </label>
                                                    <label className="inline-flex items-center gap-2 cursor-pointer">
                                                        <input 
                                                            type="radio" 
                                                            name="hasLtmp" 
                                                            checked={form.hasLtmp === false} 
                                                            onChange={() => setForm({...form, hasLtmp: false, ltmpCompletedDate: '', nextLtmpRenewalDate: ''})} 
                                                        />
                                                        <span className="text-sm">No</span>
                                                    </label>
                                                </div>
                                            )}

                                            {/* Render LTMP fields if BC (always) or IS (only if true) */}
                                            {(!isIS || form.hasLtmp) && (
                                                <div className="space-y-3">
                                                    <div>
                                                        <label className="text-xs font-medium text-slate-500 block mb-1">Last Prepared On</label>
                                                        <input 
                                                            type="date" 
                                                            className="w-full border rounded p-2 text-sm" 
                                                            value={form.ltmpCompletedDate || ''} 
                                                            onChange={e => handleLtmpDateChange(e.target.value)} 
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs font-medium text-slate-500 block mb-1">Prepared By (Consultant)</label>
                                                        <select 
                                                            className="w-full border rounded p-2 text-sm bg-white"
                                                            value={form.ltmpCompletedBy || ''}
                                                            onChange={e => setForm({...form, ltmpCompletedBy: e.target.value})}
                                                        >
                                                            <option value="">-- Select Consultant --</option>
                                                            {consultants.map(c => (
                                                                <option key={c.id} value={c.name}>{c.name}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="text-xs font-medium text-slate-500 block mb-1">Renewal Due (3 Years)</label>
                                                        <input 
                                                            type="date" 
                                                            className="w-full border rounded p-2 text-sm bg-slate-50 text-slate-500" 
                                                            value={form.nextLtmpRenewalDate || ''} 
                                                            readOnly
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Health & Safety Section */}
                                        <div className="space-y-3">
                                            <h4 className="text-sm font-semibold text-slate-700">Health & Safety Report</h4>
                                            <div className="flex items-center gap-4 mb-2">
                                                <label className="inline-flex items-center gap-2 cursor-pointer">
                                                    <input 
                                                        type="radio" 
                                                        name="hasHsReport" 
                                                        checked={form.hasHsReport === true} 
                                                        onChange={() => setForm({...form, hasHsReport: true})} 
                                                    />
                                                    <span className="text-sm">Yes</span>
                                                </label>
                                                <label className="inline-flex items-center gap-2 cursor-pointer">
                                                    <input 
                                                        type="radio" 
                                                        name="hasHsReport" 
                                                        checked={form.hasHsReport === false} 
                                                        onChange={() => setForm({...form, hasHsReport: false, hsReportDate: '', hsReportBy: ''})} 
                                                    />
                                                    <span className="text-sm">No</span>
                                                </label>
                                            </div>
                                            
                                            {form.hasHsReport && (
                                                <div className="space-y-3">
                                                    <div>
                                                        <label className="text-xs font-medium text-slate-500 block mb-1">Prepared On</label>
                                                        <input 
                                                            type="date" 
                                                            className="w-full border rounded p-2 text-sm" 
                                                            value={form.hsReportDate || ''} 
                                                            onChange={e => setForm({...form, hsReportDate: e.target.value})} 
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs font-medium text-slate-500 block mb-1">Prepared By</label>
                                                        <select 
                                                            className="w-full border rounded p-2 text-sm bg-white"
                                                            value={form.hsReportBy || ''}
                                                            onChange={e => setForm({...form, hsReportBy: e.target.value})}
                                                        >
                                                            <option value="">-- Select Consultant --</option>
                                                            {consultants.map(c => (
                                                                <option key={c.id} value={c.name}>{c.name}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Building Manager Section */}
                                <div className="space-y-4 bg-white p-5 rounded-lg border border-slate-100 shadow-sm lg:col-span-2">
                                    <h3 className="text-md font-bold text-slate-800 flex items-center gap-2 pb-2 border-b border-slate-100">
                                        <UserCheck size={16} className="text-indigo-500" /> Building Manager
                                    </h3>
                                    <div className="flex items-center gap-4 mb-4">
                                        <label className="text-sm text-slate-600 font-medium mr-2">Is there a Building Manager?</label>
                                        <label className="inline-flex items-center gap-2 cursor-pointer">
                                            <input 
                                                type="radio" 
                                                name="hasBuildingManager" 
                                                className="text-blue-600"
                                                checked={form.hasBuildingManager === true} 
                                                onChange={() => setForm({...form, hasBuildingManager: true})} 
                                            />
                                            <span className="text-sm">Yes</span>
                                        </label>
                                        <label className="inline-flex items-center gap-2 cursor-pointer">
                                            <input 
                                                type="radio" 
                                                name="hasBuildingManager" 
                                                className="text-blue-600"
                                                checked={form.hasBuildingManager === false} 
                                                onChange={() => setForm({...form, hasBuildingManager: false})} 
                                            />
                                            <span className="text-sm">No</span>
                                        </label>
                                    </div>

                                    {form.hasBuildingManager && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-medium text-slate-500 mb-1">Company Name</label>
                                                <input 
                                                    type="text" 
                                                    className="w-full border rounded p-2 text-sm"
                                                    value={form.buildingManagerCompany || ''} 
                                                    onChange={e => setForm({...form, buildingManagerCompany: e.target.value})}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-slate-500 mb-1">Contact Person</label>
                                                <input 
                                                    type="text" 
                                                    className="w-full border rounded p-2 text-sm"
                                                    value={form.buildingManagerName || ''} 
                                                    onChange={e => setForm({...form, buildingManagerName: e.target.value})}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-slate-500 mb-1">Phone Number</label>
                                                <input 
                                                    type="text" 
                                                    className="w-full border rounded p-2 text-sm"
                                                    value={form.buildingManagerPhone || ''} 
                                                    onChange={e => setForm({...form, buildingManagerPhone: e.target.value})}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-slate-500 mb-1">Email Address</label>
                                                <input 
                                                    type="email" 
                                                    className="w-full border rounded p-2 text-sm"
                                                    value={form.buildingManagerEmail || ''} 
                                                    onChange={e => setForm({...form, buildingManagerEmail: e.target.value})}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            <div className="pt-6 mt-6 border-t border-slate-200 flex justify-end gap-3">
                                <button type="button" onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg text-sm font-medium">Cancel</button>
                                <button type="submit" className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium flex items-center gap-2">
                                    <Save size={16} /> Save Changes
                                </button>
                            </div>
                        </form>
                    ) : (
                        <MeetingsTab 
                            complex={complex} 
                            userRole={userRole}
                            onAddMeeting={onAddMeeting} 
                            onUpdateMeeting={onUpdateMeeting}
                            onDeleteMeeting={onDeleteMeeting}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

interface MeetingsTabProps {
    complex: BodyCorporate;
    userRole: UserRole;
    onAddMeeting: (id: string, m: Meeting) => void;
    onUpdateMeeting: (id: string, m: Meeting) => void;
    onDeleteMeeting: (id: string, mid: string) => void;
}

const MeetingsTab: React.FC<MeetingsTabProps> = ({ complex, userRole, onAddMeeting, onUpdateMeeting, onDeleteMeeting }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [meetingForm, setMeetingForm] = useState<Partial<Meeting>>({
        type: 'AGM',
        venue: complex.nextAgmVenue || '',
        venueAddress: complex.nextAgmVenueAddress || ''
    });

    const isIS = complex.type === 'Incorporated Society' || complex.bcNumber.startsWith('IS');

    const calculateResponseDueDate = (meetingDateStr: string) => {
        if (!meetingDateStr) return '';
        
        const today = new Date();
        const meetingDate = new Date(meetingDateStr);
        
        const sevenDaysFromNow = new Date(today);
        sevenDaysFromNow.setDate(today.getDate() + 7);

        const fifteenDaysPrior = new Date(meetingDate);
        fifteenDaysPrior.setDate(meetingDate.getDate() - 15);

        let finalDate = sevenDaysFromNow;
        if (sevenDaysFromNow > fifteenDaysPrior) {
            finalDate = fifteenDaysPrior;
        }

        return finalDate.toISOString().split('T')[0];
    };

    const getDeadlines = (meetingDate: string, isIS: boolean, isocNomDays: number = 7) => {
        if (!meetingDate) return { noi: null, nom: null };
        const date = new Date(meetingDate);
        
        const noiDate = new Date(date);
        noiDate.setDate(date.getDate() - 22);

        const nomDate = new Date(date);
        // BC is 15 days, IS is configurable (default 7)
        const daysToSubtract = isIS ? isocNomDays : 15;
        nomDate.setDate(date.getDate() - daysToSubtract);

        return {
            noi: isIS ? null : noiDate.toISOString().split('T')[0],
            nom: nomDate.toISOString().split('T')[0]
        };
    };

    const handleDateChange = (date: string) => {
        const responseDue = calculateResponseDueDate(date);
        const meetingDate = new Date(date);
        const noiDate = new Date(meetingDate);
        noiDate.setDate(meetingDate.getDate() - 25); 

        setMeetingForm(prev => ({
            ...prev,
            date: date,
            noiResponseDueDate: responseDue,
            noiDueDate: noiDate.toISOString().split('T')[0]
        }));
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (meetingForm.date && meetingForm.type) {
            const m: Meeting = {
                id: editId || Math.random().toString(36).substr(2, 9),
                type: meetingForm.type as any,
                date: meetingForm.date,
                time: meetingForm.time || '18:00',
                venue: meetingForm.venue || '',
                venueAddress: meetingForm.venueAddress || '',
                noiResponseDueDate: meetingForm.noiResponseDueDate,
                noiDueDate: meetingForm.noiDueDate,
                noiIssued: meetingForm.noiIssued,
                nomIssued: meetingForm.nomIssued,
                minutesIssued: meetingForm.minutesIssued
            };
            
            if (editId) {
                onUpdateMeeting(complex.id, m);
            } else {
                onAddMeeting(complex.id, m);
            }
            
            resetForm();
        }
    };

    const startEdit = (m: Meeting) => {
        setIsEditing(true);
        setEditId(m.id);
        setMeetingForm({ ...m });
    };

    const handleDelete = (mId: string, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent any row click bubbling if applicable
        if (window.confirm("Are you sure you want to delete this meeting?")) {
            onDeleteMeeting(complex.id, mId);
        }
    };

    const resetForm = () => {
        setIsEditing(false);
        setEditId(null);
        setMeetingForm({ type: 'AGM', venue: '', venueAddress: '' });
    };

    const deadlines = getDeadlines(meetingForm.date || '', isIS, complex.isocNomDaysPrior);

    return (
        <div className="space-y-6">
            {!isEditing ? (
                 <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-slate-100">
                    <h3 className="font-bold text-slate-700">Scheduled Meetings</h3>
                    {userRole === 'admin' && (
                        <button 
                            onClick={() => setIsEditing(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                            <Plus size={16} /> Schedule Meeting
                        </button>
                    )}
                </div>
            ) : (
                <div className="bg-white p-6 rounded-lg shadow-sm border border-blue-100">
                     <h3 className="font-bold text-slate-800 mb-4">{editId ? 'Edit Meeting' : 'Schedule New Meeting'}</h3>
                     <form onSubmit={handleSave} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Meeting Type</label>
                                <select 
                                    className="w-full border rounded p-2 text-sm"
                                    value={meetingForm.type}
                                    onChange={e => setMeetingForm({...meetingForm, type: e.target.value as any})}
                                >
                                    <option value="AGM">Annual General Meeting</option>
                                    <option value="EGM">Extraordinary General Meeting</option>
                                    <option value="SGM">Special General Meeting (IS)</option>
                                    <option value="Committee">Committee Meeting</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Date</label>
                                <input 
                                    type="date" 
                                    required 
                                    className="w-full border rounded p-2 text-sm"
                                    value={meetingForm.date || ''}
                                    onChange={e => handleDateChange(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Time</label>
                                <input 
                                    type="time" 
                                    required
                                    className="w-full border rounded p-2 text-sm"
                                    value={meetingForm.time || ''}
                                    onChange={e => setMeetingForm({...meetingForm, time: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Venue Name</label>
                                <input 
                                    type="text" 
                                    className="w-full border rounded p-2 text-sm"
                                    placeholder="e.g. Community Hall"
                                    value={meetingForm.venue || ''}
                                    onChange={e => setMeetingForm({...meetingForm, venue: e.target.value})}
                                />
                            </div>
                             <div className="col-span-2">
                                <label className="block text-xs font-medium text-slate-500 mb-1">Venue Address</label>
                                <input 
                                    type="text" 
                                    className="w-full border rounded p-2 text-sm"
                                    value={meetingForm.venueAddress || ''}
                                    onChange={e => setMeetingForm({...meetingForm, venueAddress: e.target.value})}
                                />
                            </div>

                            {/* Notice Tracking Section */}
                            <div className="col-span-2 border-t border-slate-100 pt-4 mt-2">
                                <h4 className="text-sm font-bold text-slate-700 mb-3">Notice Tracking</h4>
                                <div className="grid grid-cols-3 gap-4">
                                    {/* NOI */}
                                    <div className="p-3 rounded border bg-white border-slate-200">
                                        <label className="flex flex-col gap-1 cursor-pointer">
                                            <div className="flex items-center gap-2">
                                                <input 
                                                    type="checkbox" 
                                                    checked={meetingForm.noiIssued || false}
                                                    onChange={e => setMeetingForm({...meetingForm, noiIssued: e.target.checked})}
                                                    className="rounded text-blue-600"
                                                />
                                                <span className="text-sm font-medium">NOI Issued</span>
                                            </div>
                                            {!isIS && deadlines.noi && (
                                                <span className="text-xs text-red-500 pl-6">Deadline: {new Date(deadlines.noi).toLocaleDateString('en-NZ')}</span>
                                            )}
                                            {isIS && <span className="text-xs text-slate-400 pl-6">Manual Issue (No Deadline)</span>}
                                        </label>
                                    </div>

                                    {/* NOM */}
                                    <div className="p-3 rounded border bg-white border-slate-200">
                                        <label className="flex flex-col gap-1 cursor-pointer">
                                             <div className="flex items-center gap-2">
                                                <input 
                                                    type="checkbox" 
                                                    checked={meetingForm.nomIssued || false}
                                                    onChange={e => setMeetingForm({...meetingForm, nomIssued: e.target.checked})}
                                                    className="rounded text-blue-600"
                                                />
                                                <span className="text-sm font-medium">NOM Issued</span>
                                            </div>
                                            {deadlines.nom && (
                                                 <span className="text-xs text-red-500 pl-6">Deadline: {new Date(deadlines.nom).toLocaleDateString('en-NZ')}</span>
                                            )}
                                        </label>
                                    </div>

                                     {/* Minutes */}
                                     <div className="p-3 rounded border bg-white border-slate-200">
                                        <label className="flex flex-col gap-1 cursor-pointer">
                                             <div className="flex items-center gap-2">
                                                <input 
                                                    type="checkbox" 
                                                    checked={meetingForm.minutesIssued || false}
                                                    onChange={e => setMeetingForm({...meetingForm, minutesIssued: e.target.checked})}
                                                    className="rounded text-blue-600"
                                                />
                                                <span className="text-sm font-medium">Minutes Sent</span>
                                            </div>
                                            <span className="text-xs text-slate-400 pl-6">Post-meeting</span>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {meetingForm.type === 'AGM' && (
                                <div className="col-span-2 bg-blue-50 p-4 rounded-lg border border-blue-100 mt-2">
                                    <h4 className="text-sm font-bold text-blue-800 mb-3 flex items-center gap-2">
                                        <Clock size={14} /> Compliance Dates
                                    </h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-medium text-slate-500 mb-1">NOI Due (Send By)</label>
                                            <input 
                                                type="date" 
                                                className="w-full border rounded p-2 text-sm bg-white"
                                                value={meetingForm.noiDueDate || ''}
                                                onChange={e => setMeetingForm({...meetingForm, noiDueDate: e.target.value})}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-500 mb-1">Owner Responses Due</label>
                                            <input 
                                                type="date" 
                                                className="w-full border rounded p-2 text-sm bg-white"
                                                value={meetingForm.noiResponseDueDate || ''}
                                                onChange={e => setMeetingForm({...meetingForm, noiResponseDueDate: e.target.value})}
                                            />
                                            <p className="text-[10px] text-slate-500 mt-1">
                                                Auto-calculated: 7 days from now, capped at 15 days prior to meeting.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="flex justify-end gap-3 pt-2">
                             <button type="button" onClick={resetForm} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg text-sm font-medium">Cancel</button>
                             <button type="submit" className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium">{editId ? 'Update Meeting' : 'Add Meeting'}</button>
                        </div>
                     </form>
                </div>
            )}

            <div className="bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden">
                <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500">
                        <tr>
                            <th className="px-6 py-3">Date</th>
                            <th className="px-6 py-3">Type</th>
                            <th className="px-6 py-3">Venue</th>
                            <th className="px-6 py-3 text-right">Status / Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {complex.meetings.length === 0 ? (
                            <tr><td colSpan={4} className="p-6 text-center text-slate-400">No meetings scheduled.</td></tr>
                        ) : (
                            complex.meetings.map(m => (
                                <tr key={m.id}>
                                    <td className="px-6 py-4 font-mono text-slate-800">
                                        {new Date(m.date).toLocaleDateString('en-NZ')} <span className="text-slate-400 text-xs ml-1">{m.time}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1">
                                            <span className={`px-2 py-1 rounded text-xs font-medium w-fit ${
                                                m.type === 'AGM' ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'
                                            }`}>
                                                {m.type}
                                            </span>
                                            {/* Status Indicators */}
                                            <div className="flex gap-1">
                                                {m.noiIssued && <span className="text-[10px] bg-green-100 text-green-700 px-1 rounded">NOI Sent</span>}
                                                {m.nomIssued && <span className="text-[10px] bg-green-100 text-green-700 px-1 rounded">NOM Sent</span>}
                                                {m.minutesIssued && <span className="text-[10px] bg-gray-100 text-gray-600 px-1 rounded">Mins Sent</span>}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-slate-800">{m.venue}</div>
                                        <div className="text-xs text-slate-400">{m.venueAddress}</div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-3">
                                            {new Date(m.date) < new Date() ? (
                                                <span className="text-slate-400 text-xs italic">Completed</span>
                                            ) : (
                                                <span className="text-emerald-600 text-xs font-medium">Upcoming</span>
                                            )}
                                            
                                            {userRole === 'admin' && (
                                                <>
                                                    <button onClick={() => startEdit(m)} className="text-slate-400 hover:text-blue-600 transition-colors">
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button onClick={(e) => handleDelete(m.id, e)} className="text-slate-400 hover:text-red-600 transition-colors">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ComplexList;
