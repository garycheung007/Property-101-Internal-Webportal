
import React from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { 
    DollarSign, TrendingUp, FileSpreadsheet, Download
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#6366f1', '#ec4899'];

const Financials: React.FC = () => {
    const { user } = useAuth();
    const { complexes, loading } = useData();

    if (user?.role !== 'admin') return <Navigate to="/" replace />;

    const activeComplexes = complexes.filter(c => !c.isArchived);
    const totalFees = activeComplexes.reduce((acc, c) => acc + (c.managementFee || 0), 0);
    const averageFee = totalFees / (activeComplexes.length || 1);

    const revenueByManager = (() => {
        const map: Record<string, number> = {};
        activeComplexes.forEach(c => {
            const m = c.managerName || 'Unassigned';
            map[m] = (map[m] || 0) + (c.managementFee || 0);
        });
        return Object.entries(map)
            .map(([name, fee]) => ({ name, fee }))
            .sort((a, b) => b.fee - a.fee);
    })();

    const handleExport = () => {
        const headers = ["BC Number", "Property Name", "Manager", "Units", "Management Fee (Inc GST)", "Financial Year End"];
        const rows = activeComplexes.map(c => [
            `"${c.bcNumber}"`, 
            `"${c.name}"`, 
            `"${c.managerName || 'Unassigned'}"`, 
            c.units.toString(), 
            (c.managementFee || 0).toFixed(2), 
            `"${c.financialYearEnd || ''}"`
        ]);
        const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `management_fee_report_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-300">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Financial Overview</h1>
                <button 
                    onClick={handleExport}
                    className="bg-slate-800 hover:bg-black text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg transition-all"
                >
                    <Download size={18} /> Export Fee Report
                </button>
            </div>

            {/* Financial Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border dark:border-slate-800 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl text-emerald-600">
                        <DollarSign size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Annual Fees (Inc GST)</p>
                        <p className="text-2xl font-bold dark:text-white">
                            ${totalFees.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border dark:border-slate-800 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl text-blue-600">
                        <TrendingUp size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Average Fee Per Complex</p>
                        <p className="text-2xl font-bold dark:text-white">
                            ${averageFee.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                    </div>
                </div>
            </div>

            {/* Revenue by Manager Chart */}
            <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border dark:border-slate-800 shadow-sm h-[400px] flex flex-col">
                <h3 className="text-sm font-bold uppercase tracking-widest mb-8 flex items-center gap-2 dark:text-white">
                    <TrendingUp size={18} className="text-emerald-500" /> Revenue Distribution by Manager
                </h3>
                <div className="flex-1 w-full min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={revenueByManager}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} />
                            <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} tickFormatter={(val) => `$${(val/1000).toFixed(0)}k`} />
                            <Tooltip 
                                cursor={{fill: 'rgba(241, 245, 249, 0.1)'}}
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', backgroundColor: '#1e293b', color: '#fff' }}
                                formatter={(value: number) => [`$${value.toLocaleString()}`, 'Annual Fees']}
                            />
                            <Bar dataKey="fee" radius={[6, 6, 0, 0]} maxBarSize={50}>
                                {revenueByManager.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Detailed Fee Audit Table */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="p-6 border-b dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex justify-between items-center">
                    <h3 className="text-sm font-bold uppercase tracking-widest dark:text-white">Property Fee Audit</h3>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Showing {activeComplexes.length} Active Properties</div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-800/50 text-[10px] uppercase font-bold text-slate-500 tracking-widest">
                            <tr>
                                <th className="px-6 py-4">BC Number</th>
                                <th className="px-6 py-4">Property Name</th>
                                <th className="px-6 py-4">Manager</th>
                                <th className="px-6 py-4 text-right">Annual Fee (Inc GST)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y dark:divide-slate-800">
                            {activeComplexes.sort((a, b) => (b.managementFee || 0) - (a.managementFee || 0)).map((bc) => (
                                <tr key={bc.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                                    <td className="px-6 py-4 font-mono text-xs">{bc.bcNumber}</td>
                                    <td className="px-6 py-4 font-bold text-slate-800 dark:text-white">{bc.name}</td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded text-[10px] font-bold uppercase tracking-tight">{bc.managerName || 'Unassigned'}</span>
                                    </td>
                                    <td className="px-6 py-4 text-right font-mono font-bold text-emerald-600">
                                        ${(bc.managementFee || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Financials;
