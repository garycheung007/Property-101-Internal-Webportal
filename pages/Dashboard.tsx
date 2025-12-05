
import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AlertTriangle, Calendar, FileCheck, DollarSign, Clock, MessageCircle, Send, Trash2, X, History, Filter, User } from 'lucide-react';
import { Reminder } from '../types';

const Dashboard: React.FC = () => {
  const { complexes, reminders, actionComments, addActionComment, removeActionComment, managers } = useData();
  const { user } = useAuth();
  
  // State for Filters
  const [selectedManager, setSelectedManager] = useState<string>('all');

  // State for Comment Modal
  const [selectedReminder, setSelectedReminder] = useState<Reminder | null>(null);

  // Filter out archived complexes for active stats (Global stats usually remain global, but lists are filtered)
  const activeComplexes = complexes.filter(c => !c.isArchived);

  // --- FILTERING LOGIC ---

  // 1. Filtered Complexes (for Charts/Stats context if needed, mostly for deriving meetings)
  const filteredComplexes = selectedManager === 'all' 
    ? activeComplexes 
    : activeComplexes.filter(c => c.managerName === selectedManager);

  // 2. Filtered Reminders (Critical Actions)
  const filteredReminders = reminders.filter(r => {
      const complex = complexes.find(c => c.id === r.bcId);
      // Safety check if complex archive status matters for reminders (usually handled in DataContext generation)
      // Filter by manager:
      if (selectedManager === 'all') return true;
      return complex?.managerName === selectedManager;
  });

  // 3. Filtered Upcoming Meetings
  const upcomingMeetings = filteredComplexes
    .flatMap(c => c.meetings.map(m => ({ 
        ...m, 
        bcNumber: c.bcNumber, 
        bcName: c.name, 
        bcId: c.id,
        isIS: c.type === 'Incorporated Society' || c.bcNumber.startsWith('IS'),
        isocNomDays: c.isocNomDaysPrior
    })))
    .filter(m => new Date(m.date) >= new Date(new Date().setHours(0,0,0,0)))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 10); // Show top 10 when filtered

  // Stats (Keep Global or Filtered? usually Dashboard stats are high level, but let's make them reactive to filter)
  const statsComplexes = filteredComplexes;
  const totalUnits = statsComplexes.reduce((sum, c) => sum + c.units, 0);
  const totalFees = statsComplexes.reduce((sum, c) => sum + c.managementFee, 0);

  // Chart Data preparation
  const chartData = statsComplexes.map(c => ({
    name: c.bcNumber,
    units: c.units,
    fee: c.managementFee
  }));

  // Helper to determine next document due
  const getNextDocumentStatus = (meeting: typeof upcomingMeetings[0]) => {
      const mDate = new Date(meeting.date);
      
      // Calculate NOM Date
      const nomDays = meeting.isIS ? (meeting.isocNomDays || 7) : 15;
      const nomDate = new Date(mDate);
      nomDate.setDate(mDate.getDate() - nomDays);

      if (meeting.type === 'AGM' && !meeting.isIS) {
          // Check NOI first
          if (!meeting.noiIssued) {
              return { 
                  label: 'NOI Due', 
                  date: meeting.noiDueDate || 'Calc Required', 
                  status: 'urgent' 
              };
          }
      }

      // Check NOM
      if (!meeting.nomIssued) {
          return {
              label: 'NOM Due',
              date: nomDate.toISOString().split('T')[0],
              status: 'warning'
          };
      }

      if (!meeting.minutesIssued && new Date(meeting.date) < new Date()) {
          return { label: 'Minutes Due', date: 'Post Meeting', status: 'info' };
      }

      return { label: 'Ready', date: 'All Docs Sent', status: 'good' };
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
          <p className="text-slate-500">Overview of managed properties in Auckland</p>
        </div>
        
        <div className="flex items-center gap-4">
            {/* MANAGER FILTER */}
            <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-slate-200 shadow-sm">
                <Filter size={16} className="text-slate-400" />
                <span className="text-sm text-slate-500 font-medium">Filter by Manager:</span>
                <select 
                    className="text-sm bg-transparent border-none focus:ring-0 text-slate-700 font-semibold cursor-pointer outline-none"
                    value={selectedManager}
                    onChange={(e) => setSelectedManager(e.target.value)}
                >
                    <option value="all">All Managers</option>
                    {managers.map(m => (
                        <option key={m.id} value={m.name}>{m.name}</option>
                    ))}
                </select>
            </div>
            <div className="text-right text-sm text-slate-400 hidden md:block">
                Date: {new Date().toLocaleDateString('en-NZ')}
            </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
              <FileCheck size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500">Active Complexes</p>
              <p className="text-2xl font-bold text-slate-800">{activeComplexes.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-50 rounded-lg text-indigo-600">
              <Calendar size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500">Units Managed</p>
              <p className="text-2xl font-bold text-slate-800">{totalUnits}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600">
              <DollarSign size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Fees (Inc GST)</p>
              <p className="text-2xl font-bold text-slate-800">
                ${(totalFees / 1000).toFixed(1)}k
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-50 rounded-lg text-amber-600">
              <AlertTriangle size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500">Active Reminders</p>
              <p className="text-2xl font-bold text-slate-800">{reminders.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Reminders Section */}
        <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col h-[500px]">
          <h2 className="text-lg font-bold text-slate-800 mb-1 flex items-center gap-2">
            <AlertTriangle className="text-amber-500" size={20} />
            Critical Actions
          </h2>
          <p className="text-xs text-slate-400 mb-4">
              {selectedManager === 'all' ? 'All Portfolios' : `Filtering for ${selectedManager}`}
          </p>
          
          <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
            {filteredReminders.length === 0 ? (
                <div className="text-slate-400 text-center py-10 flex flex-col items-center">
                    <FileCheck size={32} className="mb-2 opacity-50" />
                    <span>No pending actions found.</span>
                </div>
            ) : (
                filteredReminders.map(rem => {
                    // Count active comments for this reminder
                    const commentCount = actionComments.filter(c => c.reminderId === rem.id && !c.isDeleted).length;
                    
                    return (
                        <div key={rem.id} className={`p-4 rounded-lg border-l-4 ${
                            rem.severity === 'high' ? 'bg-red-50 border-red-500' : 'bg-amber-50 border-amber-400'
                        }`}>
                            <div className="flex justify-between items-start">
                                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{rem.type}</span>
                                <span className="text-xs font-mono text-slate-500">{new Date(rem.dueDate).toLocaleDateString('en-NZ')}</span>
                            </div>
                            <p className="font-semibold text-slate-800 mt-1">{rem.bcName}</p>
                            <p className="text-sm text-slate-600 mt-1">{rem.message}</p>
                            
                            <div className="mt-3 flex justify-end">
                                <button 
                                    onClick={() => setSelectedReminder(rem)}
                                    className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-blue-600 hover:bg-white px-2 py-1 rounded transition-colors"
                                >
                                    <MessageCircle size={14} />
                                    {commentCount > 0 ? (
                                        <span>{commentCount} Comments</span>
                                    ) : (
                                        <span>Add Comment</span>
                                    )}
                                </button>
                            </div>
                        </div>
                    );
                })
            )}
          </div>
        </div>

        {/* Upcoming Meetings Section */}
        <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col h-[500px]">
           <h2 className="text-lg font-bold text-slate-800 mb-1 flex items-center gap-2">
            <Clock className="text-blue-500" size={20} />
            Upcoming Meetings
          </h2>
          <p className="text-xs text-slate-400 mb-4">
              {selectedManager === 'all' ? 'All Portfolios' : `Filtering for ${selectedManager}`}
          </p>

          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {upcomingMeetings.length === 0 ? (
                  <div className="text-center text-slate-400 py-10 flex flex-col items-center">
                      <Calendar size={32} className="mb-2 opacity-50" />
                      <span>No upcoming meetings.</span>
                  </div>
              ) : (
                  <div className="divide-y divide-slate-100">
                      {upcomingMeetings.map((m) => {
                          const docStatus = getNextDocumentStatus(m);
                          const isUrgent = docStatus.status === 'urgent';
                          
                          return (
                            <div key={`${m.bcId}-${m.id}`} className="py-3 first:pt-0">
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="font-bold text-slate-700 text-sm">{m.bcNumber}</span>
                                        <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">{m.type}</span>
                                    </div>
                                    <p className="text-sm text-slate-600 truncate mb-1">{m.bcName}</p>
                                    
                                    <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                                        <Calendar size={12} />
                                        <span>{new Date(m.date).toLocaleDateString('en-NZ')} at {m.time}</span>
                                    </div>

                                    {/* Document Deadline Indicator */}
                                    <div className={`text-xs p-2 rounded flex justify-between items-center ${
                                        isUrgent ? 'bg-red-50 text-red-700' : 
                                        docStatus.status === 'warning' ? 'bg-amber-50 text-amber-700' : 
                                        docStatus.status === 'good' ? 'bg-emerald-50 text-emerald-700' :
                                        'bg-slate-50 text-slate-600'
                                    }`}>
                                        <span className="font-semibold">{docStatus.label}:</span>
                                        <span className="font-mono">
                                            {docStatus.date === 'All Docs Sent' ? 'Completed' : new Date(docStatus.date).toLocaleDateString('en-NZ')}
                                        </span>
                                    </div>
                            </div>
                          );
                      })}
                  </div>
              )}
          </div>
        </div>

        {/* Chart Section */}
        <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-[500px]">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Portfolio Overview</h2>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Bar dataKey="units" name="Units" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Comment Modal */}
      {selectedReminder && (
          <CommentModal 
            reminder={selectedReminder}
            comments={actionComments.filter(c => c.reminderId === selectedReminder.id)}
            onClose={() => setSelectedReminder(null)}
            onAddComment={addActionComment}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div>
                        <h3 className="font-bold text-slate-800">Action Log</h3>
                        <p className="text-xs text-slate-500">{reminder.bcName} - {reminder.type}</p>
                    </div>
                    <button onClick={onClose}><X size={20} className="text-slate-400 hover:text-slate-600" /></button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
                    {displayedComments.length === 0 ? (
                        <div className="text-center text-slate-400 py-8 text-sm">
                            No comments yet.
                        </div>
                    ) : (
                        displayedComments.map(comment => (
                            <div key={comment.id} className={`flex flex-col gap-1 ${comment.isDeleted ? 'opacity-50' : ''}`}>
                                <div className="flex justify-between items-baseline">
                                    <span className="text-xs font-bold text-slate-700">{comment.userName}</span>
                                    <span className="text-[10px] text-slate-400">
                                        {new Date(comment.timestamp).toLocaleString('en-NZ', { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' })}
                                    </span>
                                </div>
                                <div className={`bg-white p-3 rounded-lg border text-sm text-slate-700 shadow-sm group relative ${comment.isDeleted ? 'bg-red-50 border-red-100' : 'border-slate-200'}`}>
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

                <div className="p-4 bg-white border-t border-slate-100">
                    {isAdmin && (
                        <div className="flex justify-end mb-3">
                            <button 
                                onClick={() => setShowHistory(!showHistory)}
                                className={`text-xs flex items-center gap-1 ${showHistory ? 'text-blue-600 font-medium' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                <History size={12} />
                                {showHistory ? 'Hide Deleted Logs' : 'Show Deleted History'}
                            </button>
                        </div>
                    )}
                    <form onSubmit={handleSubmit} className="flex gap-2">
                        <input 
                            type="text" 
                            className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                            placeholder="Add a note..."
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                        />
                        <button 
                            type="submit" 
                            disabled={!text.trim()}
                            className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white p-2 rounded-lg transition-colors"
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
