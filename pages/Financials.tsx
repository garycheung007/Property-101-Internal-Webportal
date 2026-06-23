
import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import {
    DollarSign, TrendingUp, FileSpreadsheet, Download, Receipt, Clock, CheckCircle2, Loader2
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#6366f1', '#ec4899'];

const Financials: React.FC = () => {
    const { user } = useAuth();
    const { complexes, loading, invoices, markInvoiceRecovered } = useData();
    const [invoiceFilterComplex, setInvoiceFilterComplex] = useState('all');
    const [invoiceFilterDocType, setInvoiceFilterDocType] = useState('all');
    const [invoiceFilterStatus, setInvoiceFilterStatus] = useState('outstanding');
    const [recoveringId, setRecoveringId] = useState<string | null>(null);
    const [chartView, setChartView] = useState<'revenue' | 'complexes' | 'units' | 'meetings'>('revenue');

    if (!user) return <Navigate to="/" replace />;

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

    const currentYear = new Date().getFullYear().toString();

    const complexesByManager = (() => {
        const map: Record<string, number> = {};
        activeComplexes.forEach(c => { const m = c.managerName || 'Unassigned'; map[m] = (map[m] || 0) + 1; });
        return Object.entries(map).map(([name, count]) => ({ name, value: count })).sort((a, b) => b.value - a.value);
    })();

    const unitsByManager = (() => {
        const map: Record<string, number> = {};
        activeComplexes.forEach(c => { const m = c.managerName || 'Unassigned'; map[m] = (map[m] || 0) + (c.units || 0); });
        return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
    })();

    const meetingsByManager = (() => {
        const map: Record<string, number> = {};
        activeComplexes.forEach(c => {
            const m = c.managerName || 'Unassigned';
            map[m] = (map[m] || 0) + (c.meetings || []).filter(mt => mt.date?.startsWith(currentYear)).length;
        });
        return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
    })();

    const getActiveChart = () => {
        switch (chartView) {
            case 'revenue':   return { data: revenueByManager.map(d => ({ name: d.name, value: d.fee })), label: 'Revenue Distribution by Manager',       yFmt: (v: number) => `$${(v/1000).toFixed(0)}k`, ttFmt: (v: number) => [`$${v.toLocaleString('en-NZ')}`, 'Annual Fees'] as [string, string] };
            case 'complexes': return { data: complexesByManager, label: 'Complexes per Manager',                 yFmt: (v: number) => `${v}`,                      ttFmt: (v: number) => [`${v}`, 'Complexes']                          as [string, string] };
            case 'units':     return { data: unitsByManager,     label: 'Units per Manager',                     yFmt: (v: number) => `${v}`,                      ttFmt: (v: number) => [`${v}`, 'Units']                              as [string, string] };
            case 'meetings':  return { data: meetingsByManager,  label: `Meetings per Manager (${currentYear})`, yFmt: (v: number) => `${v}`,                      ttFmt: (v: number) => [`${v}`, 'Meetings']                           as [string, string] };
        }
    };
    const activeChart = getActiveChart();

    const filteredInvoices = invoices
        .filter(inv => invoiceFilterComplex === 'all' || inv.complexId === invoiceFilterComplex)
        .filter(inv => invoiceFilterDocType === 'all' || inv.documentType === invoiceFilterDocType)
        .filter(inv => {
            if (invoiceFilterStatus === 'outstanding') return !inv.recoveredAt;
            if (invoiceFilterStatus === 'recovered') return !!inv.recoveredAt;
            return true;
        })
        .sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime());

    const totalOutstanding = invoices.filter(i => !i.recoveredAt).reduce((s, i) => s + i.amountInclGst, 0);
    const totalRecovered   = invoices.filter(i =>  i.recoveredAt).reduce((s, i) => s + i.amountInclGst, 0);

    const handleMarkRecovered = async (invoiceId: string) => {
        setRecoveringId(invoiceId);
        try { await markInvoiceRecovered(invoiceId, user?.name || 'Unknown'); }
        finally { setRecoveringId(null); }
    };

    const fmtCurrency = (n: number) => `$${n.toLocaleString('en-NZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('en-NZ');

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
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Portfolio Overview</h1>
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

            {/* Manager Chart */}
            <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border dark:border-slate-800 shadow-sm h-[400px] flex flex-col">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2 dark:text-white">
                        <TrendingUp size={18} className="text-emerald-500" /> {activeChart.label}
                    </h3>
                    {user.role === 'admin' && (
                        <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1 text-xs font-bold">
                            {(['revenue', 'complexes', 'units', 'meetings'] as const).map(v => (
                                <button
                                    key={v}
                                    onClick={() => setChartView(v)}
                                    className={`px-3 py-1.5 rounded-lg transition-colors ${chartView === v ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                                >
                                    {v === 'revenue' ? 'Revenue' : v === 'complexes' ? 'Complexes' : v === 'units' ? 'Units' : 'Meetings'}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                <div className="flex-1 w-full min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={activeChart.data}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} />
                            <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} tickFormatter={activeChart.yFmt} />
                            <Tooltip
                                cursor={{fill: 'rgba(241, 245, 249, 0.1)'}}
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', backgroundColor: '#1e293b', color: '#fff' }}
                                labelStyle={{ color: '#fff' }}
                                itemStyle={{ color: '#fff' }}
                                formatter={(value) => activeChart.ttFmt(Number(value))}
                            />
                            <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={50}>
                                {activeChart.data.map((_entry, index) => (
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

            {/* On-charge Invoices */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <Receipt size={20} className="text-emerald-600" /> On-charge Invoices
                    </h2>
                    <div className="flex gap-2 text-xs">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-amber-700 dark:text-amber-400 font-bold">
                            <Clock size={12} /> Outstanding: {fmtCurrency(totalOutstanding)}
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg text-emerald-700 dark:text-emerald-400 font-bold">
                            <CheckCircle2 size={12} /> Recovered: {fmtCurrency(totalRecovered)}
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-3">
                    <select
                        value={invoiceFilterComplex}
                        onChange={e => setInvoiceFilterComplex(e.target.value)}
                        className="rounded-xl border dark:border-slate-700 dark:bg-slate-800 dark:text-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                        <option value="all">All Properties</option>
                        {[...new Map(invoices.map(i => [i.complexId, i])).values()].sort((a,b) => a.complexName.localeCompare(b.complexName)).map(i => (
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
                    </select>
                    <select
                        value={invoiceFilterStatus}
                        onChange={e => setInvoiceFilterStatus(e.target.value)}
                        className="rounded-xl border dark:border-slate-700 dark:bg-slate-800 dark:text-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                        <option value="all">All Statuses</option>
                        <option value="outstanding">Outstanding</option>
                        <option value="recovered">Recovered</option>
                    </select>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-2xl border dark:border-slate-800 shadow-sm overflow-hidden">
                    {filteredInvoices.length === 0 ? (
                        <div className="p-12 text-center text-slate-400">
                            <Receipt size={32} className="mx-auto mb-3 opacity-20" />
                            <p className="text-sm">No invoices found for the selected filters.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 dark:bg-slate-800/50 text-[10px] uppercase font-bold text-slate-500 tracking-widest">
                                    <tr>
                                        <th className="px-4 py-3">Date</th>
                                        <th className="px-4 py-3">Complex</th>
                                        <th className="px-4 py-3">Type</th>
                                        <th className="px-4 py-3">Details</th>
                                        <th className="px-4 py-3 text-right">Excl. GST</th>
                                        <th className="px-4 py-3 text-right">GST</th>
                                        <th className="px-4 py-3 text-right">Incl. GST</th>
                                        <th className="px-4 py-3">Generated By</th>
                                        <th className="px-4 py-3">Status</th>
                                        <th className="px-4 py-3"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y dark:divide-slate-800">
                                    {filteredInvoices.map(inv => (
                                        <tr key={inv.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                                            <td className="px-4 py-3 font-mono text-xs text-slate-500">{fmtDate(inv.date)}</td>
                                            <td className="px-4 py-3">
                                                <div className="font-bold text-slate-800 dark:text-white text-xs">{inv.complexName}</div>
                                                <div className="text-[10px] text-slate-400 font-mono">{inv.bcNumber}</div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="px-2 py-0.5 bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400 rounded text-[10px] font-bold uppercase">{inv.documentType}</span>
                                            </td>
                                            <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-300">{inv.details}</td>
                                            <td className="px-4 py-3 text-right font-mono text-xs">{fmtCurrency(inv.amountExclGst)}</td>
                                            <td className="px-4 py-3 text-right font-mono text-xs text-slate-500">{fmtCurrency(inv.gstAmount)}</td>
                                            <td className="px-4 py-3 text-right font-mono text-xs font-bold text-emerald-600">{fmtCurrency(inv.amountInclGst)}</td>
                                            <td className="px-4 py-3">
                                                <div className="text-xs font-medium dark:text-white">{inv.generatedBy}</div>
                                                <div className="text-[10px] text-slate-400">{new Date(inv.generatedAt).toLocaleTimeString('en-NZ', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase()} {fmtDate(inv.generatedAt)}</div>
                                            </td>
                                            <td className="px-4 py-3">
                                                {inv.recoveredAt ? (
                                                    <div>
                                                        <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold"><CheckCircle2 size={11} /> Recovered</div>
                                                        <div className="text-[10px] text-slate-400">{fmtDate(inv.recoveredAt)} · {inv.recoveredBy}</div>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 text-[10px] font-bold"><Clock size={11} /> Outstanding</div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                {!inv.recoveredAt && (
                                                    <button
                                                        onClick={() => handleMarkRecovered(inv.id)}
                                                        disabled={recoveringId === inv.id}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all disabled:opacity-50"
                                                    >
                                                        {recoveringId === inv.id ? <Loader2 size={10} className="animate-spin" /> : <CheckCircle2 size={10} />}
                                                        Mark Recovered
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Financials;
