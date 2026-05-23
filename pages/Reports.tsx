import React, { useMemo, useState } from 'react';
import { useData } from '../contexts/DataContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, Users, Building, DollarSign, Download, FileSpreadsheet, Filter, Clock } from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#6366f1', '#ec4899'];

// Custom Tick Component to handle multi-line names
const MultiLineTick = (props: any) => {
    const { x, y, payload } = props;
    if (!payload.value) return null;
    
    const words = payload.value.split(' ');
    
    return (
        <g transform={`translate(${x},${y})`}>
            {words.map((word: string, index: number) => (
                <text
                    key={index}
                    x={0}
                    y={index * 12}
                    dy={12}
                    textAnchor="middle"
                    fill="#64748b"
                    className="text-[10px] font-medium transition-colors dark:fill-slate-400"
                >
                    {word}
                </text>
            ))}
        </g>
    );
};

const Reports: React.FC = () => {
    const { complexes, managers } = useData();
    const activeComplexes = complexes.filter(c => !c.isArchived);
    const [selectedManagerForReport, setSelectedManagerForReport] = useState<string>('');

    // General Stats Calculation (Excluding fees)
    const stats = useMemo(() => {
        const managerMap: Record<string, { name: string; count: number; units: number }> = {};
        
        activeComplexes.forEach(bc => {
            const manager = bc.managerName || 'Unassigned';
            if (!managerMap[manager]) {
                managerMap[manager] = { name: manager, count: 0, units: 0 };
            }
            managerMap[manager].count += 1;
            managerMap[manager].units += bc.units || 0;
        });

        return Object.values(managerMap).sort((a, b) => b.count - a.count);
    }, [activeComplexes]);

    // Create a stable color map for all managers
    const managerColorMap = useMemo(() => {
        const allPossibleManagers = Array.from(new Set([
            ...managers.map(m => m.name),
            ...stats.map(s => s.name),
            'Unassigned'
        ]));
        
        const map: Record<string, string> = {};
        allPossibleManagers.forEach((name, index) => {
            map[name] = COLORS[index % COLORS.length];
        });
        return map;
    }, [managers, stats]);

    // Meeting Stats Calculation
    const meetingStats = useMemo(() => {
        const managerMap: Record<string, { name: string; totalMeetings: number; agms: number; committee: number }> = {};
        
        activeComplexes.forEach(bc => {
            const manager = bc.managerName || 'Unassigned';
            if (!managerMap[manager]) {
                managerMap[manager] = { name: manager, totalMeetings: 0, agms: 0, committee: 0 };
            }
            
            const contractedCommittee = bc.numberOfCommitteeMeetings || 0;
            managerMap[manager].agms += 1; // Default 1 AGM
            managerMap[manager].committee += contractedCommittee;
            managerMap[manager].totalMeetings += (1 + contractedCommittee);
        });

        return Object.values(managerMap).sort((a, b) => b.totalMeetings - a.totalMeetings);
    }, [activeComplexes]);

    const downloadPropertyDetailsCSV = (targetManager: string | null) => {
        const dataToExport = targetManager 
            ? activeComplexes.filter(c => c.managerName === targetManager)
            : activeComplexes;

        const headers = [
            "BC Number", "Property Name", "Address", "Type", "Manager", 
            "Units", "Financial Year End", "Management Start", "Onboarding Type",
            "Insurance Expiry", "Insurance Broker", "Insurance Valuer", "Next Valuation",
            "BWOF Expiry", "BWOF Consultant", 
            "LTMP Date", "LTMP Renewal",
            "Next AGM Date", "Building Manager", "Building Manager Contact", "Contracted Committee Meetings"
        ];
        
        const rows = dataToExport.map(bc => [
            `"${bc.bcNumber}"`,
            `"${bc.name}"`,
            `"${bc.address}"`,
            `"${bc.type || 'Body Corporate'}"`,
            `"${bc.managerName}"`,
            bc.units.toString(),
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
            `"${bc.buildingManagerEmail || ''}"`,
            `"${bc.numberOfCommitteeMeetings || 0}"`
        ]);

        const filename = targetManager 
            ? `property_list_${targetManager.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`
            : `full_portfolio_report_${new Date().toISOString().split('T')[0]}.csv`;

        generateAndDownloadCSV(headers, rows, filename);
    };

    const downloadMeetingReportCSV = () => {
         const headers = ["Manager Name", "Total Meetings", "AGMs", "Committee Meetings (Contracted)"];
         const rows = meetingStats.map(s => [
             `"${s.name}"`, 
             s.totalMeetings.toString(), 
             s.agms.toString(), 
             s.committee.toString()
         ]);
         generateAndDownloadCSV(headers, rows, `meeting_workload_report_${new Date().toISOString().split('T')[0]}.csv`);
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

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white transition-colors">Reports & Analytics</h1>
                    <p className="text-slate-500 dark:text-slate-400">Portfolio performance and document exports.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-4 transition-colors">
                     <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
                        <Building size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Total Complexes</p>
                        <p className="text-2xl font-bold text-slate-800 dark:text-white">{activeComplexes.length}</p>
                    </div>
                </div>
                 <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-4 transition-colors">
                     <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-purple-600 dark:text-purple-400">
                        <Users size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Active Managers</p>
                        <p className="text-2xl font-bold text-slate-800 dark:text-white">{stats.length}</p>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
                <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                    <Download size={20} className="text-blue-600" /> Report Generator
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                     <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex flex-col justify-between">
                        <div>
                            <h3 className="font-semibold text-slate-800 dark:text-white">Meeting Workload</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Analysis of the number of meetings per year.</p>
                        </div>
                        <button onClick={downloadMeetingReportCSV} className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-sm font-medium shadow-sm">
                            <Clock size={16} className="text-amber-600" />
                            Download Analysis
                        </button>
                    </div>
                    <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex flex-col justify-between">
                        <div>
                            <h3 className="font-semibold text-slate-800 dark:text-white">Full Portfolio List</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Export of ALL active complexes information.</p>
                        </div>
                        <button onClick={() => downloadPropertyDetailsCSV(null)} className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-sm font-medium shadow-sm">
                            <FileSpreadsheet size={16} className="text-blue-600" />
                            Download Full List
                        </button>
                    </div>
                    <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex flex-col justify-between">
                        <div>
                            <h3 className="font-semibold text-slate-800 dark:text-white">Manager Portfolio</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Property list filtered for a specific manager.</p>
                        </div>
                        <div className="mt-4 space-y-2">
                            <select className="w-full text-sm border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-white rounded-lg p-2 focus:ring-2 focus:ring-blue-500" value={selectedManagerForReport} onChange={(e) => setSelectedManagerForReport(e.target.value)}>
                                <option value="">Select Manager...</option>
                                {managers.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
                            </select>
                            <button onClick={() => downloadPropertyDetailsCSV(selectedManagerForReport)} disabled={!selectedManagerForReport} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium shadow-sm">
                                <Filter size={16} className="text-purple-600" />
                                Download List
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 h-[450px] flex flex-col transition-colors">
                    <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                        <TrendingUp size={18} className="text-blue-500"/> Portfolio Distribution by Manager
                    </h2>
                    <div className="flex-1 w-full min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats} margin={{ top: 10, right: 30, left: 0, bottom: 40 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis 
                                    dataKey="name" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    interval={0}
                                    tick={<MultiLineTick />} 
                                />
                                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                                <Tooltip 
                                    cursor={{fill: 'rgba(241, 245, 249, 0.1)'}}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: '#1e293b', color: '#fff' }}
                                    formatter={(value: number) => [value, 'Complexes Managed']}
                                />
                                <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={60}>
                                    {stats.map((entry, index) => (
                                        <Cell key={`cell-dist-${index}`} fill={managerColorMap[entry.name] || '#cbd5e1'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 h-[450px] flex flex-col transition-colors">
                    <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                        <Clock size={18} className="text-amber-500"/> Number of Meetings per year
                    </h2>
                    <div className="flex-1 w-full min-h-0">
                         <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={meetingStats} margin={{ top: 10, right: 30, left: 0, bottom: 40 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis 
                                    dataKey="name" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    interval={0}
                                    tick={<MultiLineTick />} 
                                />
                                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                                <Tooltip 
                                    cursor={{fill: 'rgba(241, 245, 249, 0.1)'}}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: '#1e293b', color: '#fff' }}
                                    formatter={(value: number, name: string) => {
                                        if (name === 'totalMeetings') return [value, 'Meetings Per Year'];
                                        return [value, name];
                                    }}
                                />
                                <Bar dataKey="totalMeetings" radius={[4, 4, 0, 0]} maxBarSize={60}>
                                    {meetingStats.map((entry, index) => (
                                        <Cell key={`cell-meeting-${index}`} fill={managerColorMap[entry.name] || '#cbd5e1'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
            
             <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden transition-colors">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950/50">
                    <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <FileSpreadsheet size={18} className="text-emerald-600"/> Portfolio Snapshot
                    </h2>
                </div>
                <div className="overflow-x-auto max-h-[500px]">
                    <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
                        <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs uppercase font-semibold text-slate-500 dark:text-slate-400 sticky top-0 z-10 transition-colors">
                            <tr>
                                <th className="px-6 py-4">ID</th>
                                <th className="px-6 py-4">Name</th>
                                <th className="px-6 py-4">Type</th>
                                <th className="px-6 py-4">Manager</th>
                                <th className="px-6 py-4 text-center">Units</th>
                                <th className="px-6 py-4">Committee Mtgs</th>
                                <th className="px-6 py-4">FYE</th>
                                <th className="px-6 py-4">Ins. Exp.</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {activeComplexes.map((bc) => (
                                <tr key={bc.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <td className="px-6 py-3 font-mono text-xs">{bc.bcNumber}</td>
                                    <td className="px-6 py-3 font-medium text-slate-800 dark:text-white">{bc.name}</td>
                                    <td className="px-6 py-3 text-xs">{bc.type || 'Body Corporate'}</td>
                                    <td className="px-6 py-3">{bc.managerName}</td>
                                    <td className="px-6 py-3 text-center">{bc.units}</td>
                                    <td className="px-6 py-3 text-center">{bc.numberOfCommitteeMeetings || 0}</td>
                                    <td className="px-6 py-3 text-xs">{bc.financialYearEnd}</td>
                                    <td className="px-6 py-3 text-xs">{bc.insuranceExpiry}</td>
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