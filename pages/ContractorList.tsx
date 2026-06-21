
import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { Contractor, ContractorCategory, NotingMethod, NotingRequirement } from '../types';
import { HardHat, Search, Plus, Phone, Mail, Edit2, Trash2, X, Info, PlusCircle, MinusCircle, Loader2, Save, ArrowUpDown, ChevronUp, ChevronDown } from 'lucide-react';

const ContractorList: React.FC = () => {
    const { contractors, addContractor, updateContractor, deleteContractor, systemSettings } = useData();
    const { user } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingContractor, setEditingContractor] = useState<Contractor | null>(null);
    const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

    const allCategories = Array.from(new Set([
        ...(systemSettings.contractorCategories || []),
        ...contractors.map(c => c.category),
    ])).filter(Boolean).sort();

    const filteredContractors = contractors
        .filter(c =>
            (filterCategory === 'all' || c.category === filterCategory) &&
            (c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
             c.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
             c.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()))
        )
        .sort((a, b) => sortDir === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name));

    const handleEdit = (c: Contractor) => {
        setEditingContractor(c);
        setIsModalOpen(true);
    };

    const handleDelete = async (e: React.MouseEvent, id: string, name: string) => {
        e.preventDefault();
        e.stopPropagation();

        if (!id) {
            alert("Error: Contractor ID is missing.");
            return;
        }

        if (window.confirm(`Permanently remove "${name}" from the system?`)) {
            setDeletingIds(prev => {
                const next = new Set(prev);
                next.add(id);
                return next;
            });
            
            try {
                console.log(`Initiating delete for contractor ID: ${id}`);
                await deleteContractor(id);
            } catch (err: any) {
                console.error("Delete operation failed in UI:", err);
                alert(`Critical Error: Could not delete ${name}.\n\nReason: ${err.message}`);
            } finally {
                setDeletingIds(prev => {
                    const next = new Set(prev);
                    next.delete(id);
                    return next;
                });
            }
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingContractor(null);
    };

    const handleSaveContractor = async (c: Contractor) => {
        if (editingContractor) {
            await updateContractor(c);
        } else {
            await addContractor(c);
        }
        handleCloseModal();
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white transition-colors">Contractors</h1>
                    <p className="text-slate-500 dark:text-slate-400">Directory of service providers and brokers.</p>
                </div>
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="bg-pink-600 hover:bg-pink-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg transition-all"
                >
                    <Plus size={18} /> Add Contractor
                </button>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden transition-colors">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 transition-colors flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search by name or contact..."
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500 text-sm transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select
                        className="py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white text-sm outline-none focus:ring-2 focus:ring-pink-500 transition-all"
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                    >
                        <option value="all">All Categories</option>
                        {allCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
                        <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs uppercase font-bold text-slate-500 dark:text-slate-400">
                            <tr>
                                <th className="px-6 py-4">
                                    <button onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')} className="flex items-center gap-1.5 hover:text-pink-600 transition-colors">
                                        Company
                                        {sortDir === 'asc' ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                                    </button>
                                </th>
                                <th className="px-6 py-4">Category</th>
                                <th className="px-6 py-4">Contact</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {filteredContractors.map((c) => {
                                const isDeleting = deletingIds.has(c.id);
                                return (
                                    <tr key={c.id} className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors ${isDeleting ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-slate-800 dark:text-white">{c.name}</div>
                                            {c.notingRequirements && c.notingRequirements.length > 0 && (
                                                <div className="text-[10px] text-pink-600 dark:text-pink-400 font-bold mt-0.5 flex items-center gap-1 uppercase tracking-tight">
                                                    <Info size={10} /> Noting Required
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400`}>
                                                {c.category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-slate-700 dark:text-slate-300">{c.contactPerson}</div>
                                            <div className="text-[11px] text-slate-400 flex flex-col mt-0.5">
                                                <span>{c.email}</span>
                                                <span>{c.phone}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button 
                                                    onClick={() => handleEdit(c)} 
                                                    className="p-2 text-slate-400 hover:text-pink-600 hover:bg-pink-50 dark:hover:bg-pink-900/20 rounded-lg transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button 
                                                    onClick={(e) => handleDelete(e, c.id, c.name)} 
                                                    disabled={isDeleting}
                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors disabled:opacity-30"
                                                    title="Delete"
                                                >
                                                    {isDeleting ? <Loader2 size={16} className="animate-spin text-red-500" /> : <Trash2 size={16} />}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {filteredContractors.length === 0 && (
                                <tr><td colSpan={4} className="p-12 text-center text-slate-400 italic">No contractors matched your search.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && (
                <ContractorModal 
                    contractor={editingContractor} 
                    onClose={handleCloseModal} 
                    onSave={handleSaveContractor}
                    categories={systemSettings.contractorCategories || []}
                />
            )}
        </div>
    );
};

const ContractorModal: React.FC<{ 
    contractor: Contractor | null; 
    onClose: () => void; 
    onSave: (c: Contractor) => Promise<void>; 
    categories: string[];
}> = ({ contractor, onClose, onSave, categories }) => {
    const [form, setForm] = useState<Partial<Contractor>>(contractor || { category: categories[0] || 'General', notingRequirements: [] });
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (form.name && form.category) {
            setIsSaving(true);
            try {
                const finalId = contractor?.id || `cont_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
                await onSave({
                    id: finalId,
                    name: form.name!,
                    category: form.category!,
                    contactPerson: form.contactPerson || '',
                    email: form.email || '',
                    phone: form.phone || '',
                    notingRequirements: form.notingRequirements || [],
                    notingInstructions: form.notingInstructions || ''
                });
            } catch (err: any) {
                alert(`Save Error: ${err.message}`);
                setIsSaving(false);
            }
        }
    };

    const addNotingRequirement = () => {
        setForm({ ...form, notingRequirements: [...(form.notingRequirements || []), { method: 'Email', detail: '' }] });
    };

    const updateNotingRequirement = (index: number, field: keyof NotingRequirement, value: string) => {
        const newReqs = [...(form.notingRequirements || [])];
        newReqs[index] = { ...newReqs[index], [field]: value };
        setForm({ ...form, notingRequirements: newReqs });
    };

    const removeNotingRequirement = (index: number) => {
        setForm({ ...form, notingRequirements: (form.notingRequirements || []).filter((_, i) => i !== index) });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border dark:border-slate-800">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950 transition-colors">
                    <h3 className="font-bold text-slate-800 dark:text-white uppercase tracking-wider text-xs">{contractor ? 'Edit Provider' : 'New Contractor'}</h3>
                    <button onClick={onClose} disabled={isSaving} className="text-slate-400 hover:text-slate-600 transition-colors p-1"><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Company Name</label>
                                <input required type="text" className="w-full border dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl p-3 text-sm focus:ring-2 focus:ring-pink-500 outline-none" value={form.name || ''} onChange={e => setForm({...form, name: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Category</label>
                                <select 
                                    className="w-full border dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl p-3 text-sm bg-white outline-none focus:ring-2 focus:ring-pink-500"
                                    value={form.category}
                                    onChange={e => setForm({...form, category: e.target.value})}
                                >
                                    {categories.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                    {!categories.includes(form.category || '') && form.category && (
                                        <option value={form.category}>{form.category}</option>
                                    )}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Contact Person</label>
                                <input type="text" className="w-full border dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-pink-500" value={form.contactPerson || ''} onChange={e => setForm({...form, contactPerson: e.target.value})} />
                            </div>
                        </div>

                        {form.category === 'Insurance Broker' && (
                            <div className="bg-pink-50/50 dark:bg-pink-900/10 p-4 rounded-2xl border border-pink-100 dark:border-pink-900/20">
                                 <div className="flex justify-between items-center mb-3">
                                    <h4 className="text-[10px] font-bold text-pink-700 dark:text-pink-400 uppercase tracking-widest">Noting Requirements</h4>
                                    <button 
                                        type="button" 
                                        onClick={addNotingRequirement}
                                        className="text-pink-600 hover:text-pink-800 dark:text-pink-400 text-[10px] font-bold uppercase flex items-center gap-1"
                                    >
                                        <PlusCircle size={14} /> Add Method
                                    </button>
                                 </div>
                                 <div className="space-y-3">
                                    {(form.notingRequirements || []).map((nr, index) => (
                                        <div key={index} className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-pink-100 dark:border-pink-900/40 relative group">
                                            <button 
                                                type="button" 
                                                onClick={() => removeNotingRequirement(index)}
                                                className="absolute -top-2 -right-2 text-red-500 bg-white dark:bg-slate-900 rounded-full shadow-sm"
                                            >
                                                <MinusCircle size={18} />
                                            </button>
                                            <div className="grid grid-cols-2 gap-2">
                                                <select 
                                                    className="border dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg p-2 text-xs"
                                                    value={nr.method}
                                                    onChange={e => updateNotingRequirement(index, 'method', e.target.value as NotingMethod)}
                                                >
                                                    <option value="Email">Email</option>
                                                    <option value="Phone Call">Phone</option>
                                                    <option value="Online Submission">Web Portal</option>
                                                </select>
                                                <input 
                                                    type="text" 
                                                    className="border dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg p-2 text-xs" 
                                                    placeholder="Detail..."
                                                    value={nr.detail} 
                                                    onChange={e => updateNotingRequirement(index, 'detail', e.target.value)} 
                                                />
                                            </div>
                                        </div>
                                    ))}
                                 </div>
                                <div className="mt-3">
                                    <label className="block text-[10px] font-bold text-pink-700 dark:text-pink-400 uppercase tracking-widest mb-1">Insurance Noting Instructions</label>
                                    <textarea
                                        className="w-full border border-pink-100 dark:border-pink-900/40 dark:bg-slate-800 dark:text-white rounded-xl p-2.5 text-xs resize-none outline-none focus:ring-2 focus:ring-pink-500"
                                        rows={2}
                                        placeholder="e.g. Email notings to notings@lumley.co.nz"
                                        value={form.notingInstructions || ''}
                                        onChange={e => setForm({ ...form, notingInstructions: e.target.value })}
                                    />
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Email</label>
                                <input type="email" className="w-full border dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-pink-500" value={form.email || ''} onChange={e => setForm({...form, email: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Phone</label>
                                <input type="text" className="w-full border dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-pink-500" value={form.phone || ''} onChange={e => setForm({...form, phone: e.target.value})} />
                            </div>
                        </div>
                    </div>
                    
                    <button 
                        type="submit" 
                        disabled={isSaving}
                        className="w-full bg-pink-600 hover:bg-pink-700 text-white py-4 rounded-2xl font-bold transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 uppercase tracking-widest text-xs"
                    >
                        {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                        {isSaving ? 'Processing...' : (contractor ? 'Update Details' : 'Create Contractor')}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ContractorList;
