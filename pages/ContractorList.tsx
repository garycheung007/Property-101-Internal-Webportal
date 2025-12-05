import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { Contractor, ContractorCategory } from '../types';
import { HardHat, Search, Plus, Phone, Mail, Edit2, Trash2, X } from 'lucide-react';

const ContractorList: React.FC = () => {
    const { contractors, addContractor, updateContractor, deleteContractor } = useData();
    const { user } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingContractor, setEditingContractor] = useState<Contractor | null>(null);

    const filteredContractors = contractors.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.contactPerson.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleEdit = (c: Contractor) => {
        setEditingContractor(c);
        setIsModalOpen(true);
    };

    const handleDelete = (id: string) => {
        if (window.confirm("Are you sure you want to delete this contractor?")) {
            deleteContractor(id);
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingContractor(null);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Contractor List</h1>
                    <p className="text-slate-500">Manage Insurance Brokers, Valuers, and Service Providers.</p>
                </div>
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2"
                >
                    <Plus size={16} /> Add Contractor
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Search contractors..." 
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500">
                            <tr>
                                <th className="px-6 py-4">Company Name</th>
                                <th className="px-6 py-4">Category</th>
                                <th className="px-6 py-4">Contact Person</th>
                                <th className="px-6 py-4">Contact Details</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredContractors.map((c) => (
                                <tr key={c.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4 font-medium text-slate-800">{c.name}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                                            c.category === 'Insurance Broker' ? 'bg-purple-50 text-purple-700' :
                                            c.category === 'Insurance Valuer' ? 'bg-emerald-50 text-emerald-700' :
                                            'bg-slate-100 text-slate-700'
                                        }`}>
                                            {c.category}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">{c.contactPerson}</td>
                                    <td className="px-6 py-4 space-y-1">
                                        <div className="flex items-center gap-2 text-xs">
                                            <Mail size={12} /> {c.email}
                                        </div>
                                        <div className="flex items-center gap-2 text-xs">
                                            <Phone size={12} /> {c.phone}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button onClick={() => handleEdit(c)} className="p-2 text-slate-400 hover:text-blue-600 rounded-full hover:bg-blue-50 transition-colors">
                                                <Edit2 size={16} />
                                            </button>
                                            <button onClick={() => handleDelete(c.id)} className="p-2 text-slate-400 hover:text-red-600 rounded-full hover:bg-red-50 transition-colors">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredContractors.length === 0 && (
                                <tr><td colSpan={5} className="p-8 text-center text-slate-400">No contractors found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && (
                <ContractorModal 
                    contractor={editingContractor} 
                    onClose={handleCloseModal} 
                    onSave={(c) => {
                        if (editingContractor) {
                            updateContractor(c);
                        } else {
                            addContractor(c);
                        }
                        handleCloseModal();
                    }} 
                />
            )}
        </div>
    );
};

const ContractorModal: React.FC<{ 
    contractor: Contractor | null; 
    onClose: () => void; 
    onSave: (c: Contractor) => void; 
}> = ({ contractor, onClose, onSave }) => {
    const [form, setForm] = useState<Partial<Contractor>>(contractor || { category: 'General' });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (form.name && form.category) {
            onSave({
                id: contractor?.id || Math.random().toString(36).substr(2, 9),
                name: form.name!,
                category: form.category!,
                contactPerson: form.contactPerson || '',
                email: form.email || '',
                phone: form.phone || ''
            });
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold text-slate-800">{contractor ? 'Edit Contractor' : 'Add Contractor'}</h3>
                    <button onClick={onClose}><X size={20} className="text-slate-400 hover:text-slate-600" /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Company Name</label>
                        <input required type="text" className="w-full border rounded p-2 text-sm" value={form.name || ''} onChange={e => setForm({...form, name: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Category</label>
                        <select 
                            className="w-full border rounded p-2 text-sm bg-white"
                            value={form.category}
                            onChange={e => setForm({...form, category: e.target.value as ContractorCategory})}
                        >
                            <option value="General">General</option>
                            <option value="Insurance Broker">Insurance Broker</option>
                            <option value="Insurance Valuer">Insurance Valuer</option>
                            <option value="Consultant">Consultant</option>
                            <option value="Compliance">Compliance</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Contact Person</label>
                        <input type="text" className="w-full border rounded p-2 text-sm" value={form.contactPerson || ''} onChange={e => setForm({...form, contactPerson: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">Email</label>
                            <input type="email" className="w-full border rounded p-2 text-sm" value={form.email || ''} onChange={e => setForm({...form, email: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">Phone</label>
                            <input type="text" className="w-full border rounded p-2 text-sm" value={form.phone || ''} onChange={e => setForm({...form, phone: e.target.value})} />
                        </div>
                    </div>
                    <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium transition-colors mt-4">
                        {contractor ? 'Update Contractor' : 'Add Contractor'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ContractorList;