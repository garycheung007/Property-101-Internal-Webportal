import React, { useState, useRef } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AlertTriangle, Calendar, FileCheck, DollarSign, Clock, MessageCircle, Send, Trash2, X, History, Filter, User, CheckCircle2, ClipboardList, ArrowRightCircle, ExternalLink } from 'lucide-react';
import { Reminder, ReminderType } from '../types';

const Dashboard: React.FC = () => {
  const { complexes, reminders, actionComments, addActionComment, removeActionComment, managers, updateComplex, updateMeeting } = useData();
  const { user } = useAuth();
  const navigate = useNavigate();
  const upcomingActionsRef = useRef<HTMLDivElement>(null);
  const criticalAlertsRef = useRef<HTMLDivElement>(null);

  const [selectedManager, setSelectedManager] = useState<string>('all');
  const [selectedReminder, setSelectedReminder] = useState<Reminder | null>(null);

  const activeComplexes = complexes.filter(c => !c.isArchived);

  const filteredComplexes = selectedManager === 'all' 
    ? activeComplexes 
    : activeComplexes.filter(c => c.managerName === selectedManager);

  const filteredReminders = reminders.filter(r => {
      const complex = complexes.find(c => c.id === r.bcId);
      if (selectedManager === 'all') return true;
      return complex?.managerName === selectedManager;
  });

  const criticalAlerts = filteredReminders.filter(r => r.type !== ReminderType.UPCOMING_ACTION);
  const upcomingActions = filteredReminders.filter(r => r.type === ReminderType.UPCOMING_ACTION);

  const upcomingMeetings = filteredComplexes
    .map(c => {
        // Find most relevant next AGM or EGM session
        const nextMtg = (c.meetings || [])
            .filter(m => m.type !== 'Committee' && new Date(m.date) >= new Date(new Date().setHours(0,0,0,0)))
            .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

        if (nextMtg) {
            return {
                id: nextMtg.id,
                type: nextMtg.type as any,
                date: nextMtg.date,
                time: nextMtg.time || 'TBC',
                bcNumber: c.bcNumber,
                bcName: c.name,
                bcId: c.id,
                noiIssued: nextMtg.noiIssued,
                nomIssued: nextMtg.nomIssued,
                noiDueDate: nextMtg.noiDueDate,
                complexType: c.type,
                nomDaysPrior: c.isocNomDaysPrior,
                noiNotApplicable: nextMtg.noiNotApplicable
            }
        }
        return null;
    })
    .filter((m): m is any => m !== null)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 10);

  const totalUnits = filteredComplexes.reduce((sum, c) => sum + c.units, 0);

  const getNextDocumentStatus = (meeting: any) => {
      const mDate = new Date(meeting.date);
      let noiPref: Date;
      let noiDead: Date;
      let nomPref: Date;
      let nomDead: Date;

      if (meeting.complexType === 'Incorporated Society') {
          const nomPeriod = meeting.nomDaysPrior || 7;
          nomDead = new Date(mDate);
          nomDead.setDate(nomDead.getDate() - nomPeriod);
          
          // Pref for NOM is 1 week prior to deadline
          nomPref = new Date(nomDead);
          nomPref.setDate(nomPref.getDate() - 7);

          // Deadline for NOI is 1 week prior to NOM deadline
          noiDead = new Date(nomDead);
          noiDead.setDate(noiDead.getDate() - 7);
          
          // Pref for NOI is 2 weeks prior to NOM deadline
          noiPref = new Date(nomDead);
          noiPref.setDate(noiPref.getDate() - 14);
      } else {
          // Body Corporate Statutory Rules (UTA 2010)
          noiPref = new Date(mDate); noiPref.setDate(noiPref.getDate() - 35); // 5 weeks
          noiDead = new Date(mDate); noiDead.setDate(noiDead.getDate() - 21); // 3 weeks
          
          nomPref = new Date(mDate); nomPref.setDate(nomPref.getDate() - 21); // 3 weeks
          nomDead = new Date(mDate); nomDead.setDate(nomDead.getDate() - 14); // 2 weeks
      }

      const today = new Date();
      today.setHours(0,0,0,0);

      const processStatus = (pref: Date, dead: Date, issued: boolean, notApp?: boolean) => {
          const isUrgent = today > pref; // Escalation triggers when Preferred passes
          const upcomingTrigger = new Date(pref);
          upcomingTrigger.setDate(upcomingTrigger.getDate() - 7);
          const isWarning = today >= upcomingTrigger;

          return {
              isUrgent,
              isWarning,
              prefStr: pref.toISOString().split('T')[0],
              deadStr: dead.toISOString().split('T')[0]
          };
      };

      if (!meeting.noiIssued && !meeting.noiNotApplicable) {
          const s = processStatus(noiPref, noiDead, false);
          return { 
            label: 'NOI Required', 
            pref: s.prefStr, 
            deadline: s.deadStr, 
            status: s.isUrgent ? 'urgent' : (s.isWarning ? 'warning' : 'good') 
          };
      }

      if (!meeting.nomIssued) {
          const s = processStatus(nomPref, nomDead, false);
          return { 
            label: 'NOM Required', 
            pref: s.prefStr, 
            deadline: s.deadStr, 
            status: s.isUrgent ? 'urgent' : (s.isWarning ? 'warning' : 'good') 
          };
      }

      return { label: 'Notices Sent', pref: 'Complete', deadline: 'Complete', status: 'good' };
  };

  const navigateToProperty = (bcId: string, reminderType: ReminderType, message: string) => {
      // Determine tab based on type or message content
      const isMeeting = reminderType === ReminderType.AGM || message.includes('Notice') || message.includes('NOI') || message.includes('NOM');
      const isComplianceOrInsurance = reminderType === ReminderType.INSURANCE || 
                                     reminderType === ReminderType.INSURANCE_VALUATION || 
                                     reminderType === ReminderType.BWOF ||
                                     reminderType === ReminderType.COMPLIANCE ||
                                     message.toLowerCase().includes('insurance') || 
                                     message.toLowerCase().includes('valuation') ||
                                     message.toLowerCase().includes('bwof');
      
      if (isMeeting) {
          navigate(`/complexes?id=${bcId}&tab=meetings`);
      } else if (isComplianceOrInsurance) {
          navigate(`/complexes?id=${bcId}&tab=details`);
      } else {
          // Default to details if unsure
          navigate(`/complexes?id=${bcId}&tab=details`);
      }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white transition-colors">Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400">Overview of managed properties in Auckland</p>
        </div>
        
        <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-white dark:bg-slate-900 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
                <Filter size={16} className="text-slate-400" />
                <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">Filter by Manager:</span>
                <select 
                    className="text-sm bg-transparent border-none focus:ring-0 text-slate-700 dark:text-slate-200 font-semibold cursor-pointer outline-none"
                    value={selectedManager}
                    onChange={(e) => setSelectedManager(e.target.value)}
                >
                    <option value="all">All Managers</option>
                    {managers.map(m => (
                        <option key={m.id} value={m.name}>{m.name}</option>
                    ))}
                </select>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Active Complexes', val: filteredComplexes.length, icon: <FileCheck />, color: 'pink', onClick: () => navigate('/complexes') },
          { label: 'Upcoming Actions', val: upcomingActions.length, icon: <ClipboardList />, color: 'pink', onClick: () => upcomingActionsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }) },
          { label: 'Critical Alerts', val: criticalAlerts.length, icon: <AlertTriangle />, color: 'amber', onClick: () => criticalAlertsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }
        ].map((stat, i) => (
          <div key={i} onClick={stat.onClick} className="cursor-pointer hover:shadow-md bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 transition-all text-left">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg ${
                stat.color === 'pink' ? 'bg-pink-50 text-pink-600 dark:bg-pink-900/20' : 
                stat.color === 'emerald' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20' : 
                'bg-amber-50 text-amber-600 dark:bg-amber-900/20'
              }`}>
                {stat.icon}
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">{stat.label}</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-white">{stat.val}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Upcoming Actions Section */}
        <div ref={upcomingActionsRef} className="lg:col-span-1 bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col transition-colors">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-1 flex items-center gap-2">
            <ClipboardList className="text-pink-500" size={20} />
            Upcoming Actions
          </h2>
          <p className="text-xs text-slate-400 mb-4">Task issuance for portolios</p>

          <div className="overflow-y-auto max-h-[420px] space-y-3 pr-2 custom-scrollbar">
            {upcomingActions.length === 0 ? (
                <div className="text-slate-400 text-center py-10 flex flex-col items-center">
                    <CheckCircle2 size={32} className="mb-2 opacity-50 text-emerald-500" />
                    <span>All actions complete.</span>
                </div>
            ) : (
                upcomingActions.map(rem => {
                    const isOverdue = new Date(rem.dueDate) < new Date();
                    const isMeetingRelated = rem.message.includes('Notice') || rem.message.includes('NOI') || rem.message.includes('NOM');
                    const isInsuranceRelated = rem.message.includes('insurance') || rem.message.includes('valuation');
                    
                    return (
                        <div key={rem.id} className={`p-4 rounded-xl border-l-4 group transition-all hover:translate-x-1 cursor-pointer hover:shadow-md ${
                            isOverdue ? 'bg-red-50 border-red-500 dark:bg-red-950/20' : 'bg-slate-50 border-slate-300 dark:bg-slate-800/50 dark:border-slate-700'
                        }`}
                        onClick={() => navigateToProperty(rem.bcId, rem.type, rem.message)}
                        >
                            <div className="flex justify-between items-start mb-1">
                                <div className="flex items-center gap-2">
                                    <span className={`text-[10px] font-bold uppercase tracking-widest ${isOverdue ? 'text-red-600' : 'text-slate-400'}`}>
                                        {isOverdue ? 'Overdue' : 'Scheduled'}
                                    </span>
                                    {isMeetingRelated && <span className="text-[10px] bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400 px-1.5 py-0.5 rounded font-bold uppercase">Meeting Task</span>}
                                    {isInsuranceRelated && <span className="text-[10px] bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 px-1.5 py-0.5 rounded font-bold uppercase">Insurance Task</span>}
                                </div>
                                <span className="text-[10px] font-mono text-slate-500">{new Date(rem.dueDate).toLocaleDateString('en-NZ')}</span>
                            </div>
                            <p className="text-sm font-bold text-slate-800 dark:text-white flex items-center justify-between">
                                {rem.bcName}
                                <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-pink-500" />
                            </p>
                            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-3">{rem.message}</p>
                            
                            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/50 flex justify-between items-center">
                                <button onClick={(e) => { e.stopPropagation(); setSelectedReminder(rem); }} className="text-[10px] font-bold text-pink-600 dark:text-pink-400 flex items-center gap-1 hover:underline uppercase tracking-tight">
                                    <MessageCircle size={12} /> Log Details
                                </button>
                            </div>
                        </div>
                    );
                })
            )}
          </div>
        </div>

        {/* Critical Alerts Section (Overdue tasks move here) */}
        <div ref={criticalAlertsRef} className="lg:col-span-1 bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col transition-colors">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-1 flex items-center gap-2">
            <AlertTriangle className="text-amber-500" size={20} />
            Critical Alerts
          </h2>
          <p className="text-xs text-slate-400 mb-4">Compliance risk summary</p>

          <div className="overflow-y-auto max-h-[420px] space-y-3 pr-2 custom-scrollbar">
            {criticalAlerts.length === 0 ? (
                <div className="text-slate-400 text-center py-10 flex flex-col items-center">
                    <FileCheck size={32} className="mb-2 opacity-50" />
                    <span>No critical risks identified.</span>
                </div>
            ) : (
                criticalAlerts.map(rem => (
                    <div 
                        key={rem.id} 
                        onClick={() => navigateToProperty(rem.bcId, rem.type, rem.message)}
                        className={`p-4 rounded-xl border-l-4 group cursor-pointer transition-all hover:translate-x-1 hover:shadow-md ${
                            rem.severity === 'high' ? 'bg-red-50 border-red-500 dark:bg-red-950/20' : 'bg-amber-50 border-amber-400 dark:bg-amber-950/20'
                        }`}
                    >
                        <div className="flex justify-between items-start">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{rem.type}</span>
                            <span className="text-[10px] font-mono text-slate-500">{new Date(rem.dueDate).toLocaleDateString('en-NZ')}</span>
                        </div>
                        <p className="font-bold text-slate-800 dark:text-white mt-1 flex items-center justify-between">
                            {rem.bcName}
                            <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-amber-600" />
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{rem.message}</p>
                        <div className="mt-3 flex justify-between items-center">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Click to Resolve</span>
                             <button 
                                onClick={(e) => { e.stopPropagation(); setSelectedReminder(rem); }} 
                                className="text-[10px] font-bold text-slate-500 flex items-center gap-1 hover:text-pink-600 uppercase tracking-tight"
                            >
                                <MessageCircle size={12} /> Audit Trail
                            </button>
                        </div>
                    </div>
                ))
            )}
          </div>
        </div>

        {/* Upcoming Meetings Section (Maintains chronological schedule) */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col transition-colors">
           <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-1 flex items-center gap-2">
            <Clock className="text-pink-500" size={20} />
            Upcoming Meetings
          </h2>
          <p className="text-xs text-slate-400 mb-4">Confirmed AGM schedule</p>

          <div className="overflow-y-auto max-h-[420px] pr-2 custom-scrollbar">
              {upcomingMeetings.length === 0 ? (
                  <div className="text-center text-slate-400 py-10 flex flex-col items-center">
                      <Calendar size={32} className="mb-2 opacity-50" />
                      <span>No confirmed AGMs.</span>
                  </div>
              ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                      {upcomingMeetings.map((m) => {
                          const docStatus = getNextDocumentStatus(m);
                          const isUrgent = docStatus.status === 'urgent';
                          const isComplete = docStatus.status === 'good';
                          const isNoticeSent = docStatus.label === 'Notices Sent';
                          
                          return (
                            <div key={`${m.bcId}-${m.id}`} className="py-4 first:pt-0 group cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg px-2 -mx-2 transition-all"
                            onClick={() => navigate(`/complexes?id=${m.bcId}&tab=meetings`)}>
                                    <div className="flex justify-between items-start mb-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-slate-700 dark:text-slate-200 text-sm">{m.bcNumber}</span>
                                            <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-pink-500" />
                                        </div>
                                        <span className="text-[10px] bg-pink-50 text-pink-700 dark:bg-pink-900/20 dark:text-pink-400 px-2 py-0.5 rounded font-bold">{m.type}</span>
                                    </div>
                                    <p className="text-xs text-slate-600 dark:text-slate-400 truncate mb-2">{m.bcName}</p>
                                    
                                    <div className="flex items-center gap-2 text-[10px] text-slate-500 mb-3">
                                        <Calendar size={12} />
                                        <span>{new Date(m.date).toLocaleDateString('en-NZ')} at {m.time}</span>
                                    </div>

                                    <div className={`text-[10px] p-2.5 rounded-xl border flex flex-col gap-1 transition-colors ${
                                        isUrgent ? 'bg-red-50 text-red-700 border-red-100 dark:bg-red-950/20 dark:border-red-900/30' : 
                                        docStatus.status === 'warning' ? 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/20 dark:border-amber-900/30' : 
                                        docStatus.status === 'good' && !isNoticeSent ? 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/30' :
                                        'bg-slate-50 text-slate-600 border-slate-100 dark:bg-slate-800 dark:border-slate-700'
                                    }`}>
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-1.5 font-bold uppercase tracking-tight">
                                                {isComplete && isNoticeSent && <CheckCircle2 size={10} />}
                                                {docStatus.label}:
                                            </div>
                                            <span className="font-mono font-bold">
                                                {isNoticeSent ? 'COMPLETE' : ''}
                                            </span>
                                        </div>
                                        {!isNoticeSent && (
                                            <div className="flex flex-col gap-0.5 mt-1 border-t border-current/10 pt-1.5">
                                                <div className="flex justify-between">
                                                    <span className="opacity-70">Statutory Deadline:</span>
                                                    <span className="font-bold">{new Date(docStatus.deadline!).toLocaleDateString('en-NZ')}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="opacity-70">Preferred Action Date:</span>
                                                    <span className="font-medium italic">{new Date(docStatus.pref!).toLocaleDateString('en-NZ')}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                            </div>
                          );
                      })}
                  </div>
              )}
          </div>
          <div className="pt-3 mt-3 border-t dark:border-slate-800 flex justify-end">
            <button onClick={() => navigate('/complexes')} className="text-xs text-pink-600 dark:text-pink-400 font-bold hover:underline flex items-center gap-1">
              View all complexes <ArrowRightCircle size={12} />
            </button>
          </div>
        </div>
      </div>

      {/* Comment Modal */}
      {selectedReminder && (
          <CommentModal 
            reminder={selectedReminder}
            comments={actionComments.filter(c => c.reminderId === selectedReminder.id)}
            onClose={() => setSelectedReminder(null)}
            onAddComment={(id, text, u) => addActionComment(id, selectedReminder.bcId, text, u)}
            onDeleteComment={removeActionComment}
            currentUser={user}
          />
      )}
    </div>
  );
};

// --- Sub Components ---

const CommentModal: React.FC<{
    reminder: Reminder;
    comments: any[];
    onClose: () => void;
    onAddComment: (id: string, text: string, user: any) => void;
    onDeleteComment: (id: string) => void;
    currentUser: any;
}> = ({ reminder, comments, onClose, onAddComment, onDeleteComment, currentUser }) => {
    const [text, setText] = useState('');
    const [showHistory, setShowHistory] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (text.trim() && currentUser) {
            onAddComment(reminder.id, text, currentUser);
            setText('');
        }
    };

    const isAdmin = currentUser?.role === 'admin';
    const displayedComments = comments.filter(c => showHistory ? true : !c.isDeleted).sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[80vh] border dark:border-slate-800 transition-colors">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900 transition-colors">
                    <div>
                        <h3 className="font-bold text-slate-800 dark:text-white">Action Log</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{reminder.bcName}</p>
                    </div>
                    <button onClick={onClose}><X size={20} className="text-slate-400 hover:text-slate-600" /></button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 dark:bg-slate-950/50">
                    <div className="bg-pink-50 dark:bg-pink-900/10 p-3 rounded-lg border border-pink-100 dark:border-pink-900/30">
                        <p className="text-[10px] font-bold text-pink-800 dark:text-pink-300 uppercase tracking-widest mb-1">Target Action</p>
                        <p className="text-sm font-medium text-pink-700 dark:text-pink-200">{reminder.message}</p>
                    </div>

                    {displayedComments.length === 0 ? (
                        <div className="text-center text-slate-400 py-8 text-sm italic">
                            No notes recorded for this action.
                        </div>
                    ) : (
                        displayedComments.map(comment => (
                            <div key={comment.id} className={`flex flex-col gap-1 ${comment.isDeleted ? 'opacity-50' : ''}`}>
                                <div className="flex justify-between items-baseline">
                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{comment.userName}</span>
                                    <span className="text-[10px] text-slate-400">
                                        {new Date(comment.timestamp).toLocaleString('en-NZ', { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' })}
                                    </span>
                                </div>
                                <div className={`p-3 rounded-lg border text-sm shadow-sm group relative transition-colors ${
                                    comment.isDeleted 
                                        ? 'bg-red-50 border-red-100 dark:bg-red-950/20 dark:border-red-900/20' 
                                        : 'bg-white border-slate-200 dark:bg-slate-800 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                                }`}>
                                    {comment.isDeleted ? (
                                        <div className="flex items-center gap-2">
                                            <span className="italic line-through text-slate-400">{comment.text}</span>
                                            <span className="text-[10px] text-red-500 font-bold uppercase border border-red-200 px-1 rounded">Deleted</span>
                                        </div>
                                    ) : (
                                        comment.text
                                    )}
                                    
                                    {!comment.isDeleted && (
                                        <button 
                                            onClick={() => onDeleteComment(comment.id)}
                                            className="absolute top-2 right-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                            title="Remove Log"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
                    <form onSubmit={handleSubmit} className="flex gap-2">
                        <input 
                            type="text" 
                            className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pink-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white transition-colors"
                            placeholder="Add progress note..."
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                        />
                        <button 
                            type="submit" 
                            disabled={!text.trim()}
                            className="bg-pink-600 hover:bg-pink-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white p-2 rounded-lg transition-colors"
                        >
                            <Send size={18} />
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default Dashboard;