
import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Receipt, Clock, CheckCircle2, Loader2 } from 'lucide-react';

const Financial: React.FC = () => {
    const { user } = useAuth();
    const { invoices, markInvoiceRecovered } = useData();
    const [invoiceFilterComplex, setInvoiceFilterComplex] = useState('all');
    const [invoiceFilterDocType, setInvoiceFilterDocType] = useState('all');
    const [invoiceFilterStatus, setInvoiceFilterStatus] = useState('outstanding');
    const [recoveringId, setRecoveringId] = useState<string | null>(null);

    if (!user) return <Navigate to="/" replace />;

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

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Financial</h1>
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
                    {[...new Map(invoices.map(i => [i.complexId, i])).values()].sort((a, b) => a.complexName.localeCompare(b.complexName)).map(i => (
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
    );
};

export default Financial;
