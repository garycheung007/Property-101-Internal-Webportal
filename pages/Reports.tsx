
import React, { useMemo, useState } from 'react';
import { useData } from '../contexts/DataContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { TrendingUp, Users, Building, DollarSign, Download, Briefcase, FileSpreadsheet, Filter } from 'lucide-react';
import { BodyCorporate } from '../types';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#6366f1', '#ec4899'];

const Reports: React.FC = () => {
    const { complexes, managers } = useData();
    const activeComplexes = complexes.filter(c => !c.isArchived);
    const [selectedManagerForReport, setSelectedManagerForReport] = useState<string>('');

    // Manager Stats Calculation
    const stats = useMemo(() => {
        const managerMap: Record<string, { name: string; count: number; fees: number; units: number }> = {};
        
        activeComplexes.forEach(bc => {
            const manager = bc.managerName || 'Unassigned';
            if (!managerMap[manager]) {
                managerMap[manager] = { name: manager, count: 0, fees: 0, units: 0 };
            }
            managerMap[manager].count += 1;
            managerMap[manager].fees += bc.managementFee || 0;
            managerMap[manager].units += bc.units || 0;
        });

        return Object.values(managerMap).sort((a, b) => b.fees - a.fees);
    }, [activeComplexes]);

    const totalFees = stats.reduce((acc, s) => acc + s.fees, 0);

    // --- CSV Generators ---

    // 1. Management Fee / Performance Report
    const downloadFeeSummaryCSV = () => {
        const headers = ["Manager Name", "Total Complexes", "Total Units", "Total Management Fees (Inc GST)"];
        const rows = stats.map(s => [
            `"${s.name}"`, 
            s.count.toString(), 
            s.units.toString(), 
            s.fees.toFixed(2)
        ]);
        
        generateAndDownloadCSV(headers, rows, `management_fee_summary_${new Date().toISOString().split('T')[0]}.csv`);
    };

    // 2. Detailed Property List (Reusable for All or Specific Manager)
    const downloadPropertyDetailsCSV = (targetManager: string | null) => {
        const dataToExport = targetManager 
            ? activeComplexes.filter(c => c.managerName === targetManager)
            : activeComplexes;

        const headers = [
            "BC Number", "Property Name", "Address", "Type", "Manager", 
            "Units", "Management Fee (Inc GST)", "Financial Year End", "Management Start", "Onboarding Type",
            "Insurance Expiry", "Insurance Broker", "Insurance Valuer", "Next Valuation",
            "BWOF Expiry", "BWOF Consultant", 
            "LTMP Date", "LTMP Renewal",
            "Next AGM Date", "Building Manager", "Building Manager Contact"
        ];
        
        const rows = dataToExport.map(bc => [
            `"${bc.bcNumber}"`,
            `"${bc.name}"`,
            `"${bc.address}"`,
            `"${bc.type || 'Body Corporate'}"`,
            `"${bc.managerName}"`,
            bc.units.toString(),
            (bc.managementFee || 0).toFixed(2),
            `"${bc.financialYearEnd || ''}"`,
            `"${bc.managementStartDate || ''}"`,
            `"${bc.onboardingType || ''}"`,
            `"${bc.insuranceExpiry || ''}"`,
            `"${bc.insuranceBroker || ''}"`,
            `"${bc.insuranceValuer || ''}"`,
            `"${bc.nextValuationDue || ''}"`,
            `"${bc.bwofExpiry || ''}"`,
            `"${bc.bwofConsultant || ''}"`,
            `"${bc.ltmpCompletedDate || ''}"`,
            `"${bc.nextLtmpRenewalDate || ''}"`,
            `"${bc.nextAgmDate || ''}"`,
            `"${bc.buildingManagerCompany || (bc.hasBuildingManager ? 'Yes' : 'No')}"`,
            `"${bc.buildingManagerEmail || ''}"`
        ]);

        const filename = targetManager 
            ? `property_list_${targetManager.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`
            : `full_portfolio_report_${new Date().toISOString().split('T')[0]}.csv`;

        generateAndDownloadCSV(headers, rows, filename);
    };

    const generateAndDownloadCSV = (headers: string[], rows: string[][], filename: string) => {
        const csvContent = "data:text/csv;charset=utf-8," 
            + headers.join(",") + "\n" 
            + rows.map(e => e.join(",")).join("\n");
            
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const currencyFormatter = (value: number) => 
        new Intl.NumberFormat('en-NZ', { style: 'currency', currency: 'NZD', maximumFractionDigits: 0 }).format(value);

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Reports & Analytics</h1>
                    <p className="text-slate-500">Portfolio performance and document exports.</p>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
                     <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600">
                        <DollarSign size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-slate-500">Total Annual Fees (Inc GST)</p>
                        <p className="text-2xl font-bold text-slate-800">{currencyFormatter(totalFees)}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
                     <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
                        <Building size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-slate-500">Total Complexes</p>
                        <p className="text-2xl font-bold text-slate-800">{activeComplexes.length}</p>
                    </div>
                </div>
                 <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
                     <div className="p-3 bg-purple-50 rounded-lg text-purple-600">
                        <Users size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-slate-500">Active Managers</p>
                        <p className="text-2xl font-bold text-slate-800">{stats.length}</p>
                    </div>
                </div>
            </div>

            {/* Report Generator Section */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Download size={20} className="text-blue-600" /> Report Generator
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* 1. Management Fee Report */}
                    <div className="p-4 rounded-lg border border-slate-200 bg-slate-50 flex flex-col justify-between">
                        <div>
                            <h3 className="font-semibold text-slate-800">Management Fee Report</h3>
                            <p className="text-xs text-slate-500 mt-1">Summary of total fees, units, and complexes grouped by Manager.</p>
                        </div>
                        <button 
                            onClick={downloadFeeSummaryCSV}
                            className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors text-sm font-medium shadow-sm"
                        >
                            <FileSpreadsheet size={16} className="text-emerald-600" />
                            Download Summary
                        </button>
                    </div>

                    {/* 2. Full Portfolio List */}
                    <div className="p-4 rounded-lg border border-slate-200 bg-slate-50 flex flex-col justify-between">
                        <div>
                            <h3 className="font-semibold text-slate-800">Full Portfolio List</h3>
                            <p className="text-xs text-slate-500 mt-1">Detailed export of ALL active complexes with full information (Insurance, Compliance, Dates).</p>
                        </div>
                        <button 
                            onClick={() => downloadPropertyDetailsCSV(null)}
                            className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors text-sm font-medium shadow-sm"
                        >
                            <FileSpreadsheet size={16} className="text-blue-600" />
                            Download Full List
                        </button>
                    </div>

                    {/* 3. Manager Specific List */}
                    <div className="p-4 rounded-lg border border-slate-200 bg-slate-50 flex flex-col justify-between">
                        <div>
                            <h3 className="font-semibold text-slate-800">Manager Portfolio</h3>
                            <p className="text-xs text-slate-500 mt-1">Detailed property list filtered for a specific manager.</p>
                        </div>
                        <div className="mt-4 space-y-2">
                            <select 
                                className="w-full text-sm border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
                                value={selectedManagerForReport}
                                onChange={(e) => setSelectedManagerForReport(e.target.value)}
                            >
                                <option value="">Select Manager...</option>
                                {managers.map(m => (
                                    <option key={m.id} value={m.name}>{m.name}</option>
                                ))}
                            </select>
                            <button 
                                onClick={() => downloadPropertyDetailsCSV(selectedManagerForReport)}
                                disabled={!selectedManagerForReport}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium shadow-sm"
                            >
                                <Filter size={16} className="text-purple-600" />
                                Download Manager List
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Fees by Manager Chart */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-[400px] flex flex-col">
                    <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <TrendingUp size={18} className="text-blue-500"/> Revenue by Manager (Inc GST)
                    </h2>
                    <div className="flex-1 w-full min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} tickFormatter={(val) => `$${val/1000}k`} />
                                <Tooltip 
                                    cursor={{fill: '#f1f5f9'}}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    formatter={(value: number) => [currencyFormatter(value), 'Annual Fees (Inc GST)']}
                                />
                                <Bar dataKey="fees" radius={[4, 4, 0, 0]} maxBarSize={60}>
                                    {stats.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Portfolio Distribution */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-[400px] flex flex-col">
                    <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <Briefcase size={18} className="text-purple-500"/> Portfolio Distribution (Units)
                    </h2>
                    <div className="flex-1 w-full min-h-0">
                         <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={stats}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="units"
                                >
                                    {stats.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    formatter={(value: number) => [value, 'Units Managed']}
                                />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
            
            {/* Detailed Portfolio Table Preview */}
             <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <FileSpreadsheet size={18} className="text-emerald-600"/> Portfolio Snapshot
                    </h2>
                </div>
                <div className="overflow-x-auto max-h-[500px]">
                    <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 sticky top-0 z-10">
                            <tr>
                                <th className="px-6 py-4">ID</th>
                                <th className="px-6 py-4">Name</th>
                                <th className="px-6 py-4">Type</th>
                                <th className="px-6 py-4">Manager</th>
                                <th className="px-6 py-4 text-center">Units</th>
                                <th className="px-6 py-4 text-right">Fee (Inc GST)</th>
                                <th className="px-6 py-4">FYE</th>
                                <th className="px-6 py-4">Ins. Exp.</th>
                                <th className="px-6 py-4">BWOF Exp.</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {activeComplexes.map((bc) => (
                                <tr key={bc.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-3 font-mono text-xs">{bc.bcNumber}</td>
                                    <td className="px-6 py-3 font-medium text-slate-800">{bc.name}</td>
                                    <td className="px-6 py-3 text-xs">{bc.type || 'Body Corporate'}</td>
                                    <td className="px-6 py-3">{bc.managerName}</td>
                                    <td className="px-6 py-3 text-center">{bc.units}</td>
                                    <td className="px-6 py-3 text-right font-medium text-emerald-600">{currencyFormatter(bc.managementFee || 0)}</td>
                                    <td className="px-6 py-3 text-xs">{bc.financialYearEnd}</td>
                                    <td className="px-6 py-3 text-xs">{bc.insuranceExpiry}</td>
                                    <td className="px-6 py-3 text-xs">{bc.bwofExpiry}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
             </div>
        </div>
    )
}
export default Reports;
